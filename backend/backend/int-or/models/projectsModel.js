const db = require("../utils/db");

// Create a new project
exports.createProject = async (userid, fileid, project_prompt) => {
  const query = `
    INSERT INTO projects (userid, fileid, project_prompt)
    VALUES ($1, $2, $3)
    RETURNING projectid
  `;
  const result = await db.query(query, [userid, fileid, project_prompt]);
  return result.rows[0].projectid;
};

// Update project details
exports.updateProjectCredits = async (
  projectid,
  projectCredits,
  totalTokens,
  inputTokens,
  outputTokens,
  totalCost
) => {
  const query = `
    UPDATE projects
    SET project_credits = $1,
        total_tokens = $2,
        input_tokens = $3,
        output_tokens = $4,
        total_cost = $5
    WHERE projectid = $6
  `;
  const values = [
    projectCredits,
    totalTokens,
    inputTokens,
    outputTokens,
    totalCost,
    projectid,
  ];

  try {
    await db.query(query, values);
    console.log(
      `Project updated: projectCredits=${projectCredits}, totalTokens=${totalTokens}, inputTokens=${inputTokens}, outputTokens=${outputTokens}, totalCost=${totalCost}`
    );
  } catch (error) {
    console.error("Error updating project:", error.message);
    throw new Error("Failed to update project");
  }
};

// Update the op_filepath for a project
exports.updateOpFilePath = async (projectid, opFilePath) => {
  const query = `
    UPDATE projects
    SET op_filepath = $1
    WHERE projectid = $2
  `;
  await db.query(query, [opFilePath, projectid]);
};
