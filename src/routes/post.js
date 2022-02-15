const router = require("express").Router();
const PostSchema = require('../model/post');

/** CREATE POST */
router.post("/create", async (req, res) => {

    const post = new PostSchema({
        meal_details: {
            meal_name: req.body.meal_name,
            image_url: req.body.image_url,
            ingredients: req.body.ingredients,
            recipe: req.body.recipe,
            cuisine: req.body.cuisine || null,
            meal_type: req.body.meal_type,
            meal_video_url: req.body.meal_video_url || null,
            likes: 0,
            dislikes: 0,
        },
        chef_details: {
            chef_id: req.body.chef_id,
            chef_name: req.body.chef_name || null,
            chef_image_url: req.body.chef_image_url || null
        }
    });

    try{
        const newPost = await post.save();
        res.status(200).json({status: 200, message: "Post Created", recipe_data: newPost});
    } catch(err) { 
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err });
    }
});

/** GET ALL POSTS */
router.get('/get_all', (req, res) => {
    try{
        PostSchema.find({}, function(err, posts){
            if(err) res.status(502).json({error: err});
            else res.status(200).json(posts)
        })
    } catch(err){
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err });
    }
});

module.exports = router;