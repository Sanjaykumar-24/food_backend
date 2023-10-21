const mongoose = require('mongoose')
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
  
  const adminOrderSchema = new mongoose.Schema({
    admin:{
        type:String,
        required:true
    },
    userId: {
      type: String,
      required: true,
    },
    orders: [orderSchema],
    date: {
      type: Date, 
      default: Date.now(),
    },
  });
  const AdminOrder = mongoose.model('AdminOrder', adminOrderSchema);

  module.exports = AdminOrder;
  