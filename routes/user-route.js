const router = require('express').Router()
const bcrypt = require('bcryptjs') 
const jwt = require('jsonwebtoken')
const mailgun = require("mailgun-js")
const DOMAIN = "sandbox21a46e953d154129a601ac7b91d76885.mailgun.org"
const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN})
const validator = require('email-validator')

//import authentication
const auth = require('../middleware/auth')
// import user-model
const User = require('../models/user-model')


// ROUTES
router.post('/register', async(req, res) => {
    // VALIDATIONS
    try{
        const {email, password, passwordCheck, displayName} =req.body
        const valid_email = validator.validate(email);

        console.log(valid_email)
        if(!valid_email){
            console.log("false")
            return res
                .status(400)
                .json({ msg: "please enter existing email" })
        }

        // check if passwords match
        if(password !== passwordCheck){
            return res
                .status(400)
                .json({ msg: "Passwords do not match" })
        }
        // check if there as in exisiting username
        const existingUser = await User.findOne({ username: displayName })
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
                        const token = jwt.sign({id: user._id}, process.env.JWT_TOKEN)
                        res.json({
                            token,
                            user:{
                                id: user._id,
                                name: user.username,
                                email: user.email,
                                role: user.designation, // check designations
                            },
                        })

                    
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
            const token = jwt.sign({id: user._id}, process.env.JWT_TOKEN)
            res.json({
                token,
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

        const verified = jwt.verify(token, process.env.JWT_TOKEN)
        if(!verified){ 
            return res.json(false)
        }

        const user = await User.findById(verified.id)
        if(!user){ 
            return res.json(false)
        }

        return res.json(true)

    } catch(err){
        res.status(500).json({ error: err.message })
    }

})

router.post('/changepass', async (req,res) => {
    try{   
        const {vericode, password, passwordCheck} = req.body
        const code = req.header("x-veri-code")
        const token = req.header("x-auth-token")
        const verified = jwt.verify(token, process.env.JWT_TOKEN)
        if(vericode === code && password === passwordCheck){
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            const user = await User.findOne({_id:verified.id})
            if(user){
                user.password = hashedPassword
                const updatepass = await user.save();
                res.json(updatepass)

            }
            else{
                res.status(401).json({ msg: "User doesn't exist" })
            }
        }
        else{
            if(vericode !== code) {return res.json(false)}
            if(password !== passwordCheck) {return res.json(false)}
        }
  
    }
    catch(err){
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