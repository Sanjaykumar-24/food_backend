const qrcode = require('qrcode')
const express = require('express')
const router = express.Router()

/**to generate qrcode */

router.post("/qrcode",async(req,res)=>{
    const {orderId} = req.body
    const data = JSON.stringify(orderId)
    const code = await qrcode.toDataURL(data)
    if(!code)
    {
        res.send({message:"error occured"})
    }
    res.setHeader('Content-Type','image/png')
    res.send(code)
})
module.exports = router;