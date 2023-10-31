const mongoose = require('mongoose')
const cashierSchema = new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})
const cashierModel = mongoose.model('cashier',cashierSchema)
module.exports = cashierModel