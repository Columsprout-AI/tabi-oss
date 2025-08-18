const { Storage } = require("@google-cloud/storage");
const {
  getUserIdBySessionId,
  insertOrUpdateSessionFile,
} = require("../models/sessionsModel");
const {
  insertFileRecord,
  updateFileRecordPath,
} = require("../models/filesModel");
const { logUserActivity } = require("../models/userActivityModel");

const storage = new Storage({
  projectId: "tabi-app-450518",
  // Do not include keyFilename; ADC will be used.
});
const bucketName = "tabi-files";

const uploadFileToGCP = async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log("File uploaded");

    // Step 1: Fetch userId from sessionId
    const userId = await getUserIdBySessionId(sessionId);
    if (!userId) {
      return res.status(404).json({ error: "Invalid session ID" });
    }

    // Step 2: Insert file record with placeholder text ("to be inserted")
    const fileId = await insertFileRecord(userId);
    console.log("File ID generated");

    // Step 3: Generate the actual file path using the unique fileId
    // 'objectName' is the relative path used in GCP operations.
    const objectName = `uploads/${userId}.${fileId}`;
    // 'fullFilePath' includes the bucket reference.
    const inputFilePath = `gs://${bucketName}/${objectName}`;

    // Step 4: Update the file record with the actual file path
    await updateFileRecordPath(fileId, inputFilePath);
    console.log("Input file path generated");

    // Step 5: Generate a signed URL for GCP with the fileId as the filename
    const options = {
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      // contentType: "application/octet-stream", // Removed to allow uploading any file -- this will be controlled on the frontend
    };

    const [url] = await storage
      .bucket(bucketName)
      .file(objectName)
      .getSignedUrl(options);

    // Step 6: Update the session record and log user activity
    await insertOrUpdateSessionFile(sessionId, userId, fileId);
    console.log("Sessions table updated");
    await logUserActivity(userId, "New file uploaded", fileId);
    console.log("User activity recorded");

    console.log("URL: ", url);
    console.log("path: ", inputFilePath);

    // Step 7: Send response
    res.status(200).json({ uploadUrl: url /* inputFilePath, fileId */ });
  } catch (error) {
    console.error("Error in uploadFileToGCP:", error);
    // res.status(500).json({
    // uploadUrl,
    // inputFilePath,
    // fileId,
    //});
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { uploadFileToGCP };
