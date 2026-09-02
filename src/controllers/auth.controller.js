const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
// user register controller // Post - /api/auth/register
// controllers are mailny functions which is the bussines layer i can say 
async function userRegisterController(req , res){

const {email , password , name } = req.body ;

const isExists = await userModel.findOne({
    email : email 
});

if(isExists){
    return res.status(422).json({
        message : "User Already Exists with this Email , Try Anoother email ",
        status : "failed"
    });
}

const user = await userModel.create({
    email , password , name 
});

const token = jwt.sign(

{userId : user._id},
process.env.JWT_SECRET , 
{expiresIn : "1d"}
);
console.log(token);

res.cookie("token" , token);

res.status(201).json({
    message : "User Registered Successfully", 
    user : {
        _id : user._id,
        email: user.email ,
        name:user.name 
    },
    token : token
});

await emailService.sendRegitrationEmail(user.email ,user.name );


}

// user Login controller // Post - /api/auth/login
async function userLoginController(req , res){

    const {email , password} = req.body;

    const user = await userModel
    .findOne({ email })
    .select("+password");

    if(!user){
        return res.status(401).json({
            message : "Email or password is Invalid"
        });
    }

    const isValid =  await user.comparePassword(password);

    if(!isValid){
        return res.status(401).json({
            message : "Email or password is Invalid"
        });
    }

    const token = jwt.sign(

    {userId : user._id},
    process.env.JWT_SECRET , 
    {expiresIn : "1d"}
    );

    res.cookie("token" , token );

    res.status(200).json({
        user : {
            _id : user._id,
            email :user.email ,
            name : user.name
        },
        token :{
            token
        }
    }  );



}


module.exports = {
    userRegisterController , userLoginController
};