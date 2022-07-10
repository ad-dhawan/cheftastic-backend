const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    email: String,
    name: String,
    user_avatar: String,
    fcm_token: String,
    id_token: String,
    notifications: [],
    saves: []
},{timestamps:true});

module.exports = mongoose.model('user', UserSchema);