import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { estimateCreditsAPI } from "./creditApi";
// import { estimateCreditsAPI } from "../test/credit";
import { EstimateCreditsResponse, EstimateCreditsState } from "./types";

const initialState: EstimateCreditsState = {
  data: null,
  loading: false,
  error: null,
};

export const estimateCredits = createAsyncThunk<
  EstimateCreditsResponse,
  { sessionId: string; projectPrompt: string }
>(
  "estimateCredits/get",
  async ({ sessionId, projectPrompt }, { rejectWithValue }) => {
    try {
      return await estimateCreditsAPI({ sessionId, projectPrompt });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to estimate credits"
      );
    }
  }
);

const estimateCreditsSlice = createSlice({
  name: "estimateCredits",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(estimateCredits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        estimateCredits.fulfilled,
        (state, action: PayloadAction<EstimateCreditsResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(estimateCredits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default estimateCreditsSlice.reducer;
