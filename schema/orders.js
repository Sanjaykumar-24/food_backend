const mongoose = require("mongoose");
function date() {
  const now = new Date();
  const options = {
    timeZone: "Asia/Kolkata",
    hour12: false,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  const istTime = now.toLocaleString("en-IN", options);
  return istTime;
}
const orderSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  orders: [orderSchema],
  totalPrice: {
    type: Number,
  },
  date: {
    type: Date,
    default: date(),
<<<<<<< HEAD:schema/orders.js
  }
=======
  },
>>>>>>> 444c37195de3dcd46cf3bf646b2187b0ea319a84:schema/adminOrder.js
});

const UserOrder = mongoose.model("UserOrder", userOrderSchema);

module.exports = UserOrder;
