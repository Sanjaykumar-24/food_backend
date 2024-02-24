const express = require("express");
const router = express.Router();


const {
  AdminverifyMiddleware,
  UserverifyMiddleware,
} = require("./verifyMiddleware");
const transactionModel = require("../schema/transactiondb");
const userModel = require("../schema/user");
const adminModel = require("../schema/admin");
const transferModel = require("../schema/transerAmount");

/**recharge route here */

router.post("/recharge", AdminverifyMiddleware, async (req, res) => {
  try {
  const { rollno, rechargeamount } = req.body;
  if (!rollno || !rechargeamount) {
    return res.json({ message: "Failed",error:"all field required" });
  }
      const userId = req.userId;
      const user = await userModel.findOne({ rollno });
      if (!user) {
        return res.json({ message: "Failed", error: "User not found" });
      }
  
    const admin = await adminModel.findById(userId);
    console.log(admin);
    const details = {
      admin: admin.email,
      rollno: rollno,
      amount: rechargeamount,
      date:new Date()
    };
    console.log(details);
    const updatedTransaction = await transactionModel.findOne();
    console.log(updatedTransaction);
    if (!updatedTransaction) {
      await transactionModel.create(details);
      return res.json({ message: "Rerequest",error:"null value solved" });
    }

    console.log(updatedTransaction);
    updatedTransaction.rechargetransaction.push(details);
    const isupdated = await updatedTransaction.save();

    console.log("Transaction updated:", isupdated);
    if (isupdated) {
      
      const numericRechargeAmount = Number(rechargeamount);
      user.amount += numericRechargeAmount;
      await user.save();
      return res.json({ message: "Success", user });
    } else {
      console.log("Transaction not found or updated.");
      return res.json({ message: "Failed",error:"recharge failed" });
    }
  } catch (err) {
    console.log("error :"+err.message);
    return res.json({ message: "Failed" , error:err.message});
  }
});

/**amount transfer route here */

router.post("/amountTransfer", UserverifyMiddleware, async (req, res) => {
  try {
    let { rollno, amount } = req.body;
    const lower = rollno.toLowerCase();
    rollno = lower;
    const userId = req.userId;
    if (!rollno || !amount) {
      return res.json({ message: "Failed",error:"all fields required" });
    }
    const sender = await userModel.findOne({ _id: userId });
    const receiver = await userModel.findOne({ rollno: rollno });

    if (sender.rollno == receiver.rollno) {
      return res.json({ message: "Failed",error:"you cannot send to you" });
    }
    if (!sender) {
      return res.json({ message: "Failed",error:"sender not found" });
    }
    if (!receiver) {
      return res.json({ message: "Failed",error:"receiver not found" });
    }

    let senderAmount = Number(sender.amount);
    let receiverAmount = Number(receiver.amount);
    let transferAmount = Number(amount);

    if (senderAmount < transferAmount) {
      return res.json({ message: "Failed",error: "Insufficient Balance" });
    }

    sender.amount = senderAmount - transferAmount;
    receiver.amount = receiverAmount + transferAmount;

    await sender.save();
    await receiver.save();

    const transfer = await transferModel.create({
      senderRollno: sender.rollno,
      receiverRollno: receiver.rollno,
      amountTransfered: amount,
    });
    await transfer.save();

    if (!transfer) {
      return res.json({ message: "Failed" , error:"data not stored in database" });
    }
    console.log("money transferred");
    return res.json({ message: "Success", sender: sender, receiver });
  } catch (error) {
    console.log("error :"+error.message);
    return res.json({ message: "Failed>" ,error:error.message});
  }
});

module.exports = router;
