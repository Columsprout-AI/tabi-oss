const db = require("../utils/db");

exports.logSession = async (sessionid, userid) => {
  const query = `
    INSERT INTO sessions (sessionid, userid, timestamp)
    VALUES ($1, $2, NOW())
  `;
  const result = await db.query(query, [sessionid, userid]);
  //return result.rows[0].serialno; // Return the auto-generated serial number
};

exports.getUserIdBySessionId = async (sessionid) => {
  const query = `
    SELECT userid FROM sessions WHERE sessionid = $1
  `;
  const result = await db.query(query, [sessionid]);
  return result.rows.length > 0 ? result.rows[0].userid : null;
};

exports.insertOrUpdateSessionFile = async (sessionid, userid, fileid) => {
  const queryCheck = `
    SELECT serialno, fileid FROM sessions 
    WHERE sessionid = $1 AND userid = $2
    ORDER BY timestamp DESC LIMIT 1
  `;

  const queryUpdate = `
    UPDATE sessions 
    SET fileid = $1, timestamp = NOW()
    WHERE serialno = $2
  `;

  const queryInsert = `
    INSERT INTO sessions (sessionid, userid, fileid, timestamp)
    VALUES ($1, $2, $3, NOW())
  `;

  try {
    // Step 1: Check the most recent entry for the given sessionid and userid
    const result = await db.query(queryCheck, [sessionid, userid]);

    if (result.rows.length === 0) {
      // Step 2: If no entry exists, insert a new row
      await db.query(queryInsert, [sessionid, userid, fileid]);
    } else {
      const existingFileId = result.rows[0].fileid;
      const serialno = result.rows[0].serialno;

      if (existingFileId === null) {
        // Step 3: If no fileid exists for the session, update the row
        await db.query(queryUpdate, [fileid, serialno]);
      } else {
        // Step 4: If a fileid already exists, create a new row
        await db.query(queryInsert, [sessionid, userid, fileid]);
      }
    }
  } catch (error) {
    console.error("Error in insertOrUpdateSessionFile:", error.message);
    throw error;
  }
};

// Fetch the latest session data (userid and fileid) for a given sessionid
exports.getLatestSessionData = async (sessionid) => {
  const query = `
    SELECT userid, fileid 
    FROM sessions 
    WHERE sessionid = $1 
    ORDER BY timestamp DESC 
    LIMIT 1
  `;

  try {
    const result = await db.query(query, [sessionid]);
    console.log("Query result:", result.rows);

    // If no data is found, return null
    if (result.rows.length === 0) {
      return null;
    }

    return {
      userId: result.rows[0].userid,
      fileId: result.rows[0].fileid,
    }; // Return the first (and only) result
  } catch (error) {
    console.error("Error fetching latest session data:", error.message);
    throw error;
  }
};

exports.getUserIdByFileId = async (fileid) => {
  const query =
    "SELECT userid FROM sessions WHERE fileid = $1 ORDER BY timestamp DESC LIMIT 1";
  const result = await db.query(query, [fileid]);
  return result.rows[0]?.userid || null;
};

exports.updateSessionLogoutTime = async (sessionId, clerkEndTime) => {
  const query = `
    UPDATE sessions 
    SET logout_time = to_timestamp($2)  -- if clerkEndTime is in seconds
    WHERE sessionid = $1
    RETURNING userid;
  `;

  const result = await db.query(query, [sessionId, clerkEndTime]);

  if (result.rows.length === 0) {
    throw new Error("Session not found");
  }

  return result.rows[0].userid;
};
