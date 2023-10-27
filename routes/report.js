const express = require("express");
const excelJs = require("exceljs");
const transactionModel = require("../schema/transactiondb");
const router = express.Router();
const orderModel = require("../schema/orders");

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

    if (!from || !to) {
      return res.status(404).send("Filter not specified");
    }

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

    if (startDate == "Invalid Date" || endDate == "Invalid Date") {
      return res.send("Invalid date");
    }

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

    if (!result) {
      return res.send("No Transaction Found");
    }

    let matchedTransaction;

    if (result) {
      matchedTransaction = result.rechargetransaction.filter((item) => {
        const itemDate = item.date;
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    let workbook = new excelJs.Workbook();
    const sheet = workbook.addWorksheet("transactionReport");
    sheet.columns = [
      { header: "", key: "emptyColumn", width: 10 },
      { header: "Admin", key: "admin", width: 25 },
      { header: "Rollno", key: "rollno", width: 25 },
      { header: "Date", key: "date", width: 25 },
      { header: "Amount", key: "amount", width: 25 },
    ];

    
    sheet.insertRow(1, ["","","",""]);
    sheet.getRow(2).height = 35;
    sheet.getRow(2).eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: "center" };
      cell.font = { bold: true, size: 14 };
      cell.border = {
        top: { style: "medium" },
        left: { style: "medium" },
        bottom: { style: "medium" },
        right: { style: "medium" },
      };
    });
    sheet.getCell("A2").border = {
      top: { style: "none" },
      left: { style: "none" },
      bottom: { style: "none" },
      right: { style: "none" },
    };

    let total_amount = 0;
    matchedTransaction.forEach((item) => {
      total_amount += Number(item.amount);
      sheet
        .addRow({
          admin: item.admin,
          rollno: item.rollno,
          amount: `₹ ${item.amount.toLocaleString("en-IN")}`,
          date: item.date,
        })
        .eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" }, // You can adjust the style to 'medium' or 'thick' as needed
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
    });

    sheet
      .addRow([
        "",
        "",
        "",
        "Total Amount:",
        `₹ ${total_amount.toLocaleString("en-IN")}`,
      ])
      .eachCell((cell, colNumber) => {
        cell.font = { bold: true };
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
    res.status(500).send("Err");
  }
});

//! Functions to generate report

const daily_order = async () => {};

router.get("/orders", async (req, res) => {
  try {
    // ---------------------------------------------------------------------------------------------------------------------------------------------//

    let workbook = new excelJs.Workbook();
    const sheet = workbook.addWorksheet("orderReport");
    const columns = [
      { header: "", key: "emptyColumn", width: 10 },
      { header: "Order Type", key: "order_type", width: 25 },
      { header: "Order By", key: "order_by", width: 25 },
      { header: "Order To", key: "order_to", width: 25 },
      { header: "order Items", key: "order_items", width: 25 },
      { header: "", key: "emptyColumn", width: 25 },
      { header: "", key: "emptyColumn", width: 25 },
      { header: "", key: "emptyColumn", width: 25 },
      { header: "", key: "emptyColumn", width: 25 },
      { header: "Amount", key: "amount", width: 25 },
      { header: "Time", key: "time", width: 25 },
    ];
    sheet.columns = columns;

    for (let i = 2; i <= columns.length; i++) {
      const cell = sheet.getCell(1, i); // The header row is at index 1
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" };
      cell.font = { bold: true, size: 13 };
    }

    sheet.insertRow(1, ["", "", "", ""]);

    sheet.mergeCells("B2:B3");
    const headerCell1 = sheet.getCell("B2");
    headerCell1.alignment = { horizontal: "center", vertical: "middle" };
    sheet.mergeCells("C2:C3");
    const headerCell2 = sheet.getCell("C2");
    headerCell2.alignment = { horizontal: "center", vertical: "middle" };
    sheet.mergeCells("D2:D3");
    const headerCell3 = sheet.getCell("D2");
    headerCell3.alignment = { horizontal: "center", vertical: "middle" };
    sheet.mergeCells("E2:I2");
    const headerCell4 = sheet.getCell("E2");
    headerCell4.alignment = { horizontal: "center", vertical: "middle" };
    sheet.mergeCells("J2:J3");
    const headerCell5 = sheet.getCell("J2");
    headerCell5.alignment = { horizontal: "center", vertical: "middle" };
    sheet.mergeCells("K2:K3");
    const headerCell6 = sheet.getCell("K2");
    headerCell6.alignment = { horizontal: "center", vertical: "middle" };

    sheet.getCell("E3").value = "Category";
    sheet.getCell("F3").value = "item";
    sheet.getCell("G3").value = "item price";
    sheet.getCell("H3").value = "quantity";
    sheet.getCell("I3").value = "Price";

    const subheaderStyle = {
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      },
      alignment: { horizontal: "center" },
      font: { bold: true, size: 10 },
    };

    sheet.getCell("E3").style = subheaderStyle;
    sheet.getCell("F3").style = subheaderStyle;
    sheet.getCell("G3").style = subheaderStyle;
    sheet.getCell("H3").style = subheaderStyle;
    sheet.getCell("I3").style = subheaderStyle;

    const firstRow = sheet.getRow(2);
    firstRow.height = 35;
    const secondRow = sheet.getRow(3);
    secondRow.height = 25;
    // ---------------------------------------------------------------------------------------------------------------------------------------------//



    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res
      .status(200)
      .setHeader("Content-Disposition", `attachment; filename= Order.xlsx`);
    const excel = await workbook.xlsx.writeBuffer();
    res.status(200).send(excel);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
