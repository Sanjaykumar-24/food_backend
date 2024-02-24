const mongoose = require('mongoose');
const date = require("../routes/date");
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
        type: Number,
        required: true
    },
    date: {
        type: Date,
    }

});
const transactionSchema = new mongoose.Schema({
    rechargetransaction: {
        type: [transactionItemSchema], 
        default: [] 
    }
});

const transactionModel = mongoose.model('Transaction', transactionSchema);

module.exports = transactionModel;
