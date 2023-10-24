const express = require("express");
const userModel = require("../schema/user");
const categoryModel = require("../schema/products");
const UserOrderModel = require("../schema/userOrder");
const {
  UserverifyMiddleware,
  AdminverifyMiddleware} = require("../routes/verifyMiddleware");
const AdminOrder = require("../schema/adminOrder");
const adminModel = require("../schema/admin");
const router = express.Router();

/**user order route here */

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
      console.log(order.category_id,"    ", order.item_id);

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
      date: Date.now(),
    });

    const status = await add.save();
    console.log(status);
    res.json({ userOrders });
  } catch (err) {
    console.log(err);
    return res.status(500).send("err while billing");
  }
});

/**qr code route here */

router.post("/qrcode",async(req,res)=>{
  const {orderId} = req.body
  const data = JSON.stringify(orderId)
  const code = await qrcode.toDataURL(data)
  if(!code)
  {
      res.status(500).send({message:"error occured"})
  }
  res.status(200).setHeader('Content-Type','image/png')
  res.status(200).send(code)
})

/**admin order here */

router.post("/admin", AdminverifyMiddleware, async (req, res) => {
  try {
    let item = null;
    let category = null;
    const { orders, totalPrice, rollno } = req.body;
    const userId = req.userId;
    const adminDetails = await adminModel.findById(userId);
    const userDetails = await userModel.findOne({ rollno });
    const adminOrders = [];
    let totalAmount = 0;

    if (!adminDetails) {
      console.log("admin not found");
      return res.status(401).send({ message: "admin not found" });
    }
    if (!userDetails) {
      console.log("user not found");
      return res.status(401).send({ message: "user not found" });
    }

    for (const order of orders) {
      const { category_id, item_id, quantity } = order;
      console.log(order);

      category = await categoryModel.findById(category_id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      item = category.categorydetails.find((item) => item._id == item_id);
      if (!item) {
        return res
          .status(404)
          .json({ error: "Item not found in the category" });
      }

      if (Number(quantity) > Number(item.productstock)) {
        console.log("Insufficient Quantity");
        return res.status(400).json({ message: "Insufficient Quantity" });
      }
      const orderTotalPrice = item.productprice * quantity;
      totalAmount += orderTotalPrice;
      const admin = adminDetails.email;
      const userId = userDetails.rollno;
      const newOrder = new AdminOrder({
        admin,
        userId,
        orders: [
          {
            category_id,
            item_id,
            quantity,
            totalPrice: orderTotalPrice,
            date: Date.now(),
          },
        ],
      });
      adminOrders.push(newOrder);
      item.productstock -= quantity;
      await item.save();

      await categoryModel.findOneAndUpdate(
        { _id: category_id, "categorydetails._id": item_id },
        { $inc: { "categorydetails.$.productstock": -quantity } }
      );
    }
    ////////////////loop over

    if (Number(totalAmount) !== Number(totalPrice)) {
      console.log("Right amount for the product is not received");
      return res.status(400).json({ message: "Total Amount is not correct" });
    }

    if (totalAmount > Number(adminDetails.amount)) {
      console.log("Insufficient Amount");
      return res.status(400).json({ message: "Insufficient Amount" });
    }

    if (!adminDetails.orders) {
      adminDetails.orders = [];
    }
    await AdminOrder.insertMany(adminOrders);

    adminDetails.amount -= totalAmount;
    adminDetails.orders = adminDetails.orders.concat(adminOrders);

    await adminDetails.save();
    res.status(201).json({
      message: "Orders created successfully",
      orders: adminOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create orders" });
  }
});

module.exports = router;
