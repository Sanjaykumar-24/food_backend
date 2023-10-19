const express = require('express')
const router=express.Router();
const {AdminverifyMiddleware} = require('./verifyMiddleware')
const transactionModel = require('../schema/transactiondb')
const userModel = require('../schema/user');
const adminModel = require('../schema/admin');
router.post('/recharge', AdminverifyMiddleware, async (req, res) => {
  const { rollno, rechargeamount } = req.body;
  const userId = req.userId
  try {
    
   

    const admin = await adminModel.findById(userId);
    console.log(admin)
    const details = { admin: admin.email, rollno: rollno, amount: rechargeamount, date: new Date() };
    console.log(details);
    const updatedTransaction = await transactionModel.findOne({});
    console.log(updatedTransaction)
    if(!updatedTransaction)
    {
      await transactionModel.create(details)
      return res.json({message:"null value solved"})
    }
    
    console.log(updatedTransaction);
    updatedTransaction.rechargetransaction.push(details);
    const isupdated=await updatedTransaction.save()


    console.log("Transaction updated:", isupdated);
if (isupdated) {
  const user = await userModel.findOne({ rollno })
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const numericRechargeAmount = Number(rechargeamount);
  user.amount += numericRechargeAmount;
  await user.save();
  return res.status(200).json({ message: 'Recharge successful', user });
} else {
  console.log("Transaction not found or updated.");
  return res.send({message:"recharge failed"})
}
 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router