const express = require("express");
const sharp = require("sharp");
const AWS = require('aws-sdk')
const fs = require("fs");
require("dotenv").config();
const router = express.Router();
const categoryModel = require("../schema/products");
const {
  AdminverifyMiddleware,
  UserverifyMiddleware,
} = require("./verifyMiddleware");

AWS.config.update({
  accessKeyId:process.env.AWS_SECUREKEY,
  secretAccessKey:process.env.AWS_SECRETKEY,
  region:process.env.AWS_LOCATION
})

const s3 = new AWS.S3();
const bucketname = "foodimagesece"


//! POST method to add an item in the specified category with (image,category,item name,price,category_id,item Stock)
router.post("/add_item", async (req, res) => {
  try {
  console.log("---------   Adding Item   ---------");
  if (!req.files || !req.files.image) {
    return res.json({message:"Error",info:"Missing Image"})
  }
  const { category, item, price, _id, item_stock } = req.body;

  if (_id.length != 24) {
    return res.json({message:"Error",info:"ID missing"})
  }
  if (!item) {
    return res.json({message:"Error",info:"Insufficient data"})
  }
  console.log("ID",_id);

  const result = await categoryModel.findById(_id);
  if (result === null) {
    return res.json({message:"Error",info:"Category not found"})
  }
  const subres = await categoryModel.findOne({
    _id,
    categorydetails: { $elemMatch: { productname: item } },
  });
  if (subres) {
    return res.json({message:"Error",info:"Duplicate category"})
  }

  const uploadedImage = req.files.image;

       const imageBuffer = await sharp(uploadedImage.data)
      .toFormat("jpg")
      .toBuffer();

    fs.writeFile("./foodimages.jpg", imageBuffer, (err) => {
      if (err) {
        console.log("Err while converting buffer");
      }
    });
  
    const name = item.split(' ').join('')
    const s3Key = name+".jpg"

    await s3.upload({
      Bucket:bucketname,
      Key:s3Key,
      Body:imageBuffer
    },
    (err,data)=>{
      if(err)
      {
        res.json({message:"failed",error:err.message})
      }
    })

    await categoryModel.updateOne(
      { _id },
      {
        $push: {
          categorydetails: {
            productname: item,
            productprice: price,
            productstock: item_stock,
            productimage: "https://foodimagesece.s3.eu-north-1.amazonaws.com/"+s3Key
          },
        },
      }
    );
    return res.json({message:"Success",info:"Item added successfully"})
  } catch (err) {
    return res.json({message:"Error",info:err.message})
  }
});

//! POST method to add an category to the collection with (categoryname) empty item details wil be created with the category given

router.post("/add_category", async(req, res) => {
  console.log("--------     Adding Category     ---------");
  const { category } = req.body;
  const uploadImage = req?.files?.image;
  if (!category) {
    return res.json({message:"Error",info:"Category not found"})
  }
  try{
    try {
      console.log("---------     Converting Image     ---------");
      if (uploadImage) {
        const imageBuffer = await sharp(uploadImage.data)
          .toFormat("jpg")
          .toBuffer()
        
        const name = category.split(' ').join('')
        const s3Key = name+".jpg"
    
         console.log("shesha0")

        await s3.upload({
          Bucket: bucketname,
          Key: s3Key,
          Body: imageBuffer
        },
          (err, data) => {
            if (err) {
             return res.json({ message: "failed", error: err.message });
            }
          })
          console.log("fuck")
        const addcat = categoryModel.create({
          category:category,
          categoryImage:"https://foodimagesece.s3.eu-north-1.amazonaws.com/"+s3Key
        })
        consle.log(addcat)
       await addcat.save()
       return res.json({message:"success"})
      }
    } catch (err) {
      console.log("Image Upload Failed");
    }
    
  } catch (err) {
    console.log(err);
    if (err.code === 11000 && err.keyPattern && err.keyValue) {
      return res.json({message:"erroe",info:"Duplicate category"});
    }
    res.json({message:"error",info:err.message})
  }
});

//! GET method to get all the categories in the DB

router.get("/get_categories", async (req, res) => {
  try{

    console.log("---------     Getting Categories     ---------");
    const category = await categoryModel.find({}, "category categoryImage");
    res.json({message:"SUCCESS",category});
  }catch(err){
    res.json({message:"error",info:err.message});
  }
});

