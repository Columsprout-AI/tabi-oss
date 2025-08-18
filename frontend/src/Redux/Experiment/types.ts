export interface ExperimentResponse {
  message: string;
  parsedResponse: {
    outputData: string[];
  };
  inputData: string[];
  expCredits: number;
  userCredits: number;
}

export interface ExperimentPayload {
  sessionId: string;
  expPrompt: string;
}

export interface ExperimentState {
  responseData: ExperimentResponse | null;
  loading: boolean;
  error: string | null;
}
