const express = require("express");
const { extractHeaders } = require("../controllers/extractHeadersController");
const { startIngestion } = require("../controllers/startIngestionController");

const router = express.Router();

// Route for extracting headers
router.post("/extract-headers", extractHeaders);

// Route for starting ingestion
router.post("/start-ingestion", startIngestion);

module.exports = router;
