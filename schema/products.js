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
const productSchema = new mongoose.Schema({
  productname: {
    type: String,
    required: true,
  },
  productprice: {
    type: Number,
    required: true,
    min: 0,
  },
  productstock: {
    type: Number,
    required: true,
    min: 0,
  },
  productimage: {
    type: String,
  },
  date:{
    type:String,
    default:date()
}
});

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    unique: true,
    required: true,
  },
  categoryImage: {
    type: String,
  },
  categorydetails: {
    type: [productSchema],
  },
  date:{
    type:String,
    default:date()
}
});
const categoryModel = mongoose.model("Category", categorySchema);
module.exports = categoryModel;
