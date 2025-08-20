require("dotenv").config();
const { mongoClient, connectToMongoDB } = require("../utils/Mongo.js");

// Configurable constants
const MARKUP_CONSTANT = 1.2;

exports.estimateCredits = async (req, res) => {
  const { projectPrompt, userId, fileId, inputIndex, lastExpCredits } =
    req.body;

  // Validate input
  if (
    !projectPrompt ||
    !userId ||
    !fileId ||
    inputIndex === undefined ||
    lastExpCredits === undefined
  ) {
    return res.status(400).json({
      error:
        "projectPrompt, userId, fileId, inputIndex, and lastExpCredits are required",
    });
  }

  try {
    // Step 1: Log the received data for debugging
    console.log(`Received credit estimation request:`, {
      projectPrompt,
      userId,
      fileId,
      inputIndex,
      lastExpCredits,
    });

    // Step 2: Retrieve document count
    await connectToMongoDB(); // Ensure MongoDB connection is established
    const db = mongoClient.db(process.env.DB_NAME); // Use DB_NAME from .env
    const collection = db.collection(`${userId}.${fileId}.${inputIndex}`);
    const documentCount = await collection.countDocuments();

    console.log(`Document Count: ${documentCount}`);
    if (documentCount === 0) {
      console.error("No documents found in the collection.");
      return res
        .status(400)
        .json({ error: "No documents found in the collection." });
    }

    // Step 3: Estimate credits
    const estimatedCredits = lastExpCredits * documentCount * MARKUP_CONSTANT;

    console.log(
      `Last Exp Credits: ${lastExpCredits}, Document Count: ${documentCount}, Estimated Credits: ${estimatedCredits}`
    );

    // Step 4: Respond with estimated credits directly to the frontend
    return res.status(200).json({
      message: "Credit estimation completed successfully",
      estimatedCredits,
    });
  } catch (error) {
    console.error("Error during credit estimation:", error.message);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

// the api call for exports.estimateCredits would require lastExpCredits for running
// have maintained MARKUP_CONSTANT separately for raising estimates to minimize negative sproutoken balance cases
