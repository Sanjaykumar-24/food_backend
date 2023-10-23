const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    isLogged: { 
        type: Boolean, 
        default: false
    }
});

const loginModel = mongoose.model('login_details', loginSchema); // Change to "loginSchema" with a capital "S"

module.exports = loginModel;
