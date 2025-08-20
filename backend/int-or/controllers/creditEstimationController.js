if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const axios = require("axios");
const { getLatestSessionData } = require("../models/sessionsModel");
const { getInputIndexByFileId } = require("../models/filesModel");
const { getLatestExpCreditsByFileId } = require("../models/experimentsModel");
const { updateEstimatedCredits } = require("../models/creditsModel");

const PROCESSING_URL = process.env.PROCESSING_URL;

exports.estimateCredits = async (req, res) => {
  const { projectPrompt, sessionId } = req.body;

  // Validate input
  if (!projectPrompt || !sessionId) {
    return res
      .status(400)
      .json({ error: "projectPrompt and sessionId are required" });
  }
  console.log("Credit estimation request received");

  try {
    // Step 1: Extract the latest userId and fileId for the given sessionId
    const sessionData = await getLatestSessionData(sessionId);

    if (!sessionData) {
      throw new Error(`No active session found for sessionId: ${sessionId}`);
    }

    const { userId, fileId } = sessionData;

    // Step 2: Fetch inputindex from the files table for the given fileId
    const inputIndex = await getInputIndexByFileId(fileId);

    if (inputIndex === null || inputIndex === undefined) {
      throw new Error(`Input index not found for fileId: ${fileId}`);
    }

    // Step 3: Fetch the latest exp_credits from the experiments table for the given fileId
    const lastExpCredits = await getLatestExpCreditsByFileId(fileId);

    if (lastExpCredits === null || lastExpCredits === undefined) {
      throw new Error(`exp_credits not found for fileId: ${fileId}`);
    }

    // Step 4: Send data to the processing service's /credit-estimation endpoint
    const response = await axios.post(
      `${PROCESSING_URL}/api/proc/estimate-credits`, // Processing service endpoint
      {
        projectPrompt,
        userId,
        fileId,
        inputIndex,
        lastExpCredits, // last experiment credit count
      }
    );
    console.log("Response from credit estimation received");

    // Step 5: Extract credit estimate from the response
    const creditEstimate = response.data.estimatedCredits;
    // console.log("estimate: ", response.data.estimatedCredits);
    // console.log("estimate: ", creditEstimate);

    // Step 6: Update the estimated_credits in the credits table
    await updateEstimatedCredits(userId, fileId, creditEstimate);
    console.log("Credits table updated");

    // Step 7: Return the credit estimate to the frontend
    return res.status(200).json({
      message: "Credit estimate retrieved successfully",
      creditEstimate,
    });
  } catch (error) {
    console.error("Error estimating credits:", error.message);

    // Handle errors (e.g., processing service unavailable)
    if (error.response) {
      return res.status(error.response.status).json({
        error: "Failed to estimate credits",
        details: error.response.data,
      });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};
