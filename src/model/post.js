const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
    meal_name: {
        type: String,
        required: true
    },
    image_url: {
        type: String,
        required: true
    },
    cuisine: {
        type: String,
        required: true
    },
    meal_type: {
        type: String,
        required: true
    },
    meal_video_url: {
        type: String,
    },
    chef_name: {
        type: String,
        required: true
    },
    chef_image_url: {
        type: String,
        required: true
    },
    likes: {
        type: Integer,
        required: true
    },
    dislikes: {
        type: Integer,
        required: true
    }
},{timestamps:true});

module.exports = mongoose.model('post', PostSchema);