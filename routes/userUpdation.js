const express = require('express')
const  {UserverifyMiddleware} = require('./verifyMiddleware')
const router = express.Router()
const userModel = require("../schema/user")
router.post('/updatename',UserverifyMiddleware,async(req,res)=>{
     const userId = req.userId
     const {newname} = req.body
     const user = await userModel.findById(userId)
     if(!user)
     {
        res.send({message:"user not found"})
     }
     const email = user.email
     const updatename = await userModel.updateOne({email:email},{$set:{username:newname}})
     if(!updatename)
     {
        res.send({message:"username not updated"})
     }
     res.send({message:"username updated"})
})

module.exports = router
