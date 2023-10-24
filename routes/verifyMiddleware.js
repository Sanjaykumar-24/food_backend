const express = require("express");
const jwt = require("jsonwebtoken");
const adminModel = require("../schema/admin");
const userModel = require("../schema/user");

/*admin verification middleware*/

const AdminverifyMiddleware = async (req, res, next) => {
  console.log("---------     Admin Middleware Verification     ---------");

  try {
    const AccessToken = req.headers.authorization.split(" ")[1];
    if (!AccessToken) {
      return res.status(401).send({ message: "Illegal Access" });
    }
    jwt.verify(
      AccessToken,
      process.env.ACCESS_TOKEN_SECRETKEY,
      async (err, user) => {
        if (err) {
          return res.status(401).send({ message: "token error" });
        }
        const isadmin = await adminModel.findById(user.id);
        if (!isadmin) return res.status(401).send({ message: "not a admin" });
        req.userId = user.id;
        next();
      }
    );
  } catch (error) {
    console.log("Middleware Error: " + error.message);
    return res.status(500).send({ message: "Internal Middleware error" });
  }
};

/*user verification middleware*/

const UserverifyMiddleware = async (req, res, next) => {
  console.log("---------     USER Middleware Verification     ---------");
  try {
    const AccessToken = req.headers.authorization.split(" ")[1];
    if (!AccessToken) {
      res.status(401).send({ message: "Illegal Access" });
    }
    jwt.verify(
      AccessToken,
      process.env.ACCESS_TOKEN_SECRETKEY,
      async (err, user) => {
        if (err) {
          return res.status(500).send({ message: "token error" });
        }
        const isuser = await userModel.findById(user.id);
        if (!isuser) return res.status(401).send({ message: "not a admin" });
        req.userId = user.id;
        next();
      }
    );
  } catch (error) {
    console.log("Middleware Error: " + error.message);
    return res.status(500).send({ message: "Internal Middleware error" });
  }
};

module.exports = { AdminverifyMiddleware, UserverifyMiddleware };
