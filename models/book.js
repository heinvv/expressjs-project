const mongoose = require('mongoose');
const path = require('path');
const converImageBasePath = 'uploads/book-covers';

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    publishDate: {
        type: Date,
        required: true,
    },
    pageCount: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    coverImageName: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author',
        required: true,
    }
});

bookSchema.virtual('coverImagePath').get(function() {
    if (this.coverImageName != null) {
        return path.join('/', converImageBasePath, this.coverImageName);
    }
});

module.exports = mongoose.model('Book', bookSchema);
module.exports.converImageBasePath = converImageBasePath;
