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
         return res.status(422).send({message:"all feilds required"})
      }
      const user = await userModel.findById(userId)
      if(!user)
      {
         res.status(401).send({message:"user not found"})
      }
      const email = user.email
      const updatename = await userModel.updateOne({email:email},{$set:{username:newname}})
      if(!updatename)
      {
         res.status(500).send({message:"username not updated"})
      }
      res.status(200).send({message:"username updated"})
      
   } catch (error) {
      console.log("error :"+error.message);
      return res.status(500).send({ message: "internal server error =====>" + error.message});
   }
})

module.exports = router
