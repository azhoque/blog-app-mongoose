const mongoose = require('mongoose');

const blogpostSchema = mongoose.Schema({
    author: {
        firstName: String,
        lastName: String
    },
    title: {type: String, required: true},
    content: {type: String},
    created: {type: Date, default: Date.now}
});

blogpostSchema.virtual('authorName').get(function(){
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogpostSchema.methods.apiRepr = function(){
    return{
        id: this._id,
        author: this.authorName,
        content: this.content,
        title: this.title,
        created: this.created
    };
}

const BlogPost = mongoose.model('BlogPost', blogpostSchema);

module.exports = {BlogPost};