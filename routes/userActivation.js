const express = require('express')
const  {AdminverifyMiddleware} = require('./verifyMiddleware')
const router = express.Router()
const userModel = require("../schema/user")
router.post('/updatename',AdminverifyMiddleware,async(req,res)=>{
   try {
      const {newname,rollno} = req.body
      const user = await userModel.findOne({rollno:rollno})
      if(!user)
      {
         res.json({message:"Failed",error:"user not found"})
      }
      const email = user.email
      const updatename = await userModel.updateOne({email:email},{$set:{username:newname}})
      if(!updatename)
      {
         res.json({message:"Failed", error:"username not updated"})
      }
      res.json({message:"Success"})
      
   } catch (error) {
      console.log("error :"+error.message);
      return res.json({ message: "Failed" , error:error.message});
   }
})

module.exports = router
