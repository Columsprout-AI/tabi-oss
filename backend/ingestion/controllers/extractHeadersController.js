// controllers/extractHeadersController.js
const { Storage } = require("@google-cloud/storage");
const csv = require("csv-parser");

const storage = new Storage(); // Uses ADC (gcloud or attached SA)

exports.extractHeaders = async (req, res) => {
  const { inputFilePath } = req.body;

  // Validate input
  if (!inputFilePath) {
    return res.status(400).json({ error: "inputFilePath is required" });
  }

  // Expect gs://bucket/object
  const match = inputFilePath.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    return res.status(400).json({ error: "inputFilePath must be a gs:// URL" });
  }
  const [, bucketName, objectName] = match;

  try {
    console.log(`Reading headers from: gs://${bucketName}/${objectName}`);

    const headerValues = await new Promise((resolve, reject) => {
      let resolved = false;

      const readStream = storage.bucket(bucketName).file(objectName).createReadStream();
      const parser = csv();

      readStream
        .on("error", reject)
        .pipe(parser)
        .on("headers", (headers) => {
          // Resolve as soon as we have headers
          if (!resolved) {
            resolved = true;
            // Best-effort early stop to avoid reading the whole file
            readStream.destroy();
            resolve(headers);
          }
        })
        .on("error", reject)
        .on("end", () => {
          // In case headers event didn't fire (malformed CSV)
          if (!resolved) reject(new Error("Unable to read CSV headers"));
        });
    });

    console.log("Extracted headers:", headerValues);

    return res.status(200).json({
      message: "Headers extracted successfully",
      headerValues,
    });
  } catch (error) {
    console.error("Error extracting headers:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
