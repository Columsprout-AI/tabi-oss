const express = require("express");
const {
  handleIngestion,
  handleIngestionWebhook,
} = require("../controllers/ingestionController");
// const attachUserId = require("../middleware/attachUserId");

const router = express.Router();

// Route to handle ingestion start
router.post("/start-ingestion", /* attachUserId, */ handleIngestion);

// Webhook to handle ingestion service response
router.post("/ingestion-webhook", handleIngestionWebhook);

module.exports = router;
