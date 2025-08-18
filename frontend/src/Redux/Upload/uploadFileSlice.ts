/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Define the payload type for the upload action
interface UploadState {
  sessionId: string;
  filePath: string | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: UploadState = {
  sessionId: "",
  filePath: null,
  isLoading: false,
  error: null,
};

// ✅ Async thunk for handling the file upload action
export const uploadFileAction = createAsyncThunk(
  "upload/uploadFile",
  async (
    { sessionId }: { sessionId: string },
    { rejectWithValue }
  ) => {
    try {
      return { sessionId };
    } catch (error: any) {
      return rejectWithValue(error.message || "File upload failed.");
    }
  }
);

// ✅ Upload Slice
const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(uploadFileAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        uploadFileAction.fulfilled,
        (
          state,
          action: PayloadAction<{ sessionId: string}>
        ) => {
          state.isLoading = false;
          state.sessionId = action.payload.sessionId;
          state.error = null;
        }
      )
      .addCase(uploadFileAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default uploadSlice.reducer;
