const express = require("express");
const { generateOutputPath } = require("../controllers/outputPathController");

const router = express.Router();

// Webhook endpoint for receiving input_filepath
router.post("/output-path", generateOutputPath);

module.exports = router;
