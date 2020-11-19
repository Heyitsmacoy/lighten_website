const router = require('express').Router()
const bcrypt = require('bcryptjs') 
const jwt = require('jsonwebtoken')
const mailgun = require("mailgun-js")
const DOMAIN = "sandbox21a46e953d154129a601ac7b91d76885.mailgun.org"
const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN})

//import authentication
const auth = require('../middleware/auth')
// import user-model
const User = require('../models/user-model')


// ROUTES
router.post('/register', async(req, res) => {
    // VALIDATIONS
    try{
        const {email, password, passwordCheck, displayName} =req.body
        // check if passwords match
        if(password !== passwordCheck){
            console.log("pass")
            return res
                .status(400)
                .json({ msg: "Passwords do not match" })
        }
        // check if there as in exisiting username
        const existingUser = await User.findOne({ username: displayName })
        console.log("uname")
            if(existingUser){
                return res
                    .status(400)
                    .json({ msg: "Username already taken" })
            }
            else{
                //check if there is an existing email
                const exisitingEmail = await User.findOne({ email: email })
                if(exisitingEmail){
                    console.log("em")
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
                        username: displayName,
                        password: hashedPassword,
                        email: email
                    })
                    const savedUser = await newUser.save()
                    res.json(savedUser) 
                }
            }
    }catch(err){
        res.status(500).json({error:err.message})
    }
})

router.post('/login', async (req, res) => {
    // VALIDATIONS
    try{
        const {email, password, displayName} = req.body
        // check for username or email
        const user = await User.findOne({$or: [{username:displayName}, {email:email}]})
        if(user){
            // comparing of password and hashed password
            bcrypt.compare(password,user.password, (err, isMatch) => {
                if(isMatch){
                    // check designations
                    if(user.designation === "admin"){
                        const token = jwt.sign({id: user._id}, process.env.JWT_TOKEN)
                        res.json({
                            token,
                            user:{
                                id: user._id,
                                name: user.username,
                                email: user.email,
                            },
                        })

                    }
                    else{
                        const token = jwt.sign({id: user._id}, process.env.JWT_TOKEN)
                        console.log(token)
                        res.json({
                            token,
                            user:{
                                id: user._id,
                                name: user.username,
                                email: user.email,
                            },
                        })
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

router.post('/forgotpass', async (req, res) => {
    try{
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min); 
        }
        const veri_code = getRandomInt(100000, 999999)
        const email = req.body.email
        console.log(email)
        const user = await User.findOne({email:email})
        if(!user){
            return res
                .status(400)
              .json({ msg: "User doesn't exist" })
        }else{
            const data = {
                from: 'elighten2020@gmail.com',
                to: email,
                subject: 'Account Activate ',
                html: `
                    <h2> Verification Code </h2>
                    <p>${veri_code}</p>
                    
                `
            }
            res.json({
                user:{
                    id: user._id,
                    name: user.username,
                    email: user.email,
                    code: veri_code,
                },
            })
        }
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
})

router.post('/tokenIsValid', async (req, res) => {
    try{
        const token = req.header("x-auth-token")
        if(!token){ 
            return res.json(false)
        }

        const verified = jwt.verify(token, process.enc.JWT_TOKEN)
        if(!verified){ 
            return res.json(false)
        }

        const user = await User.findOne(verified.id)
        if(!user){ 
            return res.json(false)
        }
        return res.json(true)

    } catch(err){
        res.status(500).json({ error: err.message })
    }

})

router.get("/", auth, async(req, res) => {
    const user = await User.findById(req.user)
    res.json({
        displayName: user.username,
        id: user._id,
    })
})

module.exports = router