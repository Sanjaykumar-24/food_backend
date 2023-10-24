const mongoose = require('mongoose');
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
        type: String,
        default:date()
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
