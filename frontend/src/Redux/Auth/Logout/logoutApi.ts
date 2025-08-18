// logoutApi.ts
import axios from "axios";
import BASE_URL from "@/utils/baseUrl";
import { LogoutResponse } from "./types";

export const recordLogout = async (sessionId: string): Promise<string> => {
  try {
    const response = await axios.post<LogoutResponse>(
      `${BASE_URL}/record-logout`,
      {
        sessionId,
      }
    );
  return response.data.message; // e.g., "Logout successful!"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }catch (error: any) {
    console.error("Error logging out record:", error);
    throw error.response?.data || "Logout failed";
  }
};