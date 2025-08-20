if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const axios = require("axios");
const { logUserActivity } = require("../models/userActivityModel");
const {
  createExperiment,
  updateExperiment,
} = require("../models/experimentsModel");
const { logSystemEvent } = require("../models/systemEventsModel");
const {
  updateUserCredits,
  getCreditsCountByUserId,
} = require("../models/usersModel");
const { getLatestSessionData } = require("../models/sessionsModel"); // Function to fetch latest userId and fileId
const { getInputIndexByFileId } = require("../models/filesModel"); // Function to fetch inputIndex from fileId
const { updateCreditsTable } = require("../models/creditsModel"); // Function for updating credits table

const EXPERIMENT_URL = process.env.EXPERIMENT_URL;

exports.handlePrompt = async (req, res) => {
  const { expPrompt, sessionId } = req.body;

  // Validate input
  if (!expPrompt || !sessionId) {
    return res.status(400).json({ error: "Prompt and sessionId are required" });
  }
  console.log("Experiment initiated");

  try {
    // Step 1: Fetch the latest userId and fileId from the sessions table
    const sessionData = await getLatestSessionData(sessionId);

    if (!sessionData) {
      throw new Error(`No active session found for sessionId: ${sessionId}`);
    }

    const { userId, fileId } = sessionData;

    // Step 2: Fetch the inputIndex from the files table
    const inputIndex = await getInputIndexByFileId(fileId);

    if (inputIndex === null || inputIndex === undefined) {
      throw new Error(`Input index not found for fileId: ${fileId}`);
    }

    // Fetch credits_count from the users table
    const creditsCount = await getCreditsCountByUserId(userId);

    if (creditsCount === null || creditsCount === undefined) {
      throw new Error(`Failed to fetch credits for userId: ${userId}`);
    }

    // CREDIT CHECK - Check if credits are sufficient
    if (creditsCount < 1) {
      return res.status(400).json({ error: "Insufficient tokens" }); // Respond if insufficient credits
    }

    // Step 1: Log the event in user_activity table
    await logUserActivity(userId, "Experiment prompt received", fileId);
    console.log("User activity recorded");

    // Step 2: Create a new experiment entry in experiments table
    const experimentId = await createExperiment(fileId, expPrompt);

    // Step 3: Log "Experiment started" in system_events
    await logSystemEvent(userId, "Experiment started", "experiment", fileId);
    console.log("System event recorded");

    // Step 4: Send data to the experiment microservice
    const response = await axios.post(
      `${EXPERIMENT_URL}/api/exp/start-experiment`, // Experiment endpoint
      {
        userId,
        fileId,
        inputIndex,
        expPrompt,
        experimentId,
      }
    );

    // Log the raw response for debugging
    console.log("Experiment microservice response:", response.data.message);
    // console.log("Raw response from experiment microservice:", response.data);

    // Step 5: Extract exp_output, exp_credits, and rand_batch from the response
    const {
      message,
      parsedResponse,
      inputData,
      randBatch,
      expCredits,
      inputTokens,
      outputTokens,
      totalTokens,
      totalCost,
    } = response.data;

    if (
      !message ||
      !parsedResponse?.outputData ||
      expCredits === undefined ||
      !randBatch?.inputData ||
      !inputData ||
      totalTokens === undefined ||
      inputTokens === undefined ||
      outputTokens === undefined ||
      totalCost === undefined
    ) {
      console.error(
        "Validation failed. Missing or invalid fields in response:"
      );
      console.log({
        message,
        parsedResponse,
        expCredits,
        randBatch,
        inputData,
        totalTokens,
        inputTokens,
        outputTokens,
      });
      throw new Error("Invalid response from experiment microservice");
    } else {
      console.log("Webhook data received.");
    }

    // Step 6: Update experiment details in the experiments table
    await updateExperiment(
      experimentId,
      expCredits,
      randBatch,
      totalTokens,
      inputTokens,
      outputTokens,
      totalCost
    );
    console.log("Experiment table updated");

    // Step 6.5: Update the credits table
    await updateCreditsTable(userId, fileId, experimentId, expCredits);
    console.log("Credits table updated");

    // Step 7: Update credits_count in the users table and fetch updated value
    await updateUserCredits(userId, expCredits); // Deduct credits
    console.log("Credits updated for the user");
    const userCredits = await getCreditsCountByUserId(userId); // Fetch updated credits count

    // Step 8: Log "Experiment completed" in system_events
    await logSystemEvent(userId, "Experiment completed", "experiment", fileId);
    console.log("System event recorded");

    // Step 9: Respond to the frontend with exp_output, input data, exp_credits, uupdated user credits
    return res.status(200).json({
      message,
      parsedResponse,
      expCredits,
      inputData,
      userCredits,
    });
  } catch (error) {
    console.error("Error handling prompt:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
