const express = require('express')
const excelJs = require('exceljs')
const transactionModel = require('../schema/transactiondb')
const router = express.Router()
router.get("/transaction",async(req,res)=>{
   try  
   {
    let workbook = new excelJs.Workbook()
    const sheet = workbook.addWorksheet('transactionReport')
    sheet.columns = [
        {header:"Admin",key:'admin',width:25},
        {header:"Rollno",key:'rollno',width:25},
        {header:"Amount",key:'amount',width:25},
        {header:"Date",key:'date',width:25}
    ]
    const total = await transactionModel.find({});
    if(total.length==0)
    {
        res.status(404).send({message:"no transactions found"})
    }
    const data = total[0].rechargetransaction;
    if(data.length==0)
    {
        res.status(401).send({message:"no transactions found"})
    }
    data.map((item)=>{
        sheet.addRow({
            admin:item.admin,
            rollno:item.rollno,
            amount:item.amount,
            date:item.date
        })
    })
    res.status(200).setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.status(200).setHeader('Content-Disposition', 'attachment; filename=transactionReport.xlsx');
    const excel = await workbook.xlsx.writeBuffer()
    res.status(200).send(excel)
   }
   catch(error)
   {
  res.status(500).send({message:"error"})
   }
})
module.exports = router