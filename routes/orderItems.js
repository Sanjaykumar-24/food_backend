const express = require("express");
const userModel = require("../schema/user");
const categoryModel = require("../schema/products");
const UserOrder = require("../schema/userOrder");
const { UserverifyMiddleware } = require("../routes/verifyMiddleware");
const router = express.Router();

router.post("/user", UserverifyMiddleware, async (req, res) => {
  try {
    let item = null;
    let category = null;
    const userId = req.userId;
    const userDetails = await userModel.findById(userId);
    const { orders, totalPrice } = req.body;
    const userOrders = [];
    let totalAmount = 0;

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
      const newOrder = new UserOrder({
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

      userOrders.push(newOrder);
      item.productstock -= quantity;
      await item.save();

      await categoryModel.findOneAndUpdate(
        { _id: category_id, "categorydetails._id": item_id },
        { $inc: { "categorydetails.$.productstock": -quantity } }
      );
    }

    if (Number(totalAmount) !== Number(totalPrice)) {
      console.log("Right amount for the product is not received");
      return res.status(400).json({ message: "Total Amount is not correct" });
    }

    if (totalAmount > Number(userDetails.amount)) {
      console.log("Insufficient Amount");
      return res.status(400).json({ message: "Insufficient Amount" });
    }

    if (!userDetails.orders) {
      userDetails.orders = [];
    }
    await UserOrder.insertMany(userOrders);

    userDetails.amount -= totalAmount;
    userDetails.orders = userDetails.orders.concat(userOrders);

    await userDetails.save();
    const summary = {};

    res.status(201).json({
      message: "Orders created successfully",
      orders: userOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create orders" });
  }
});

module.exports = router;
