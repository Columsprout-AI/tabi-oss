export interface LogoutResponse {
  message: string;
}


export interface LogoutState {
  data: string | null;
  loading: boolean;
  error: string | null;
}