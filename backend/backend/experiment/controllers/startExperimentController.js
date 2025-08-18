const axios = require("axios");
const {
  mongoClient,
  connectToMongoDB,
  openai,
  assistantId,
} = require("../utils/Mongo.js"); // Updated imports

// Constants
const TOKEN_COSTS = { input: 0.15, output: 0.6 }; // Costs per 1,000,000 tokens
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 5000; // 5 seconds

// Function to poll for run completion
async function waitForRunCompletion(threadId, runId) {
  let attempts = 0;
  let runResponse;

  while (attempts < MAX_RETRIES) {
    runResponse = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (runResponse.status === "completed") {
      return runResponse;
    }

    console.log(
      `Run not complete. Retrying... (${attempts + 1}/${MAX_RETRIES})`
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    attempts++;
  }

  if (runResponse.status !== "completed") {
    throw new Error("Run did not complete within the maximum retry limit.");
  }

  return runResponse;
}

// Main experiment logic
async function performExperimentLogic(
  userId,
  fileId,
  inputIndex,
  expPrompt,
  experimentId
) {
  await connectToMongoDB(); // Ensure MongoDB connection is established
  const db = mongoClient.db(process.env.DB_NAME); // Use DB_NAME from .env
  const collection = db.collection(`${userId}.${fileId}.${inputIndex}`);

  let parsedResponse,
    finalResponse,
    expCredits,
    inputTokens,
    outputTokens,
    inputDataUsed,
    randBatch,
    totalCost;

  try {
    // Fetch and sanitize random batch
    const documents = await collection.find().toArray();
    if (documents.length === 0) {
      throw new Error("No documents found in the collection.");
    }

    const randomIndex = Math.floor(Math.random() * (documents.length - 1));
    const selectedBatch = documents[randomIndex];

    inputDataUsed = selectedBatch.inputData.map((data) =>
      data.replace(/\n/g, " ").trim()
    );
    randBatch = { _id: selectedBatch._id, inputData: inputDataUsed[0] };

    console.log("Sanitized RandBatch:", randBatch);

    // Create thread with experiment prompt
    const threadResponse = await openai.beta.threads.create({
      messages: [{ role: "user", content: expPrompt }],
      metadata: { user: userId, fileId },
    });
    const threadId = threadResponse.id;

    console.log("Thread created:", threadId);

    // Create run with random batch data
    const runResponse = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_messages: [
        { role: "user", content: JSON.stringify(inputDataUsed) },
      ],
      metadata: { fileId, experimentId: experimentId.toString() },
    });

    const runId = runResponse.id;
    console.log(`Run created with ID: ${runId}`);

    // Poll for run completion
    const assistantResponse = await waitForRunCompletion(threadId, runId);

    // Retrieve the last message
    const lastMessage = await openai.beta.threads.messages.list(threadId, {
      limit: 1,
    });
    const lastMessageId = lastMessage.data[0].id;
    const lastAssistantMessage = await openai.beta.threads.messages.retrieve(
      threadId,
      lastMessageId
    );

    if (lastAssistantMessage.error) {
      throw new Error(
        "Error retrieving the last message: " +
          lastAssistantMessage.error.message
      );
    }

    // Parse the assistant's response
    parsedResponse = JSON.parse(lastAssistantMessage.content[0].text.value);

    // Check if the parsed response already has an outputData property, and wrap only if needed.
    finalResponse = parsedResponse.hasOwnProperty("outputData")
      ? parsedResponse
      : { outputData: parsedResponse };

    // Calculate token costs and credits
    inputTokens = assistantResponse.usage?.prompt_tokens || 0;
    outputTokens = assistantResponse.usage?.completion_tokens || 0;

    const inputCost = (inputTokens / 1000000) * TOKEN_COSTS.input;
    const outputCost = (outputTokens / 1000000) * TOKEN_COSTS.output;
    totalCost = inputCost + outputCost;

    expCredits = ((totalCost / 0.01) * 100).toFixed(4);

    console.log(
      `Tokens: Input=${inputTokens}, Output=${outputTokens}, Total=${
        inputTokens + outputTokens
      }, Cost=$${totalCost.toFixed(4)}, Sproutokens=${expCredits}`
    );

    // Clean up the thread
    await openai.beta.threads.del(threadId);
    console.log("Thread deleted:", threadId);
  } catch (error) {
    console.error("Error during experiment logic:", error.message);
    throw error;
  } finally {
    await mongoClient.close(); // Ensure MongoDB connection is closed
  }

  return {
    parsedResponse: finalResponse,
    expCredits,
    inputTokens,
    outputTokens,
    randBatch,
    inputDataUsed,
    totalCost: parseFloat(totalCost.toFixed(4)),
  };
}

// Controller for the experiment API
exports.runExperiment = async (req, res) => {
  const { userId, fileId, inputIndex, expPrompt, experimentId } = req.body;

  if (
    !userId ||
    !fileId ||
    inputIndex === undefined ||
    !expPrompt ||
    !experimentId
  ) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided." });
  }

  try {
    console.log("Experiment request received:", req.body);

    const {
      parsedResponse,
      expCredits,
      inputTokens,
      outputTokens,
      randBatch,
      inputDataUsed,
      totalCost,
    } = await performExperimentLogic(
      userId,
      fileId,
      inputIndex,
      expPrompt,
      experimentId
    );

    // Calculate total tokens and cost
    const totalTokens = inputTokens + outputTokens;

    res.status(200).json({
      message: "Experiment completed successfully.",
      parsedResponse,
      inputData: inputDataUsed,
      randBatch,
      expCredits,
      inputTokens,
      outputTokens,
      totalTokens,
      totalCost,
    });
  } catch (error) {
    console.error("Error in runExperiment:", error.message);
    res.status(500).json({ error: "Internal Server Error." });
  }
};
