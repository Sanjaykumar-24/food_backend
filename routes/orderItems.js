const express = require("express");
const mongoose = require("mongoose");
const userModel = require("../schema/user");
const categoryModel = require("../schema/products");
const orderModel = require("../schema/orders");
const qrcode = require("qrcode");
const date = require("./date");
const { soc } = require("../transporter/socketTransport");
const {
  UserverifyMiddleware,
  AdminverifyMiddleware,
} = require("../routes/verifyMiddleware");
const adminModel = require("../schema/admin");
const router = express.Router();
// !user order route here

router.post("/user", UserverifyMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.userId;
    const { orders, totalPrice } = req.body;

    if (!orders || !totalPrice || totalPrice <= 0) {
      return res.json({ message: "Failed", error: "Invalid details" });
    }

    let amount = 0;
    const userBal = await userModel.findById(userId, "amount");

    if (userBal.amount < totalPrice) {
      return res.json({ message: "Failed", error: "Insufficient balance" });
    }
    const userOrders = [];
    const orderHistory = [];

    await session.startTransaction();

    for (const order of orders) {
      console.log(order.category_id, "    ", order.item_id);

      const result = await categoryModel.find(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          "categorydetails.$": 1,
        }
      );
      if (!result) {
        await session.abortTransaction();
        session.endSession();
        return res.json({ Message: "Failed", error: "Item or Category Error" });
      }

      if (result[0].categorydetails[0].productstock < order.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.json({
          message: "Failed",
          error: `${result[0].categorydetails[0].productname} not available to mentioned your quantity`,
        });
      }
      amount += result[0].categorydetails[0].productprice * order.quantity;
      if (userBal < amount) {
        await session.abortTransaction();
        session.endSession();
        return res.json({
          message: "Failed",
          error: "Insufficient balance while billing",
        });
      }
      await categoryModel.updateOne(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          $inc: { "categorydetails.$.productstock": -order.quantity },
        },
        { session }
      );

      const orderList = {};
      const ordHistory = {};
      orderList.productname = result[0].categorydetails[0].productname;
      orderList.productprice = result[0].categorydetails[0].productprice;
      orderList.quantity = order.quantity;
      orderList.totalcost =
        result[0].categorydetails[0].productprice * order.quantity;
      userOrders.push(orderList);

      ordHistory.category_id = order.category;
      ordHistory.item_id = order.item;
      ordHistory.quantity = order.quantity;
      ordHistory.price =
        result[0].categorydetails[0].productprice * order.quantity;
      orderHistory.push(ordHistory);
    }

    if (amount != totalPrice) {
      await session.abortTransaction();
      session.endSession();
      return res.json({ Message: "Failed", error: "Calculation Err!" });
    }

    await userModel.updateOne(
      {
        _id: userId,
      },
      {
        $inc: { amount: -amount },
      },
      { session }
    );

    const data = await userModel.findOne({ _id: userId });

    const add = new orderModel({
      orders: orderHistory,
      totalPrice: amount,
      orderType: "User",
      orderBy: data.rollno,
      orderTo: data.rollno,
    });

    const status = await add.save({ session });
    console.log(status);
    await session.commitTransaction();
    session.endSession();
    res.json({ message: "Success", userOrders, totalamount: amount });
  } catch (err) {
    console.log("error billing :" + err.message);
    await session.abortTransaction();
    session.endSession();
    return res.json({ message: "Failed", error: err.message });
  }
});

// !  ADMIN order

router.post("/admin", AdminverifyMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.userId;
    const { orders, totalPrice, rollno } = req.body;

    if (!orders || !totalPrice || totalPrice <= 0 || !rollno) {
      return res.json({ message: "Failed", error: "not enough data" });
    }

    let amount = 0;
    const userBal = await userModel.findOne({ rollno }, "amount rollno");

    if (!userBal) {
      return res.json({ message: "failed", error: "user not registered" });
    }

    if (userBal.amount < totalPrice) {
      return res.json({ message: "Failed", error: "Insufficirnt balance" });
    }
    const userOrders = [];
    const orderHistory = [];
    const socEmit = [];
    await session.startTransaction();

    for (const order of orders) {
      console.log(order.category_id, "    ", order.item_id);

      const result = await categoryModel.find(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          category: 1,
          "categorydetails.$": 1,
        }
      );

      if (result.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.json({ message: "Failed", error: "Item or Category Error" });
      }

      if (result[0].categorydetails[0].productstock < order.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(503).json({
          message: "Failed",
          error: `${result[0].categorydetails[0].productname} not available to mentioned your quantity`,
        });
      }

      amount += result[0].categorydetails[0].productprice * order.quantity;
      if (userBal < amount) {
        await session.abortTransaction();
        session.endSession();
        return res.json({
          message: "Failed",
          error: "Insufficient balance while billing",
        });
      }

      await categoryModel.updateOne(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          $inc: { "categorydetails.$.productstock": -order.quantity },
        },
        { session }
      );

      const orderList = {};
      orderList.productname = result[0].categorydetails[0].productname;
      orderList.productprice = result[0].categorydetails[0].productprice;
      orderList.quantity = order.quantity;
      orderList.totalcost =
        result[0].categorydetails[0].productprice * order.quantity;
      userOrders.push(orderList);

      const ordHistory = {};

      ordHistory.category = result[0].category;
      ordHistory.item = result[0].categorydetails[0].productname;
      ordHistory.quantity = order.quantity;
      ordHistory.price =
        result[0].categorydetails[0].productprice * order.quantity;
      orderHistory.push(ordHistory);

      socEmit.push({
        category_id: result[0]._id,
        item_id: result[0].categorydetails[0]._id,
        productstock:
          result[0].categorydetails[0].productstock - order.quantity,
      });
    }

    if (amount != totalPrice) {
      await session.abortTransaction();
      session.endSession();
      return res.json({ Message: "Failed", error: "Calculation Err!" });
    }

    await userModel.updateOne(
      {
        rollno,
      },
      {
        $inc: { amount: -amount },
      },
      { session }
    );

    const adminMail = await adminModel.findById(userId, "email");

    const add = new orderModel({
      orderType: "Admin",
      orderBy: adminMail.email,
      orderTo: userBal.rollno,
      orders: orderHistory,
      totalPrice: amount,
    });

    const status = await add.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.json({ message: "Success", userOrders, totalamount: amount });
    return soc.io.emit("updateStock", socEmit);
  } catch (err) {
    console.log("error :" + err.message);
    await session.abortTransaction();
    session.endSession();
    return res.json({ message: "Failed", error: err.message });
  }
});

/**qrcode route here */

router.post("/qrcode", async (req, res) => {
  const { orderId } = req.body;
  const data = JSON.stringify(orderId);
  const code = await qrcode.toDataURL(data);
  if (!code) {
    res.json({ message: "Failed", error: "error occured while generating qr" });
  }
  res.setHeader("Content-type", "image/png");
  console.log(code);
  res.json({ message: "Success", code });
});

router.post("/admin_user", async (req, res) => {
  console.log("---------------admin_user--------------------");
  try {
    const { userid } = req.body;
    if (!userid) {
      return res.json({ message: "failed", error: "id not provided" });
    }
    const result = await userModel.findOne(
      { $or: [{ rfid: userid }, { rollno: userid }] },
      "rollno username -_id amount"
    );
    if (!result) {
      return res.json({ message: "failed", error: "Invalid ID" });
    } else {
      return res.json({ message: "success", result });
    }
  } catch (err) {
    res.json({ message: "failed", error: err.message });
  }
});

module.exports = router;
