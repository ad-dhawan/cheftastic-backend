const router = require("express").Router();
const UserSchema = require('../model/user');

//REGISTER USER
router.post("/register", async (req, res) => {
    const user = new UserSchema({
        email: req.body.email,
        name: req.body.name,
    });

    try{
        const savedUser = await user.save();
        res.status(200).json({status: 200, message: "User registered", user_data: savedUser});
    } catch(err) { 
        res.status(500).json({ status: 500, message: "Internal Server Error", error: err });
    }
});

module.exports = router;