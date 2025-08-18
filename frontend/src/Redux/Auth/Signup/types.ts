export interface UserData {
  clerkId: string;
  email: string;
  // firstName: string;
  // lastName: string;
  createdAt: string;
  lastLogin: string;
  sessionId: string;
}

export interface SignupState {
  user: UserData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
