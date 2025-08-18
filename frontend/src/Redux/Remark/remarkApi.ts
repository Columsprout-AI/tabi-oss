/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosToken from "../../utils/axiosInstance";
import BASE_URL from "../../utils/baseUrl";
import { RecordUserRemarkParams, RecordUserRemarkResponse } from "./types";

export const recordUserRemarkAPI = async ({
  sessionId,
  userRemark,
}: RecordUserRemarkParams): Promise<RecordUserRemarkResponse> => {
  try {
    const response = await axiosToken.post<RecordUserRemarkResponse>(
      `${BASE_URL}/record-user-remark`,
      { sessionId, userRemark }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error recording user remark:", error.message);
    throw error;
  }
};
