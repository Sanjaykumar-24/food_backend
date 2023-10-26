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
    const query = req.query.type;
    if (!query) {
      return res.status(404).send("query not found");
    }
    let workbook = new excelJs.Workbook();
    const sheet = workbook.addWorksheet("transactionReport");
    sheet.columns = [
      { header: "Order Type", key: "order_type", width: 25 },
      { header: "Order By", key: "order_by", width: 25 },
      { header: "Order To", key: "order_to", width: 25 },
      { header: "Order Items", key: "order_items", width: 50 },
      { header: "Total Amount", key: "amount", width: 25 },
      { header: "Date", key: "date", width: 25 },
    ];
    sheet.getCell("D1").value = "Category Name - Item Name (Qty, Price)";

    const orders = [
      {
        categoryName: "Category 1",
        itemName: "Item 1",
        quantity: 2,
        price: 10,
      },
      {
        categoryName: "Category 2",
        itemName: "Item 2",
        quantity: 1,
        price: 15,
      },
    ];
    const formattedOrders = orders.map(
      (order) =>
        `${order.categoryName} - ${order.itemName} (${order.quantity}, ${order.price})`
    );
    sheet.addRow({
      order_type: "Type",
      order_by: "User",
      order_to: "Recipient",
      order_items: formattedOrders.join("\n"), // Join the formatted orders with newline for each order
      amount: 25, // Total amount for the orders
      date: new Date(), // Date of the order
    });

    switch (query) {
      case "daily_report":
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
    }
    console.log(query);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
