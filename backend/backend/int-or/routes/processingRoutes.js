const express = require("express");
const {
  handleProcessing,
  handleProcessingWebhook,
} = require("../controllers/processingController");
// const attachUserId = require("../middleware/attachUserId");

const router = express.Router();

// Route to start the processing
router.post("/start-processing", /* attachUserId,*/ handleProcessing);

// Route to handle webhook from processing service
router.post("/processing-webhook", handleProcessingWebhook);

module.exports = router;
