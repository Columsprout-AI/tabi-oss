const db = require("../utils/db");

exports.logUserActivity = async (userid, action, fileid = null) => {
  const query =
    "INSERT INTO user_activity (userid, user_action, timestamp, fileid) VALUES ($1, $2, NOW(), $3)";
  await db.query(query, [userid, action, fileid]);
};
