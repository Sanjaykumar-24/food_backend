const express = require('express')
const  {UserverifyMiddleware} = require('./verifyMiddleware')
const router = express.Router()
const userModel = require("../schema/user")
router.post('/updatename',UserverifyMiddleware,async(req,res)=>{
   try {
      const userId = req.userId
      const {newname} = req.body
      if(!username)
      {
         return res.json({message:"all feilds required"})
      }
      const user = await userModel.findById(userId)
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
