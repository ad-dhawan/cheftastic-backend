const router = require("express").Router();
const UserSchema = require('../model/user');

//REGISTER USER
router.post("/register", async (req, res) => {

    //CHECK USER EXISTENCE
    const userExist = await UserSchema.findOne({ email: req.body.email });
    if (userExist) return res.status(409).json(userExist);
    else {
        //CREATE NEW USER
        const user = new UserSchema({
            email: req.body.email,
            name: req.body.name,
            recipes: 0,
            user_type: req.body.user_type
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
        res.status(200).json(user)
    } catch(err) {
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

module.exports = router;