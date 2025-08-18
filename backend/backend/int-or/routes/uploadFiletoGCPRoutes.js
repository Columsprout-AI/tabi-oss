// routes/upload.js
const express = require("express");
const router = express.Router();
const { uploadFileToGCP } = require("../controllers/uploadFiletoGCPController");

// Route for file upload
router.post("/upload-to-GCP", uploadFileToGCP);

module.exports = router;
