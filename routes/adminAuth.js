const express = require("express");
const pdfdocument = require('pdfkit')
const otp_generator = require("otp-generator");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const adminModel = require("../schema/admin");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { AdminverifyMiddleware } = require("./verifyMiddleware");
const loginModel = require("../schema/Adminlogindetails");
const tokenModel = require("../schema/tokenschema");
const date = require("./date")


const verificationCodes = new Map();
const OTP = () => {
    const otp = otp_generator.generate(6, {
        upperCaseAlphabets: true,
        specialChars: true,
        digits: true,
    });
    return otp;
};

const generrateAccessToken = (user) => {
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRETKEY, {
        expiresIn: "1d",
    });
    return accessToken;
};
const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRETKEY, {
        expiresIn: "15d",
    });
    return refreshToken;
};

const transporter = nodemailer.createTransport(
    smtpTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.APP_PASS,
        },
    })
);

/*otp generating for registering a admin route here*/

router.post("/registergetotp", async(req, res) => {
    try {
        const { email } = req.body;
        const admin = await adminModel.findOne({ email: email });
        if (admin) {
            return res.json({ message: "Failed", error: "admin with this mail already exists" });
        }
        const otpvalue = otp_generator.generate(4, {
            digits: true,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log(otpvalue);
        const exptime = 10 * 60 * 1000;
        verificationCodes.set(email, {
            code: otpvalue,
            exptime: exptime + Date.now(),
        });
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
                return res.json({ message: "Failed", error: error.message });
            } else {
                console.log("Email sent: " + info.response);
                return res.json({ message: "Success" });
            }
        });
        const timeID = setTimeout(() => {
            verificationCodes.delete(email);
        }, exptime);
        clearTimeout(timeID);
    } catch (error) {
        console.log("error :" + error.message);
        return res.json({ message: "Failed", error: error.message });
    }
});

/**generate otp for changing password for a admin */

router.post("/forgetgetotp", async(req, res) => {
    try {
        const { email } = req.body;
        const admin = await adminModel.findOne({ email: email });
        if (!admin) {
            return res.json({ message: "Failed", error: "admin with this mail not found" });
        }
        const otpvalue = otp_generator.generate(4, {
            digits: true,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log(otpvalue);
        const exptime = 10 * 60 * 1000;
        verificationCodes.set(email, {
            code: otpvalue,
            exptime: exptime + Date.now(),
        });
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
                return res.json({ message: "Failed", error: error.message });
            } else {
                console.log("Email sent: " + info.response);
                return res.json({ message: "Success" });;
            }
        });
        const timeID = setTimeout(() => {
            verificationCodes.delete(email);
        }, exptime);
        clearTimeout(timeID);
    } catch (error) {
        console.log("error :" + error.message);
        return res.json({ message: "Failed", error: error.message });
    }
});

/*otp verifying route here*/

router.post("/otpverify", async(req, res) => {
    try {
        const { email, code } = req.body;
        console.log(verificationCodes.get(email));
        const otp = verificationCodes.get(email);
        console.log(otp);

        if (!otp) {
            return res.json({ message: "Failed", error: "otp expired" });
        } else if (otp.code == code && otp.exptime > Date.now()) {
            return res.json({ message: "Success", verifyotp: otp.code });
        } else if (otp.code != code) {
            return res.json({ message: "Failed", error: "invalid otp" });
        }
    } catch (error) {
        console.log("error :" + error.message);
        return res.json({ message: "Failed", error: error.message });
    }
});

/*admin register route here*/

router.post("/register", async(req, res) => {
    try {
        const schema = Joi.object({
            password: Joi.string().min(6).required(),
            email: Joi.string().email().required(),
            verifyotp: Joi.string().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.json({ message: "Failed", error: error.message });
        }
        const alreadyAdmin = await adminModel.findOne({ email: value.email });
        if (alreadyAdmin) {
            return res.json({ message: "Failed", error: "Admin is already registered" });
        }
        if (value.verifyotp != verificationCodes.get(value.email) ?.code) {
            return res.json({ message: "Failed", error: "not verified" });
        }
        const { email, password } = value;
        const hashedPassword = await bcrypt.hash(password, 10);

        const data = await adminModel.create({ email, password: hashedPassword });
        console.log(data);
        console.log(String(data.date))
        const userid = { id: data.id };
        const accessToken = generrateAccessToken(userid);
        const refreshToken = generateRefreshToken(userid);
        verificationCodes.delete(email);
        const date_ = date()
        console.log(date);
        await tokenModel.create({
            email: value.email,
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            Created_on: date_,
            Modified_on: date_
        })
        console.log("Admin token saved")
        return res.json({
            message: "Success",
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    } catch (error) {
        console.error(error);
        return res.json({ message: "Failed", error: error.message });
    }
});

/* login route here */

router.post("/login", async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.log("all feilds required");
            return res.json({ message: "Failed", error: "all fields required" });
        }

        const admin = await adminModel.findOne({ email: email });
        if (!admin) {
            return res.json({ message: "Failed", error: "admin not found" });
        }
        const hashpass = admin.password;
        bcrypt.compare(password, hashpass, async(err, result) => {
            if (err) {
                return res.json({ message: "Failed", error: err.message });
            }
            if (!result) {
                return res.json({ message: "Failed", error: "password wrong" });
            }
            if (result) {
                const userid = { id: admin.id };
                const accessToken = generrateAccessToken(userid);
                const refreshToken = generateRefreshToken(userid);
                const admindetails = await loginModel.findOne({ email });

                if (admindetails) {
                    if (admindetails.isLogged) {
                        return res.json({ message: "Failed", error: "This account is already in use" });
                    } else {
                        admindetails.email = email;
                        admindetails.isLogged = true;

                        await admindetails.save();
                    }
                } else {
                    const newUser = new loginModel({
                        email: email,
                        isLogged: true
                    });
                    await newUser.save();
                }
                let tokendata = await tokenModel.findOne({ email });

                if (tokendata) {
                    tokendata.AccessToken = accessToken;
                    tokendata.RefreshToken = refreshToken;
                    tokendata.Modified_on = date()
                    await tokendata.save();

                    console.log("Token Data Updated:", tokendata);
                } else {
                    console.log("No Token Data found for email:", email);
                }
                return res.json({
                    message: "Success",
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                });
            }
        });
    } catch (error) {
        console.log("error :" + error.message);
        return res.json({ message: "Failed" + error.message });
    }
});

