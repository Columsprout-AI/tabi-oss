const { logUserActivity } = require("../models/userActivityModel");
const { getLatestSessionData } = require("../models/sessionsModel");

exports.logUserLogout = async (req, res) => {
  const { sessionId } = req.body; // Receive sessionId from the API

  // Validate input
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }
  console.log("User logged out");

  try {
    // Step 1: Fetch userId from the sessions table
    const sessionData = await getLatestSessionData(sessionId);

    if (!sessionData) {
      throw new Error(`No active session found for sessionId: ${sessionId}`);
    }

    const { userId } = sessionData;

    // Step 2: Log "User logged out" in user_activity table
    await logUserActivity(userId, "User logged out");
    console.log("User activity recorded");

    // Step 3: Respond to the frontend
    return res.status(200).json({ message: "User logout logged successfully" });
  } catch (error) {
    console.error("Error logging user logout:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
