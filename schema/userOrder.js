const mongoose = require('mongoose');

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
  totalPrice: {
    type: Number,
    required: true,
  },
});

const userOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  orders: [orderSchema],
  date: {
    type: Date, 
    default: Date.now,
  },
});

const UserOrder = mongoose.model('UserOrder', userOrderSchema);

module.exports = UserOrder;
