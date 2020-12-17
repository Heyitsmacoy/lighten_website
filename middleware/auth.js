const jwt = require("jsonwebtoken")

const auth = (req, res, next) => {
    try{
        const token = req.header("x-auth-token")

        if(!token){
            return res.status(401).json({msg: "authorization denied"})
        }
        const verified = jwt.verify(token, process.env.JWT_TOKEN)
        if(!verified){
            return res.status(401).json({msg: "token verification failed or authorization denied"})
        }else{
            req.user = verified.id //yung sinesend ko sa function
            next();
        }
    }catch(err){
        res.status(500).json({error: err.message})
    }
}

module.exports = auth