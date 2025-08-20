const pool = require("../utils/db");

// ✅ Insert a new payment
const createPayment = async (user_id, order_id, amount, currency = "INR") => {
  const query = `
        INSERT INTO payments (userid, order_id, amount, currency, status, created_at)
        VALUES ($1, $2, $3, $4, 'created', NOW())
        RETURNING *;
    `;
  const values = [user_id, order_id, amount, currency];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting payment:", error);
    throw error;
  }
};

// Update payment status when payment is successful
const markPaymentAsPaid = async (order_id, payment_id, signature) => {
  const query = `
        UPDATE payments
        SET payment_id = $1, signature = $2, status = 'paid'
        WHERE order_id = $3
        RETURNING userid AS "userId", amount;  -- Return user_id and amount along with update
    `;
  const values = [payment_id, signature, order_id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Returns user_id and amount
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

// Mark payment as failed (if user cancels or payment is declined)
const markPaymentAsFailed = async (order_id) => {
  const query = `
        UPDATE payments
        SET status = 'failed'
        WHERE order_id = $1
        RETURNING *;
    `;
  const values = [order_id];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating payment to failed:", error);
    throw error;
  }
};

// Export individual functions
module.exports = {
  createPayment,
  markPaymentAsPaid,
  markPaymentAsFailed,
};
