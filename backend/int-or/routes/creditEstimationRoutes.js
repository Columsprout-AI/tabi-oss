const express = require("express");
const {
  estimateCredits,
} = require("../controllers/creditEstimationController");
// const attachUserandFile = require("../middleware/attachUserandFile"); // Middleware to attach userid, fileid, etc.
const router = express.Router();

// Route to estimate credits
router.post("/estimate-credits", estimateCredits);

module.exports = router;
