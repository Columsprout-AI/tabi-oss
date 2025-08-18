import axios from "axios";
import BASE_URL from "../../../utils/baseUrl";
import { LoginCredentials, LoginResponse } from "./types";

// Function to call the login API
export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${BASE_URL}/record-login`,
      credentials
    );
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error during login:", error);
    throw error.response?.data || "Login failed";
  }
};
