import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { startExperiment } from "./experimentApi";
import {
  ExperimentResponse,
  ExperimentState,
  ExperimentPayload,
} from "./types";
import { setCredits } from "../Credits/userCredit";
const initialState: ExperimentState = {
  responseData: null,
  loading: false,
  error: null,
};
export const startExperimentAction = createAsyncThunk<
  ExperimentResponse,
  ExperimentPayload
>("experiment/start", async ({ sessionId, expPrompt }, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI;
  try {
    const response = await startExperiment({ sessionId, expPrompt });
    dispatch(setCredits(response.userCredits));
    
    // Wait an extra 2 seconds before returning to prevent race conditions
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    //check for errors
    if (!response || typeof response !== "object" || !response.message) {
      throw new Error("Invalid response format from API");
    }

    console.log(response);
    return response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to start experiment"
    );
  }
});

const experimentSlice = createSlice({
  name: "experiment",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(startExperimentAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        startExperimentAction.fulfilled,
        (state, action: PayloadAction<ExperimentResponse>) => {
          state.loading = false;
          state.responseData = action.payload;
        }
      )
      .addCase(startExperimentAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
export default experimentSlice.reducer;
