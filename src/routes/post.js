const express = require("express");
const app = express();
const router = require("express").Router();
const multer = require('multer');
const PostSchema = require('../model/post');
const UserSchema = require('../model/user');
const admin = require("firebase-admin");
const crypto = require("crypto");

function sendNotification(title, body, type, imageUrl, token) {
    try {

        const notification = admin.messaging().send({
            notification: {
                title,
                body,
                imageUrl,
            },
            token
        })
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
router.post("/create", upload.single('image_url'), async (req, res) => {

    const user = await UserSchema.findOne({ _id: req.body.chef_id })
    
    const post = new PostSchema({
        meal_name: req.body.meal_name,
        image_url: `https://cheftastic2.herokuapp.com/${req.file.path}`,
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
        const newPost = await post.save();
        
        await user.updateOne({ $push : { recipes: {
            _id: newPost._id,
            meal_name: newPost.meal_name,
            image_url: newPost.image_url
        } } })

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
            if(fetch_data == "load_more")
                markerIdObject = { _id: { $lt: marker_id } }
            else if(fetch_data == "pull_refresh")
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

        const notificationUser = await UserSchema.findOne({ _id: post.user_id })

        if (!post.likes.includes(req.body.user_id)) {

            await post.updateOne({ $push: {likes: req.body.user_id}})

            const notificationTitle = 'Woah!!';
            const notificationBody = 'People are liking your recipe ❤️'
            const existingNotificationBody = `${post.likes.length + 1} peoples liked your recipe`
            
            await sendNotification(notificationTitle, notificationBody, "like", post.image_url, notificationUser.fcm_token);

            const notificationData = {
                _id: crypto.randomBytes(16).toString("hex"),
                title: notificationTitle,
                body: notificationBody,
                image_url: post.image_url,
                meal_name: post.meal_name,
                meal_id: post._id,
                type: 'like',
                seen: false,
                createdAt: new Date().toISOString()
            }

            const existingNotificationData = {
                _id: crypto.randomBytes(16).toString("hex"),
                title: notificationTitle,
                body: existingNotificationBody,
                image_url: post.image_url,
                meal_name: post.meal_name,
                meal_id: post._id,
                type: 'like',
                seen: false,
                createdAt: new Date().toISOString()
            }
            
            const notificationIndex = await notificationUser.notifications.findIndex(item => item.meal_id.toString() === post._id.toString())
            if(notificationIndex === -1){
                await notificationUser.updateOne({ $push : { notifications: { $each: [notificationData], $position: 0 } } });
                res.status(200).json({ message: "liked", notification: notificationData })
            }
            else {
                await notificationUser.updateOne({ $pull: {"notifications": {meal_id: post._id} } });
                await notificationUser.updateOne({ $push : { notifications: { $each: [existingNotificationData], $position: 0 } } });
                res.status(200).json({ message: "liked", notification: existingNotificationData })
            }

        } else {

            await post.updateOne({ $pull: {likes: req.body.user_id }})
            res.status(200).json({ message: "disliked" })

        }

    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

/** GET SPECIALS POSTS */
router.get('/get_top', (req, res) => {
    try{
        PostSchema.aggregate([
            // { $unwind: "$likes" },
            { $project: {
                meal_name: "$meal_name",
                likeCount: { $size: "$likes" },
            }},
            { $group: { _id: "$_id", posts: { $push: "$_id" } } },
            { $sort: { "likeCount": -1 } },
            { $limit: 5 },
          ], function(err, posts) {
              if(err) res.status(502).json({error: err.toString()})
              else res.status(200).json(posts)
          })
    } catch(err){
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

module.exports = router;