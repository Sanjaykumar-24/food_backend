const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productname: {
    type: String,
    required: true,
  },
  productprice: {
    type: Number,
    required: true,
  },
  productstock: {
    type: Number,
    required: true,
  },
  productimage: {
    type: String,
  },
});

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    unique: true,
    required: true,
  },
  categorydetails: {
    type: [productSchema],
  },
});
const categoryModel = mongoose.model("Category", categorySchema);
module.exports = categoryModel;
