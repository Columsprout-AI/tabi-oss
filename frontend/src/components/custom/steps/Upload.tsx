/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/Redux/store";
import { uploadFileAction } from "@/Redux/Upload/uploadFileSlice";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "react-hot-toast";
import BASE_URL from "../../../utils/baseUrl";
import { convertXlsxToCsv } from "@/hooks/xlsx2csv";

interface UploadProps {
  onUpload: (headers: string[]) => void;
  sessionId: string;
}

const Upload = ({ onUpload, sessionId }: UploadProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
    if (fileType !== "csv" && fileType !== "xlsx") {
      toast.error("Only CSV or XLSX files are allowed!");
      return;
    }

    // ✅ File size validation (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds the 5MB limit. Please upload a smaller file.");
      return;
    }
  
    if (selectedFile.size === 0) {
      toast.error("The uploaded file is empty. Please select a valid file.");
      return;
    }

    try {
      let processedFile: File = selectedFile;

      if (fileType === "xlsx") {
        processedFile = await convertXlsxToCsv(selectedFile); // ✅ Ensure it returns a valid File
      }

      setFile(processedFile);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process the file. Please try again.");
    }
  };

  const extractHeaders = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
      onUpload(headers);
    };

    reader.readAsText(file);
  };

  const uploadFileHandler = async () => {
    if (!file) return;
    setIsUploading(true);
    toast.loading("Requesting signed URL...");

    try {
      // ✅ Step 1: Request signed URL
      const response = await fetch(`${BASE_URL}/upload-to-GCP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error("Failed to obtain upload URL");

      const { uploadUrl } = await response.json();
      toast.dismiss();
      toast.loading("Uploading file to GCP...");

      // ✅ Step 2: Upload file to GCP
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("File upload failed.");

      toast.dismiss();
      toast.success("✅ Upload successful!");

      // ✅ Step 3: Extract headers from the file
      extractHeaders();

      // ✅ Step 4: Dispatch action to update Redux store
      dispatch(
        uploadFileAction({
          sessionId,
          // filePath: `gcp/${file.name}`,
        })
      )
        .unwrap()
        .then((response) => {
          console.log("Upload Successful:", response);
        })
        .catch((error) => {
          console.error("Upload Failed:", error);
        });

      setFile(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.dismiss();
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-6">
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-96 h-64 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition"
      >
        <div className="w-full flex justify-center items-center mb-2">
          <Image
            src="/upload.png"
            width={400}
            height={400}
            alt="Upload Illustration"
            className="w-24 h-24"
          />
        </div>
        <p className="text-gray-700 font-medium">
          Click or Drag & Drop to Upload
        </p>
        <p className="text-sm text-gray-500">
          Only CSV or XLSX files are allowed
        </p>
      </label>

      <input
        type="file"
        id="file-upload" 
        accept=".csv,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      {file && (
        <p className="mt-2 text-sm text-green-600 font-medium">
          Selected: {file.name}
        </p>
      )}

      <Button
        className="bg-[#423EC7] text-white mt-4 px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        onClick={uploadFileHandler}
        disabled={!file || isUploading}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
};

export default Upload;
