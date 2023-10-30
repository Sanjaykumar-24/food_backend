const express = require("express");
const sharp = require("sharp");
const fs = require("fs");
require("dotenv").config();
const { google } = require("googleapis");
const SCOPE = ["https://www.googleapis.com/auth/drive"];
const router = express.Router();
const categoryModel = require("../schema/products");
const {
  AdminverifyMiddleware,
  UserverifyMiddleware,
} = require("./verifyMiddleware");
const item_details = {};
const category_details = {};
const details = [];
details.push(category_details);
details.push(item_details);

const folderId = [
  process.env.FOLDER_ID1,
  process.env.FOLDER_ID2,
];

//! Function to authorize, to upload the image to drive

async function authorize() {
  const jwtClient = await new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY.replace(/"/g, ""),
    SCOPE
  );
  await jwtClient.authorize();
  return jwtClient;
}

//! Function to upload the image to google drive and retrive the URL

async function uploadFile(authClient, loc) {
  return new Promise(async (resolve, rejected) => {
    console.log("---------     Uploading     ---------");
    const drive = google.drive({ version: "v3", auth: authClient });

    var fileMetaData = {
      name: details[loc].name,
      parents: [folderId[loc]],
    };

    try {
      const file = await drive.files.create({
        resource: fileMetaData,
        media: {
          body: fs.createReadStream("./foodimages.jpg"),
          mimeType: "image/jpg",
        },
        fields: "id",
      });
      details[loc].url = "https://drive.google.com/uc?id=" + file.data.id;
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      const result = await drive.files.get({
        fileId: file.data.id,
        fields: "webViewLink",
      });

      const imageUrl = result.data.webViewLink;
      console.log("---------     Image URL:", imageUrl);
      resolve(file);
    } catch (error) {
      rejected(error);
    }
  });
}

//! Function to delete the image in drive

async function deleteFile(authClient, fileId) {
  console.log("---------     Deleting Image in drive     ---------");
  const drive = google.drive({ version: "v3", auth: authClient });
  try {
    await drive.files.delete({ fileId: fileId });
    console.log("File deleted successfully.");
  } catch (error) {
    console.error("Error deleting the file:", error);
  }
}

//! POST method to add an item in the specified category with (image,category,item name,price,category_id,item Stock)

router.post("/add_item", async (req, res) => {
  try {
  console.log("---------   Adding Item   ---------");
  if (!req.files || !req.files.image) {
    return res.json({message:"Error",info:"Missing Image"})
  }
  const {  item, price, _id, item_stock } = req.body;
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

  console.log("proceddign");
 
  item_details.name = item;
  item_details.price = price;
  item_details.item_stock = item_stock;
  const uploadedImage = req.files.image;


  
    const imageBuffer = await sharp(uploadedImage.data)
      .toFormat("jpg")
      .toBuffer();

    fs.writeFile("./foodimages.jpg", imageBuffer, (err) => {
      if (err) {
        console.log("Err while converting buffer");
      }
    });

    console.log("---------     File write success     --------");

    const authClient = await authorize();

    await uploadFile(authClient, 1);
    await categoryModel.updateOne(
      { _id },
      {
        $push: {
          categorydetails: {
            productname: item_details.name,
            productprice: item_details.price,
            productstock: item_details.item_stock,
            productimage: item_details.url,
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

router.post("/add_category", async (req, res) => {
  console.log("--------     Adding Category     ---------");
  const { addCategory } = req.body;
  const uploadImage = req?.files?.image;
  if (!addCategory) {
    return res.json({message:"Error",info:"Category not found"})
  }
  try {
    category_details.name = addCategory;
    const add = new categoryModel({
      category: addCategory,
    });
    const status = await add.save();
    try {
      console.log("---------     Converting Image     ---------");
      if (uploadImage) {
        const imageBuffer = await sharp(uploadImage.data)
          .toFormat("jpg")
          .toBuffer();
        fs.writeFile("./foodimages.jpg", imageBuffer, (err) => {
          if (err) {
            console.log("Err while converting buffer");
          }
        });
        const authClient = await authorize();
        await uploadFile(authClient, 0);
        await categoryModel.updateOne(
          { _id: status._id },
          { categoryImage: category_details.url }
        );
      }
    } catch (err) {
      console.log("Image Upload Failed");
    }
    res.json({message:"success"})
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

module.exports = router;
