const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {authenticateToken} = require("./userAuth");

//Sign Up
router.post("/sign-up", async(req,res) => {
    try{
        const {username,email,password,address} = req.body;

        //check username length is more than 4
        if(username.length <= 4)
        {
            return res
                .status(400)
                .json({message: "Insufficient username length (should be > 4)"});
        }

        //check username already exists
        const existingUser = await User.findOne({username: username});
        if(existingUser)
        {
            return res
                .status(400)
                .json({message: "Username Already exists"});
        }

        //check email already exists
        const existingEmail = await User.findOne({email: email});
        if(existingEmail)
        {
            return res
                .status(400)
                .json({message: "Email Already exists"});
        }

        //check password's length
        if(password.length < 6)
        {
            return res
            .status(400)
            .json({message: "Password length should be greater than 5"});
        }

        const hashPass = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: username,
            email:email,
            password:hashPass,
            address:address,
        });
        await newUser.save();
        return res.status(200).json({message: "Sign-Up Successfull"});
    }catch{
        res.status(500).json({message: "Internal server error"});
    }
});

//sign in
router.post("/sign-in", async(req,res) => {
    try{
        const {username,password} = req.body;
        const existingUser = await User.findOne({username});
        if(!existingUser)
        {
            // console.log("not found");
            return res.status(400).json({message: "Invalid Credentials"});
        }
        const data = await bcrypt.compare(password,existingUser.password);
            if(data)
            {
                const authClaims = [
                    {name: existingUser.username},
                    {role: existingUser.role},
                ];

                const token = jwt.sign({authClaims},"bookStore123",{
                    expiresIn: "30d",
                });

                return res.status(200).json({id: existingUser._id, role: existingUser.role, token: token});
            }
            else
            {
               return res.status(400).json({message:"Invalid credentials"});
            }  
        
        // return res.status(200).json({message: "Sign-Up Successfull"});
    }catch{
        return res.status(500).json({message: "Internal server error"});
    }
});

//get-user-info
router.get("/get-user-information", authenticateToken, async (req,res) => {
    try{
        const {id} = req.headers;
        const data = await User.findById(id).select('-password');
        return res.status(200).json(data);
    }
    catch(error)
    {
        res.status(500).json({message: "Internal server error"});
    }
});

//update address
router.put("/update-address", authenticateToken, async (req, res) => {

    try{
        const {id} = req.headers;
        const {address} = req.body;
        await User.findByIdAndUpdate(id,{address: address});
        return res.status(200).json({message: "Address updated successfully"});
    }
    catch(error)
    {
        res.status(500).json({message: "Internal Server error"});
    }
});

module.exports = router;