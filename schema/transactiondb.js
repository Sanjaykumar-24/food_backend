const mongoose = require('mongoose');
const moment = require('moment-timezone');
   
const transactionItemSchema = new mongoose.Schema({
    admin:{
        type:String,
        required:true,
    },
    rollno:{
        type:String,
        required:true
    },
    amount:{
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: () => moment().tz('Asia/Kolkata')
    },

});
const transactionSchema = new mongoose.Schema({
    rechargetransaction: {
        type: [transactionItemSchema], 
        default: [] 
    }
});

const transactionModel = mongoose.model('Transaction', transactionSchema);

module.exports = transactionModel;
