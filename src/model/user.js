const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    email: String,
    name: String,
    recipes: [],
    user_avatar: String,
    user_token: String,
    id_token: String
},{timestamps:true});

module.exports = mongoose.model('user', UserSchema);