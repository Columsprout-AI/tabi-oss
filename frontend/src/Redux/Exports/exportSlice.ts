import { createAsyncThunk } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { recordExport } from "./exportApi";
import { RecordExportState } from "./types";

export const fetchRecordExport = createAsyncThunk(
  "recordExport/fetch",
  async ({ sessionId }: { sessionId: string }) => {
    return await recordExport(sessionId);
  }
);
const initialState: RecordExportState = {
  data: null,
  loading: false,
  error: null,
};
const recordExportSlice = createSlice({
  name: "recordExport",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecordExport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecordExport.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRecordExport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export record";
      });
  },
});

export default recordExportSlice.reducer;
