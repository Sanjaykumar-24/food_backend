const express = require("express");
const sharp = require("sharp");
const fs = require("fs");
const { google } = require("googleapis");
const apikeys = require("../apikeys.json");
const SCOPE = ["https://www.googleapis.com/auth/drive"];
const router = express.Router()
const item_details = {};
async function authorize() {
  const jwtClient = new google.auth.JWT(
    apikeys.client_email,
    null,
    apikeys.private_key,
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
  const { category, item, price } = req.body;
  if (!category || !item) {
    return res.status(400).send("Insufficient data");
  }

  item_details.category = category;
  item_details.item = item;
  item_details.price = price;
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

    return res.status(200).send("Item added successfully");
  } catch (err) {
    return res.status(500).send("Error adding item");
  }
});

module.exports = router;
