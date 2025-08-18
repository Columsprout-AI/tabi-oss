if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const axios = require("axios");
const { logUserActivity } = require("../models/userActivityModel");
const {
  createProject,
  updateOpFilePath,
  updateProjectCredits,
} = require("../models/projectsModel");
const { logSystemEvent } = require("../models/systemEventsModel");
const { getLatestSessionData } = require("../models/sessionsModel");
const { getInputIndexByFileId, updateS3Path } = require("../models/filesModel");
const {
  getCreditsCountByUserId,
  updateUserCredits,
} = require("../models/usersModel"); // Import function to fetch credits_count
const {
  updateCreditsWithProjectDetails,
  getEstimatedCreditsByUserAndFile,
} = require("../models/creditsModel"); // Import the credits table function

// In-memory storage for the frontend API URL
const PROCESSING_URL = process.env.PROCESSING_URL;
const INGESTION_URL = process.env.INGESTION_URL;
const FRONTEND_WEBHOOK_URL = process.env.FRONTEND_WEBHOOK_URL;
const BUCKET_NAME = "tabi-files";

exports.handleProcessing = async (req, res) => {
  const { projectPrompt, sessionId } = req.body; // Receive projectPrompt and sessionId from frontend

  // Validate input
  if (!projectPrompt || !sessionId) {
    return res
      .status(400)
      .json({ error: "Prompt, sessionId and estimatedCredits are required" });
  }
  console.log("Processing initiated");

  try {
    // Step 1: Fetch userId and fileId from the sessions table
    const sessionData = await getLatestSessionData(sessionId);

    if (!sessionData) {
      throw new Error(`No active session found for sessionId: ${sessionId}`);
    }

    const { userId, fileId } = sessionData;

    // Step 2a: Fetch inputindex from the files table for the given fileid
    const inputIndex = await getInputIndexByFileId(fileId);

    if (inputIndex === null || inputIndex === undefined) {
      throw new Error(`Input index not found for fileid: ${fileId}`);
    }

    // Step 2b: Fetch estimated_credits from the credits table
    const estimatedCredits = await getEstimatedCreditsByUserAndFile(
      userId,
      fileId
    );

    if (estimatedCredits === null || estimatedCredits === undefined) {
      throw new Error(
        `Failed to fetch estimated credits for userId: ${userId}, fileId: ${fileId}`
      );
    }

    // Step 3: Fetch credits_count from the users table for the given userId
    const creditsCount = await getCreditsCountByUserId(userId);

    if (creditsCount === null || creditsCount === undefined) {
      throw new Error(`Failed to fetch credits for userId: ${userId}`);
    }

    // Step 4: Compare credits_count with estimatedCredits
    if (creditsCount < estimatedCredits) {
      return res.status(400).json({ error: "Insufficient tokens" }); // Send "Insufficient tokens" response
    }

    // Step 5: Notify frontend that processing is starting if sufficient credits are available
    res.status(200).json({ message: "Processing started successfully" });

    // Step 6: Log "Processing prompt received" in user_activity table
    await logUserActivity(userId, "Processing prompt received", fileId);
    console.log("User activity recorded");

    // Step 7: Create a new project in the projects table
    const projectId = await createProject(userId, fileId, projectPrompt);
    console.log("Project ID generated");

    // Step 8: Log "Processing started" in system_events
    await logSystemEvent(
      userId,
      "Processing started",
      "Processing",
      fileId,
      projectId
    );
    console.log("System event recorded");

    // Step 9: Send data to the processing service
    const response = await axios.post(
      `${PROCESSING_URL}/api/proc/start-processing`,
      {
        sessionId,
        userId,
        fileId,
        inputIndex,
        projectPrompt,
        projectId,
      }
    );

    const { status } = response.data;

    // Handle processing status
    if (status !== "started") {
      throw new Error("Unexpected status from processing service");
    }

    console.log("Processing service reported status as started.");
  } catch (error) {
    console.error("Error during processing:", error.message);
  }
};

// Webhook to handle response from processing service
exports.handleProcessingWebhook = async (req, res) => {
  const {
    sessionId,
    fileId,
    projectId,
    userId,
    projectCredits,
    projectTokens,
    projectInputTokens,
    projectOutputTokens,
    totalCost,
    inputIndex,
  } = req.body;

  // Validate input
  if (
    !projectId ||
    projectCredits === undefined ||
    !userId ||
    projectTokens === undefined ||
    projectInputTokens === undefined ||
    projectOutputTokens === undefined ||
    totalCost === undefined
  ) {
    return res.status(400).json({ error: "Invalid webhook payload" });
  }
  console.log("Processing completion notification received");

  // Step 1: Respond to the webhook call immediately
  res
    .status(200)
    .json({ message: "Webhook received of processing completion." });

  try {
    // Step 2a: Log "Processing completed" in system_events
    await logSystemEvent(
      null,
      "Processing completed",
      "Processing",
      null,
      projectId
    );
    console.log("System event recorded");

    // Step 2b: Update project details in the projects table
    await updateProjectCredits(
      projectId,
      projectCredits,
      projectTokens,
      projectInputTokens,
      projectOutputTokens,
      totalCost
    );
    console.log("Project credits details updated");

    // Step 2c: Update the credits table with project details
    await updateCreditsWithProjectDetails(
      userId,
      fileId,
      projectId,
      projectCredits
    );
    console.log("Project credits updated");

    // Step 2d: Deduct credits from the users table and fetch the updated value
    await updateUserCredits(userId, projectCredits); // Deduct credits from the user's account
    const userCredits = await getCreditsCountByUserId(userId); // Get updated credits count
    console.log("User credits updated");

    // Step 3: Send a webhook to ingestion at `output-path` endpoint and get the output file path
    let outputFilePath;
    try {
      const ingestionResponse = await axios.post(
        `${INGESTION_URL}/api/ing/output-path`,
        {
          userId,
          fileId,
          inputIndex,
        }
      );
      console.log(
        `Webhook sent to ingestion: Status=${ingestionResponse.status}`
      );
      outputFilePath = ingestionResponse.data.downloadUrl;
    } catch (error) {
      console.error("Error sending webhook to ingestion:", error.message);
      throw error;
    }

    // Step 4: Update the outputFilePath column in the projects table
    await updateOpFilePath(projectId, outputFilePath);
    console.log(`Output file path updated: ${outputFilePath}`);

    // Step 5: Update the s3_path column in the files table
    await updateS3Path(fileId, outputFilePath);
    console.log(`S3 path updated for fileId: ${fileId}`);

    // Step 6: Send webhook to frontend
    try {
      const frontendResponse = await axios.post(
        `${FRONTEND_WEBHOOK_URL}/api/process-update`,
        {
          sessionId,
          projectId,
          outputFilePath,
          message: "Processing completed",
          projectCredits,
          userCredits,
        }
      );
      console.log(
        `Notification sent to frontend: Status=${frontendResponse.status}`
      );
    } catch (error) {
      console.error("Error notifying frontend:", error.message);
    }
  } catch (error) {
    console.error("Error handling processing webhook:", error.message);
  }
};

// Step 4: Construct the output path
// const fileName = `${userId}.${fileId}.${inputIndex}`;
// const outputDirectory =
//   "/Users/shivanisharma/Desktop/test-backend/01 test-backend/cs-alpha/backend/dummy-S3"; // Hardcoded output directory - will later be moved to .env file
// const outputFilePath = `${outputDirectory}/${fileName}-output.csv`;
// const fileName = `${userId}.${fileId}`;
// const outputFilePath = `https://storage.googleapis.com/${BUCKET_NAME}/outputs/${fileName}-output.csv`;
