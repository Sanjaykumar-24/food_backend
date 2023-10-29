const express = require("express");
const mongoose = require("mongoose");
const userModel = require("../schema/user");
const categoryModel = require("../schema/products");
const orderModel = require("../schema/orders");
const qrcode = require('qrcode')
const PDFDocument = require('pdfkit');
const {
  UserverifyMiddleware,
  AdminverifyMiddleware,
} = require("../routes/verifyMiddleware");
const adminModel = require("../schema/admin");
const router = express.Router();


function date() {
  const now = new Date();
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
  const istTime = now.toLocaleString("en-IN", options);
  return istTime;
}
/**user order route here */

router.post("/user", UserverifyMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.userId;
    const { orders, totalPrice } = req.body;

    if (!orders || !totalPrice || totalPrice <= 0) {
      return res.status(422).json({ message: "Invalid details" });
    }

    let amount = 0;
    const userBal = await userModel.findById(userId, "amount");

    if (userBal.amount < totalPrice) {
      return res.status(422).json({ message: "Insufficient balance" });
    }
    const userOrders = [];
    const orderHistory = [];

    await session.startTransaction();

    for (const order of orders) {
      console.log(order.category_id, "    ", order.item_id);

      const result = await categoryModel.find(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          "categorydetails.$": 1,
        }
      );
      if (!result) {
        await session.abortTransaction();
        session.endSession();
        return res.json({ Message: "Item or Category Error" });
      }

      if (result[0].categorydetails[0].productstock < order.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(503).json({
          message: `${result[0].categorydetails[0].productname} not available to mentioned your quantity`,
        });
      }
      amount += result[0].categorydetails[0].productprice * order.quantity;
      if (userBal < amount) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(422)
          .json({ message: "Insufficient balance while billing" });
      }
      await categoryModel.updateOne(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          $inc: { "categorydetails.$.productstock": -order.quantity },
        },
        { session }
      );

      const orderList = {};
      const ordHistory = {};
      orderList.productname = result[0].categorydetails[0].productname;
      orderList.productprice = result[0].categorydetails[0].productprice;
      orderList.quantity = order.quantity;
      orderList.totalcost =
        result[0].categorydetails[0].productprice * order.quantity;
      userOrders.push(orderList);

      ordHistory.category_id = order.category_id;
      ordHistory.item_id = order.item_id;
      ordHistory.quantity = order.quantity;
      ordHistory.price =
        result[0].categorydetails[0].productprice * order.quantity;
      orderHistory.push(ordHistory);
    }

    if (amount != totalPrice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).send({ Message: "Calculation Err!" });
    }

    await userModel.updateOne(
      {
        _id: userId,
      },
      {
        $inc: { amount: -amount },
      },
      { session }
    );

    const data = await userModel.findOne({ _id: userId });

    const add = new orderModel({
      orders: orderHistory,
      totalPrice: amount,
      orderType: "User",
      orderBy: data.rollno,
      orderTo: data.rollno,
      date:date()
    });

    const status = await add.save({ session });
    console.log(status);
    await session.commitTransaction();
    session.endSession();
    res.json({ userOrders, totalamount: amount });
  } catch (err) {
    console.log("error billing :" + err.message);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .send({ message: "internal server error =====>" + err.message });
  }
});

