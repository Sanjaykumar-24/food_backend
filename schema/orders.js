const mongoose = require("mongoose");
const date = require('../routes/date')
const orderSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const userOrderSchema = new mongoose.Schema({
  orderType: {
    type: String,
  },
  orderBy: {
    type: String,
  },
  orderTo:{
    type:String
  },
  orders: [orderSchema],
  totalPrice: {
    type: Number,
  },
  date: {
    type: Date,
    default:date()
  }
});

const UserOrder = mongoose.model("Orders", userOrderSchema);

module.exports = UserOrder;
