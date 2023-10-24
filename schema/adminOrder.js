const mongoose = require("mongoose");
function date()
{
    const now = new Date();
    const options = {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const istTime = now.toLocaleString('en-IN', options);
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
  date:{
    type:String,
    default:date()
  }
});

const adminOrderSchema = new mongoose.Schema({
  admin: {
    type: String,
    required: true,
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
const AdminOrder = mongoose.model("AdminOrder", adminOrderSchema);

module.exports = AdminOrder;
