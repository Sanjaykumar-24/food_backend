const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const userRouter = require("./routes/userAuth");
const adminRouter = require("./routes/adminAuth");
const updateRouter = require("./routes/userUpdation");
const transactionrouter = require("./routes/transaction");
const itemRouter = require("./routes/addItem");
const itemOrder = require("./routes/orderItems");
const reportRoute = require("./routes/report");
const printRoute = require("./routes/printOrders");
const RfidactivateRoute = require("./routes/userActivation");
const {socketVerifyMiddleware}=require('./routes/verifyMiddleware')
const {instrument} = require('@socket.io/admin-ui') 
require("dotenv").config();
const port = process.env.PORT || 2001;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));
app.use(fileUpload());
app.use(bodyParser.json());
const { Server } = require("socket.io");

/*database connection here*/

mongoose
  .connect(process.env.URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("Database connected successfully 😀😃😄");
  })
  .catch((err) => {
    console.error("Database connection error 😔😔☹", err);
  })

<<<<<<< HEAD
=======
    const io = new Server(server, {
      cors: {
        origin: ["https://admin.socket.io"],
        credentials:true
      },
    });

    instrument(io, {
      auth: false,
      mode: "development",
    });    
    // io.use(socketVerifyMiddleware)

    io.on("connection", (socket) => {
      console.log("SOCKET------------ connected");

      console.log(socket.id);
      
      socket.on("disconnect", () => {
        console.log(socket.id);
      })

      socket.on("message", (data) => {
        console.log(data);
      })
    })
  })
>>>>>>> c6676fd78b1d0bf1fc4ae0e24b7d62117d9790aa

/*router junction*/

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/", transactionrouter);
app.use("/update", updateRouter);
app.use("/item", itemRouter);
app.use("/order", itemOrder);
app.use("/report", reportRoute);
app.use("/print", printRoute);
app.use("/rfid", RfidactivateRoute);

const server = app.listen(port,()=>{
  console.log(`port http://localhost:${port} is running `);
})

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});


// io.use(socketVerifyMiddleware)

io.on("connection", (socket) => {
  console.log("SOCKET------------ connected");

  console.log(socket.id);
  
  socket.on("disconnect", () => {
    console.log(socket.id);
  })

  socket.on("message", (data) => {
    console.log(data);
  })
  socket.on("updateStock",(data)=>{
    console.log("Emitted message",data)
    socket.broadcast.emit("updateStock",{update:data.new_stock  })
  })
})

module.exports = io