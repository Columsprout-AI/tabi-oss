// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { createRazorpayOrderAPI } from "./orderByRazorpayApi";
// import { AxiosError } from "axios";

// // Define response type

// export const createRazorpayOrder = createAsyncThunk<
//   RazorpayOrderResponse, // Response type
//   CreateRazorpayOrderPayload, // Payload type
//   { rejectValue: string } // Reject value type
// >("razorpayOrder/create", async ({ amount, userId }, { rejectWithValue }) => {
//   try {
//     return await createRazorpayOrderAPI(amount, userId);
//   } catch (error) {
//     const axiosError = error as AxiosError<{ message: string }>;
//     return rejectWithValue(
//       axiosError.response?.data?.message || "An error occurred"
//     );
//   }
// });

// // Initial state
// const initialState: RazorpayOrderState = {
//   data: null,
//   loading: false,
//   error: null,
// };

// // Create slice
// const createRazorpayOrderSlice = createSlice({
//   name: "createRazorpayOrder",
//   initialState,
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(createRazorpayOrder.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(
//         createRazorpayOrder.fulfilled,
//         (state, action: PayloadAction<RazorpayOrderResponse>) => {
//           state.loading = false;
//           state.data = action.payload;
//         }
//       )
//       .addCase(
//         createRazorpayOrder.rejected,
//         (state, action: PayloadAction<string | undefined>) => {
//           state.loading = false;
//           state.error = action.payload || "Unknown error";
//         }
//       );
//   },
// });

// export default createRazorpayOrderSlice.reducer;
