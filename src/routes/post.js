const express = require("express");
const app = express();
const router = require("express").Router();
const Multer = require('multer');
const PostSchema = require('../model/post');
const UserSchema = require('../model/user');
const admin = require("firebase-admin");
const crypto = require("crypto");
const util = require('util')
const {Storage} = require('@google-cloud/storage')
const path = require("path")
const dotenv = require("dotenv");

//GOOGLE CLOUD STORAGE
const storage = new Storage({
    keyFilename: path.join(__dirname, "../../cheftastic-2-df4d188bcb59.json"),
    projectId: "cheftastic-2"
});

dotenv.config()
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

const { format } = util

function sendNotification(title, body, imageUrl, token) {
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

const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
    },
});

router.use(multer.single('image_url'));

/** CREATE POST */
router.post("/create", async (req, res, next) => {

    const blob = bucket.file(req.file.originalname.replace(/ /g, "_"))
    const blobStream = blob.createWriteStream({
        resumable: false
    })

    blobStream.on('error', err => {
        next(err);
    });

    blobStream.on('finish', async () => {
        // The public URL can be used to directly access the file via HTTP.
        const publicUrl = format(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );

        const user = await UserSchema.findOne({ _id: req.body.chef_id })

        const post = new PostSchema({
            meal_name: req.body.meal_name,
            image_url: publicUrl,
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
            res.status(200).json(newPost);
        } catch(err) { 
            res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
        }

      });
    
      blobStream.end(req.file.buffer);
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
router.get('/get_specials', (req, res) => {
    try{
        PostSchema.aggregate([
            {$unwind: "$likes"},
            {$group: {_id: "$_id", likesCount: {$sum: 1}}},
            {$sort: {likesCount: -1}},
            {$limit: 5},
            {$project: {_id: 1}}
          ], function(err, posts) {
              if(err) res.status(502).json({error: err.toString()})
              else res.status(200).json(posts)
          })
    } catch(err){
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

module.exports = router;