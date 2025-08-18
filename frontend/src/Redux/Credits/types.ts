export interface EstimateCreditsResponse {
  creditEstimate: number;
  message: string;
}

export interface EstimateCreditsState {
  data: EstimateCreditsResponse | null;
  loading: boolean;
  error: string | null;
}
