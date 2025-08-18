export interface RecordUserRemarkResponse {
  message: string;
  userRemarkValue: number;
}

// Define function parameters
export interface RecordUserRemarkParams {
  sessionId: string;
  userRemark: "like" | "dislike";
}

export interface RecordUserRemarkState {
  data: RecordUserRemarkResponse | null;
  loading: boolean;
  error: string | null;
}
