const { logUserActivity } = require("../models/userActivityModel");
const { updateExportStatus } = require("../models/filesModel");
const { getLatestSessionData } = require("../models/sessionsModel");

exports.logFileExport = async (req, res) => {
  const { sessionId } = req.body; // Receive sessionId from the API

  // Validate input
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }
  console.log("Output exported");

  try {
    // Step 1: Fetch userId and fileId from the sessions table
    const sessionData = await getLatestSessionData(sessionId);

    if (!sessionData) {
      throw new Error(`No active session found for sessionId: ${sessionId}`);
    }

    const { userId, fileId } = sessionData;

    // Step 2: Log "User exported file" in user_activity
    await logUserActivity(userId, "User exported file", fileId);
    console.log("User activity recorded");

    // Step 3: Update export_status in files table
    await updateExportStatus(userId, fileId, "1");
    console.log("Export status updated in the db");

    // Step 4: Respond to the frontend
    return res
      .status(200)
      .json({ message: "File export logged and status updated successfully" });
  } catch (error) {
    console.error("Error logging file export:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
