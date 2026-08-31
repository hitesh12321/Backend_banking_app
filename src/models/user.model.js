const mongoose = require("mongoose");

const userSchema = mongoose.Schema({

    email:{
        type :String,
        required :[True , "Email is required for Creating User.."],
        trim :True ,
        lowercase :True,
        match :[]
    }

});