/*admin change password here*/

router.post("/changepassword", async(req, res) => {
    try {
        const { email, newpass, verifyotp } = req.body;
        if (!email || !newpass || !verifyotp) {
            return res.json({ Message: "Failed", error: "Missing details" });
        }
        if (verifyotp != verificationCodes ?.get(email) ?.code) {
            return res.json({ message: "Failed", error: "otp not verified" });
        }
        const db_user = await adminModel.findOne({ email });
        if (!db_user) {
            return res.json({ message: "Failed", error: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(newpass, 10);
        const find = { email: email };
        const update = { password: hashedPassword };
        const options = { new: true };

        const updatedDocument = await adminModel.findOneAndUpdate(
            find,
            update,
            options
        );

        if (updatedDocument) {
            console.log(updatedDocument);
            verificationCodes.delete(email);
            return res.json({ message: "Success" });
        } else {
            console.log("Document is empty");
            return res.json({ message: "Failed", error: "Empty is not allowed" });
        }
    } catch (err) {
        console.log("error :" + err.message);
        return res.json({ message: "Failed", error: err.message });
    }
});

/*access token route here*/

router.post("/token", async(req, res) => {
    try {
        const oldrefreshToken = req.headers.authorization.split(" ")[1];
        if (!oldrefreshToken) {
            res.json({ message: "Failed", error: "all deatils required" })
        }
        jwt.verify(
            oldrefreshToken,
            process.env.REFRESH_TOKEN_SECRETKEY,
            async(err, user) => {
                if (err) {
                    console.log(err.message);
                    return res.send({ message: "Failed", error: "token expired" });
                }
                const userid = { id: user ?.id };
                const user_ = await adminModel.findById(user.id);
                let tokendata = await tokenModel.findOne({ email: user_.email });

                const accessToken = generrateAccessToken(userid);
                const refreshToken = generateRefreshToken(userid);
                if (tokendata) {
                    tokendata.AccessToken = accessToken;
                    tokendata.RefreshToken = refreshToken;
                    tokendata.Modified_on = date()
                    await tokendata.save();

                    console.log("Token Data Updated:", tokendata);
                } else {
                    console.log("No Token Data found for this email:", email);
                }
                return res.json({
                    message: "Success",
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                });
            }
        );
    } catch (error) {
        console.log("error :" + error.message);
        return res.json({ message: "Failed", error: error.message });
    }
});

/**logout route here */


router.post('/logout', AdminverifyMiddleware, async(req, res) => {

    try {
        const userId = req.userId;
        const Admindetails = await adminModel.findById(userId);
        const { email } = Admindetails.email;
        const deletedAdmin = await loginModel.findOneAndRemove(email)
        let tokendata = await tokenModel.findOne({ email: Admindetails.email });

        if (tokendata) {
            tokendata.AccessToken = "No token";
            tokendata.RefreshToken = "No Token";
            tokendata.Modified_on = date()
            await tokendata.save();

            console.log("Token Data Updated:", tokendata);
        } else {
            console.log("No Token Data found for email:", email);
        }

        console.log(deletedAdmin)
        if (!deletedAdmin) {
            console.log("No user logged in");
            return res.json({ message: "Failed", error: "No user logged in" });
        }
        return res.json({ message: "Success" });

    } catch (error) {
        console.log("error :" + error.message);
        return res.json({ message: "Failed", error: error.message });
    }
})

/**billing route here */

router.post('/bill', async(req, res) => {
    const { orderId } = req.body;
    const item = []
    const pdfdocument = new pdfdocument()
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=bill.pdf');
    pdfdocument.pipe(res);
    pdfdocument.font('Helvetica-Bold');
    pdfdocument.fontSize(14);
    pdfdocument.text(new Date().toString().slice(0, 10), 60, 50)
    pdfdocument.fontSize(20)
    pdfdocument.text("SmartBilling", 250, 50)
    pdfdocument.fontSize(16)
    pdfdocument.text("rollno", 490, 50)
    pdfdocument.moveDown(1)

    const top = 150
    pdfdocument.fontSize(15);
    pdfdocument.text("s.no", 80, top);
    pdfdocument.text("product", 200, top);
    pdfdocument.text("quantity", 340, top);
    pdfdocument.text("price", 500, top);
    pdfdocument.font('Helvetica');

    pdfdocument.fontSize(12);
    let y = 200;
    for (const item of items) {
        pdfdocument.text(item.serial.toString(), 80, y);
        pdfdocument.text(item.product, 200, y);
        pdfdocument.text(item.quantity.toString(), 360, y);
        pdfdocument.text(item.price.toFixed(2), 500, y);
        y += 30;
    }

    pdfdocument.fontSize(15);
    pdfdocument.font('Helvetica-Bold');
    pdfdocument.text(`total: ${80}`, 480, y + 10);

    pdfdocument.end();
})


module.exports = router;