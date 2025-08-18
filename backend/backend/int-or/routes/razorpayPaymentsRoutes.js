const express = require("express");
const { createOrder } = require("../controllers/razorpayPaymentsController");

const router = express.Router();

router.post("/razorpay/create-order", createOrder);

module.exports = router;
