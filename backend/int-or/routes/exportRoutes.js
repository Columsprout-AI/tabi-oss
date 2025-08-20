const express = require("express");
const { logFileExport } = require("../controllers/exportController");
// const attachUserId = require("../middleware/attachUserId");
const router = express.Router();

// Route to log file export
router.post("/record-export", /* attachUserId, */ logFileExport);

module.exports = router;
