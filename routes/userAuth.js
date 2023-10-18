const express = require('express')
const joi = require('joi')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const otp = require('otp-generator')
const smtpTransporter = require('nodemailer-smtp-transport')
const router = express.Router()
require('dotenv').config()
const userModel = require('../schema/user')
const e = require('express')
const transporter = nodemailer.createTransport(
    smtpTransporter({
      service: 'Gmail',
      auth: {
        user:'covaitraveller@gmail.com',
        pass:'ghzn uprx hzdt xohh',
      },
    })
  )
  const generrateAccessToken = (user)=>{
       const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRETKEY,{expiresIn:'15m'})
       return accessToken;
  }
  const generateRefreshToken = (user)=>{
      const refreshToken = jwt.sign(user,process.env.REFRESH_TOKEN_SECRETKEY,{expiresIn:'15d'})
      return refreshToken;
  }
  const otpmap = new Map()
/*otp request route here*/
router.post("/getotp",async(req,res)=>{
    const {email} = req.body;
    const otpvalue = otp.generate(4,{digits:true,upperCaseAlphabets:false,lowerCaseAlphabets:false,specialChars:false})
    console.log(otpvalue)
    const exptime = 10*60*1000
    otpmap.set(email,{code:otpvalue,exptime:exptime+Date.now()})
    const mailOptions = {
        to: email,
        subject: 'Password Reset Verification Code',
        html: ` <html>
             <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 5px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
        
                .header {
                    background-color: #007BFF;
                    color: #fff;
                    text-align: center;
                    padding: 20px;
                }
        
                .header h1 {
                    font-size: 24px;
                }
        
                .content {
                    padding: 20px;
                }
        
                .content p {
                    font-size: 16px;
                }
        
                .otp-code {
                    font-size: 28px;
                    text-align: center;
                    padding: 10px;
                    background-color: #007BFF;
                    color: #fff;
                    border-radius: 5px;
                }
        
                .footer {
                    text-align: center;
                    margin-top: 20px;
                }
        
                .footer p {
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>OTP Verification</h1>
                </div>
                <div class="content">
                    <p>Dear User,</p>
                    <p>Your OTP code for verification is:</p>
                    <div class="otp-code">${otpvalue}</div>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        `}
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.send('Error in sending email');
        } else {
          console.log('Email sent: ' + info.response);
          res.send('Check your email for the verification code');
        }
      })
   setTimeout(()=>{
     otpmap.delete(email)
   },10*60*1000)
})
/*register route here*/
router.post("/register",async(req,res)=>{
   const joischema = joi.object(
    {
        password:joi.string().min(6).required(),
        email:joi.string().email().required(),
        rollno:joi.string().required(),
        username:joi.string().min(6).required(),
        verifyotp:joi.string().required()
    }
   )
   const {error,value} = joischema.validate(req.body);
   console.log(value);
   if(error)
   {
    console.log(error.message)
    res.send({message:"invalid data"})
   }
   const alreadyUser = await userModel.findOne({ email: value.email });
    if(value.verifyotp!=otpmap?.get(value.email)?.code)
    {
        res.send({message:"not verified"})
    }
    if (alreadyUser) {
    return res.json({ message: "User is already registered" });
  }
    try {
        const hashedpassword = await bcrypt.hash(value.password,10);
        if(!hashedpassword)
        {
         res.send({message:"password not hashed"})
        }
        value.password = hashedpassword
      const data = await userModel.create(value);
      const userid = {id:data.id};
      const accessToken = generrateAccessToken(userid)
      const refreshToken = generateRefreshToken(userid)
      return res.json({message:"user registered sucessfully",accessToken:accessToken,refreshToken:refreshToken})
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Error while registering user" });
    }
})
/*login route here*/
router.post("/login",async(req,res)=>{
    const {email,password} = req.body;
    const user = await userModel.findOne({email:email})
    if(!user)
    {
        res.send({message:"user not found"})
    }
    const hashpass = user.password
    const id = {id:user.id};
    bcrypt.compare(password,hashpass,(err,result)=>{
        if(err)
        {
            res.send({message:"error while comparing password"})
        }
        if(result)
        {
            const accessToken = generrateAccessToken(id);
            const refreshToken = generateRefreshToken(id);
            res.send({message:"password is correct",accessToken:accessToken,refreshToken:refreshToken})
        }
    })
})


/*changepassword route here */
router.post("/otpverify",async(req,res)=>
{
    const {email,code} = req.body;
    console.log(otpmap.get(email))
    const otp = otpmap.get(email);
    console.log(otp)
    try{
    if(!otp)
    {
        res.send({message:"otp expired"})
    }
    else if(otp.code == code && otp.exptime > Date.now())
    {
        res.send({message:"otp verified",verifyotp:otp.code})
    }
    else if(otp.code != code)
    {
        res.send({message:"invalid otp"})
    }
    }
    catch(error)
    {
       console.log(error.message)
       res.send({message:"internal server error"})
    }
})
router.post("/changepassword",async(req,res)=>{
      const {email,newpass,hashotp} = req.body
      const verify =  bcrypt.compare(otpmap.get(email).code,hashotp)
      if(!verify)
      {
        res.send("otp not verified")
      }
      const hashpassnew = await bcrypt.hash(newpass,10)
      if(!hashpassnew)
      {
        res.send({message:"password not hashed"})
      }
      const user = await userModel.updateOne({email:email},{$set:{password:hashpassnew}})
      if(!user)
      {
        res.send({message:"password not updated"})
      }
      otpmap.delete(email)
      res.send({message:"password updated"})
});
/*token refresh route here*/
router.post("/token",(req,res)=>{
    const oldrefreshToken = req.headers.authorization.split(" ")[1];
    jwt.verify(oldrefreshToken,process.env.REFRESH_TOKEN_SECRETKEY,(err,user)=>{
       if(err)
       {
        console.log(err.message)
        return res.send({message:"access token is not valid"})
       }
       const userid = {id:user?.id}
       const accessToken = generrateAccessToken(userid)
       const refreshToken = generateRefreshToken(userid)
       res.send({message:"token generated",accessToken:accessToken,refreshToken:refreshToken})
    })
})
module.exports = router;