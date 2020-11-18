const mailgun = require("mailgun-js")
const DOMAIN = "sandbox21a46e953d154129a601ac7b91d76885.mailgun.org"
const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN})
const User = require('../models/user-model')
require('dotenv/config')
const randomInt = require('random-int')

const forgotpass= (req, res, next) => {
    var email = req.body.fpwemail
    User.findOne({ email:email })
        .then(user => {
            if(!user){
                res.json({
                    message: "Email does not exist"
                })
            }else{
                const veriCode = randomInt(100000, 999999)
                const token = jwt.sign({ email, veriCode}, process.env.JWT_TOKEN, {expiresIn: '20m'})
                const data = {
                    from: 'elighten2020@gmail.com',
                    to: email,
                    subject: 'Reset Password ',
                    html: `
                        <h2> Forgot Password </h2>
                        <a href= ${process.env.CLIENT_URL}/forgotpass/${token}> Link to change password </a>
                        
                    `
                }
                mg.messages().send(data, function (error, body) {
                    if(error){
                        return res.json({
                            error: err.message
                        })
                    }
                    return res.json({message:"Email has been sent, please check your email"})
                })
            }
            
        })
        .catch(err => {
            return res.status(500).json({
                error: err
            });
        });
}

const verify_email = (req, res, next) => {
    var password = req.body.password
    var cPassword = req.body.cPassword
    var username = req.body.uName
    var email = req.body.email
   
    User.findOne({ username:username })
        .then(user => {
            if(user){
                res.json({
                    message: "Username already exist"
                })
            }
            else if(password !== cPassword){
                res.json({
                    message: "Passwords do not match"
                })
            }    
            
        })
        .catch(err => {
            return res.status(500).json({
                error: err
            });
        });

    User.findOne({ email:email })
        .then(user => {
            if(user){
                res.json({
                    message: "Email already exist"
                })
            }else{
                const token = jwt.sign({username, email, password}, process.env.JWT_ACCOUNT_ACTIVATE, {expiresIn: '20m'})
                const data = {
                    from: 'elighten2020@gmail.com',
                    to: email,
                    subject: 'Account Activate ',
                    html: `
                        <h2> Click here to activate account </h2>
                        <a href= ${process.env.CLIENT_URL}/authentication/${token}> Link to activate </a>
                    `
                }
                mg.messages().send(data, function (error, body) {
                    if(error){
                        return res.json({
                            error: err.message
                        })
                    }
                    return res.json({message:"Email has been sent, please activate your account"})
                })
            }
            
        })
        .catch(err => {
            return res.status(500).json({
                error: err
            });
        });
}
