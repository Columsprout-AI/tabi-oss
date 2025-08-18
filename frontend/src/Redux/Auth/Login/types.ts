export interface LoginResponse {
  userCredits: number;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  clerkId: string;
  email: string;
  credits?: number;
}

export interface LoginState {
  user: User | null;
  status: "idle" | "authenticated";
}
