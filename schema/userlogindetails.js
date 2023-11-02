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

const userloginModel = mongoose.model('login_details_user', loginSchema); // Change to "loginSchema" with a capital "S"

module.exports = userloginModel;
