const db = require("../utils/db");

/**
 * Inserts a new file record with a placeholder for the input_filepath.
 * Returns the generated fileid.
 */
exports.insertFileRecord = async (userid, inputFilePath = "To be inserted") => {
  const query = `
    INSERT INTO files (userid, input_filepath) 
    VALUES ($1, $2) 
    RETURNING fileid
  `;
  const result = await db.query(query, [userid, inputFilePath]);
  return result.rows[0].fileid;
};

/**
 * Updates the file record for the given fileid with the actual input_filepath.
 * Returns the updated record.
 */
exports.updateFileRecordPath = async (fileId, inputFilePath) => {
  const query = `
    UPDATE files
    SET input_filepath = $1
    WHERE fileid = $2
    RETURNING *
  `;
  const values = [inputFilePath, fileId];
  const result = await db.query(query, values);
  return result.rows[0];
};

exports.updateInputColumn = async (userid, fileid, inputcolumn) => {
  const query = `
    UPDATE files
    SET inputcolumn = $1
    WHERE userid = $2 AND fileid = $3
  `;
  await db.query(query, [inputcolumn, userid, fileid]);
};

exports.updateInputIndex = async (fileid, inputIndex) => {
  const query = `
    UPDATE files
    SET inputindex = $1
    WHERE fileid = $2
  `;
  await db.query(query, [inputIndex, fileid]);
};

exports.updateExportStatus = async (userid, fileid, status) => {
  const query = `
    UPDATE files
    SET export_status = $1
    WHERE userid = $2 AND fileid = $3
  `;
  const values = [status, userid, fileid];

  try {
    await db.query(query, values);
    console.log(
      `Export status updated to ${status} for fileid: ${fileid} and userid: ${userid}`
    );
  } catch (error) {
    console.error("Error updating export status:", error.message);
    throw new Error("Failed to update export status");
  }
};

exports.getInputIndexByFileId = async (fileid) => {
  const query = `
    SELECT inputindex 
    FROM files 
    WHERE fileid = $1
  `;
  try {
    const result = await db.query(query, [fileid]);
    return result.rows[0] ? result.rows[0].inputindex : null; // Return the inputindex or null if not found
  } catch (error) {
    console.error("Error fetching inputindex by fileid:", error.message);
    throw error; // Propagate the error for handling in the calling function
  }
};

exports.updateS3Path = async (fileid, s3Path) => {
  const query = `
    UPDATE files
    SET s3_path = $1
    WHERE fileid = $2
  `;
  await db.query(query, [s3Path, fileid]);
};
