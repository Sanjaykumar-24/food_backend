const express=require('express');
const bcrypt=require('bcrypt');
const cors=require('cors')
const fileUpload = require("express-fileupload");
const mongoose = require('mongoose');
const userRouter = require('./routes/userAuth')
const adminRouter = require('./routes/adminAuth')
const updateRouter = require('./routes/userUpdation')
const trachsactionrouter = require('./routes/transaction')
const addItem = require('./routes/addItem')
require('dotenv').config()
const port = process.env.PORT||2001;
const app = express();
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cors())
app.use(fileUpload())


/*database connection here*/

mongoose.connect(process.env.URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
})
    .then(() => {
      console.log('Database connected successfully 😀😃😄');
    })
    .catch((err) => {
      console.error('Database connection error 😔😔☹', err);
    });

/*roter junction*/

app.use('/user',userRouter)
app.use('/admin',adminRouter)
app.use('/',trachsactionrouter)
app.use('/update',updateRouter)
app.use('/add',addItem)


app.listen(port,()=>{
    console.log(` port http://localhost:${port} is running `);
})