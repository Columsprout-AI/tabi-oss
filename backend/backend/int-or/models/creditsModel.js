const db = require("../utils/db");

/**
 * Update the credits table with the given details.
 * @param {number} userId - The ID of the user.
 * @param {number} fileId - The ID of the file.
 * @param {number} experimentId - The ID of the experiment.
 * @param {number} expCredits - The number of credits spent.
 * @returns {Promise<void>}
 */
exports.updateCreditsTable = async (
  userId,
  fileId,
  experimentId,
  expCredits
) => {
  const query = `
    INSERT INTO credits (userid, fileid, experimentid, exp_credits)
    VALUES ($1, $2, $3, $4)
  `;

  await db.query(query, [userId, fileId, experimentId, expCredits]);
};

/**
 * Update the estimated credits in the credits table for the latest experiment of a user and file.
 * @param {number} userId - The ID of the user.
 * @param {number} fileId - The ID of the file.
 * @param {number} estimatedCredits - The estimated credits to update.
 * @returns {Promise<void>}
 */
exports.updateEstimatedCredits = async (userId, fileId, estimatedCredits) => {
  const query = `
    UPDATE credits
    SET estimated_credits = $3
    WHERE userid = $1 AND fileid = $2
      AND experimentid = (
        SELECT experimentid
        FROM credits
        WHERE userid = $1 AND fileid = $2
        ORDER BY experimentid DESC
        LIMIT 1
      )
  `;

  await db.query(query, [userId, fileId, estimatedCredits]);
};

/**
 * Update the credits table with project details for the latest experiment of a user and file.
 * @param {number} userId - The ID of the user.
 * @param {number} fileId - The ID of the file.
 * @param {number} projectId - The ID of the project.
 * @param {number} projectCredits - The credits allocated for the project.
 * @returns {Promise<void>}
 */
exports.updateCreditsWithProjectDetails = async (
  userId,
  fileId,
  projectId,
  projectCredits
) => {
  const query = `
    UPDATE credits
    SET projectid = $3, project_credits = $4
    WHERE userid = $1 AND fileid = $2
      AND experimentid = (
        SELECT experimentid
        FROM credits
        WHERE userid = $1 AND fileid = $2
        ORDER BY experimentid DESC
        LIMIT 1
      )
  `;

  await db.query(query, [userId, fileId, projectId, projectCredits]);
};

/**
 * Fetch the estimated credits for the latest experiment of a user and file.
 * @param {number} userId - The ID of the user.
 * @param {number} fileId - The ID of the file.
 * @returns {Promise<number>} The estimated credits for the latest experiment.
 */
exports.getEstimatedCreditsByUserAndFile = async (userId, fileId) => {
  const query = `
    SELECT estimated_credits
    FROM credits
    WHERE userid = $1 AND fileid = $2
    ORDER BY experimentid DESC
    LIMIT 1
  `;

  const result = await db.query(query, [userId, fileId]);

  if (result.rows.length === 0) {
    return null; // No matching record found
  }

  return result.rows[0].estimated_credits; // Return the estimated credits
};
