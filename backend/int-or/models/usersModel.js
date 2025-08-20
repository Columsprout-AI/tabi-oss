const db = require("../utils/db");

exports.getUserByEmail = async (email) => {
  const query = `
    SELECT * FROM users
    WHERE email = $1;
  `;

  try {
    const result = await db.query(query, [email]);
    return result.rows[0]; // Returns the user record if found, otherwise undefined
  } catch (error) {
    console.error("Error in getUserByEmail:", error.message);
    throw error;
  }
};

exports.createUser = async (
  clerkId,
  email,
  // firstName,
  // lastName,
  createdAt,
  lastLogin,
  creditsCount
) => {
  const query = `
    INSERT INTO users (clerkid, email, created_at, last_login, credits_count)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING userid;
  `;

  try {
    const result = await db.query(query, [
      clerkId,
      email,
      createdAt,
      lastLogin,
      creditsCount,
    ]);
    return result.rows[0].userid; // Return the generated user ID
  } catch (error) {
    console.error("Error in createUser:", error.message);
    throw error;
  }
};

// Update the last_login column for the given user with the current timestamp
exports.updateUserLastLogin = async (userId) => {
  const query = `
    UPDATE users 
    SET last_login = NOW()
    WHERE userid = $1
  `;
  try {
    await db.query(query, [userId]);
  } catch (error) {
    console.error("Error updating last login for user ID:", error.message);
    throw error;
  }
};

// Update user info in the database
exports.updateUserInfo = async (clerkId, email) => {
  const query = `
    UPDATE users
    SET email = $2
    WHERE clerkid = $1
  `;

  try {
    const result = await db.query(query, [clerkId, email]);
    console.log("User updated in the database");
    return result.rowCount; // Return the number of rows updated
  } catch (error) {
    console.error("Error updating user:", error.message);
    throw error;
  }
};

// Update delete_account column for a user
exports.markUserAsDeleted = async (clerkId) => {
  const query = `
    UPDATE users
    SET delete_account = true
    WHERE clerkid = $1
  `;

  try {
    const result = await db.query(query, [clerkId]);
    console.log("User marked as deleted in the database");
    return result.rowCount; // Return the number of rows updated
  } catch (error) {
    console.error("Error marking user as deleted:", error.message);
    throw error;
  }
};

exports.getUserIdByClerkId = async (clerkid) => {
  const query = "SELECT userid FROM users WHERE clerkid = $1";
  const result = await db.query(query, [clerkid]);

  if (result.rows.length === 0) {
    throw new Error(`No user found for clerkid: ${clerkid}`);
  }

  return result.rows[0].userid;
};

exports.getCreditsCountByUserId = async (userid) => {
  const query = "SELECT credits_count FROM users WHERE userid = $1";
  const result = await db.query(query, [userid]);

  if (result.rows.length === 0) {
    throw new Error(`No user found for userid: ${userid}`);
  }

  return result.rows[0].credits_count;
};

exports.updateUserCredits = async (userid, creditsToDeduct) => {
  const query = `
    UPDATE users
    SET credits_count = credits_count - $1
    WHERE userid = $2
  `;
  const values = [creditsToDeduct, userid];

  try {
    await db.query(query, values);
    console.log(
      `User credits updated: Subtracted ${creditsToDeduct} credits for userid: ${userid}`
    );
  } catch (error) {
    console.error("Error updating user credits:", error.message);
    throw new Error("Failed to update user credits");
  }
};

exports.addCreditsToUser = async (userid, credits) => {
  const query = `
        UPDATE users
        SET credits_count = credits_count + $1
        WHERE userid = $2
        RETURNING credits_count;
    `;
  const values = [credits, userid];

  try {
    const result = await db.query(query, values);
    return result.rows[0]?.credits_count; // Return updated credits_count
  } catch (error) {
    console.error("Error updating user credits:", error);
    throw error;
  }
};
