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
            meal_type: req.body.meal_type,
            meal_video_url: req.body.meal_video_url || null,
            meal_cooking_time: req.body.meal_cooking_time,
            meal_difficulty: req.body.meal_difficulty,
            meal_calories: req.body.meal_calories,
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
            
            await sendNotification(notificationTitle, notificationBody, post.image_url, notificationUser.fcm_token);

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

/** SAVE/UNSAVE POST */
router.put('/save/:id', async(req, res) => {
    try{
        const post = await PostSchema.findOne({ _id: req.params.id })

        if (!post.saves.includes(req.body.user_id)) {

            await post.updateOne({ $push: {saves: req.body.user_id}})
            res.status(200).json({ message: "saved", post })

        } else {

            await post.updateOne({ $pull: {saves: req.body.user_id }})
            res.status(200).json({ message: "unsaved", post })

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

/** SEARCH */
router.get('/search', async (req, res) => {
    try{
        const recipe_data = await PostSchema.find( { "meal_name": { $regex: new RegExp(req.query.search_text, 'i') } } )
        const user_data = await UserSchema.find( { "name": { $regex: new RegExp(req.query.search_text, 'i') } } )

        await res.status(200).json({recipes: recipe_data, users: user_data})
    } catch(err){
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

/** GET DEEPLINK PAGE */
router.get('/:id', async (req, res) => {
    try{
        const post = await PostSchema.findOne({ _id: req.params.id })
        res.write(`<!DOCTYPE html>
    <html>
    <head>
    <title>Cheftastic</title>
    <style>
    *{
       
       margin: 0;
       padding: 0;
    }
    
    .Nav{
       background: white;
       padding: 15px;
       display: flex;
       justify-content: space-between;
       position: relative;
       align-items: center;
    }
    
    .navlist ul{
        display: flex;
    }

    .navlist li{
        list-style: none;
        margin: 0rem 1rem;
    }

    .navlist li a{
        text-decoration: none;
    }

    .nav-content{
       
       font-size: 2rem;
       text-decoration: none;
       color: red;
       padding-left: 1rem;
    
    }
    
    .main-contanier{
       width: 60%;
       margin: auto;
       margin-top: 1rem;
       background: white;
    
    
    }
    
    .content{
       margin: 1rem 2rem;
    }
    
    
    .content h2{
       margin: 1rem 0rem;
       font-size: 2.5rem;
    
    }
    
    .content-img{
       height: 30rem;
       width: 100%;
       overflow: hidden;
    }
    
    .content-img .btn{
       position: absolute;
       left: 23%;
       top: 30rem;
       font-size: 3rem;
       color: white;
    }
    
    
    .content-img img{
       width: 100%;
       height: 60rem;
    
    }
    
    .content{
       margin: 0rem 1.5rem;
       margin-bottom: 2.5rem;
    
    }
    
    .info-item{
       display: flex;
    
    }
    
    .creater{
       position: relative;
       margin: 0rem 10px;
       margin-right: auto;
    
    }
    
    .meal_type{
    
       display: flex;
       align-items: center;
    }
    
    .meal_type img{
       margin-right: .5rem;
    
    }
    
    .avatar img{
       height: 2.5rem;
    
    }
    
    
    .name{
       margin: 0.5rem 0rem;
       font-size: 1.5rem;
    }
    
    .extra-info{
       display: flex;
    
    }
    
    .kcal{
    
       font-size: 1.5rem;
       padding-bottom: 0.4rem;
       color: #388ce0;
    
    }
    
    .start{
    
       font-size: 1.5rem;
       padding-bottom: 0.4rem;
       color: #efd600fc;
    
    }
    
    .time{
       font-size: 1.5rem;
       padding-bottom: 0.4rem;
       color: #0ac60a;
    
    }
    
    hr{
       width: 50%;
       margin: auto;
    }
    
    .ingredients{
       text-align: center;
       color: red;
       font-size: 1.5rem;
       margin: 1rem 0rem;
    
    }
    
    li{
       color: orange;
       font-size: 1.2rem;
       margin-bottom: 1rem;
    
    
    }
    
    li span{
       color: black;
    }
    
    .instructions{
       text-align: center;
       color: red;
       font-size: 1.5rem;
       margin: 1rem 0rem;
    
    }
    
    .info-1{
       display: flex;
       margin: 0rem 1rem;
       flex-direction: column;
       align-items: center;
       background: #aedcf6;
       padding: 1.5rem 1rem;
       width: 3.5rem;
       border-radius: 10px;
       color: #388ce0;
    
    
    
    }
    .info-2{
       display: flex;
       margin: 0rem 1rem;
       flex-direction: column;
       align-items: center;
       background: #fff6ae;
       padding: 1.5rem 1rem;
       width: 3.5rem;
       border-radius: 10px;
       color: #efd600fc;
    
    
    }
    .info-3{
       display: flex;
       margin: 0rem 1rem;
       flex-direction: column;
       align-items: center;
       background: #a4f6a7;
       padding: 1.5rem 1rem;
       width: 3.5rem;
       border-radius: 10px;
       color: #0ac60a;
    
    }
    
    .info-credit{
       width: 80%;
       margin: auto;
    }
    </style>
    <script src="https://kit.fontawesome.com/9ebcbc9e58.js" crossorigin="anonymous"></script>
    </head>
    <body style=" background: #eeee;">
        <!---------------------- Navbar starting------------------ -->
        <nav class="Nav">
            <div class="Navbar" >
              <a class="nav-content" href="#">Cheftastic</a>
            </div>
        </nav>
        
        <!------------------Main Container-------------------->
        <section class="main-contanier">
            <!--Img-->
            <section class="content-img">
                <img src="${post.image_url}" alt="">
                <a href="${post.meal_video_url}"><i class="btn fa-regular fa-circle-play"></i></a>
            </section>
            <!--Info-->
            <section class="content">
                <h2>
                    ${post.meal_name}
                </h2>
                <section class="info-item">
                    <div class="avatar">
                        <img src="${post.user_avatar}" alt="">
                        
                    </div>
                    <section class="creater">
                        <div class="creater-name">
                            <div class="name">
                                ${post.user_name}
                            </div>
                            <div class="meal_type"> 
    
                                <img src="https://img.icons8.com/ios-glyphs/30/000000/non-vegetarian-food-symbol.png"/>
                                <div>
                                    ${post.meal_type}
                                </div>
                            </div>
                        </div>
                    </section>
                    <section class="extra-info">
                        <div class="info-1">
                            <i class="kcal fa-solid fa-fire-flame-curved"></i>
                            ${post.meal_calories}
                        </div>
                        <div class="info-2">
                            <i class="start fa-solid fa-star"></i>
                            ${post.meal_difficulty}
                        </div>
                        <div class="info-3">
                            <i class="time fa-solid fa-clock-rotate-left"></i>
                            ${post.meal_cooking_time}
                        </div>
                    </section>
                </section>
            </section>
            <hr>
            <section class="info-credit">
            <!--Ingredients-->
            <section>
            <div class="ingredients">
                Ingredients
            </div>`)
    for(let i=0 ; i<post.ingredients.length; i++){
        res.write(`
        <div>
            <ul>
                <li>
                    <span>
                        ${post.ingredients[i]}
                    </span>
                </li>
            </ul>
        </div>`)
    }        
    res.write(`
            </section>
            <!--Instructions-->
            <section>
                <div class="instructions">
                    Instructions
                </div>`)
    for(let j=0; j<post.recipe.length; j++){
    res.write(`
                <div>
                    <ul>
                        <li>
                            <span>
                            ${post.recipe[j]}
                            </span> 
                        </li>
                    </ul>
                </div>`)
    }
    res.write(`</section>
            </section>
        </section>
    
    
    
    </body>
    </html>`)
    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

module.exports = router;