router.post("/admin", AdminverifyMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.userId;
    const { orders, totalPrice, rollno } = req.body;

    if (!orders || !totalPrice || totalPrice <= 0 || !rollno) {
      return res.status(422).json({ message: "Invalid details" });
    }

    let amount = 0;
    const userBal = await userModel.findOne({ rollno }, "amount rollno");

    if (userBal.amount < totalPrice) {
      return res.status(422).json({ message: "Insufficirnt balance" });
    }
    const userOrders = [];
    const orderHistory = [];
    await session.startTransaction();

    for (const order of orders) {
      console.log(order.category_id, "    ", order.item_id);

      const result = await categoryModel.find(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          "categorydetails.$": 1,
        }
      );

      if (!result) {
        await session.abortTransaction();
        session.endSession();
        return res.json({ Message: "Item or Category Error" });
      }

      if (result[0].categorydetails[0].productstock < order.quantity) {
        return res.status(503).json({
          message: `${result[0].categorydetails[0].productname} not available to mentioned your quantity`,
        });
      }
      amount += result[0].categorydetails[0].productprice * order.quantity;
      if (userBal < amount) {
        return res
          .status(422)
          .json({ message: "Insufficient balance while billing" });
      }

      await categoryModel.updateOne(
        {
          _id: order.category_id,
          "categorydetails._id": order.item_id,
        },
        {
          $inc: { "categorydetails.$.productstock": -order.quantity },
        },
        { session }
      );

      const orderList = {};
      const ordHistory = {};
      orderList.productname = result[0].categorydetails[0].productname;
      orderList.productprice = result[0].categorydetails[0].productprice;
      orderList.quantity = order.quantity;
      orderList.totalcost =
        result[0].categorydetails[0].productprice * order.quantity;
      userOrders.push(orderList);

      ordHistory.category_id = order.category_id;
      ordHistory.item_id = order.item_id;
      ordHistory.quantity = order.quantity;
      ordHistory.price =
        result[0].categorydetails[0].productprice * order.quantity;
      orderHistory.push(ordHistory);
    }

    if (amount != totalPrice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).send({ Message: "Calculation Err!" });
    }

    await userModel.updateOne(
      {
        rollno,
      },
      {
        $inc: { amount: -amount },
      },
      { session }
    );

    const adminMail = await adminModel.findById(userId, "email");

    const add = new orderModel({ 
      orderType: "Admin",
      orderBy: adminMail.email,
      orderTo: userBal.rollno,
      orders: orderHistory,
      totalPrice: amount,
      date:date()
    });

    const status = await add.save({ session });
    console.log(status);
    await session.commitTransaction();
    session.endSession();
    res.json({ userOrders, totalamount: amount });
  } catch (err) {
    console.log("error :" + err.message);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .send({ message: "internal server error =====>" + err.message });
  }
});


/**qrcode route here */

router.post('/qrcode',async(req,res)=>{
  const {orderId} = req.body
  const data = JSON.stringify(orderId)
  const code = await qrcode.toDataURL(data)
  if(!code)
  {
    res.send({message:"error occured while generating qr"})
  }
  res.setHeader('Content-type','image/png')
  console.log(code)
  res.send(code)
})


/**bill printing route here */

router.post('/bill',async(req,res)=>{
 const {name} = req.body;
 console.log(name)
  /**req should come with order details and make order details like this format👇 */
  const items = [
    { serial: 1, product: 'Product 1', quantity: 2, price: 50 },
    { serial: 2, product: 'Product 2', quantity: 1, price: 30 },
  ];

  const pdfdocument = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition','inline; filename=bill.pdf');

  pdfdocument.pipe(res);
  // const imagePath = 'green.png'
  // pdfdocument.image(imagePath,250,120,{width:150,height:100})
  // pdfdocument.font('Helvetica-Bold');
  pdfdocument.fontSize(14);
  pdfdocument.text(new Date().toString().slice(0,10),60,50)
  pdfdocument.fontSize(20)
  pdfdocument.text("SmartBilling",250,50)
  pdfdocument.fontSize(16)
  pdfdocument.text("rollno",490,50)
  pdfdocument.moveDown(1)

  const top = 150
  pdfdocument.fontSize(15);
  pdfdocument.text("s.no", 80, top);
  pdfdocument.text("product", 200, top);
  pdfdocument.text("quantity", 340, top);
  pdfdocument.text("price", 500, top);
  pdfdocument.font('Helvetica');
 
  pdfdocument.fontSize(12);
  let y = 200;
  for (const item of items) {
    pdfdocument.text(item.serial.toString(), 80, y);
    pdfdocument.text(item.product, 200, y);
    pdfdocument.text(item.quantity.toString(), 360, y);
    pdfdocument.text(item.price.toFixed(2), 500, y);
    y += 30; 
  }
  pdfdocument.fontSize(15);
  pdfdocument.font('Helvetica-Bold');
  pdfdocument.text(`total: ${80}`,480,y+10);

  pdfdocument.end();
})


module.exports = router;
