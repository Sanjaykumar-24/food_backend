const express = require("express");
const excelJs = require("exceljs");
const transactionModel = require("../schema/transactiondb");
const router = express.Router();
const orderModel = require("../schema/orders");
const categoryModel = require("../schema/products");

router.get("/recharge", async (req, res) => {
  let { type } = req.query;
  if (!type) {
    return res.json({ message: "failed", error: "type required" });
  }
  switch (type) {
    case "excel":
      return rechargeReportExcel(req, res);
    case "text":
      return rechargeReportText(req, res);
    case "pdf":
      return res.send("working on pdf");
    default:
      return res.json({ message: "failed", error: "type error" });
  }
});

//! Functions to generate report

const rechargeReportExcel = async (req, res) => {
  const { from, to } = req.query;
  try {
    if (!from || !to) {
      return res.json({ message: "Failed", error: "Filter not specified" });
    }
    const startDate = new Date(from);
    const endDate = new Date(to);

    if (startDate == "Invalid Date" || endDate == "Invalid Date") {
      return res.json({ message: "Failed", error: "Invalid date" });
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

    console.log(result);

    if (result.length === 0) {
      return res.json({ message: "No transaction found" });
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

    sheet.autoFilter = "B2:E3";

    sheet.insertRow(1, ["", "", "", ""]);
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

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename= Recharge (${day + "-" + month + "-" + year}).xlsx`
    );
    const excel = await workbook.xlsx.writeBuffer();
    res.send(excel);
  } catch (err) {
    console.log(err);
    res.status(500).send("Err");
  }
};

const rechargeReportText = async (req, res) => {
  const { from, to } = req.query;
  try {
    if (!from || !to) {
      return res.json({ message: "Failed", error: "Filter not specified" });
    }
    const startDate = new Date(from);
    const endDate = new Date(to);

    if (startDate == "Invalid Date" || endDate == "Invalid Date") {
      return res.json({ message: "Failed", error: "Invalid date" });
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

    console.log(result);

    if (result.length === 0) {
      return res.json({ message: "No transaction found" });
    }

    let matchedTransaction;

    if (result) {
      matchedTransaction = result.rechargetransaction.filter((item) => {
        const itemDate = item.date;
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    return res.json({ message: "success", result: matchedTransaction });
  } catch (err) {
    return res.json({ message: "failed", error: err.message });
  }
};

// !----------------------------------------------------------------------------------------------------------------------------------------------------------------------

router.get("/orders", async (req, res) => {
  const { type } = req.query;
  if (!type) {
    return res.json({ message: "Type undefined" });
  }
  try {
    switch (type) {
      case "excel":
        return orderReportExcel(req, res);

      case "text":
        return orderReportText(req, res);

      case "pdf":
        return orderReportPdf(req, res);

      default:
        return res.json({ message: "Error", info: "Type Err" });
    }
  } catch (err) {
    console.log(err);
    res.json({ message: "Failed", error: "Internal Server Error" });
  }
});

// ! Function to send the excel
const orderReportExcel = async (req, res) => {
  try {
    console.log("----------------Excel Report ----------------");
    const { from, to } = req.query;
    if (!from || !to) {
      return res.json({ message: "Failed", error: "Filter not specified" });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    // console.log(startDate,"  ",endDate)
    if (startDate == "Invalid Date" || endDate == "Invalid Date") {
      return res.json({ message: "Failed", error: "Invalid date" });
    }

    const result = await orderModel.find({
      $and: [{ date: { $gte: from } }, { date: { $lte: to } }],
    });

    // console.log("Result", result);

    if (result.length === 0) {
      return res.json({ message: "No orders found" });
    }

    // ---------------------------------------------------------------------------------------------------------------------------------------------//

    let workbook = new excelJs.Workbook();
    const sheet = workbook.addWorksheet("orderReport");
    const columns = [
      { header: "", key: "emptyColumn", width: 10 },
      { header: "Order Type", key: "order_type", width: 20 },
      { header: "Order By", key: "order_by", width: 25 },
      { header: "Order To", key: "order_to", width: 25 },
      { header: "Order Items", key: "order_items", width: 20 }, // Include Order Items
      { header: "", key: "emptyColumn", width: 20 },
      { header: "", key: "emptyColumn", width: 10 },
      { header: "", key: "emptyColumn", width: 10 },
      { header: "", key: "emptyColumn", width: 10 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Time", key: "time", width: 25 },
    ];
    sheet.columns = columns;
    sheet.autoFilter = "B3:K3";

    for (let i = 2; i <= columns.length; i++) {
      const cell = sheet.getCell(1, i); // The header row is at index 1
      cell.border = {
        top: { style: "thick" },
        left: { style: "thick" },
        right: { style: "thick" },
        bottom: { style: "thick" },
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

    sheet.getCell("E3").value = {
      header: "Category",
      key: "category",
    }.header;
    sheet.getCell("F3").value = {
      header: "Item",
      key: "item",
    }.header;
    sheet.getCell("G3").value = {
      header: "Item Price",
      key: "item_price",
    }.header;
    sheet.getCell("H3").value = {
      header: "Quantity",
      key: "quantity",
    }.header;
    sheet.getCell("I3").value = {
      header: "Price",
      key: "price",
    }.header;

    const subheaderStyle = {
      border: {
        top: { style: "thick" },
        left: { style: "thick" },
        right: { style: "thick" },
        bottom: { style: "thick" },
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

    let start_cell = 4;
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

    result.forEach(async (trans, index) => {
      const ord_time = trans.date;
      const indiaTime = ord_time.toLocaleString("en-US", options);
      const row = sheet.addRow({
        order_type: trans.orderType,
        order_by: trans.orderBy,
        order_to: trans.orderTo,
        amount: trans.totalPrice,
        time: indiaTime,
      });
      // const firstRow = sheet.getRow(start_cell);
      // firstRow.height = 35;

      row.getCell("order_type").border = {
        left: { style: "thick" },
        bottom: { style: "thin" },
      };
      row.getCell("time").border = {
        right: { style: "thick" },
        bottom: { style: "thin" },
      };
      row.getCell("order_type").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      row.getCell("order_by").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      row.getCell("order_by").border = {
        bottom: { style: "thin" },
      };
      row.getCell("order_to").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      row.getCell("order_to").border = {
        bottom: { style: "thin" },
      };
      row.getCell("amount").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      row.getCell("amount").border = {
        bottom: { style: "thin" },
      };
      row.getCell("time").alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      const temp = index;
      const len = trans.orders.length;

      trans.orders.forEach(async (item, index) => {
        console.log("ITEMS=", item);
        const row = sheet.getRow(start_cell + index);
        row.getCell("E").value = item.category;
        row.getCell("F").value = item.item;
        row.getCell("G").value = item.price / item.quantity;
        row.getCell("H").value = item.quantity;
        row.getCell("I").value = item.price;

        console.log(index + "    -------------->    ", len);
        const firstRow = sheet.getRow(start_cell + index);
        firstRow.height = 35;

        if (index + 1 === len) {
          row.getCell("E").border = {
            bottom: { style: "thin" },
          };
          row.getCell("F").border = {
            bottom: { style: "thin" },
          };
          row.getCell("G").border = {
            bottom: { style: "thin" },
          };
          row.getCell("H").border = {
            bottom: { style: "thin" },
          };
          row.getCell("I").border = {
            bottom: { style: "thin" },
          };
        }
      });

      sheet.mergeCells(`B${start_cell}:B${start_cell + len - 1}`);
      sheet.mergeCells(`C${start_cell}:C${start_cell + len - 1}`);
      sheet.mergeCells(`D${start_cell}:D${start_cell + len - 1}`);
      sheet.mergeCells(`J${start_cell}:J${start_cell + len - 1}`);
      sheet.mergeCells(`K${start_cell}:K${start_cell + len - 1}`);
      start_cell += len;
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename= Order.xlsx`);
    const excel = await workbook.xlsx.writeBuffer();
    res.send(excel);
  } catch (err) {
    console.log(err);
    res.json({ message: "Failed", error: "Internal Server Error" });
  }
};

const orderReportPdf = async (req, res) => {
  try {
    res.json({ message: "working on PDF" });
  } catch (err) {
    console.log(err);
    res.json({ message: "Failed", error: "Internal Server Error" });
  }
};

//! function to sent the text

const orderReportText = async (req, res) => {
  try {
    console.log("----------------Json Report ----------------");
    const { from, to } = req.query;
    if (!from || !to) {
      return res.json({ message: "Failed", error: "Filter not specified" });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    if (startDate == "Invalid Date" || endDate == "Invalid Date") {
      return res.json({ message: "Failed", error: "Invalid date" });
    }

    const result = await orderModel.find({
      $and: [{ date: { $gte: from } }, { date: { $lte: to } }],
    });

    if (result.length === 0) {
      return res.json({ message: "No orders found" });
    }

    return res.json({ message: "success", result });
  } catch (err) {
    return res.json({ message: "failed", error: err.message });
  }
};

// !-------------------------------------------------------------------------------------------------------------------------------------------------

router.get("/stock", async (req, res) => {
  let { type } = req.query;
  if (!type) {
    return res.json({ message: failed, error: "type required" });
  }
  switch (type) {
    case "excel":
      return stockReportExcel(req, res);
    case "text":
      return stockReportText(req, res);
    case "pdf":
      return res.send("working on pdf");
    default:
      return res.json({ message: "failed", error: "type error" });
  }
});

const stockReportText = async (req, res) => {
  try {
    const result = await categoryModel.find(
      { "categorydetails.0": { $exists: true } },
      {
        _id: 0,
        category: 1,
        "categorydetails.productname": 1,
        "categorydetails.productstock": 1,
      }
    );
    if (result.length === 0) {
      return res.json({ message: "No category found" });
    }
    return res.json({ message: "success", result });
  } catch (err) {
    res.json({ message: "failed", error: err.message });
  }
};

module.exports = router;
