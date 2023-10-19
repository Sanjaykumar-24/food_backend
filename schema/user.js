const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    username:{
        type:String,
    },
    rollno:{
        type:String,
        unique:true
    },
    amount:{
        type:Number,
        default:0
    }
})
const userModel = mongoose.model('users',userSchema)
module.exports = userModel;