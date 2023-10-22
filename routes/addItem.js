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

//! Function to authorize, to upload the image to drive

async function authorize() {
  console.log("Authorizing", process.env.CLIENT_EMAIL);
  console.log("Key", process.env.PRIVATE_KEY);
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

async function uploadFile(authClient) {
  return new Promise(async (resolve, rejected) => {
    console.log("Uploading");
    const drive = google.drive({ version: "v3", auth: authClient });

    var fileMetaData = {
      name: item_details.item,
      parents: ["1jydbPP0jEN1sa0srHy3j9vVxPrrr_CnU"],
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

      console.log("File uploaded successfully.");
      console.log("File ID:", file.data.id);
      item_details.url = "https://drive.google.com/uc?id=" + file.data.id;

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
      console.log("Image URL:", imageUrl);
      resolve(file);
    } catch (error) {
      rejected(error);
    }
  });
}

//! POST method to add an item in the specified category with (image,category,item name,price,category_id,item Stock)

router.post("/add_item", AdminverifyMiddleware, async (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(404).send("Image file not found");
  }
  const { category, item, price, _id, item_stock } = req.body;
  if (_id.length != 24) {
    return res.send("Invalid ID");
  }
  if (!category || !item) {
    return res.status(400).send("Insufficient data");
  }

  const result = await categoryModel.findById(_id);
  if (result === null) {
    return res.send("category does not exist");
  }
  const subres = await categoryModel.findOne({
    _id,
    categorydetails: { $elemMatch: { productname: item } },
  });
  if (subres) {
    return res.send("Item already exist");
  }
  console.log("REULT===", subres);

  item_details.category = category;
  item_details.item = item;
  item_details.price = price;
  item_details.item_stock = item_stock;
  const uploadedImage = req.files.image;
  console.log("Destructure finished");

  try {
    const imageBuffer = await sharp(uploadedImage.data)
      .toFormat("jpg")
      .toBuffer();
    console.log("conversion finished");

    fs.writeFile("./foodimages.jpg", imageBuffer, (err) => {
      if (err) {
        console.log("Err while converting buffer");
      }
    });

    console.log("File write success");

    const authClient = await authorize();
    console.log("Authenticated");

    await uploadFile(authClient);
    console.log("Item Details===>", item_details);
    const result = await categoryModel.updateOne(
      { _id },
      {
        $push: {
          categorydetails: {
            productname: item_details.item,
            productprice: item_details.price,
            productstock: item_details.item_stock,
            productimage: item_details.url,
          },
        },
      }
    );
    console.log("Respone", result);
    return res.status(200).send("Item added successfully");
  } catch (err) {
    return res.status(500).send(`Error adding item ${err}`);
  }
});

//! POST method to add an category to the collection with (categoryname) empty item details wil be created with the category given

router.post("/add_category", AdminverifyMiddleware, async (req, res) => {
  const { addCategory } = req.body;

  if (!addCategory) {
    return res.status(404).send("Category not found");
  }

  const add = new categoryModel({
    category: addCategory,
  });

  try {
    const status = await add.save();
    console.log(status);
    res.status(200).send(`Category added ${status._id}`);
  } catch (err) {
    console.log(err);
    if (err.code === 11000 && err.keyPattern && err.keyValue) {
      return res.send("Duplicate Category");
    }
    res.status(500).send("Category add failed");
  }
});

//! GET method to get all the categories in the DB

router.get("/get_categories", async (req, res) => {
  const category = await categoryModel.find({}, "category");
  res.json(category);
});

//! GET method to get the specified category details(category name) returns all the items in the given category

router.get("/get_categories_details/:category", async (req, res) => {
  console.log(req.params);
  const { category } = req.params;
  try {
    const result = await categoryModel.find({ category: category });
    if (result.length == 0) {
      return res.json(`Category ${category} does not exist`);
    }
    res.json(result);
  } catch (err) {
    res.status(500).send("Fetch Failed");
  }
});

//! DELETE method to remove a given category (category _id)

router.delete("/remove_category", async (req, res) => {
  const { _id } = req.body;
  try {
    const result = await categoryModel.deleteOne({ _id });
    console.log(result);
    if (result.deletedCount == 0) {
      return res.send("Id is not valid");
    }
    return res.send("Successfully deleted");
  } catch (err) {
    return res.status(500).send("Failed!");
  }
});

//! DELETE method to remove an item in a specified Category (category _id, item _id)

router.delete("/remove_item", async (req, res) => {
  const { category_id, item_id } = req.body;
  try {
    const result = await categoryModel.updateOne(
      { _id: category_id },
      { $pull: { categorydetails: { _id: item_id } } }
    );
    if (result.modifiedCount == 0) {
      return res.send("Invalid ID");
    }
    if (result.modifiedCount == 1) {
      return res.send("Successfully deleted");
    }
    console.log(result);
  } catch (err) {
    res.status(500).send("err");
    console.log(`err ${err}`);
  }
});

//! PATCH method to update an item in the specified category (category _id ,item _id, update *fields*)

router.patch("/item_update", async (req, res) => {
  const { category_id, item_id, update } = req.body;
  if (!category_id || !item_id || !update) {
    return res.send("Insufficient Data");
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
      return res.send("Item modified Successfully");
    } else {
      return res.send("Data invalid");
    }
  } catch (err) {
    res.status(500).send("Failed");
    console.log(err);
  }
});

router.patch("/category_update", async (req, res) => {
  const { _id, category } = req.body;
  if (!_id || !category) {
    return res.send("insufficient data");
  }
  try {
    const result = await categoryModel.updateOne({ _id }, { category });
    if (result.acknowledged) {
      return res.send("Update Successfull");
    } else {
      return res.send("Update Failed");
    }
  } catch (err) {
    res.status(500).send("err");
  }
});

router.get("/user/get_categories", async (req, res) => {
  const category = await categoryModel.find({}, "category");
  res.json(category);
});

router.get("/user/get_categories_details/:category", async (req, res) => {
  console.log(req.params);
  const { category } = req.params;
  try {
    const result = await categoryModel.find({ category: category });
    if (result.length == 0) {
      return res.json(`Category ${category} does not exist`);
    }
    res.json(result);
  } catch (err) {
    res.status(500).send("Fetch Failed");
  }
});

module.exports = router;
