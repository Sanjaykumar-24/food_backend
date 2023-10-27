const express = require("express");
const mongoose = require("mongoose");
const userModel = require("../schema/user");
const categoryModel = require("../schema/products");
const orderModel = require("../schema/orders");
const {
  UserverifyMiddleware,
  AdminverifyMiddleware,
} = require("../routes/verifyMiddleware");
const adminModel = require("../schema/admin");
const router = express.Router();

/**user order route here */

router.post("/user", UserverifyMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.userId;
    const { orders, totalPrice } = req.body;

    if (!orders || !totalPrice || totalPrice <= 0) {
      return res.status(422).json({ message: "Invalid details" });
    }

    let amount = 0;
    const userBal = await userModel.findById(userId, "amount");

    if (userBal.amount < totalPrice) {
      return res.status(422).json({ message: "Insufficient balance" });
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
        return res.json({ Message: "Item or Category Error" });
      }

      if (result[0].categorydetails[0].productstock < order.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(503).json({
          message: `${result[0].categorydetails[0].productname} not available to mentioned your quantity`,
        });
      }
      amount += result[0].categorydetails[0].productprice * order.quantity;
      if (userBal < amount) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(422)
          .json({ message: "Insufficient balance while billing" });
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

      ordHistory.category_id = order.category_id;
      ordHistory.item_id = order.item_id;
      ordHistory.quantity = order.quantity;
      ordHistory.price =
        result[0].categorydetails[0].productprice * order.quantity;
      orderHistory.push(ordHistory);
    }

    if (amount != totalPrice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).send({ Message: "Calculation Err!" });
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
      userId: userId,
      orders: orderHistory,
      totalPrice: amount,
      date:new Date(),
      orderType:'User',
      orderBy:data.rollno
    });

    const status = await add.save({ session });
    console.log(status);
    await session.commitTransaction();
    session.endSession();
    res.json({ userOrders, totalamount: amount });
  } catch (err) {
    console.log("error billing :" + err.message);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .send({ message: "internal server error =====>" + err.message });
  }
});

router.post("/admin", AdminverifyMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.userId;
    const { orders, totalPrice, rollno } = req.body;

    if (!orders || !totalPrice || totalPrice <= 0 || !rollno) {
      return res.status(422).json({ message: "Invalid details" });
    }

    let amount = 0;
    const userBal = await userModel.findOne({ rollno }, "amount rollno");

    if (userBal.amount < totalPrice) {
      return res.status(422).json({ message: "Insufficirnt balance" });
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
        return res.json({ Message: "Item or Category Error" });
      }

      if (result[0].categorydetails[0].productstock < order.quantity) {
        return res.status(503).json({
          message: `${result[0].categorydetails[0].productname} not available to mentioned your quantity`,
        });
      }
      amount += result[0].categorydetails[0].productprice * order.quantity;
      if (userBal < amount) {
        return res
          .status(422)
          .json({ message: "Insufficient balance while billing" });
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

      ordHistory.category_id = order.category_id;
      ordHistory.item_id = order.item_id;
      ordHistory.quantity = order.quantity;
      ordHistory.price =
        result[0].categorydetails[0].productprice * order.quantity;
      orderHistory.push(ordHistory);
    }

    if (amount != totalPrice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).send({ Message: "Calculation Err!" });
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
      orderType:'Admin',
      orderBy:adminMail.email,
      orderTo:userBal.rollno,
      userId: rollno,
      orders: orderHistory,
      totalPrice: amount,
      date: new Date()
    });

    const status = await add.save({ session });
    console.log(status);
    await session.commitTransaction();
    session.endSession();
    res.json({ userOrders, totalamount: amount });
  } catch (err) {
    console.log("error :" + err.message);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .send({ message: "internal server error =====>" + err.message });
  }
});

module.exports = router;
