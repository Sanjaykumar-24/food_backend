const express = require("express");
const userModel = require("../schema/user");
const categoryModel = require("../schema/products");
const UserOrderModel = require("../schema/userOrder");
const {
  UserverifyMiddleware,
  AdminverifyMiddleware,
} = require("../routes/verifyMiddleware");
const AdminOrderModel = require("../schema/adminOrder");
const adminModel = require("../schema/admin");
const router = express.Router();

router.post("/user", UserverifyMiddleware, async (req, res) => {
  const userId = req.userId;
  const { orders, totalPrice } = req.body;

  if (!orders || !totalPrice || totalPrice <= 0) {
    return res.status(422).json({ message: "Invalid details" });
  }
  try {
    let amount = 0;

    const userBal = await userModel.findById(userId, "amount");

    if (userBal.amount < totalPrice) {
      return res.status(422).json({ message: "Insufficirnt balance" });
    }
    const userOrders = [];
    const orderHistory = [];

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
      return res.status(500).send({ Message: "Calculation Err!" });
    }

    await userModel.updateOne(
      {
        _id: userId,
      },
      {
        $inc: { amount: -amount },
      }
    );

    for (const order of orders) {
      await categoryModel.updateOne(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          $inc: { "categorydetails.$.productstock": -order.quantity },
        }
      );
    }

    const add = new UserOrderModel({
      userId: userId,
      orders: orderHistory,
      totalPrice:amount,
      date: Date.now(),
    });

    const status = await add.save();
    console.log(status);
    res.json({ userOrders, totalamount: amount });
  } catch (err) {
    console.log(err);
    return res.status(500).send("err while billing");
  }
});

router.post("/admin", AdminverifyMiddleware, async (req, res) => {
  const userId = req.userId;
  const { orders, totalPrice, rollno } = req.body;

  if (!orders || !totalPrice || totalPrice <= 0 || !rollno) {
    return res.status(422).json({ message: "Invalid details" });
  }
  try {
    let amount = 0;

    const userBal = await userModel.findOne({ rollno }, "amount");

    if (userBal.amount < totalPrice) {
      return res.status(422).json({ message: "Insufficirnt balance" });
    }
    const userOrders = [];
    const orderHistory = [];

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
      return res.status(500).send({ Message: "Calculation Err!" });
    }

    await userModel.updateOne(
      {
        rollno,
      },
      {
        $inc: { amount: -amount },
      }
    );

    for (const order of orders) {
      await categoryModel.updateOne(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          $inc: { "categorydetails.$.productstock": -order.quantity },
        }
      );
    }

    const adminMail = await adminModel.findById(userId, "email");

    const add = new AdminOrderModel({
      admin: adminMail.email,
      userId: rollno,
      orders: orderHistory,
      totalPrice:amount,
      date: Date.now(),
    });

    const status = await add.save();
    console.log(status);
    res.json({ userOrders, totalamount: amount });
  } catch (err) {
    console.log(err);
    return res.status(500).send("err while billing");
  }
});

module.exports = router;
