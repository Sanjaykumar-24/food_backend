const mongoose = require('mongoose')
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
const adminschema = new mongoose.Schema(
    {
        email:{
            type:String,
            unique: true
        },
        password:{
            type:String,
        },
        date:{
            type:String,
            default:date()
        }
    }
)
const adminModel = mongoose.model('admins',adminschema);
module.exports = adminModel;