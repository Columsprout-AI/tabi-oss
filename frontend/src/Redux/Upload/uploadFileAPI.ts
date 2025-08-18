/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import axiosToken from "../../utils/axiosInstance";
import BASE_URL from "../../utils/baseUrl";
import { UploadPayload, UploadResponse } from "./types";

// Function to request signed URL
const getSignedUrl = async (data: UploadPayload) => {
  try {
    const response = await axiosToken.post(`${BASE_URL}/upload-to-GCP`, data);
    return response.data; // Expected: { uploadUrl, fileId }
  } catch (error: any) {
    console.error("Error requesting signed URL:", error.message);
    throw error.response?.data || "Failed to get signed URL";
  }
};

// Function to upload the file directly to Google Cloud Storage

const uploadToGCP = async (uploadUrl: string, file: File) => {
  try {
    const response = await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!response || response.status !== 200)
      throw new Error("Upload to GCP failed");

    return true;
  } catch (error: any) {
    console.error("Error uploading file to GCP:", error.message);
    throw "Upload failed";
  }
};

// Main function for uploading file
export const uploadFile = async (
  data: UploadPayload,
  file: File
): Promise<UploadResponse> => {
  try {
    // ✅ Step 1: Get Signed URL
    const { uploadUrl } = await getSignedUrl(data);

    if (!uploadUrl) throw new Error("Failed to obtain signed URL");

    // ✅ Step 2: Upload to GCP with the actual file
    const success = await uploadToGCP(uploadUrl, file);

    if (!success) throw new Error("Upload to GCP failed");

    // ✅ Step 3: Return response with fileId
    return { uploadUrl };
  } catch (error: any) {
    console.error("Upload error:", error);
    throw error;
  }
};
