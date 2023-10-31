const mongoose = require('mongoose')
const date = require("../routes/date");

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