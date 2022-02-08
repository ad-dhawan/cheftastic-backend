const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
    meal_details: {
        meal_name: {
            type: String,
            required: true
        },
        image_url: {
            type: String,
            required: true
        },
        ingredients: [String],
        recipe: [String],
        cuisine: String,
        meal_type: {
            type: String,
            required: true
        },
        meal_video_url: String,
        likes: Number,
        dislikes: Number
    },
    chef_details: {
        chef_id: {
            type: String,
            required: true
        },
        chef_name: String,
        chef_image_url: String
    }
},{timestamps:true});

module.exports = mongoose.model('post', PostSchema);