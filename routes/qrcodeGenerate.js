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
        res.status(500).send({message:"error occured"})
    }
    res.status(200).setHeader('Content-Type','image/png')
    res.status(200).send(code)
})
module.exports = router;