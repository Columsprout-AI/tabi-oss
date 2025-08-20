if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { Storage } = require("@google-cloud/storage");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const axios = require("axios");

const INTOR_URL = process.env.INTOR_URL;
const storage = new Storage(); // ADC

// Batch schema
const batchSchema = new mongoose.Schema({
  inputData: { type: [String], required: true },
  outputData: { type: [String], default: () => Array(10).fill(null) },
});

exports.startIngestion = async (req, res) => {
  const { sessionId, userId, fileId, inputColumn, bucketName } = req.body;

  if (!userId || !fileId || !inputColumn || !bucketName) {
    return res.status(400).json({
      error: "userId, fileId, inputColumn, and bucketName are required",
    });
  }

  try {
    // Respond immediately (as documented)
    res.status(200).json({ message: "started" });

    console.log("Received ingestion request:", {
      sessionId,
      userId,
      fileId,
      inputColumn,
      bucketName,
    });

    // Read the uploaded CSV from: uploads/<userId>.<fileId>
    const objectName = `uploads/${userId}.${fileId}`;
    const file = storage.bucket(bucketName).file(objectName);

    const rowValues = [];
    let inputIndex;

    await new Promise((resolve, reject) => {
      file
        .createReadStream()
        .pipe(csv())
        .on("headers", (csvHeaders) => {
          const sanitizedHeaders = csvHeaders.map((h) => h.trim().toLowerCase());
          const target = inputColumn.trim().toLowerCase();
          inputIndex = sanitizedHeaders.indexOf(target);
          if (inputIndex === -1) {
            return reject(
              new Error(`Column "${inputColumn}" not found in file headers: ${csvHeaders.join(", ")}`)
            );
          }
          console.log(`Column "${inputColumn}" found at index ${inputIndex}`);
        })
        .on("data", (row) => {
          let value = Object.values(row)[inputIndex];
          if (typeof value === "string" && value.length > 0) {
            if (value.length > 600) value = value.substring(0, 600);
            rowValues.push(value);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Write 10-row batches to Mongo
    const collectionName = `${userId}.${fileId}.${inputIndex}`;
    const CollectionModel =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, batchSchema, collectionName);

    const batchSize = 10;
    const ops = [];
    for (let i = 0; i < rowValues.length; i += batchSize) {
      const batchInputData = rowValues.slice(i, i + batchSize);
      ops.push(
        CollectionModel.create({
          inputData: batchInputData,
          outputData: Array(batchInputData.length).fill(null),
        })
      );
    }
    await Promise.all(ops);
    console.log(`Saved ${ops.length} batch docs to ${collectionName}`);

    // Webhook back to int-or
    if (typeof inputIndex !== "number") {
      throw new Error("inputIndex is invalid or undefined");
    }

    await axios.post(`${INTOR_URL}/api/intor/ingestion-webhook`, {
      sessionId,
      fileId: Number(fileId),
      inputIndex,
      ingestionStatus: "Ingestion completed",
    });

    console.log("Webhook sent to int-or: Ingestion completed");
  } catch (error) {
    console.error("Error during ingestion:", error.message);
    // no res here (we already responded), just log
  }
};
