const Razorpay = require("razorpay");
const dotenv = require("dotenv");
const { createPayment } = require("../models/paymentsModel");
const { getUserIdByClerkId } = require("../models/usersModel");
const { getCurrentRate } = require("../utils/conversionRateService");

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, clerkId } = req.body;

    // Validate input
    if (!amount || !clerkId) {
      return res
        .status(400)
        .json({ success: false, message: "Amount and clerkId are required" });
    }

    // Get userId from clerkId
    const userId = await getUserIdByClerkId(clerkId);
    if (!userId) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Validate and parse the USD amount
    const usdAmount = parseFloat(amount);

    // Retrieve the cached conversion rate and convert it to an integer
    let conversionRate = getCurrentRate();
    if (!conversionRate) {
      return res
        .status(500)
        .json({ success: false, message: "Conversion rate not available" });
    }
    conversionRate = parseInt(conversionRate, 10);

    // Convert USD amount to INR using the conversion rate
    const amountInINR = usdAmount * conversionRate;
    console.log(`Converted amount from USD to INR: ${amountInINR}`);

    // Convert amount to paisa (Razorpay uses paisa format)
    const orderAmount = Math.round(amountInINR * 100);

    // Create Razorpay Order
    const options = {
      amount: orderAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);

    // Store order in your database using paymentsModel.js
    await createPayment(userId, order.id, amountInINR, "INR");
    console.log("Payments table updated");

    return res.json({
      success: true,
      message: "Order ID created",
      order_id: order.id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
