const express = require("express");
const sharp = require("sharp");
const fs = require("fs");
require("dotenv").config();
const { google } = require("googleapis");
const SCOPE = ["https://www.googleapis.com/auth/drive"];
const router = express.Router();
const categoryModel = require("../schema/products");
const item_details = {};

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

async function uploadFile(authClient) {
  return new Promise(async (resolve, rejected) => {
    const drive = google.drive({ version: "v3", auth: authClient });

    var fileMetaData = {
      name: item_details.item,
      parents: ["1jydbPP0jEN1sa0srHy3j9vVxPrrr_CnU"], // A folder ID to which the file will get uploaded
    };

    try {
      // Upload the file
      const file = await drive.files.create({
        resource: fileMetaData,
        media: {
          body: fs.createReadStream("./foodimages.jpg"), // File to be uploaded
          mimeType: "image/jpg",
        },
        fields: "id",
      });

      console.log("File uploaded successfully.");
      console.log("File ID:", file.data.id);
      item_details.url = "https://drive.google.com/uc?id=" + file.data.id;

      // Make the uploaded file public
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      // Get the sharing link to the image
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

router.post("/add_item", async (req, res) => {
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

  try {
    const imageBuffer = await sharp(uploadedImage.data)
      .toFormat("jpg")
      .toBuffer();

    fs.writeFile("./foodimages.jpg", imageBuffer, (err) => {
      if (err) {
        console.log("Err while converting buffer");
      }
    });

    const authClient = await authorize();

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

router.post("/add_category", async (req, res) => {
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

router.get("/get_categories", async (req, res) => {
  const category = await categoryModel.find({}, "category");
  res.json(category);
});

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

module.exports = router;
