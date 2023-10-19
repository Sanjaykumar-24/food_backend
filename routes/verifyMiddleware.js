const express=require('express')
const jwt=require('jsonwebtoken')
const adminModel = require('../schema/admin')
const userModel = require('../schema/user')

/*admin verification middleware*/

const AdminverifyMiddleware=(async(req,res,next)=>{
    const  AccessToken=req.headers.authorization.split(' ')[1]
    jwt.verify(AccessToken,process.env.ACCESS_TOKEN_SECRETKEY,async (err,user)=>{
        if(err)
        {
            return res.send({message:"token error"})
        }
        console.log(user);
        const isadmin=await adminModel.findById(user.id)
        console.log(user);
        if(!isadmin)
        return res.send({message:"not a admin"})
        req.userId = user.id;
        next();
    })
})    

/*user verification middleware*/

const UserverifyMiddleware=(async(req,res,next)=>{
    const  AccessToken = req.headers.authorization.split(' ')[1]
    jwt.verify(AccessToken,process.env.ACCESS_TOKEN_SECRETKEY,async(err,user)=>{
        if(err)
        {
            return res.send({message:"token error"})
        }
        console.log(user);
        const isuser = await userModel.findById(user.id)
        console.log(isuser);
        if(!isuser)
        return res.send({message:"not a admin"})
        req.userId = user.id;
        next();
    })
})


module.exports = {AdminverifyMiddleware,UserverifyMiddleware};