import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import BASE_URL from "../../utils/baseUrl";
import { setCredits } from "../Credits/userCredit";

// Request payload for creating an order
interface CreateOrderPayload {
  amount: number;
  clerkId: string;
}

// Response from `create-order` API
interface OrderResponse {
  order_id: string;
  success: boolean;
  message: string;
}

// Request payload for verifying a payment
interface VerifyPaymentPayload {
  order_id: string;
  payment_id: string;
  signature: string;
}

// Response from `verify-payment` API
interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  updatedCredits: number;
}

// Request payload for failed payment
interface FailPaymentPayload {
  order_id: string;
}

// Response from `fail-payment` API
interface FailPaymentResponse {
  success: boolean;
  message: string;
}

// Define types
interface RazorpayState {
  orderId: string | null;
  paymentStatus: "idle" | "loading" | "success" | "failed";
  credits: number;
  error: string | null;
}

// Initial state
const initialState: RazorpayState = {
  orderId: null,
  paymentStatus: "idle",
  credits: 0,
  error: null,
};

export const createOrder = createAsyncThunk<
  OrderResponse,
  CreateOrderPayload,
  { rejectValue: string } // ✅ Add proper reject type
>("razorpay/createOrder", async ({ amount, clerkId }, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${BASE_URL}/razorpay/create-order`, {
      amount,
      clerkId,
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to create order"
    );
  }
});

export const verifyPayment = createAsyncThunk<
  VerifyPaymentResponse,
  VerifyPaymentPayload,
  { rejectValue: string }
>(
  "razorpay/verifyPayment",
  async ({ order_id, payment_id, signature }, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    try {
      const response = await axios.post(`${BASE_URL}/razorpay/verify-payment`, {
        order_id,
        payment_id,
        signature,
      });
      dispatch(setCredits(response.data.updatedCredits ?? 0));
      return response.data;
    } catch (error) {
      return rejectWithValue(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Payment verification failed"
      );
    }
  }
);

export const failPayment = createAsyncThunk<
  FailPaymentResponse,
  FailPaymentPayload,
  { rejectValue: string }
>("razorpay/failPayment", async ({ order_id }, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${BASE_URL}/razorpay/fail-payment`, {
      order_id,
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to report failed payment"
    );
  }
});

const razorpaySlice = createSlice({
  name: "razorpay",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.paymentStatus = "loading";
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.paymentStatus = "idle";
        state.orderId = action.payload.order_id;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.paymentStatus = "failed";
        state.error = action.payload || "An unknown error occurred"; // ✅ Handle properly
      })
      .addCase(verifyPayment.pending, (state) => {
        state.paymentStatus = "loading";
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.paymentStatus = "success";
        state.credits = action.payload.updatedCredits;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.paymentStatus = "failed";
        state.error = action.payload || "An unknown error occurred"; // ✅ Handle properly
      })
      .addCase(failPayment.rejected, (state, action) => {
        state.paymentStatus = "failed";
        state.error = action.payload || "An unknown error occurred"; // ✅ Handle properly
      });
  },
});
export type RazorpaySliceState = typeof initialState;

export default razorpaySlice.reducer;
