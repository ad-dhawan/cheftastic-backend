const router = require("express").Router();
const UserSchema = require('../model/user');
const PostSchema = require('../model/post');
const Multer = require('multer');
const {Storage} = require('@google-cloud/storage')
const dotenv = require("dotenv");
const path = require("path");
const util = require('util')

//GOOGLE CLOUD STORAGE
const storage = new Storage({
    keyFilename: path.join(__dirname, "../../cheftastic-2-df4d188bcb59.json"),
    projectId: "cheftastic-2"
});

dotenv.config();
const bucket = storage.bucket(process.env.GCLOUD_USERS_BUCKET);
const avatar_bucket = storage.bucket(process.env.GCLOUD_AVATAR_BUCKET)

const { format } = util


const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
    },
});

router.use(multer.single('user_avatar'));

//REGISTER USER
router.post("/register", async (req, res) => {

    //CHECK USER EXISTENCE
    const userExist = await UserSchema.findOne({ email: req.body.email });
    if (userExist) {
        const editedData = {
            email: req.body.email,
            name: req.body.name,
            user_avatar: req.body.user_avatar,
            fcm_token: req.body.fcm_token,
            id_token: req.body.id_token,
        };

        try{
            await UserSchema.updateOne({email: req.body.email}, editedData)
            res.status(409).json(userExist);
        } catch(err) { 
            res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
        }
    }
    else {
        //CREATE NEW USER
        const user = new UserSchema({
            email: req.body.email,
            name: req.body.name,
            user_avatar: req.body.user_avatar,
            fcm_token: req.body.fcm_token,
            id_token: req.body.id_token,
            notifications: [],
            saves: []
        });

        try{
            const savedUser = await user.save();
            res.status(200).json(savedUser);
        } catch(err) { 
            res.status(500).json({ status: 500, message: "Internal Server Error", error: err });
        }
    }
});

//EDIT USER
router.put("/edit", async (req, res, next) => {

    const blob = bucket.file(req.file.originalname.replace(/ /g, "_"))
    const blobStream = blob.createWriteStream({
        resumable: false
    })

    blobStream.on('error', err => {
        next(err);
    });

    blobStream.on('finish', async () => {
        const publicUrl = format(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );

        try{
            const newData = {
                name: req.body.name,
                user_avatar: publicUrl
            }
            await UserSchema.updateOne({_id: req.body.user_id}, newData)
            res.status(200).json(newData);
        } catch(err) { 
            res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
        }

      });
    
      blobStream.end(req.file.buffer);
});

/** GET ALL USERS */
router.get('/get_all', (req, res) => {
    try{
        UserSchema.find({}, function(err, users){
            if(err) res.status(502).json({error: err});
            else res.status(200).json(users)
        })
    } catch(err){
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err });
    }
});

/** GET SPECIFIC USER */
router.get('/get/:id', async (req, res) => {
    try{
        const user = await UserSchema.findOne({ _id: req.params.id })
        res.status(200).json({  _id: user._id, email: user.email, name: user.name, recipes: user.recipes.length, user_avatar: user.user_avatar  })
    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

/** GET USER RECIPES */
router.get('/get_user_recipes/:id', async(req, res) => {
    try{
        PostSchema.find( {user_id: req.params.id}, function(err, posts){
            if(err) res.status(502).json({error: err.toString})
            else res.status(200).json(posts)
        }).sort( { createdAt: -1 } )
    } catch (err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

/** DELETE USER */
router.delete('/delete/:id', async(req, res) => {
    try{
        UserSchema.deleteOne({ _id: req.params.id }, function(err, count){
            if(err) res.status(404).json({error: err.toString()});
            else res.status(200).json(count)
        })
    } catch(err) {
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
});

/** GET USER NOTIFICATIONS */
router.get('/get_notification/:id', async (req, res) => {
    try{
        UserSchema.findOne({_id: req.params.id}, function(err, user){
            if(err) res.status(502).json({error: err.toString})
            else res.status(200).json(user.notifications)
        })

    } catch(err){
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

/** GET DEFAULT USER AVATARS */
router.get('/get_avatars', async (req, res) => {
    try {
        const [files] = await avatar_bucket.getFiles();
        res.status(200).json(files)
    }
    catch(err){
        console.log(err)
    }
})

module.exports = router;