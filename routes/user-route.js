const router = require('express').Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs') 
const jwt = require('jsonwebtoken')

// import user-model
const User = require('../models/user-model')

// ROUTES
// Home route
router.get('/', (req, res) => {
    // res.render mo rito yung home page
})
// Registration route
router.get('/register', (req, res) => {
    // res.render mo rito yung registration page
})
router.post('/register', async(req, res) => {
    var username = req.body.uName;
    var password = req.body.password;
    var cPassword = req.body.cPassword;
    var email = req.body.email;

    // VALIDATIONS
    try{
        // check if passwords match
        if(password !== cPassword){
            return res
                .status(400)
                .json({ msg: "Passwords do not match" })
        }
        // check if there as in exisiting username
        const existingUser = await User.findOne({ username: username })
            if(existingUser){
                return res
                    .status(400)
                    .json({ msg: "Username already taken" })
            }
            else{
                //check if there is an existing email
                const exisitingEmail = await User.findOne({ email: email })
                if(exisitingEmail){
                    return res
                        .status(400)
                        .json({ msg: "Email already exists"})
                }
                else{
                    //hashing passowrd
                    const salt = await bcrypt.genSalt(10)
                    const hashedPassword = await bcrypt.hash(password, salt)

                    //saving data to database
                    const newUser = new User({
                        username,
                        password: hashedPassword,
                        email
                    })
                    newUser.save()
                    res.json(newUser) 
                }
            }
    }catch(err){
        res.status(500).json({error:err.message})
    }
})

// Login Route
router.get('/login', (req, res) => {
    //res.render mo rito yung login page
})
router.post('/login', async (req, res) => {
    var unlog = req.body.unlog
    var pwlog = req.body.pwlog

    // VALIDATIONS
    try{
        // check for username or email
        const user = await User.findOne({$or: [{username:unlog}, {email:unlog}]})
        if(user){
            // comparing of password and hashed password
            bcrypt.compare(pwlog,user.password, (err, isMatch) => {
                if(isMatch){
                    // check designations
                    if(user.designation === "admin"){
                        res.json({msg: "logged in as an admin"})
                    }
                    else{
                        res.json({msg:"Logged in as a user"})
                    }
                }
                else{
                    return res
                        .status(400)
                        .json({ msg: "Password incorrect" })
                }
            })
        }
        else{
            return res
                .status(400)
                .json({ msg: "User doesn't exist" })
        }
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
    
})



router.get('/forgotPassword', (req, res) => {
    //res.render("fpw.ejs")
})
router.get('/terms&policy', (req, res) => {
    //res.render("terms.ejs")
})

module.exports = router