// import axiosToken from "../../../utils/axiosInstance";
// import BASE_URL from "../../../utils/baseUrl";
// import { RazorpayOrderResponse } from "./types";

// export const createRazorpayOrderAPI = async (
//   amount: number,
//   userId: string
// ): Promise<RazorpayOrderResponse> => {
//   try {
//     const response = (await axiosToken.post)<RazorpayOrderResponse>(
//       `${BASE_URL}/razorpay/create-order`,
//       {
//         amount,
//         userId,
//       }
//     );
//     return response;
//   } catch (error) {
//     console.error("Error creating Razorpay order:", error);
//     throw error;
//   }
// };
