const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
    meal_name: String,
    image_url: String,
    ingredients: [String],
    recipe: [String],
    cuisine: String,
    meal_type: String,
    meal_video_url: String,
    likes: [],
    user_id: String,
    user_name: String,
    user_avatar: String,
    user_token: String
},{timestamps:true});

module.exports = mongoose.model('post', PostSchema);