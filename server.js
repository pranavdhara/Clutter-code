const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;

// Initialize GoogleGenerativeAI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyDbfd8CyKCMXdQc1Ypbqvbg6nW5Ckv5Muo');  // Replace with your actual API key from environment variables

// Set up Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Use CORS middleware
app.use(cors());

// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

// Handle the image upload and processing for object names and materials
app.post("/process-images", upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Please find the objects and provide the name list in HTML ul li format, don't repeat the names and name should be in one word.";

    const imageParts = req.files.map(file => fileToGenerativePart(file.path, file.mimetype));
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = await response.text();

    // Clean up the uploaded files
    req.files.forEach(file => fs.unlinkSync(file.path));

    res.json({ response: text });
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ error: "Error processing images." });
  }
});

// Handle the image upload and processing for materials only
app.post("/process-images-labels", upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Please check the object and provide the materials used in the image in a list in HTML ul li format, and don't repeat items.";

    const imageParts = req.files.map(file => fileToGenerativePart(file.path, file.mimetype));
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = await response.text();

    // Clean up the uploaded files
    req.files.forEach(file => fs.unlinkSync(file.path));

    res.json({ response: text });
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ error: "Error processing images." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});