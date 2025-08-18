require("dotenv").config();
const { createUser, getUserByEmail } = require("../models/usersModel");
const { logSession } = require("../models/sessionsModel");
const { logUserActivity } = require("../models/userActivityModel");

exports.recordSignup = async (req, res) => {
  const { clerkId, email, createdAt, lastLogin, sessionId } = req.body;

  // Validate input
  if (!clerkId || !email || !createdAt || !sessionId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  console.log("User signed up");

  // fetch free credits and check if the email already exists
  let userCredits = process.env.FREE_USER_CREDITS;
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    userCredits = 0;
  }

  try {
    // Step 1: Add user to the users table and get the userId
    const userId = await createUser(
      clerkId,
      email,
      createdAt,
      lastLogin,
      userCredits
    );
    console.log("User created");

    // Step 2: Log session in the sessions table
    await logSession(sessionId, userId);
    console.log("Session logged");

    // Step 3: Log the user's activity in the user_activity table
    await logUserActivity(userId, "User signed up");
    console.log("User activity recorded");

    // Step 4: Respond with success
    res.status(201).json({
      message: "User signup recorded successfully",
      userId: userId,
      userCredits: userCredits,
    });
  } catch (error) {
    console.error("Error in recordSignup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
