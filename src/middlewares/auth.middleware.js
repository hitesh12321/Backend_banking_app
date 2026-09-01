const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const authMiddleware = async (req , res , next)=>{

    try{
        const authHeader = req.headers.authorization;
        if(!authHeader){
            return res.status(401).json({
                message :"Authorization token required"
            });
        }
        const token = authHeader.split(" ")[1];
        if(!token){
            return res.status(401).json({
                message : "Invalid Authorization Format"
            });
        }

        const decoded = jwt.verify(token , process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);

        if(!user){
            return res.status(401).json({
                message : "User no longer exists"
            });
        }

        req.user = user;
        next();


    }catch{
        return res.status(401).json({

            message: "invalid or expired token"

        });
    }

}

module.exports = {authMiddleware};