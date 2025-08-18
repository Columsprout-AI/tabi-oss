const { Storage } = require("@google-cloud/storage");
const { connectMongoDB } = require("../utils/mongoConfig");
const mongoose = require("mongoose");

const storage = new Storage(); // ADC

// simple CSV escaper
function csvEscape(s = "") {
  const str = String(s);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

exports.generateOutputPath = async (req, res) => {
  const { userId, fileId, inputIndex, bucketName: bodyBucket } = req.body;
  if (!userId || !fileId || inputIndex === undefined) {
    return res.status(400).json({ error: "userId, fileId, and inputIndex are required" });
  }

  const bucketName = bodyBucket || process.env.BUCKET_NAME;
  if (!bucketName) {
    return res.status(400).json({ error: "bucketName missing (provide in body or set BUCKET_NAME env)" });
  }

  try {
    await connectMongoDB();

    const collectionName = `${userId}.${fileId}.${inputIndex}`;
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);

    const batchDocuments = await collection.find().toArray();
    if (!batchDocuments || batchDocuments.length === 0) {
      throw new Error(`No documents found in collection: ${collectionName}`);
    }

    const header = "inputData,outputData\n";
    const rows = batchDocuments.flatMap((doc) => {
      const ins = doc.inputData || [];
      const outs = doc.outputData || [];
      return ins.map((input, i) => `${csvEscape(input)},${csvEscape(outs[i] ?? "")}`);
    });
    const csvContent = header + rows.join("\n");

    const destination = `outputs/${userId}.${fileId}-output.csv`;
    const file = storage.bucket(bucketName).file(destination);

    await file.save(csvContent, { contentType: "text/csv" });
    console.log(`CSV written to gs://${bucketName}/${destination}`);

    const [downloadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Output file generated successfully on GCS",
      downloadUrl,
    });
  } catch (error) {
    console.error("Error generating output file on GCS:", error.message);
    return res.status(500).json({ error: "Failed to generate output file" });
  }
};
