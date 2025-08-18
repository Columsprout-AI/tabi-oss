export interface StartProcessingResponse {
  message?: string;
  error?: string;
}

export interface StartProcessingState {
  data: StartProcessingResponse | null;
  loading: boolean;
  error: string | null;
}
