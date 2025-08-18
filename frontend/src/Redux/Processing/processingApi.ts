import axiosToken from "../../utils/axiosInstance";
import BASE_URL from "../../utils/baseUrl";
import { StartProcessingResponse } from "./types";

export const startProcessingAPI = async ({
  sessionId,
  projectPrompt,
  estimatedCredits,
}: {
  sessionId: string;
  projectPrompt: string;
  estimatedCredits: number;
}): Promise<StartProcessingResponse> => {
  try {
    const response = await axiosToken.post(`${BASE_URL}/start-processing`, {
      sessionId,
      projectPrompt,
      estimatedCredits,
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error starting processing:", error.message);
    throw error.response?.data || { error: "Processing failed" };
  }
};
