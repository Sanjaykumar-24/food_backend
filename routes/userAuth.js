const express = require("express");
const joi = require("joi");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const otp = require("otp-generator");
const smtpTransporter = require("nodemailer-smtp-transport");
const router = express.Router();
require("dotenv").config();
const userModel = require("../schema/user");
// const e = require("express");
const { UserverifyMiddleware } = require("./verifyMiddleware");
const AdminloginModel = require("../schema/userlogindetails");
const userloginModel = require("../schema/userlogindetails");
const tokenModel = require("../schema/tokenschema");
const date = require("./date");

const transporter = nodemailer.createTransport(
  smtpTransporter({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASS,
    },
  })
);

const generrateAccessToken = (user) => {
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRETKEY, {
    expiresIn: "15m",
  });
  return accessToken;
};
const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRETKEY, {
    expiresIn: "15d",
  });
  return refreshToken;
};
const otpmap = new Map();

/*otp request for registering a user route here*/

router.post("/registergetotp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email: email });
    if (user) {
      return res
        .json({ message: "Failed",error:"user with this email already exist" });
    }
    const otpvalue = otp.generate(4, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log(otpvalue);
    const exptime = 10 * 60 * 1000;
    otpmap.set(email, { code: otpvalue, exptime: exptime + Date.now() });
    const mailOptions = {
      to: email,
      subject: "Password Reset Verification Code",
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
            `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.json({message:"Failed",error:"Error in sending email"});
      } else {
        console.log("Email sent: " + info.response);
        return res.json({message:"Success"});
      }
    });
    const timeId = setTimeout(() => {
      otpmap.delete(email);
    }, exptime);
    clearTimeout(timeId);
  } catch (error) {
    console.log("error :" + error.message);
    return res.json({ message:"Failed",error:error.message});
  }
});

/**forget password get otp route here */

router.post("/forgetgetotp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res.json({ message:"Failed",error:"user with this email not found" });
    }
    const otpvalue = otp.generate(4, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log(otpvalue);
    const exptime = 10 * 60 * 1000;
    otpmap.set(email, { code: otpvalue, exptime: exptime + Date.now() });
    const mailOptions = {
      to: email,
      subject: "Password Reset Verification Code",
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
            `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.json({message:"Failed",error:"Error in sending email"});
      } else {
        console.log("Email sent: " + info.response);
        return res.json({message:"Success"});
      }
    });
    const timeId = setTimeout(() => {
      otpmap.delete(email);
    }, exptime);
    clearTimeout(timeId);
  } catch (error) {
    console.log("error :" + error.message);
    return res.json({ message: "Failed" ,error:error.message });
  }
});


/*otpverification route here */

router.post("/otpverify", async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log(otpmap.get(email));
    const otp = otpmap.get(email);
    console.log(otp);
    if (!otp) {
      return res.json({ message:"Failed",error:"otp expired" });
    } else if (otp.code == code && otp.exptime > Date.now()) {
      return res.json({ message: "Success", verifyotp: otp.code });
    } else if (otp.code != code) {
      return res.json({ message:"Failed" ,error:"invalid otp" });
    }
  } catch (error) {
    console.log("error :" + error.message);
    return res.json({ message:"Failed" ,error:error.message });
  }
});

/*register route here*/