//! GET method to get the specified category details(category name) returns all the items in the given category

router.get(
  "/get_categories_details/:categoryid",
  async (req, res) => {
    console.log(
      "---------     Getting Item details In a Category     ---------"
    );
    const { categoryid } = req.params;
    try {
      const result = await categoryModel.findById(categoryid,"-categoryImage -date -_id -__v");
      if (result.length == 0) {
        return res.json({message:"error",info:"Category not found"})
      }
      return res.json({message:"success",result})
    } catch (err) {
      res.json({message:"error"})
    }
  }
);

//! DELETE method to remove a given category (category _id)

router.delete("/remove_category", async (req, res) => {
  console.log("---------     Removing Category     ---------");
  const { _id } = req.body;
  try {
    const result = await categoryModel.deleteOne({ _id });
    if (result.deletedCount == 0) {
      return res.json({message:"error",info:"Id not found"})
    }
    return res.json({message:"success"})
  } catch (err) {
    return res.json({message:"error",info:"Internal Error"})
  }
});

//! DELETE method to remove an item in a specified Category (category _id, item _id)

router.delete("/remove_item", async (req, res) => {
  console.log("---------     Removing Item     ---------");
  const { category_id, item_id } = req.body;
  try {
    const result = await categoryModel.updateOne(
      { _id: category_id },
      { $pull: { categorydetails: { _id: item_id } } }
    );
    if (result.modifiedCount == 0) {
      return res.status(422).send("Invalid ID");
    }
    if (result.modifiedCount == 1) {
      return res.status(200).send("Successfully deleted");
    }
  } catch (err) {
    res.status(500).send("err");
    console.log(`err ${err}`);
  }
});

//! PATCH method to update an item in the specified category (category _id ,item _id, update *fields*)

router.patch("/item_update", async (req, res) => {
  console.log("---------     Updating Item     ---------");
  const { category_id, item_id, update } = req.body;
  if (!category_id || !item_id || !update) {
    return res.status(422).send("Insufficient Data");
  }

  try {
    const { productname, productprice, productstock, productimage } = update;
    const newData = {};

    if (productname) {
      newData[`categorydetails.$[elem].productname`] = productname;
    }
    if (productprice) {
      newData[`categorydetails.$[elem].productprice`] = Number(productprice);
    }
    if (productstock) {
      newData[`categorydetails.$[elem].productstock`] = Number(productstock);
    }
    if (productimage) {
      newData[`categorydetails.$[elem].productimage`] = productimage;
    }
    const arrayFilters = [
      {
        "elem._id": item_id,
      },
    ];

    const result = await categoryModel.updateOne(
      { _id: category_id },
      { $set: newData },
      { arrayFilters: arrayFilters }
    );
    if (result.acknowledged) {
      return res.status(200).send("Item modified Successfully");
    } else {
      return res.status(422).send("Data invalid");
    }
  } catch (err) {
    res.status(500).send("Failed");
    console.log(err);
  }
});

router.patch("/category_update", async (req, res) => {
  console.log("---------     Updating Category     ---------");
  const { _id, category } = req.body;
  if (!_id || !category) {
    return res.status(422).send("insufficient data");
  }
  try {
    const result = await categoryModel.updateOne({ _id }, { category });
    if (result.acknowledged) {
      return res.status(200).send("Update Successfull");
    } else {
      return res.status(500).send("Update Failed");
    }
  } catch (err) {
    res.status(500).send("err");
  }
});

//!  user routes

router.get("/user/get_categories", async (req, res) => {
  console.log(
    "---------  USER   ---------     Getting Categories     ---------"
  );
  const category = await categoryModel.find({}, "category categoryImage");
  res.status(200).json(category);
});


router.get(
  "/user/get_categories_details/:category",
  async (req, res) => {
    console.log(
      "---------    USER   ---------     Getting All item in a Category     ---------"
    );
    const { category } = req.params;
    try {
      const result = await categoryModel.find(
        { category: category },
        "-categoryImage"
      );
      if (result.length == 0) {
        return res.status(422).json(`Category ${category} does not exist`);
      }
      res.status(200).json(result);
    } catch (err) {
      res.status(500).send("Fetch Failed");
    }
  }
);

module.exports = router
