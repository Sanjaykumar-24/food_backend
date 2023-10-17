const express = require('express');
const otp_generator = require('otp-generator')
const bcrypt = require('bcrypt');
const Joi = require('joi');
const adminModel = require('../schema/admin');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const router = express.Router();

const verificationCodes = new Map();
const OTP=()=>{
    const otp=otp_generator.generate(6,{upperCaseAlphabets:true,specialChars:true,digits:true})
    return otp;
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/adminregister', async (req, res) => {
  const schema = Joi.object({
    password: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
  });

  const { error, value } = schema.validate(req.body);
  const alreadyAdmin = await adminModel.findOne({ email: value.email });

  if (alreadyAdmin) {
    return res.json({ message: "User is already registered" });
  }
  
    const { email, password } = value;
    const hashedPassword = await bcrypt.hash(password,10);

    try {
      const data = await adminModel.create({ email, password: hashedPassword });
      console.log(data);
      return res.send({ message: "User registered successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Error while registering user" });
    }
});



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/forgot', async(req, res) => {
  const {email} = req.body;
  const ifuser=await adminModel.findOne({email})
  if(ifuser)
  {
    const num= OTP();
    console.log(num);
    const generatedCode = num ;
    const expirationTime = 10 * 60 * 1000;

 
    verificationCodes.set(email, {
        code: generatedCode,
        expires: Date.now() + expirationTime,
    });

  const mailOptions = {
    to: email,
    subject: 'Password Reset Verification Code',
    text: `Your verification code is: ${generatedCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.send('Error sending email');
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Check your email for the verification code.');
    }
  });

  setTimeout(() => {
    verificationCodes.delete(email);
  }, expirationTime);
}
else{
    res.send("email is not registered");
}
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const verifyCodeMiddleware = (req, res, next) => {
  const email = req.body.email;
  const code = req.body.code;
  const storedCode = verificationCodes.get(email);

  if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expires) {
    res.send('Invalid or expired code.');
  } else {
    verificationCodes.delete(email);
    next(); 
  }
};


router.post('/change-password', verifyCodeMiddleware, async (req, res) => {
  const { email, password } = req.body;
  const db_user = await adminModel.findOne({ email });
  if (!db_user) {
    return res.status(404).send({ message: "User not found" });
  }
  const comp = await bcrypt.compare(password, db_user.password);
  if (comp) {
    return res.send({ message: "Don't use old password" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const find = { email: email };
  const update = { password: hashedPassword };
  const options = { new: true };
  try {
    const updatedDocument = await adminModel.findOneAndUpdate(find, update, options);

    if (updatedDocument) {
      console.log(updatedDocument);
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
module.exports = router;
