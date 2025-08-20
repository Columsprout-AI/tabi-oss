const axios = require("axios");
const { insertFileRecord } = require("../models/filesModel");
const { logUserActivity } = require("../models/userActivityModel");
const { logSystemEvent } = require("../models/systemEventsModel");
const {
  getUserIdBySessionId,
  insertOrUpdateSessionFile,
} = require("../models/sessionsModel");

exports.handleFileUpload = async (req, res) => {
  const { inputFilePath, sessionId } = req.body;

  // Validate input
  if (!inputFilePath || !sessionId) {
    return res
      .status(400)
      .json({ error: "Input file path and session ID are required" });
  }
  console.log("File uploaded");

  try {
    // Step 1: Fetch the userId from the sessions table using sessionId
    const userId = await getUserIdBySessionId(sessionId);
    if (!userId) {
      return res.status(404).json({ error: "Invalid session ID" });
    }

    // Step 2: Insert file record and get the generated file ID
    const fileId = await insertFileRecord(userId, inputFilePath);
    console.log("File ID generated");

    // Step 3: Insert or update the sessions table
    await insertOrUpdateSessionFile(sessionId, userId, fileId);
    console.log("Sessions table updated");

    // Step 4: Log user activity
    await logUserActivity(userId, "New file uploaded", fileId);
    console.log("User activity recorded");

    // Step 5: Interact with the ingestion service to extract headers
    const headerValues = await extractHeadersFromIngestionService(
      userId,
      inputFilePath,
      fileId
    );

    // Step 6: Respond to the frontend with success message and data
    return res.status(200).json({
      message: "File uploaded successfully",
      fileId,
      headerValues,
    });
  } catch (error) {
    console.error("Error handling file upload:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Helper function to interact with the ingestion service
const extractHeadersFromIngestionService = async (
  userId,
  inputFilePath,
  fileId
) => {
  try {
    // Send the file path to the ingestion service
    const response = await axios.post(
      "http://localhost:5001/api/ing/extract-headers", // Replace with your ingestion service URL
      { inputFilePath, fileId }
    );

    // Extract headers from the response
    const headerValues = response.data.headerValues;
    console.log(`Ingestion service returned headers:`, headerValues);

    // Log the event in the system_events table
    await logSystemEvent(userId, "Headers generated", "ingestion", fileId);

    return headerValues;
  } catch (error) {
    console.error("Error in ingestion service interaction:", error.message);
    if (error.response) {
      console.error("Ingestion service error response:", error.response.data);
    }
    throw new Error("Failed to process file with ingestion service");
  }
};
