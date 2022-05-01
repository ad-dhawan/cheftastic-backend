const express = require("express");
const app = express();
const router = require("express").Router();
const multer = require('multer');
const PostSchema = require('../model/post');
const UserSchema = require('../model/user');
const admin = require("firebase-admin");

async function sendNotification(title, body, token) {
    try {

        const message = {
            notification: {
              title: title,
              body: body
            },
            token: token
        };

        const notification = admin.messaging().sendMulticast(message)
        .then(response => console.log("SENT NOTIFICATION: ", response))
        .catch(err => console.log("COULDN'T SEND NOTIFICATION: ", err));

        return notification

    } catch(err) {
      return err
    }
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/posts');
    },
    filename: function(req, file, cb) {
        cb(null, 'cheftastic' + '_' + file.originalname.replace(/ /g,"_"));
    }
});

const upload = multer({ storage: storage })

/** CREATE POST */
router.post("/create", upload.single('meal_image'), async (req, res) => {

    const user = await UserSchema.findOne({ _id: req.body.chef_id })
    
    const post = new PostSchema({
        meal_name: req.body.meal_name,
        // image_url: req.body.meal_image,
        ingredients: req.body.ingredients,
        recipe: req.body.recipe,
        cuisine: req.body.cuisine || null,
        meal_type: req.body.meal_type,
        meal_video_url: req.body.meal_video_url || null,
        likes: [],
        user_id: req.body.chef_id,
        user_name: user.name,
        user_avatar: user.user_avatar,
        user_token: user.user_token
    });

    try{
        await user.updateOne({ $push : { recipes: post } })
        
        const newPost = await post.save();

        res.status(200).json(newPost);
    } catch(err) { 
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
});

/** GET ALL POSTS */
router.get('/get_all', (req, res) => {
    try{
        let{page_size, marker_id, fetch_data} = req.query

        if(!page_size)
            page_size = 10;

        let markerIdObject;
        if(!marker_id) markerIdObject = {}
        else {
            if(!fetch_data)
                markerIdObject = { _id: { $lt: marker_id } }
            else if(fetch_data = "pull_refresh")
                markerIdObject = { _id: { $gt: marker_id } }  
        }

        PostSchema.find( markerIdObject, function(err, posts){
            if(err) res.status(502).json({error: err.toString})
            else res.status(200).json(posts)
        } )
            .sort( { createdAt: -1 } )
            .limit( parseInt(page_size) ) ;

    } catch(err){
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
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

    const user = await UserSchema.findOne({ _id: req.body.chef_id })

    try{
        PostSchema.deleteOne({ _id: req.params.id }, function(err, count){
            if(err) res.status(404).json({error: err.toString()});
            else {
                res.status(200).json(count);
            }
        })
    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
});

/** LIKE/DISLIKE POST */
router.put('/like/:id', async(req, res) => {
    try{
        const post = await PostSchema.findOne({ _id: req.params.id })

        if (!post.likes.includes(req.body.user_id)) {

            await post.updateOne({ $push: {likes: req.body.user_id}})
            const notification = await sendNotification("Someone liked your post", "click to check", post.user_token);
            res.status(200).json({ message: "liked", notification: notification })

        } else {

            await post.updateOne({ $pull: {likes: req.body.user_id }})
            res.status(200).json({ message: "disliked" })

        }

    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

module.exports = router;