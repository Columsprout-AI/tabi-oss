import axios from "axios";
import BASE_URL from "../../../utils/baseUrl";

export const failPayment = async (order_id) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/intor/razorpay/fail-payment`,
      { order_id }
    );
    return response.data;
  } catch (error) {
    console.error("Error failing payment:", error);
    throw error;
  }
};
