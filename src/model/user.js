const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    email: String,
    name: String,
    recipes: Number,
},{timestamps:true});

module.exports = mongoose.model('user', UserSchema);