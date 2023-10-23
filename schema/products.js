const mongoose = require("mongoose");

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
});
const categoryModel = mongoose.model("Category", categorySchema);
module.exports = categoryModel;
