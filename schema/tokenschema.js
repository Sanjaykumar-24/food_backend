const { TokenExpiredError } = require('jsonwebtoken');
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

const tokenSchema = new mongoose.Schema({
    email:{
        type:String,
        unique:true
    },
    AccessToken:{
        type:String
    },
    RefreshToken:{
        type:String
    },
    Created_on:{
        type:Date
    },
    Modified_on:{
        type:Date
    }
}) 
const tokenModel= mongoose.model('Token',tokenSchema)

module.exports = tokenModel;