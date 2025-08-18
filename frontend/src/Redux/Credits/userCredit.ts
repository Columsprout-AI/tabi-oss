import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CreditsState {
  value: number;
}

const initialState: CreditsState = { value: 0 };

const creditsSlice = createSlice({
  name: "credits",
  initialState,
  reducers: {
    setCredits: (state, action: PayloadAction<number>) => {
      console.log("action.payload", action.payload);
      state.value = action.payload;
    },
    decrementCredits: (state, action: PayloadAction<number>) => {
      state.value -= action.payload;
    },
    incrementCredits: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { setCredits, decrementCredits, incrementCredits } =
  creditsSlice.actions;
export default creditsSlice.reducer;
