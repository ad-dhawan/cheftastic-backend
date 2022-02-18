const router = require("express").Router();
const PostSchema = require('../model/post');
const UserSchema = require('../model/user');

/** CREATE POST */
router.post("/create", async (req, res) => {
    const post = new PostSchema({
        meal_name: req.body.meal_name,
        image_url: req.body.image_url,
        ingredients: req.body.ingredients,
        recipe: req.body.recipe,
        cuisine: req.body.cuisine || null,
        meal_type: req.body.meal_type,
        meal_video_url: req.body.meal_video_url || null,
        likes: 0,
        dislikes: 0,
        chef_id: req.body.chef_id,
        chef_name: req.body.chef_name || null,
        chef_image_url: req.body.chef_image_url || null
    });

    try{
        const newPost = await post.save();

        const user = await UserSchema.findOne({ _id: req.body.chef_id })
        await user.updateOne({ $set : { recipes: user.recipes+=1 } })

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

/** GET SPECIFIC POST */
router.get('/get/:id', async (req, res) => {
    try{
        const post = await PostSchema.findOne({ _id: req.params.id })
        res.status(200).json(post)
    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

/** DELETE POST */
router.delete('/delete/:id', async(req, res) => {
    try{
        PostSchema.deleteOne({ _id: req.params.id }, function(err, count){
            if(err) res.status(404).json({error: err.toString()});
            else res.status(200).json(count)
        })
    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
});

/** LIKE/DISLIKE POST */
router.put('/like/:id', async(req, res) => {
    try{
        const post = await PostSchema.findOne({ _id: req.params.id })
        if(req.body.action === 'like') {
            await post.updateOne({ $set : { likes: post.likes+=1 } })
            res.status(200).json({message: `liked ${post._id}`, post: post})
        }
        else if(req.body.action === 'dislike') {
            await post.updateOne({ $set : { dislikes: post.dislikes+=1 } })
            res.status(200).json({message: `disliked ${post._id}`, post: post})
        }
    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

module.exports = router;