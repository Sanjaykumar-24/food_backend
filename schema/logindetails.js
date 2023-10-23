const { boolean } = require('joi');
const mongoose = require('mongoose');
const loginschema = new mongoose.schema({
    email:{
        type:String,
        required:true
    },
    islogged:{
        type:boolean,
        default:false
    }
})
const login_model = mongoose.model('login_details',loginschema);
module.exports =  login_model;