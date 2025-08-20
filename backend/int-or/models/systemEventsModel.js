const db = require("../utils/db");

// Log an event in the system_events table
exports.logSystemEvent = async (userid, eventType, microservice) => {
  const query = `
    INSERT INTO system_events (userid, event_type, microservice, event_timestamp)
    VALUES ($1, $2, $3, NOW())
  `;
  await db.query(query, [userid, eventType, microservice]);
};

// // Get the latest event for a specific file and microservice
// exports.getLatestEventForFile = async (userid, fileid, microservice) => {
//   const query = `
//     SELECT event_type
//     FROM system_events
//     WHERE userid = $1 AND fileid = $2 AND microservice = $3
//     ORDER BY event_timestamp DESC
//     LIMIT 1
//   `;
//   const result = await db.query(query, [userid, fileid, microservice]);
//   return result.rows[0]?.event_type || null;
// };
