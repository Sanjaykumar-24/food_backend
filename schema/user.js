const mongoose = require("mongoose");

const date = require("../routes/date");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  username: {
    type: String,
  },
  rollno: {
    type: String,
    unique: true,
    set: (value) => value.toUpperCase(),
  },
  rfid:{
    type:String,
    unique:true,
    default:null
  },
  amount: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});
const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
