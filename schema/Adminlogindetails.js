const mongoose = require('mongoose');
const date = require("../routes/date");
const loginSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    isLogged: { 
        type: Boolean, 
        default: false
    },
    date:{
        type:Date,
        default:date()
    }
});

const loginModel = mongoose.model('login_details_admin', loginSchema); // Change to "loginSchema" with a capital "S"

module.exports = loginModel;
