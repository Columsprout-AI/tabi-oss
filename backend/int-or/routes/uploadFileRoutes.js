const express = require("express");
const { handleFileUpload } = require("../controllers/uploadFileController");
// const attachUserId = require("../middleware/attachUserId"); // Middleware to attach userid from session or token

const router = express.Router();

// Route to handle file upload
router.post("/upload-file", /* attachUserId, */ handleFileUpload);

module.exports = router;
