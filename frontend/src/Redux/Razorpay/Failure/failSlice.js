import { createAsyncThunk } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { failPayment } from "./failAPi";

export const fetchFailPayment = createAsyncThunk(
  "failPayment/fetch",
  async ({ order_id }) => {
    return await failPayment(order_id);
  }
);

const failPaymentSlice = createSlice({
  name: "failPayment",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFailPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFailPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchFailPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default failPaymentSlice.reducer;
