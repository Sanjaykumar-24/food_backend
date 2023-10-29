const mongoose = require('mongoose')
const date = require("../routes/date");
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