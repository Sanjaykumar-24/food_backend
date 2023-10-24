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
    return res.status(422).send({ message: "all field required" });
  }
      const userId = req.userId;
      const user = await userModel.findOne({ rollno });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
    const admin = await adminModel.findById(userId);
    console.log(admin);
    const details = {
      admin: admin.email,
      rollno: rollno,
      amount: rechargeamount
    };
    console.log(details);
    const updatedTransaction = await transactionModel.findOne({});
    console.log(updatedTransaction);
    if (!updatedTransaction) {
      await transactionModel.create(details);
      return res.status(200).json({ message: "null value solved" });
    }

    console.log(updatedTransaction);
    updatedTransaction.rechargetransaction.push(details);
    const isupdated = await updatedTransaction.save();

    console.log("Transaction updated:", isupdated);
    if (isupdated) {
      
      const numericRechargeAmount = Number(rechargeamount);
      user.amount += numericRechargeAmount;
      await user.save();
      return res.status(200).json({ message: "Recharge successful", user });
    } else {
      console.log("Transaction not found or updated.");
      return res.status(400).send({ message: "recharge failed" });
    }
  } catch (err) {
    console.log("error :"+err.message);
    return res.status(500).send({ message: "internal server error =====>" + err.message});
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
      return res.status(422).send({ message: "all fields required" });
    }
    const sender = await userModel.findOne({ _id: userId });
    const receiver = await userModel.findOne({ rollno: rollno });

    if (sender.rollno == receiver.rollno) {
      return res.status(422).send({ message: "you cannot send to you" });
    }
    if (!sender) {
      return res.status(401).send({ message: "sender not found" });
    }
    if (!receiver) {
      return res.status(401).send({ message: "receiver not found" });
    }

    let senderAmount = Number(sender.amount);
    let receiverAmount = Number(receiver.amount);
    let transferAmount = Number(amount);

    if (senderAmount < transferAmount) {
      return res.status(422).send({ message: "Insufficient Balance" });
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
      return res.status(500).send({ message: "data not stored in database" });
    }
    console.log("money transferred");
    return res.status(200).send({ message: "Money transferred", sender: sender, receiver });
  } catch (error) {
    console.log("error :"+error.message);
    return res.status(500).send({ message: "internal server error =====>" + error.message});
  }
});

module.exports = router;
