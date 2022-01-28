const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    }
},{timestamps:true});

module.exports = mongoose.model('user', UserSchema);