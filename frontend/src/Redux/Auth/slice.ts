/* eslint-disable @typescript-eslint/no-explicit-any */
import BASE_URL from "@/utils/baseUrl";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { recordLogout } from "@/Redux/Auth//Logout/logoutApi";
import toast from "react-hot-toast";
// import { AppDispatch, RootState } from "../store";
import { setCredits } from "../Credits/userCredit";
// import { useDispatch } from "react-redux";

// Define types
interface User {
  clerkId: string;
  email: string;
  credits?: number;
}

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error?: string | null;
  isSignedUp: boolean;
  isSigningUp: boolean;
  credits?: number; // <-- Add this to store credits
}

interface AuthResponse {
  message: string;
  userId?: string;
  userCredits?: number;
}

interface SignupPayload {
  clerkId: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  sessionId: string;
}

interface LoginPayload {
  clerkId: string;
  sessionId: string;
}

interface LogoutPayload {
  sessionId: string;
}

// Async thunk for signup
export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData: SignupPayload, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;

    try {
      const response = await axios.post<AuthResponse>(
        `${BASE_URL}/record-signup`,
        userData
      );
      toast.success("Signup successful!");
      console.log("Signup Data:", response.data);
      dispatch(setCredits(response.data.userCredits ?? 0));
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Signup failed");
      // router.push("/sign-in");
      return rejectWithValue(error.response?.data || "Signup failed");
    }
  }
);

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (loginData: LoginPayload, thunkAPI) => {
    // const dispatch = useDispatch<AppDispatch>();
    const { dispatch, rejectWithValue } = thunkAPI;
    try {
      const response = await axios.post<AuthResponse>(
        `${BASE_URL}/record-login`,
        loginData
      );
      toast.success("Login successful!");
      dispatch(setCredits(response.data.userCredits ?? 0));
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
      // router.push("/sign-in");
      return rejectWithValue(error.response?.data || "Login failed");
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async ({sessionId}: LogoutPayload, { rejectWithValue }) => {
    // If there's no sessionId, skip calling the server to avoid 400 errors
    if (!sessionId) {
      return; // Do nothing
    }
    try {
      const message = await recordLogout(sessionId);
      toast.success(message || "Logout successful!");
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Logout failed";
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

// Initial state
const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  isSignedUp: false,
  isSigningUp: false,
  credits: undefined,
};

// Create a single auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.status = "idle";
      state.error = null;
      state.isSignedUp = false;
      state.isSigningUp = false;
    },
    resetSignupFlag: (state) => {
      state.isSignedUp = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup flow
      .addCase(signupUser.pending, (state) => {
        state.status = "loading";
        state.isSigningUp = true;
      })
      .addCase(
        signupUser.fulfilled,
        (state, action: PayloadAction<AuthResponse>) => {
          state.status = "authenticated";
          state.isSignedUp = true;
          state.isSigningUp = false;

          state.user = {
            clerkId: action.payload.userId || "",
            email: "",
            credits: action.payload.userCredits || 0,
          };
          state.credits = action.payload.userCredits || 0;

          // Reset signup flag after 5 seconds
          setTimeout(() => {
            state.isSignedUp = false;
          }, 5000);
        }
      )
      .addCase(signupUser.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
        state.isSigningUp = false;
      })

      // Login flow
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<AuthResponse>) => {
          state.user = {
            clerkId: action.payload.userId || "",
            email: "",
            credits: action.payload.userCredits || 0,
          };
          state.credits = action.payload.userCredits || 0;
          state.status = "authenticated";
        }
      )
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
      })

      // Logout flow
      .addCase(logoutUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = "idle";
        state.isSignedUp = false;
        state.isSigningUp = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload as string;
      });
  },
});

export const { clearUser, resetSignupFlag } = authSlice.actions;
// export const selectUserCredits = (state: RootState) => state.auth.credits;
export default authSlice.reducer;
