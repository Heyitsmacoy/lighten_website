const router = require('express').Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs') 
const jwt = require('jsonwebtoken')
var request = require('request')

// import user-model
const User = require('../models/user-model')
const { json } = require('body-parser')
//import middleware
const auth = require('../middleware/auth')
const mail = require('../middleware/mailing')

// ROUTES
// Home route
router.get('/', (req, res) => {
    res.render("index.ejs")
})
// Registration route
router.get('/register', (req, res) => {
    res.render("register.ejs")
})
// terms&privacy route
router.get('/term&policy', (req, res) => {
    res.render("terms.ejs")
})
// forgotpass route
router.get('/forgotPassword', (req, res) => {
    res.render("fpw-confirm.ejs")
})

router.post('/emailfpw', mail.forgot_pass)

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
                        const token = jwt.sign({ id: user.username}, process.env.JWT_TOKEN)
                        var url = process.env.CLIENT_URL + "/login/"+token
                        // console.log(url)
                        // console.log(token)
                        //request(url, function(error,response,body){
                          //  res.status(200).send(body)
                            res.send({
                                token,
                                user:{
                                    name: user.username,
                                    email: user.email
                                },
                            })
                          //})
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


// Login Route
router.get('/login/:token', (req, res) => {
    const token = req.params.token
    console.log(token)
    console.log("geh")
    res.render("admin.ejs")
})

router.post('/token_validation',auth, async(req,res) =>{
    try {
        const token = req.header("x-auth-token")
        console.log(token)
        if(!token){
            return res.json(false)
        }else{
            const verified = jwt.verify(token, process.env.JWT_TOKEN)
            if(!verified){
                return res.json(false)
            }else{
                const user = await User.findOne(verified.id)
                console.log(user)
                console.log(verified)
            }
        }
    } catch (err) {
        res.status(500).json({error: err.message})
    }
 })
module.exports = router