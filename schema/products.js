const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
    productname:{
        type:String,
        required:true
    },
    productprice:{
        type:Number
    },
    productimage:{
        type:String
    },
    category:{
        type:String,
        unique:true,
        required:true
    }
})
