const {
  getUserIdByClerkId,
  getCreditsCountByUserId,
  updateUserLastLogin,
} = require("../models/usersModel");
const { logUserActivity } = require("../models/userActivityModel");
const { logSession } = require("../models/sessionsModel");

exports.recordLogin = async (req, res) => {
  const { clerkId, sessionId } = req.body;

  // Validate if clerkId is present in the request body
  if (!clerkId) {
    return res.status(400).json({ error: "Clerk ID is required" });
  }
  // Validate if sessionId is present in the request body
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }
  console.log("User logged in");

  try {
    // Step 1: Fetch the user ID corresponding to the clerk ID
    const userId = await getUserIdByClerkId(clerkId);

    if (!userId) {
      return res
        .status(404)
        .json({ error: `No user found for clerk ID: ${clerkId}` });
    }

    // Step 2: Fetch credits count for the user
    const userCredits = await getCreditsCountByUserId(userId);

    // Step 3: Log the session ID and user ID in the sessions table
    await logSession(sessionId, userId);
    console.log("Session logged");

    // Step 3.5: Update the user's last_login timestamp with the current time
    await updateUserLastLogin(userId);
    console.log("User log in time updated");

    // Step 4: Log the user activity in the user_activity table
    await logUserActivity(userId, "User logged in");
    console.log("User activity recorded");

    // Step 5: Log a success message and send the response
    const logMessage = `Clerk with ID ${clerkId}, User ID ${userId}, and Session ID ${sessionId} logged in successfully.`;
    console.log(logMessage);

    return res.status(200).json({
      message: logMessage,
      userCredits, // Sending the credits count to the frontend
    });
  } catch (error) {
    console.error("Error recording login:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
