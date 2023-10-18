const express=require('express')
const router=express.Router();
<<<<<<< HEAD
const {AdminverifyMiddleware} =require('./verifyMiddleware')
const {UserverifyMiddleware} = require('./verifyMiddleware');
=======
const {AdminverifyMiddleware}=require('./verifyMiddleware')
const {UserverifyMiddleware}=require('./verifyMiddleware');
>>>>>>> 4bf24a743f53ca4525a0390dae3296b193eab632
const userModel = require('../schema/user');

router.post('/recharge', AdminverifyMiddleware, async (req, res) => {
  const { rollno, rechargeamount } = req.body;

  try {
    const user = await userModel.findOne({ rollno });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.amount += rechargeamount;
    await user.save();

    return res.status(200).json({ message: 'Recharge successful', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports = router