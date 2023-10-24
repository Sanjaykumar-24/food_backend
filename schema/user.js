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
  amount: {
    type: Number,
    default: 0,
  },
  date:{
    type:String,
    default:date()
  }
});
const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
