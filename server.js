const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

const {DATABASE_URL, PORT} = require('./config');
const {BlogPost} = require('./models');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

mongoose.Promise = global.Promise;

app.get('/posts', (req, res) => {
    BlogPost
        .find()
        .then(posts => {
            res.json(posts.map(post => (post.apiRepr())));
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'something went sideways ...'});
        });
});

app.get('/posts/:id', (req, res) => {
    BlogPost
    .findById(req.params.id)
    .then(post => res.josn(post.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error:'something went haywire ...'});
    });
});

app.post('/posts', (req, res) => {
    const requireFields = ['title', 'author', 'content'];
    for(let i = 0; i < requireFields.length; i++){
        const field = requireFields[i];
        if(!(field in req.body)){
            const message = `Missing \`${field}\` in request body`
            console.error(message);
            return res.status(400).send(message);
        }
    }

BlogPost
    .create({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author
    })
    .then(blogPost => res.status(201).json(blogPost.apiRepr()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went upside-down ...'});
    });        
});

app.delete('/posts/:id', (req, res) => {
    BlogPost
        .findByIdAndRemove(req.params.id)
        .then(() => {
            res.status(204).json({message: 'success'});
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'Something broke ...'});
        });
});

app.put('/posts/:id', (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)){
        res.status(400).json({
            error: 'request path id and request body id values must match'
        });
    }
    const updated = {};
    const updatedableFields = ['title', 'content', 'author'];
    updatedableFields.forEach(field => {
        if(field in req.body){
            updated[field] = req.body[field];
        }
    });
    
    BlogPost
        .findByidAndupdate(req.params.id, {$set: updated}, {new: true})
        .then(updatedPost => res.json(204).end())
        .catch(err => res.status(500).json({message: 'Something screwed up ...'}))
});

app.delete('/:id', (req, res) => {
    BlogPost
    .findByIdAndRemove(req.params.id)
    .then(() => {
        console.log(`Delete blog post with id \`${req.params.ID}\``);
        res.status(204).end();
    });
});

app.use('*', function(){
    res.status(404).json({message: 'Not found!'});
});

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};