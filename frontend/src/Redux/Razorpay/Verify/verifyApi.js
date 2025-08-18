import axios from "axios";
import BASE_URL from "../../../utils/baseUrl";

export const verifyPayment = async (order_id, payment_id, signature) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/intor/razorpay/verify-payment`,
      {
        order_id,
        payment_id,
        signature,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};
