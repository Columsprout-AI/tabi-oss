const db = require("../utils/db");

// Create a new experiment
exports.createExperiment = async (fileid, exp_prompt) => {
  const query = `
    INSERT INTO experiments (fileid, exp_prompt)
    VALUES ($1, $2)
    RETURNING experimentid
  `;
  const result = await db.query(query, [fileid, exp_prompt]);

  if (!result.rows[0] || !result.rows[0].experimentid) {
    throw new Error("Failed to create experiment. experimentid not returned.");
  }

  return result.rows[0].experimentid;
};

// Update experiment details
exports.updateExperiment = async (
  experimentid,
  expCredits,
  randBatch,
  totalTokens,
  inputTokens,
  outputTokens,
  totalCost
) => {
  const query = `
    UPDATE experiments
    SET exp_credits = $1,
        rand_batch = $2,
        total_tokens = $3,
        input_tokens = $4,
        output_tokens = $5,
        total_cost = $6
    WHERE experimentid = $7
  `;
  const values = [
    expCredits,
    randBatch,
    totalTokens,
    inputTokens,
    outputTokens,
    totalCost,
    experimentid,
  ];

  try {
    await db.query(query, values);
    console.log(
      `Experiment updated: expCredits=${expCredits}, randBatch=${randBatch}, totalTokens=${totalTokens}, inputTokens=${inputTokens}, outputTokens=${outputTokens}, totalCost=${totalCost}`
    );
  } catch (error) {
    console.error("Error updating experiment:", error.message);
    throw new Error("Failed to update experiment");
  }
};

exports.getLatestExpCreditsByFileId = async (fileid) => {
  const query = `
    SELECT exp_credits
    FROM experiments
    WHERE fileid = $1
    ORDER BY experimentid DESC
    LIMIT 1
  `;
  const values = [fileid];

  try {
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null; // No exp_credits found for the fileid
    }

    return result.rows[0].exp_credits;
  } catch (error) {
    console.error("Error fetching exp_credits:", error.message);
    throw new Error("Failed to fetch exp_credits for the given fileid");
  }
};

exports.updateUserRemark = async (fileid, userRemarkValue) => {
  const query = `
    UPDATE experiments
    SET user_remark = $1
    WHERE experimentid = (
      SELECT experimentid
      FROM experiments
      WHERE fileid = $2
      ORDER BY experimentid DESC
      LIMIT 1
    )
  `;
  const values = [userRemarkValue, fileid];

  try {
    await db.query(query, values);
    console.log(
      `User remark updated to ${userRemarkValue} for the latest experiment for fileid: ${fileid}`
    );
  } catch (error) {
    console.error("Error updating user remark:", error.message);
    throw new Error("Failed to update user remark");
  }
};
