import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginState, User } from "./types";

// Initial state
const initialState: LoginState = {
  user: null,
  status: "idle",
};

// Create the login slice
const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.status = "authenticated";
    },
    clearUser: (state) => {
      state.user = null;
      state.status = "idle";
    },
  },
});

// Export actions
export const selectUserCredits = (state: { login: LoginState }) =>
  state.login.user?.credits ?? 0;
export const { setUser, clearUser } = loginSlice.actions;

// Export reducer
export default loginSlice.reducer;
