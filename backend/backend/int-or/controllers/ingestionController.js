if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const axios = require("axios");
const { logUserActivity } = require("../models/userActivityModel");
const { updateInputIndex, updateInputColumn } = require("../models/filesModel");
const { logSystemEvent } = require("../models/systemEventsModel");
const {
  getLatestSessionData,
  getUserIdByFileId,
} = require("../models/sessionsModel");

// In-memory storage for the frontend webhook URL
const FRONTEND_WEBHOOK_URL = process.env.FRONTEND_WEBHOOK_URL;
const INGESTION_URL = process.env.INGESTION_URL;
// Define GCP configuration values (these can be stored in config/environment variables)
const GCP_PROJECT_ID = "tabi-app-450518";
const BUCKET_NAME = "tabi-files";

exports.handleIngestion = async (req, res) => {
  const { sessionId, inputColumn } = req.body;

  // Validate input
  if (!sessionId || !inputColumn) {
    return res
      .status(400)
      .json({ error: "sessionId and inputColumn are required" });
  }
  console.log("Ingestion initiation request received");

  try {
    // Step 1: Send immediate response to frontend
    res.status(200).json({ message: "Ingestion started successfully" });

    // Step 2: Fetch the latest userId and fileId from the sessions table
    const sessionData = await getLatestSessionData(sessionId);

    if (!sessionData) {
      throw new Error(`No active session found for sessionId: ${sessionId}`);
    }

    const { userId, fileId } = sessionData;
    console.log(`Fetched UserID: ${userId}, FileID: ${fileId}`);

    // Step 3: Log user activity
    await logUserActivity(userId, "Input column selected", fileId);
    console.log("User activity recorded");

    // Step 4: Update the files table with the input column
    await updateInputColumn(userId, fileId, inputColumn);
    console.log("Input column name updated");

    // Step 5: Log "Ingestion started" in system events
    await logSystemEvent(userId, "Ingestion started", "Ingestion", fileId);
    console.log("System event recorded");

    // Step 6: Send data to ingestion service, including gcpProjectId and bucketName
    const response = await axios.post(
      `${INGESTION_URL}/api/ing/start-ingestion`,
      {
        sessionId,
        userId,
        fileId,
        inputColumn,
        gcpProjectId: GCP_PROJECT_ID,
        bucketName: BUCKET_NAME,
      }
    );

    const { message } = response.data;

    // Handle ingestion status
    if (message !== "started") {
      throw new Error("Unexpected status from ingestion service");
    }

    console.log("Ingestion service reported status as started.");
  } catch (error) {
    console.error("Error during ingestion process:", error.message);
  }
};

// Webhook to handle response from ingestion service
exports.handleIngestionWebhook = async (req, res) => {
  const { sessionId, fileId, inputIndex, ingestionStatus } = req.body;

  // Validate input
  if (
    fileId === undefined ||
    fileId === null ||
    inputIndex === undefined ||
    inputIndex === null ||
    !ingestionStatus
  ) {
    return res.status(400).json({ error: "Invalid webhook payload" });
  }
  console.log("Ingestion completion notification received");
  console.log("Webhook Payload Received:", {
    sessionId,
    fileId,
    inputIndex,
    ingestionStatus,
  });

  try {
    if (ingestionStatus === "Ingestion completed") {
      // Step 1: Fetch userId based on fileId
      const userId = await getUserIdByFileId(fileId);
      if (!userId) {
        throw new Error(`No user found for fileId: ${fileId}`);
      }

      // Step 2: Log "Ingestion completed" in system events
      await logSystemEvent(userId, "Ingestion completed", "Ingestion", fileId);
      console.log("System event recorded");

      // Step 3: Update files table with inputIndex
      await updateInputIndex(fileId, inputIndex);
      console.log("Input column index updated");

      // Step 4: Send webhook to frontend
      await axios.post(`${FRONTEND_WEBHOOK_URL}/api/ingestion-update`, {
        sessionId,
        fileId,
        message: "Ingestion completed",
      });
      console.log("Webhook sent to frontend: Ingestion completed");
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error handling ingestion webhook:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
