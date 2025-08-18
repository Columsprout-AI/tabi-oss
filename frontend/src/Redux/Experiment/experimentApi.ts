import axiosToken from "../../utils/axiosInstance";
import BASE_URL from "../../utils/baseUrl";
import { ExperimentPayload, ExperimentResponse } from "./types";
export const startExperiment = async ({
  sessionId,
  expPrompt,
}: ExperimentPayload): Promise<ExperimentResponse> => {
  try {
    const response = await axiosToken.post<ExperimentResponse>(
      `${BASE_URL}/start-experiment`,
      { sessionId, expPrompt }
    );
    console.log("Response Data:", response.data);
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error starting experiment:", error.message);
    throw error.response?.data || { message: "Experiment failed" };
  }
};
