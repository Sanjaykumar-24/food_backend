const express = require('express')
const  {AdminverifyMiddleware} = require('./verifyMiddleware')
const router = express.Router()
const userModel = require("../schema/user")
router.post('/activation',AdminverifyMiddleware,async(req,res)=>{
   try {
      const {rfid,rollno} = req.body
      if(!rfid||!rollno)
      {
         return res.json({message:"Failed",error:"rfid not found"})
      }
      const user = await userModel.findOne({rollno:rollno})
      if(!user)
      {
         res.json({message:"Failed",error:"user not found"})
      }
      user.rfid = rfid;
      await user.save();
      res.json({message:"Success"})
      
   } catch (error) {
      console.log("error :"+error.message);
      return res.json({ message: "Failed" , error:error.message});
   }
})

module.exports = router
