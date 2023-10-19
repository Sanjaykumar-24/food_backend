const express = require('express');
const otp_generator = require('otp-generator')
const bcrypt = require('bcrypt');
const Joi = require('joi');
const adminModel = require('../schema/admin');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const router = express.Router();
const jwt = require('jsonwebtoken')
const verificationCodes = new Map();
const OTP=()=>{
    const otp=otp_generator.generate(6,{upperCaseAlphabets:true,specialChars:true,digits:true})
    return otp;
}

const generrateAccessToken = (user)=>{
  const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRETKEY,{expiresIn:'15m'})
  return accessToken;
}
const generateRefreshToken = (user)=>{
 const refreshToken = jwt.sign(user,process.env.REFRESH_TOKEN_SECRETKEY,{expiresIn:'15d'})
 return refreshToken;
}

const transporter = nodemailer.createTransport(
  smtpTransport({
    service: 'Gmail',
    auth: {
      user:'covaitraveller@gmail.com',
      pass:'ghzn uprx hzdt xohh',
    },
  })
);

/*otp generating route here*/


router.post("/getotp",async(req,res)=>{
  const {email} = req.body;
  const otpvalue = otp_generator.generate(4,{digits:true,upperCaseAlphabets:false,lowerCaseAlphabets:false,specialChars:false})
  console.log(otpvalue)
  const exptime = 10*60*1000
  verificationCodes.set(email,{code:otpvalue,exptime:exptime+Date.now()})
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
        return res.send('Error in sending email');
      } else {
        console.log('Email sent: ' + info.response);
        return res.send('Check your email for the verification code');
      }
    })
 const timeID =  setTimeout(()=>{
   verificationCodes.delete(email)
 },exptime)
 clearTimeout(timeID)
})

/*otp verifying route here*/


router.post("/otpverify",async(req,res)=>
{
    const {email,code} = req.body;
    console.log(verificationCodes.get(email))
    const otp = verificationCodes.get(email);
    console.log(otp)
    try{
    if(!otp)
    {
       return res.send({message:"otp expired"})
    }
    else if(otp.code == code && otp.exptime > Date.now())
    {
     return res.send({message:"otp verified",verifyotp:otp.code}) 
    }
    else if(otp.code != code)
    {
       return res.send({message:"invalid otp"})
    }
    }
    catch(error)
    {
       console.log(error.message)
       return res.send({message:"internal server error"})
    }
})


/*admin register route here*/


router.post('/register', async (req, res) => {
  const schema = Joi.object({
    password: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
    verifyotp:Joi.string().required()
  });
  const { error, value } = schema.validate(req.body);
  if(error)
  {
   return res.send("invalid data")
  }
  const alreadyAdmin = await adminModel.findOne({ email: value.email });
  if(value.verifyotp!=verificationCodes.get(value.email)?.code)
    {
       return res.send({message:"not verified"})
    }
  if (alreadyAdmin) {
    return res.json({ message: "Admin is already registered" });
  }
    const { email, password } = value;
    const hashedPassword = await bcrypt.hash(password,10);
    try {
      const data = await adminModel.create({ email, password: hashedPassword });
      console.log(data);
      const userid = {id:data.id}
      const accessToken = generrateAccessToken(userid)
      const refreshToken = generateRefreshToken(userid)
      verificationCodes.delete(email)
      return res.send({ message: "User registered successfully",accessToken:accessToken,refreshToken:refreshToken});
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Error while registering user" });
    }
});

/* login route here */

router.post('/login',async(req,res)=>{
  const {email,password} = req.body;
  const admin = await adminModel.findOne({email:email})
  if(!admin)
  {
   return res.send({message:"admin not found"})
  }
  const hashpass = admin.password
   bcrypt(password,hashpass,(err,result)=>{
      if(err)
      {
       return res.send({message:"password wrong"})
      }
      if(result)
      {
        const userid = {id:admin.id}
        const accessToken = generrateAccessToken(userid)
        const refreshToken = generateRefreshToken(userid)
       return res.send({message:"login sucessful",accessToken:accessToken,refreshToken:refreshToken})
      }
  })
})


/*admin change password here*/

router.post('/changepassword', async (req, res) => {
  const {email,newpass,verifyotp } = req.body;
  if(verifyotp!=verificationCodes?.get(email)?.code)
  {
   return res.send("otp not verified")
  }
  const db_user = await adminModel.findOne({ email });
  if (!db_user) {
    return res.status(404).send({ message: "User not found" });
  }
  if(verifyotp!=verificationCodes?.get(email)?.code)
  {
   return res.send({message:"otp not verified"})
  }
  const hashedPassword = await bcrypt.hash(newpass, 10);
  const find = { email: email };
  const update = { password: hashedPassword };
  const options = { new: true };
  try {
    const updatedDocument = await adminModel.findOneAndUpdate(find, update, options);

    if (updatedDocument) {
      console.log(updatedDocument);
      verificationCodes.delete(email)
      return res.status(200).send({ message:"Password changed"});
    } else {
      console.log("Document is empty");
      return res.status(404).send({ message:"Empty is not allowed"});
    }
  } catch (err) {
    console.log(err.message);
    return res.status(404).send({ message:"Password not changed"})
  }
});


/*access token route here*/

router.post('/token',async(req,res)=>{
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
     return res.send({message:"token generated",accessToken:accessToken,refreshToken:refreshToken})
  })
})

module.exports = router;
