const nodemailer = require("nodemailer");
require("dotenv").config();
const transporter = nodemailer.createTransport({

service: "gmail",
auth : {

    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS

}

});

const sendEmail = async (to , subject , text )=>{

    try {
        await transporter.sendMail({
            from : process.env.EMAIL_USER,
            to,
            subject , 
            text
        });
        console.log(`Email successfully sent to ${to}`);
    } catch (error) {
        console.error("Error sending email: ", error);
    }

};

const sendRegitrationEmail = async (email , name)=>{

    await sendEmail(email , "Registration Successfull!!" , `Hello ${name}, Your account has been created successfully.`);
}




module.exports = {sendRegitrationEmail , sendEmail};