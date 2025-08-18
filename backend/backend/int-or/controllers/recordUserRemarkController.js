const { logUserActivity } = require("../models/userActivityModel");
const { getLatestSessionData } = require("../models/sessionsModel");
const { updateUserRemark } = require("../models/experimentsModel");

exports.recordUserRemark = async (req, res) => {
  const { sessionId, userRemark } = req.body; // Receive sessionid and userRemark from webhook

  // Validate input
  if (!sessionId || !userRemark) {
    return res
      .status(400)
      .json({ error: "Session ID and userRemark are required" });
  }
  console.log("User remark received");

  try {
    // Step 1: Fetch userId and fileId from the sessions table
    const sessionData = await getLatestSessionData(sessionId);

    if (!sessionData) {
      throw new Error(`No active session found for sessionId: ${sessionId}`);
    }

    const { userId, fileId } = sessionData;

    // Step 2: Log "User shared remark" in user_activity
    await logUserActivity(userId, "User shared remark");
    console.log("User activity recorded");

    // Step 3: Determine value for user_remark column
    const userRemarkValue = userRemark.toLowerCase() === "like" ? 1 : 0;

    // Step 4: Update the user_remark column in the experiments table for the latest experimentid
    await updateUserRemark(fileId, userRemarkValue);
    console.log("User remark recorded");

    // Step 5: Respond to the API
    return res.status(200).json({
      message: "User remark recorded successfully",
      userRemarkValue,
    });
  } catch (error) {
    console.error("Error recording user remark:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
