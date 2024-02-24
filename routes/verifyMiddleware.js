const express = require("express");
const jwt = require("jsonwebtoken");
const adminModel = require("../schema/admin");
const userModel = require("../schema/user");
const tokenModel = require("../schema/tokenschema");

/*admin verification middleware*/

const AdminverifyMiddleware = async (req, res, next) => {
  console.log("---------     Admin Middleware Verification     ---------");

  try {
    const AccessToken = req.headers.authorization.split(" ")[1];
    if (!AccessToken) {
      return res.json({ message: "Failed", error: "Illegal Access" });
    }
    jwt.verify(
      AccessToken,
      process.env.ACCESS_TOKEN_SECRETKEY,
      async (err, user) => {
        if (err) {
          return res
            .status(401)
            .json({ message: "Failed", error: "jwt expired" });
        }
        const isadmin = await adminModel.findById(user.id);
        if (!isadmin)
          return res.json({ message: "Failed", error: "not a admin" });

        let tokendata = await tokenModel.findOne({ email: isadmin.email });
        console.log("detals:" + tokendata);
        console.log("ACCESSTOKEN:" + AccessToken);
        if (!tokendata) {
          return res.json({ message: "Failed", error: "token not found" });
        }
        if (tokendata.AccessToken !== AccessToken) {
          return res
            .status(401)
            .json({ message: "Failed", error: "token is not valid" });
        }
        req.userId = user.id;
        next();
      }
    );
  } catch (error) {
    console.log("Middleware Error: " + error.message);
    return res.json({ message: "Failed", error: error.message });
  }
};

/*user verification middleware*/

const UserverifyMiddleware = async (req, res, next) => {
  console.log("---------     USER Middleware Verification     ---------");
  try {
    const AccessToken = req.headers.authorization.split(" ")[1];
    if (!AccessToken) {
      res.json({ message: "Failed", error: "Illegal Access" });
    }
    jwt.verify(
      AccessToken,
      process.env.ACCESS_TOKEN_SECRETKEY,
      async (err, user) => {
        if (err) {
          return res.json({ message: "Failed", error: err.message });
        }
        const isuser = await userModel.findById(user.id);
        if (!isuser)
          return res.json({ message: "Failed", error: "not a user" });
        req.userId = user.id;
        // const userdetails = await userModel.findById(user.id);
        let tokendata = await tokenModel.findOne({ email: isuser.email });
        console.log("detals:" + tokendata);
        if (!tokendata) {
          return res.json({ message: "Failed", error: "token not found" });
        }
        if (tokendata.AccessToken !== AccessToken) {
          return res.json({ message: "Failed", error: "token is not valid" });
        }
        next();
      }
    );
  } catch (error) {
    console.log("Middleware Error: " + error.message);
    return res.json({ message: "Failed", error: error.message });
  }
};

const socketVerifyMiddleware = async (socket, next) => {
  const token = socket.handshake.auth.token;
  console.log("----------------Socket verification----------------", token);
  if (!token) {
    return next(new Error("token error"));
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRETKEY, async (err, user) => {
    if (err) {
      console.log("Auth err");
      return next(new Error("Authentication error"));
    }
    console.log(user);
    next();
  });
};

module.exports = {
  AdminverifyMiddleware,
  UserverifyMiddleware,
  socketVerifyMiddleware,
};
