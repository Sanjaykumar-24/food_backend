const express=require('express')
const router=express.Router();
const {AdminverifyMiddleware}=require('./verifyMiddleware')
const {UserverifyMiddleware}=require('./verifyMiddleware');
const userModel = require('../schema/user');


router.post('/recharge', AdminverifyMiddleware, async (req, res) => {
  const { rollno, rechargeamount } = req.body;

  try {
    const user = await userModel.findOne({ rollno });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const numericRechargeAmount = Number(rechargeamount);
    user.amount += numericRechargeAmount;
    await user.save();

    return res.status(200).json({ message: 'Recharge successful', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports=router