const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    designation: {
        type: String,
        default: "user"
    },
    email: {
        type: String,
        unique: true
    },
    status: {
        type: Boolean,
        default: true
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})


const User = mongoose.model('User', userSchema)
module.exports = User