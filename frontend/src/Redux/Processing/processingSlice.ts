import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { startProcessingAPI } from "../test/process";
import { startProcessingAPI } from "./processingApi";
import { StartProcessingResponse, StartProcessingState } from "./types";

const initialState: StartProcessingState = {
  data: null,
  loading: false,
  error: null,
};

export const startProcessing = createAsyncThunk<
  StartProcessingResponse,
  { sessionId: string; projectPrompt: string; estimatedCredits: number }
>(
  "startProcessing/start",
  async (
    { sessionId, projectPrompt, estimatedCredits },
    { rejectWithValue }
  ) => {
    try {
      return await startProcessingAPI({
        sessionId,
        projectPrompt,
        estimatedCredits,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(error.error || "Processing failed");
    }
  }
);

const startProcessingSlice = createSlice({
  name: "startProcessing",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(startProcessing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        startProcessing.fulfilled,
        (state, action: PayloadAction<StartProcessingResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(startProcessing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default startProcessingSlice.reducer;
