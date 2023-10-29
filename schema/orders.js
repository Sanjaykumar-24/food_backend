const mongoose = require("mongoose");
const itemSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  }
})
const orderSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  items:[itemSchema]
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
    type: String
  }
});

const UserOrder = mongoose.model("Orders", userOrderSchema);

module.exports = UserOrder;
