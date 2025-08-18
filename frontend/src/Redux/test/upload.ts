export const mockUploadFile = async ({
  sessionId,
  file,
}: {
  sessionId: string;
  file: File;
}): Promise<{
  message: string;
  fileId: string;
  uploadUrl: string;
  inputFilePath: string;
}> => {
  console.log("📢 Mock Upload API Triggered:", {
    sessionId,
    // fileName: file.name,
  });

  return new Promise(
    (resolve) =>
      setTimeout(() => {
        console.log("✅ Mock Upload API Response: File uploaded successfully!");

        const fileId = `mock-${Math.random().toString(36).substring(7)}`;
        const uploadUrl = `https://mock-storage.local/upload/${fileId}`;
        const inputFilePath = `mock-uploads/${sessionId}/${fileId}-${file.name}`;

        resolve({
          message: "File uploaded successfully.",
          fileId,
          uploadUrl,
          inputFilePath,
        });
      }, 1500) // Simulate API delay (1.5 seconds)
  );
};
