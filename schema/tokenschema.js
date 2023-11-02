const { TokenExpiredError } = require('jsonwebtoken');
const mongoose = require('mongoose')
const date = require("../routes/date");
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
        type:String
    },
    Modified_on:{
        type:Date,
        default:date()
    }
}) 
const tokenModel= mongoose.model('Token',tokenSchema)

module.exports = tokenModel;