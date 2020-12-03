const mongoose = require('mongoose')
const Schema = mongoose.Schema

const admin_at_Schema = new Schema ({
    username: {
        type: String
    },
    action: {
        type: String
    },
    name: {
        type: String
    },
    old_value: {
        type: String
    },
    new_value: {
        type: String
    }
}, {timestamps: true})

const AdminActivity = mongoose.model('AdminActivity', admin_at_Schema)
module.exports = AdminActivity