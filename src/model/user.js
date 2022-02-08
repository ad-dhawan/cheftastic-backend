const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    recipes: {
        type: Number,
    }
},{timestamps:true});

module.exports = mongoose.model('user', UserSchema);