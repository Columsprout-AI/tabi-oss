import axiosToken from "../../utils/axiosInstance";
import BASE_URL from "../../utils/baseUrl";
import { EstimateCreditsResponse } from "./types";

export const estimateCreditsAPI = async ({
  sessionId,
  projectPrompt,
}: {
  sessionId: string;
  projectPrompt: string;
}): Promise<EstimateCreditsResponse> => {
  try {
    const response = await axiosToken.post<EstimateCreditsResponse>(
      `${BASE_URL}/estimate-credits`,
      { sessionId, projectPrompt }
    );
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error estimating credits:", error.message);
    throw error;
  }
};
