import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { signupUser } from "./signupApi";
import { SignupState, UserData } from "./types";

const initialState: SignupState = {
  user: null,
  status: "idle",
  error: null,
};

export const signup = createAsyncThunk<UserData, UserData>(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      return await signupUser(userData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Signup failed");
    }
  }
);

// Create the signup slice
const signupSlice = createSlice({
  name: "signup",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.status = "loading";
      })
      .addCase(signup.fulfilled, (state, action: PayloadAction<UserData>) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default signupSlice.reducer;
