const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const axios = require("axios");

// MongoDB Batch Schema
const batchSchema = new mongoose.Schema({
  inputData: { type: [String], required: true }, // Input data array
  outputData: { type: [String], default: () => Array(10).fill(null) }, // Placeholder output data
});

exports.startIngestion = async (req, res) => {
  const { userId, fileId, inputColumn } = req.body;

  // Validate input
  if (!userId || !fileId || !inputColumn) {
    return res
      .status(400)
      .json({ error: "userId, fileId, and inputColumn are required" });
  }

  try {
    // Step 1: Respond to the API with success
    res.status(200).json({ message: "started" });

    // Step 2: Log the received data for debugging
    console.log(`Received ingestion request:`, {
      userId,
      fileId,
      inputColumn,
    });

    // Step 3: Extract data from the file
    const inputFilePath = `/Users/shivanisharma/Desktop/test-backend/test-files/${fileId}.csv`; // Construct file path (adjust as needed)
    const rowValues = [];
    let headerValues = [];
    let inputIndex;

    console.log(`Reading file at path: ${inputFilePath}`);
    await new Promise((resolve, reject) => {
      fs.createReadStream(inputFilePath)
        .pipe(csv())
        .on("headers", (csvHeaders) => {
          headerValues = csvHeaders;
          inputIndex = headerValues.indexOf(inputColumn);
          if (inputIndex === -1) {
            return reject(
              new Error(`Column "${inputColumn}" not found in file headers.`)
            );
          }
          console.log(`Column "${inputColumn}" found at index ${inputIndex}`);
        })
        .on("data", (row) => {
          const value = Object.values(row)[inputIndex];
          if (value) rowValues.push(value);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // console.log(`Extracted input data:`, rowValues);

    // Step 4: Save extracted data to MongoDB
    const collectionName = `${userId}.${fileId}.${inputIndex}`;
    const collectionModel = mongoose.model(
      collectionName,
      batchSchema,
      collectionName
    );

    const batchSize = 10;
    const batchPromises = [];
    for (let i = 0; i < rowValues.length; i += batchSize) {
      const batchInputData = rowValues.slice(i, i + batchSize);
      const batchDocument = {
        inputData: batchInputData,
        outputData: Array(batchInputData.length).fill(null),
      };
      batchPromises.push(collectionModel.create(batchDocument));
    }

    await Promise.all(batchPromises);
    console.log(
      `Data successfully saved to MongoDB collection: ${collectionName}`
    );

    console.log("fileId:", fileId, "inputIndex:", inputIndex);

    // Step 5: Call webhook to int-or service
    try {
      await axios.post("http://localhost:3000/api/intor/ingestion-webhook", {
        fileId,
        inputIndex,
        ingestionStatus: "Ingestion completed",
      });
    } catch (error) {
      console.log("Error sending webhook");
    }
    console.log(`Webhook sent to int-or service: Ingestion completed`);
  } catch (error) {
    console.error("Error during ingestion process:", error.ingestion_status);
  }
};
