import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { verifyPayment } from "./verifyApi";

export const fetchVerifyPayment = createAsyncThunk(
  "verifyPayment/fetch",
  async ({ order_id, payment_id, signature }) => {
    return await verifyPayment(order_id, payment_id, signature);
  }
);

const verifyPaymentSlice = createSlice({
  name: "verifyPayment",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVerifyPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVerifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchVerifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default verifyPaymentSlice.reducer;
