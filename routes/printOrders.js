const PDFDocument = require('pdfkit')
const express = require('express')
const router = express.Router()

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
   
module.exports = router