const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

const createAccountController = require("../controllers/account.controller");


// POST - api/accounts/    create a new account

router.post("/create" , authMiddleware.authMiddleware , createAccountController.createAccountController);


module.exports = router;