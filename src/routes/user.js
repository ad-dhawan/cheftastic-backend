const router = require("express").Router();
const UserSchema = require('../model/user');

//REGISTER USER
router.post("/register", async (req, res) => {

    //CHECK USER EXISTENCE
    const userExist = await UserSchema.findOne({ email: req.body.email });
    if (userExist) return res.status(409).json({status: 409, user: userExist});
    else {
        //CREATE NEW USER
        const user = new UserSchema({
            email: req.body.email,
            name: req.body.name,
            recipes:[],
            user_avatar: req.body.user_avatar,
            fcm_token: req.body.fcm_token,
            id_token: req.body.id_token,
            notifications: [],
        });

        try{
            const savedUser = await user.save();
            res.status(200).json(savedUser);
        } catch(err) { 
            res.status(500).json({ status: 500, message: "Internal Server Error", error: err });
        }
    }
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
        const user = await UserSchema.findOne({ _id: req.params.id })
        res.status(200).json(user.recipes)
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
        let{page_size, marker_id, fetch_data} = req.query

        if(!page_size)
            page_size = 15;

        let markerIdObject;
        if(!marker_id) markerIdObject = {}

        else {
            if(fetch_data == "load_more")
                markerIdObject = { _id: { $lt: marker_id } }
            else if(fetch_data == "pull_refresh")
                markerIdObject = { _id: { $gt: marker_id } }  
        }

        const user = await UserSchema.findOne({ _id: req.params.id })
            .sort( { createdAt: -1 } )
            .limit( parseInt(page_size) ) ;

        res.status(200).json(user.notifications)

    } catch(err){
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err.toString() });
    }
})

module.exports = router;