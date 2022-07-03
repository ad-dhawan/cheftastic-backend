const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
    meal_name: String,
    image_url: String,
    ingredients: [String],
    recipe: [String],
    meal_type: String,
    meal_video_url: String,
    meal_cooking_time: String,
    meal_difficulty: String,
    meal_calories: String,
    likes: [],
    saves: [],
    user_id: String,
    user_name: String,
    user_avatar: String,
    user_token: String
},{timestamps:true});

module.exports = mongoose.model('post', PostSchema);