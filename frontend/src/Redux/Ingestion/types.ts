export interface IngestionResponse {
  message: string;
}

export interface IngestionPayload {
  sessionId: string;
  inputColumn: string;
}

export interface IngestionState {
  loading: boolean;
  error: string | null;
}
