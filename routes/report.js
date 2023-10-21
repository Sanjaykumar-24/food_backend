const express = require('express')
const excelJs = require('exceljs')
let fs = require('fs')
const transactionModel = require('../schema/transactiondb')
const { sheets } = require('googleapis/build/src/apis/sheets')
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
    const data = total[0].rechargetransaction;
    if(data.length==0)
    {
        res.send({message:"no transactions found"})
    }
    data.map((item)=>{
        sheet.addRow({
            admin:item.admin,
            rollno:item.rollno,
            amount:item.amount,
            date:item.date
        })
    })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=transactionReport.xlsx');
    const excel = await workbook.xlsx.writeBuffer()
    res.send(excel)
   }
   catch(error)
   {
  res.send({message:"error"})
   }
})
module.exports = router