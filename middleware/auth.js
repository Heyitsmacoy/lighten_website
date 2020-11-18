const jwt = require("jsonwebtoken")

const auth = (req, res, next) => {
    try{
        const token = req.header("x-auth-token")
        console.log(req.params.token)

        if(!token){
            return res.status(401).json({msg: "authorization denied"})
        }
        const verified = jwt.verify(token, process.env.JWT_TOKEN)
        if(!verified){
            return res.status(401).json({msg: "token verification failed or authorization denied"})
        }else{
            console.log(verified)
            req.user = verified.id
            next();
        }
    }catch(err){
        res.status(500).json({error: err.message})
    }
}

module.exports = auth