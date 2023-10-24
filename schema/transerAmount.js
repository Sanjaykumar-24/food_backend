const mongoose = require('mongoose')

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


const transerAmountSchema = new mongoose.Schema({
    senderRollno:{
        type:String,
        required:true
    },
    receiverRollno:{
        type:String,
        required:true
    },
    amountTransfered:{
        type:String,
        required:true
    },
    date:{
        type:String,
        default:date()
    }
})
const transferModel = mongoose.model('transferamount',transerAmountSchema)

module.exports = transferModel