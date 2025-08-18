import axios from "axios";
import BASE_URL from "../../../utils/baseUrl";
import { UserData } from "./types";

export const signupUser = async (userData: UserData): Promise<UserData> => {
  try {
    const response = await axios.post(`${BASE_URL}/record-signup`, userData);
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw error.response?.data || "Signup failed";
  }
};
