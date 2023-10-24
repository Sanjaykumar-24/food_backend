const express = require("express");
const excelJs = require("exceljs");
const transactionModel = require("../schema/transactiondb");
const router = express.Router();
// router.get("/transaction",async(req,res)=>{
//    try
//    {
// let workbook = new excelJs.Workbook()
// const sheet = workbook.addWorksheet('transactionReport')
// sheet.columns = [
//     {header:"Admin",key:'admin',width:25},
//     {header:"Rollno",key:'rollno',width:25},
//     {header:"Amount",key:'amount',width:25},
//     {header:"Date",key:'date',width:25}
// ]
//     const total = await transactionModel.find({});
// if(total.length==0)
// {
//     res.status(404).send({message:"no transactions found"})
// }
//     const data = total[0].rechargetransaction;
//     if(data.length==0)
//     {
//         res.status(401).send({message:"no transactions found"})
//     }
// data.map((item)=>{
//     sheet.addRow({
//         admin:item.admin,
//         rollno:item.rollno,
//         amount:item.amount,
//         date:item.date
//     })
// })
// res.status(200).setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
// res.status(200).setHeader('Content-Disposition', 'attachment; filename=transactionReport.xlsx');
// const excel = await workbook.xlsx.writeBuffer()
// res.status(200).send(excel)
//    }
//    catch(error){
//     console.log("error :"+error.message);
//     return res.status(500).send({ message: "internal server error =====>" + error.message});
//    }
// })

router.get("/recharge", async (req, res) => {
  try {
    let { from, to } = req.query;

    let workbook = new excelJs.Workbook();
    const sheet = workbook.addWorksheet("transactionReport");
    sheet.columns = [
      { header: "Admin", key: "admin", width: 25 },
      { header: "Rollno", key: "rollno", width: 25 },
      { header: "Amount", key: "amount", width: 25 },
      { header: "Date", key: "date", width: 25 },
    ];
    const options = {
      timeZone: "Asia/Kolkata",
      hour12: false,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    const startDate = new Date(from).toLocaleString("en-IN", options);
    const endDate = new Date(to).toLocaleString("en-IN", options);
    console.log(startDate + "\n" + endDate);

    const result = await transactionModel.findOne({
      rechargetransaction: {
        $elemMatch: {
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
    });

    let matchedTransaction;

    if (result) {
      matchedTransaction = result.rechargetransaction.filter((item) => {
        const itemDate = item.date;
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    console.log(matchedTransaction);

    matchedTransaction.map((item) => {
      sheet.addRow({
        admin: item.admin,
        rollno: item.rollno,
        amount: item.amount,
        date: item.date,
      });
    });
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res
      .status(200)
      .setHeader(
        "Content-Disposition",
        `attachment; filename= Recharge (${
          day + "-" + month + "-" + year
        }).xlsx`
      );
    const excel = await workbook.xlsx.writeBuffer();
    res.status(200).send(excel);
  } catch (err) {
    console.log(err);
    res.send("Err");
  }
});

module.exports = router;
