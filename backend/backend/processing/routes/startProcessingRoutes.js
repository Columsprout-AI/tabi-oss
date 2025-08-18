const express = require("express");
const { startProcessing } = require("../controllers/startProcessingController");

const router = express.Router();

// Route for starting the processing
router.post("/start-processing", startProcessing);

module.exports = router;
