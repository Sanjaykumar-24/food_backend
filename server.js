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


app.use('/',authRouter)
app.listen(port,()=>{
    console.log(` port http://localhost:${port} is running `);
})