const express = require("express");
const {
  verifyPayment,
  failPayment,
} = require("../controllers/razorpayStatusController");

const router = express.Router();

// ✅ Route for verifying a successful payment (Signature Matching)
router.post("/razorpay/verify-payment", verifyPayment);

// ✅ Route for handling failed payments
router.post("/razorpay/fail-payment", failPayment);

module.exports = router;
