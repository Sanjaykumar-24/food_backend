const mongoose = require("mongoose");
const date = require("../routes/date");
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
    type:Date,
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
    type:Date,
    default:date()
}
});
const categoryModel = mongoose.model("Category", categorySchema);
module.exports = categoryModel;
