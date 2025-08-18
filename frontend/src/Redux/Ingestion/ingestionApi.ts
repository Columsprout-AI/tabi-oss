import axiosToken from "../../utils/axiosInstance";
import BASE_URL from "../../utils/baseUrl";
import { IngestionPayload, IngestionResponse } from "./types";

export const startIngestion = async ({
  sessionId,
  inputColumn,
}: IngestionPayload): Promise<IngestionResponse> => {
  try {
    const response = await axiosToken.post<IngestionResponse>(
      `${BASE_URL}/start-ingestion`,
      {
        sessionId,
        inputColumn,
      }
    );

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error starting ingestion:", error.message);
    throw error.response?.data || { message: "Ingestion failed" };
  }
};
