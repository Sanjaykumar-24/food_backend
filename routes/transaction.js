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
    const user = await userModel.findOne({ rollno })
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const numericRechargeAmount = Number(rechargeamount);
    user.amount += numericRechargeAmount;
    await user.save();
    const admin = await adminModel.findById(userId)
    const details = {admin:admin.email,rollno:rollno,amount:rechargeamount,Date:new Date()}
    const addtrans = await transactionModel.findOneAndUpdate({})
    return res.status(200).json({ message: 'Recharge successful', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router