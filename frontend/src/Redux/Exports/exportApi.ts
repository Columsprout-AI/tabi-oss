import axios from "axios";
import BASE_URL from "../../utils/baseUrl";
import { RecordExportResponse } from "./types";
export const recordExport = async (
  sessionId: string
): Promise<RecordExportResponse> => {
  try {
    const response = await axios.post<RecordExportResponse>(
      `${BASE_URL}/record-export`,
      { sessionId }
    );
    return response.data;
  } catch (error) {
    console.error("Error exporting record:", error);
    throw error;
  }
};
