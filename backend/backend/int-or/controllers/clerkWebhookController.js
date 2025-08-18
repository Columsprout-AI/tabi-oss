// Import required dependencies
const { Webhook } = require("svix");
const { updateUserInfo, markUserAsDeleted } = require("../models/usersModel");
const { updateSessionLogoutTime } = require("../models/sessionsModel");
const { logUserActivity } = require("../models/userActivityModel");

exports.handleClerkWebhook = async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET; // Make sure this is set in your .env file

  if (!SIGNING_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is missing in .env file");
    return res.status(500).json({ error: "Internal Server Error" });
  }

  // Extract Svix headers from the request
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers");
    return res.status(400).json({ error: "Unauthorized" });
  }

  const webhook = new Webhook(SIGNING_SECRET);

  let event;
  try {
    // Verify the webhook and parse the payload
    const payloadString = req.body.toString(); // Ensure request body is a string
    event = webhook.verify(payloadString, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Failed to verify Clerk webhook:", err);
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  try {
    // Handle the webhook event based on its type
    switch (event.type) {
      case "user.updated": {
        const { id: clerkId, email_addresses } = event.data;
        const email = email_addresses[0]?.email_address;
        await updateUserInfo(clerkId, email);
        console.log(`User updated: ${clerkId}`);
        break;
      }
      case "user.deleted": {
        const { id: deletedClerkId } = event.data;
        await markUserAsDeleted(deletedClerkId);
        console.log(`User marked as deleted: ${deletedClerkId}`);
        break;
      }
      case "session.ended":
      case "session.removed": {
        const session = event.data;
        const sessionId = session.id;
        const clerkEndTime = session.updated_at;

        try {
          const userId = await updateSessionLogoutTime(sessionId, clerkEndTime);
          await logUserActivity(userId, "User logged out");
          console.log(
            `Session ${event.type}: sessionId=${sessionId}, userId=${userId} logged out at ${clerkEndTime}`
          );
        } catch (sessionError) {
          console.error(
            `Error handling ${event.type}: ${sessionError.message}`
          );
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
