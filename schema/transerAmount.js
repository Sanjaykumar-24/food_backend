const mongoose = require('mongoose')
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
    }
})
const transferModel = mongoose.model('transferamount',transerAmountSchema)

module.exports = transferModel