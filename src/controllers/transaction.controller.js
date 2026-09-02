const transactionModel = require("../models/transaction.model");
const jwt = require("jsonwebtoken");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");


/**

* - Create a new transaction
* THE 10-STEP TRANSFER FLOW:
* 1. Validate request
2. Validate idempotency key
3. Check account status
* 4. Derive sender balance from ledger
* 5. Create transaction (PENDING)
6. Create DEBIT ledger entry
* 7. Create CREDIT ledger entry
* 8. Mark transaction COMPLETED
* 9. Commit MongoDB session
* 10. Send email notification

*/

async function createTransaction(req, res) {

    // 1.validate request 

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "please provide all details. fromAccount , toAccount , amount , idempotencyKey"
        });
    }

    const findFromAccount = await accountModel.findOne({
        _id: fromAccount
    });
    if (!findFromAccount) {
        return res.status(400).json({
            message: "provide a valid sender account"
        });
    }
    const findToAccount = await accountModel.findOne({
        _id: toAccount
    });
    if (!findToAccount) {
        return res.status(400).json({
            message: "provide a valid receiver account"
        });
    }

    // 2.validate idempotency key 

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Payment Successful",
                transaction: isTransactionAlreadyExists
            });
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Payment Pending/Processing"
            });
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status().json({
                message: "Payment Failed"
            });
        }
        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status().json({
                message: "Payment is Reversed , please retry"
            });
        }


    }

    // 3.check account status 

    // if transaction already not exists so 

    // to check if from or to menas sender or receiver account is closed or prozen 

    // const isSenderAccountActive = await accountModel.findOne({
    //     fromAccount:fromAccount
    // });


    if (findFromAccount.status != "ACTIVE" || findToAccount.status != "ACTIVE") {
        return res.status(403).json({
            message: "sender account and receiver account both should be Active"
        });
    }


    // 4 . Derive Sender balance from ledger

    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: `insuffecient balance in Sender Account , current balance is ${balance} `
        });
    }
    /// NOW 
    // ACID 
    /** 
    * 5. Create transaction (PENDING)
6. Create DEBIT ledger entry
* 7. Create CREDIT ledger entry
* 8. Mark transaction COMPLETED
*/ // ya to sare ya ek bhi na ho - ATOMICITY
    //5. create transactions (PENDING)

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }, {
        session
    });


    //6. Create DEBIT ledger entry
    const debitLedgerEntry = await ledgerModel.create({
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }, { session });


    //* 7. Create CREDIT ledger entry
    const creditLedgerEntry = await ledgerModel.create({
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }, { session });


    //* 8. Mark transaction COMPLETED
    transaction.status = "COMPLETED";
    await transaction.save({ session });


    //* 9. Commit MongoDB session
    await session.commitTransaction();
    session.endSession();


    // * 10. Send email notification

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);


    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    });
}

async function createInitialFuncdstransaction(req, res) {

    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "please provide all details. - toAccount , amount , idempotencyKey"
        });
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "provide a valid receiver account"
        });
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    });

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System User account not found"
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({

        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING",


    });

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], {
        session
    });

    const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], {
        session
    });

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();

    session.endSession();



    return res.status(201).json({
        message: "Initial Funds Transaction completed successfully",
        transaction: transaction
    });

}

module.exports = { createTransaction, createInitialFuncdstransaction };