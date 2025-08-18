import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { recordUserRemarkAPI } from "./remarkApi";
// import { recordUserRemarkAPI } from "@/Redux/test/remark";
import { RecordUserRemarkResponse, RecordUserRemarkState } from "./types";

const initialState: RecordUserRemarkState = {
  data: null,
  loading: false,
  error: null,
};

export const recordUserRemark = createAsyncThunk<
  RecordUserRemarkResponse,
  { sessionId: string; userRemark: "like" | "dislike" }
>(
  "userRemark/record",
  async ({ sessionId, userRemark }, { rejectWithValue }) => {
    try {
      return await recordUserRemarkAPI({ sessionId, userRemark });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to record remark");
    }
  }
);

const recordUserRemarkSlice = createSlice({
  name: "recordUserRemark",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(recordUserRemark.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        recordUserRemark.fulfilled,
        (state, action: PayloadAction<RecordUserRemarkResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(recordUserRemark.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default recordUserRemarkSlice.reducer;
