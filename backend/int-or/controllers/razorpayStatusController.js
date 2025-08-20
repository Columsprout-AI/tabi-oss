const crypto = require("crypto");
const {
  markPaymentAsPaid,
  markPaymentAsFailed,
} = require("../models/paymentsModel");
const { addCreditsToUser } = require("../models/usersModel");

const creditConversionFactor = 100; // Hardcoded conversion factor for USD
const usdConversionFactor = 87; // USD-INR Conversion Factor

// Verify Payment (Success Scenario)
exports.verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    // Validate request
    if (!order_id || !payment_id || !signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required payment details" });
    }
    console.log("User payment status to be verified");

    // Generate server-side signature for verification
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature!" });
    }

    // Update payment status in DB
    const updatedPayment = await markPaymentAsPaid(
      order_id,
      payment_id,
      signature
    );
    if (!updatedPayment) {
      return res.status(500).json({
        success: false,
        message: "Failed to update payment status in DB",
      });
    }
    console.log("Payments table updated");
    console.log(updatedPayment);

    const { userId, amount } = updatedPayment; // Extract user_id & amount

    // Calculate credits
    const credits = (amount / usdConversionFactor) * creditConversionFactor;

    // Add credits to the user in `users` table
    const updatedCredits = await addCreditsToUser(userId, credits);
    console.log(
      "user:",
      userId,
      "updated credits:",
      credits,
      "updated in the table:",
      updatedCredits
    );

    return res.json({
      success: true,
      message: "Payment verified successfully!",
      updatedCredits,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Handle Failed Payments
exports.failPayment = async (req, res) => {
  try {
    const { order_id } = req.body;

    // Validate request
    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }
    console.log("Failed payment to be updated");

    // Update payment status in DB
    const updatedPayment = await markPaymentAsFailed(order_id);
    if (!updatedPayment) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to mark payment as failed" });
    }
    console.log("Failed payment recorded");

    return res.json({ success: true, message: "Payment marked as failed." });
  } catch (error) {
    console.error("Error marking payment as failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
