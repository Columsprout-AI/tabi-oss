const fs = require("fs");
const path = require("path");
const { connectMongoDB } = require("../utils/mongoConfig"); // Import MongoDB connection utility
const mongoose = require("mongoose");

// Hardcoded output directory
const outputDirectory =
  "/Users/shivanisharma/Desktop/test-backend/01 test-backend/cs-alpha/backend/dummy-S3";

exports.generateOutputPath = async (req, res) => {
  const { userId, fileId, inputIndex } = req.body;

  // Validate input
  if (!userId || !fileId || inputIndex === undefined) {
    return res
      .status(400)
      .json({ error: "userId, fileId, and inputIndex are required" });
  }

  try {
    // Step 1: Connect to MongoDB
    await connectMongoDB();

    // Step 2: Define the collection name and fetch the collection
    const collectionName = `${userId}.${fileId}.${inputIndex}`;
    const db = mongoose.connection.db; // Get the native MongoDB database instance
    const collection = db.collection(collectionName);

    // Step 3: Fetch all documents from the collection
    const batchDocuments = await collection.find().toArray();

    if (!batchDocuments || batchDocuments.length === 0) {
      throw new Error(`No documents found in collection: ${collectionName}`);
    }

    // Step 4: Prepare the CSV file content
    const csvHeader = "inputData,outputData\n";
    const csvRows = batchDocuments.flatMap((doc) => {
      const inputDataArray = doc.inputData || [];
      const outputDataArray = doc.outputData || [];
      return inputDataArray.map((input, index) => {
        const output = outputDataArray[index] || ""; // Handle cases where arrays are of different lengths
        return `${input},${output}`;
      });
    });

    const csvContent = csvHeader + csvRows.join("\n");

    // Step 5: Define the output file path
    const outputFilePath = path.join(
      outputDirectory,
      `${collectionName}-output.csv`
    );

    // Step 6: Write the CSV content to the output file
    fs.writeFileSync(outputFilePath, csvContent);
    console.log(`CSV file created at: ${outputFilePath}`);

    // Step 7: Respond with the output file path
    return res.status(200).json({
      message: "Output file generated successfully",
      outputFilePath,
    });
  } catch (error) {
    console.error("Error generating output file path:", error.message);
    return res.status(500).json({ error: "Failed to generate output file" });
  }
};
