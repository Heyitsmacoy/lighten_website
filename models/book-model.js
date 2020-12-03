const mongoose = require('mongoose')
const Schema = mongoose.Schema

const bookSchema = new Schema({
    isbn: {
        type: String, 
    },
    book_title: {
        type: String, 
    },
    author: {
        type: String, 
    },
    publisher: {
        type: String, 
    },
    date_published: {
        type: String, 
    },
    genre: {
        type: String, 
    },
    rating: {
        type: String, 
    },
    price: {
        type: String, 
    }
})

const Book = mongoose.model('Book', bookSchema)
module.exports = Book