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
    dislikes: [],
    chef_id: String,
    chef_name: String,
    chef_image_url: String
},{timestamps:true});

module.exports = mongoose.model('post', PostSchema);