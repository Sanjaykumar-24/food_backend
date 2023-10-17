const express=require('express');
const bcrypt=require('bcrypt');
const cors=require('cors')
const mongoose=require('mongoose');
const authRouter = require('./routes/userAuth')
require('dotenv').config()
const port = process.env.PORT||2001;
const app = express();
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cors())


mongoose.connect(process.env.URI)
.then(()=>{
    console.log("database is connected successfully 😀😃😄");
})
.catch(err=>{
    console.log("database is not connected 😔😔☹");
})
app.use('/',authRouter)
app.listen(port,()=>{
    console.log(` port http://localhost:${port} is running `);
})