router.post("/register", async (req, res) => {
  try {
    const joischema = joi.object({
      password: joi.string().min(6).required(),
      email: joi.string().email().required(),
      rollno: joi.string().required(),
      username: joi.string().min(6).required(),
      verifyotp: joi.string().required(),
    });
    const { error, value } = joischema.validate(req.body);
    console.log(value);
    if (error) {
      console.log(error.message);
      return res.json({ message:"Failed",error:"invalid data" });
    }
    const alreadyUser = await userModel.findOne({ email: value.email });
    if (alreadyUser) {
      return res.json({ message:"Failed",error:"User is already registered" });
    }
    if (value.verifyotp != otpmap?.get(value.email)?.code) {
      return res.json({ message:"Failed",error:"not verified" });
    }

    const hashedpassword = await bcrypt.hash(value.password, 10);
    if (!hashedpassword) {
      return res.json({ message:"Failed",error:"password not hashed" });
    }
    value.password = hashedpassword;
    const data = await userModel.create(value);
    const userid = { id: data.id };
    const accessToken = generrateAccessToken(userid);
    const refreshToken = generateRefreshToken(userid);
    const date_=date()
    console.log(date);
    await tokenModel.create({ email: value.email ,
      AccessToken:accessToken,RefreshToken:refreshToken,Created_on:date_,Modified_on:date_
    })
    console.log("token saved")
    otpmap.delete(value.email);
    return res.json({
      message: "Success",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.log("error :" + error.message);
    return res.json({ message:"Failed" ,error:error.message });
  }
});

/*login route here*/

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ message:"Failed",error:"all feilds required" });
    }
    const user = await userModel.findOne({ email });
    console.log(user);
    if (!user) {
      return res.josn({ message:"Failed",error:"user not found" });
    }
   
    const hashpass = user.password;
    const id = { id: user.id };
    bcrypt.compare(password, hashpass, async (err, result) => {
      if (err) {
        return res
          .status(500)
          .send({ message: "error while comparing password" });
      }      
      if (!result) {
        console.log("Incorrect password!");
        return res.status(401).send({ message: "Incorrect password" });
      }
      if (result) {
        const accessToken = generrateAccessToken(id);
        const refreshToken = generateRefreshToken(id);
        const userdetails = await userloginModel.findOne({ email });
        if (userdetails) {
          if (userdetails.isLogged) {
            return res
              .status(401)
              .send({ message: "This account is already in use" });
          } else {
            userdetails.email = email;
            userdetails.isLogged = true;
            await userdetails.save();
          }
        } else {
          const newUser = new userloginModel({
            email: email,
            isLogged: true,
          });
          await newUser.save();
        }
        let tokendata = await tokenModel.findOne({email });

        if (tokendata) {
          tokendata.AccessToken = accessToken;
          tokendata.RefreshToken = refreshToken;
          tokendata.Modified_on = date()
          await tokendata.save();
      
          console.log("Token Data Updated:", tokendata);
        } else {
          console.log("No Token Data found for email:", email);
        }
      
        return res.status(200).send({
          message: "password is correct",
          email: user.email,
          user_name: user.username,
          balance: user.amount,
          accessToken: accessToken,
          refreshToken: refreshToken,
        });
      }
    });
  } catch (error) {
    console.log("error :" + error.message);
    return res
      .status(500)
      .send({ message: "internal server error =====>" + error.message });
  }
});

/*chang password route here*/

router.post("/changepassword", async (req, res) => {
  try {
    const { email, newpass, verifyotp } = req.body;
    if (verifyotp != otpmap?.get(email)?.code) {
      return res.status(401).send("otp not verified");
    }
    const hashpassnew = await bcrypt.hash(newpass, 10);
    if (!hashpassnew) {
      return res.status(500).send({ message: "password not hashed" });
    }
    const user = await userModel.updateOne(
      { email: email },
      { $set: { password: hashpassnew } }
    );
    if (!user) {
      return res.status(500).send({ message: "password not updated" });
    }
    otpmap.delete(email);
    return res.status(200).send({ message: "password updated" });
  } catch (error) {
    console.error("error: " + error.message);
    return res.status(500).send({ message: "Internal server error" });
  }
});

/*token refresh route here*/

router.post("/token", async(req, res) => {
  try {
    const oldrefreshToken = req.headers.authorization.split(" ")[1];
    if (!oldrefreshToken) {
      return res.status(422).send({ message: "illigal access" });
    }
    jwt.verify(
      oldrefreshToken,
      process.env.REFRESH_TOKEN_SECRETKEY,
      async (err, user) => {
        if (err) {
          console.log(err.message);
          return res.status(401).send({ message: "access token is not valid" });
        }
        const userid = {id:user?.id};
        const user_ = await userModel.findById( user.id);
        console.log(user_)
        const accessToken = generrateAccessToken(userid);
        const refreshToken = generateRefreshToken(userid);
        console.log(user_)
        let tokendata = await tokenModel.findOne({email:user_.email});

        if (tokendata) {
          tokendata.AccessToken = accessToken;
          tokendata.RefreshToken = refreshToken;
          tokendata.Modified_on = date()
          await tokendata.save();
      
          console.log("Token Data Updated:", tokendata);
        } else {
          console.log("No Token Data found for email:", email);
        }
        return res.status(200).send({
          message: "token generated",
          accessToken: accessToken,
          refreshToken: refreshToken,
        });
      }
    );
  } catch (error) {
    console.log("error :" + error.message);
    return res
      .status(500)
      .send({ message: "internal server error =====>" + error.message });
  }
});

router.post("/logout", UserverifyMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const userdetails = await userModel.findById(userId);
    const { email } = userdetails.email;
    const deleteduser = await userloginModel.findOneAndRemove(email);
    let tokendata = await tokenModel.findOne({email:userdetails.email});

        if (tokendata) {
          tokendata.AccessToken = "No token";
          tokendata.RefreshToken = "No Token";
          tokendata.Modified_on = date()
          await tokendata.save();
      
          console.log("Token Data Updated:", tokendata);
        } else {
          console.log("No Token Data found for email:", email);
        }
    console.log(deleteduser);
    if (!deleteduser) {
      console.log("No user logged in");
      return res.status(500).send({ message: "Logout Failed" });
    }
    return res.status(200).send({ message: "Logout successfull" });
  } catch (error) {
    console.log("error :" + error.message);
    return res
      .status(500)
      .send({ message: "internal server error =====>" + error.message });
  }
});

module.exports = router;
