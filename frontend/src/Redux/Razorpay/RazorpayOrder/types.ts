export interface RazorpayOrderResponse {
  success: boolean;
  message: string;
  order_id: string;
}

export interface RazorpayOrderState {
  data: RazorpayOrderResponse | null;
  loading: boolean;
  error: string | null;
}

export interface CreateRazorpayOrderPayload {
  amount: number;
  userId: string;
}
