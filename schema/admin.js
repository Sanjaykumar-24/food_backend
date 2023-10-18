const mongoose = require('mongoose')
const adminschema = new mongoose.Schema(
    {
        email:{
            type:String,
            unique: true
        },
        password:{
            type:String,
        }
    }
)
const adminModel = mongoose.model('admins',adminschema);
module.exports = adminModel;