const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");





console.log("App is running");


const authRouter = require("./routes/auth.routes"); // auth wala oruter 
const accountRouter = require("./routes/account.routes");

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth" , authRouter);
app.use("/api/account" , accountRouter);
module.exports = app;
