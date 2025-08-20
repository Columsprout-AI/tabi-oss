// utils/cronCleanup.js
const cron = require("node-cron");
const db = require("./db");

// Define the cron schedule.
// This example runs the cleanup every day at 2 AM.
cron.schedule("0 2 * * *", async () => {
  console.log("Starting cleanup job...");

  try {
    // Delete rows in user_activity older than 10 days
    await db.query(
      "DELETE FROM user_activity WHERE timestamp < NOW() - INTERVAL '10 days'"
    );
    console.log("Cleaned up user_activity table.");

    // Delete rows in system_events older than 10 days
    await db.query(
      "DELETE FROM system_events WHERE event_timestamp < NOW() - INTERVAL '10 days'"
    );
    console.log("Cleaned up system_events table.");

    // Delete rows in sessions older than 10 days
    await db.query(
      "DELETE FROM sessions WHERE timestamp < NOW() - INTERVAL '10 days'"
    );
    console.log("Cleaned up sessions table.");
  } catch (error) {
    console.error("Error during cleanup job:", error);
  }
});
