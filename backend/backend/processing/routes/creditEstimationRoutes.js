const express = require("express");
const {
  estimateCredits,
} = require("../controllers/creditEstimationController");

const router = express.Router();

// Define the route relative to the base path
router.post("/estimate-credits", estimateCredits);

module.exports = router;
