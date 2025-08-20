const express = require("express");
const { handlePrompt } = require("../controllers/experimentController");
// const attachUserId = require("../middleware/attachUserId");

const router = express.Router();

// Route to handle experiment prompt
router.post("/start-experiment", handlePrompt);

module.exports = router;
