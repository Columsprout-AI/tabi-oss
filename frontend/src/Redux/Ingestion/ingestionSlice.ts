/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { startIngestion } from "./ingestionApi";
import { IngestionState } from "./types";

const initialState: IngestionState = {
  loading: false,
  error: null,
};

export const initiateIngestion = createAsyncThunk<
  string,
  { sessionId: string; inputColumn: string }
>(
  "ingestion/start",
  async ({ sessionId, inputColumn }, { rejectWithValue }) => {
    try {
      const response = await startIngestion({ sessionId, inputColumn });
      return response.message;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
const ingestionSlice = createSlice({
  name: "ingestion",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initiateIngestion.pending, (state) => {
        console.log("Ingestion request started...");
        state.loading = true;
        state.error = null;
      })
      .addCase(initiateIngestion.fulfilled, (state) => {
        console.log("Ingestion request successful!");
        state.loading = false;
      })
      .addCase(initiateIngestion.rejected, (state, action) => {
        console.log("Ingestion request failed!", action.payload);
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default ingestionSlice.reducer;
