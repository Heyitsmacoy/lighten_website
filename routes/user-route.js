const router = require('express').Router()
const bcrypt = require('bcryptjs') 
const jwt = require('jsonwebtoken')
const mailgun = require("mailgun-js")
const DOMAIN = "sandbox21a46e953d154129a601ac7b91d76885.mailgun.org"
const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN})
const validator = require('email-validator')

//import authentication
const auth = require('../middleware/auth')
// import models
const User = require('../models/user-model')
const Book = require('../models/book-model')


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
        const {email, password} = req.body
        // check for username or email
        const user = await User.findOne({ email:email })
        if(user){
            console.log("existing");
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
                                role: user.designation, //check designations
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

//with auth to only make it work if the token is admin
//parang register lang yung algo
router.post("/addBook",auth, async(req, res) => {
    try {
        const {isbn, book_title, author, publisher, date_published, genre,  price, type} =req.body
        //yung req.user dito from auth siya yung sinend ko don na id
        if(req.user == process.env.ADMIN){ //nilagay ko sa env yung ID ng main admin namen tas kinocompare ko
            const newBook = new Book({     //pero mukhang babaguhin ko naman yan kase di na lang isa magiging admin naten
                isbn: isbn, 
                book_title: book_title,
                author: author,
                publisher: publisher,
                date_published: date_published,
                genre: genre,
                rating: 0,
                price: price,
                type: type
            })
            const savedBook = await newBook.save()
            res.json(savedBook)
        }
        else{
            res.status(401).json({ msg: "Authorization Denied" })
        }
    } catch (err) {
        res.status(500).json({error:err.message})
    }
})

//parang forgot password lang yung algo
router.post("/updateBook",auth, async(req, res) => {
    try {
        const {isbn, book_title, author, publisher, date_published, genre,  price, type} =req.body
        const book = await Book.findOne({isbn:isbn}) //hanapin ko lang yung book
        if(req.user == process.env.ADMIN){ // check niyo sa addbook yung comment
            book.isbn = isbn;
            book.book_title = book_title;
            book.author = author;
            book.publisher = publisher;
            book.date_published = date_published;
            book.genre = genre;
            book.price = price;
            book.type = type;
            const updateBook = await book.save();
            res.json(updateBook)
        }
        else{
            res.status(401).json({ msg: "Authorization Denied" })
        }
    } catch (err) {
        res.status(500).json({error:err.message})
    }
})

router.post('/deleteUser',auth, async(req,res) => {
    try {
        const {isbn} =req.body
        const book = await Book.findOne({isbn})
        if(req.user == process.env.ADMIN){
            user.status = false
            const deleteBook = await book.save();
            res.json(deleteBook)
        }
        else{
            res.status(401).json({ msg: "Authorization Denied" })
        }
    } catch (err) {
        res.status(500).json({error:err.message})
    }
})


//may currently adduser na sa front pero di pa eto yung ginagamit na function register muna
//kase sa function na to pwede nang imodify yung designation
router.post('/addUser', async(req, res) => {
    // VALIDATIONS
    try{
        const {email, password, passwordCheck, displayName, designation} =req.body
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
                        email: email,
                        designation: designation
                    })
                    const savedUser = await newUser.save()
                    res.json(savedUser) 
                }
            }
    }catch(err){
        res.status(500).json({error:err.message})
    }
})
//same lang din ng updatebook
router.post('/updateUser',auth, async(req,res) => {
    try {
        const {email, username, password} =req.body
        const user = await User.findOne({username:username})
        if(req.user == process.env.ADMIN){
            user.email = email
            user.username = username
            user.password = password
            const updateUser = await user.save();
            res.json(updateUser)
        }
        else{
            res.status(401).json({ msg: "Authorization Denied" })
        }
    } catch (err) {
        res.status(500).json({error:err.message})
    }
})
//eto inuupdate ko lang yung status into false
router.post('/deleteUser',auth, async(req,res) => {
    try {
        const {email, username} =req.body
        const user = await User.findOne({email:email})
        if(req.user == process.env.ADMIN){
            user.status = false
            const deleteUser = await user.save();
            res.json(deleteUser)
        }
        else{
            res.status(401).json({ msg: "Authorization Denied" })
        }
    } catch (err) {
        res.status(500).json({error:err.message})
    }
})


module.exports = router