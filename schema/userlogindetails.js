const mongoose = require('mongoose');
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
        type:String,
        default:date()
    }
});

const userloginModel = mongoose.model('login_details_user', loginSchema); // Change to "loginSchema" with a capital "S"

module.exports = userloginModel;
