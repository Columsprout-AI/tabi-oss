if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const axios = require("axios");
const {
  mongoClient,
  connectToMongoDB,
  openai,
  assistantId,
} = require("../utils/Mongo.js"); // mongoClient and openai are defined in utils.js

// Constants
const TOKEN_COSTS = {
  input: Number(process.env.TOKEN_COST_PER_MILLION_INPUT || 0.15),
  output: Number(process.env.TOKEN_COST_PER_MILLION_OUTPUT || 0.6),
};
const MAX_RETRIES   = Number(process.env.MAX_RUN_RETRIES || 20);
const RETRY_DELAY_MS = Number(process.env.RUN_RETRY_DELAY_MS || 5000);
const INTOR_URL = process.env.INTOR_URL;

// Actual processing logic
async function performProcessing(
  userId,
  fileId,
  projectId,
  projectPrompt,
  inputIndex
) {
  await connectToMongoDB(); // Ensure MongoDB connection is established
  const db = mongoClient.db(process.env.DB_NAME); // Use DB_NAME from .env
  const collection = db.collection(`${userId}.${fileId}.${inputIndex}`);

  let i = 0;
  let projectInputTokens = 0;
  let projectOutputTokens = 0;
  let projectTokens = 0; // Total tokens used
  let projectCredits = 0; // Total credits accumulated
  let totalCost = 0; // Total cost accumulated

  try {
    while (true) {
      const inputDocument = await collection.find().skip(i).limit(1).toArray();
      if (inputDocument.length === 0) break; // add error line here

      // const inputData = inputDocument[0].inputData;
      const inputData = inputDocument[0].inputData.map((data) =>
        data.replace(/\n/g, " ").trim()
      );

      // 1: Create thread with initial prompt
      const threadResponse = await openai.beta.threads.create({
        messages: [{ role: "user", content: projectPrompt }],
        metadata: { user: userId, fileId: fileId },
      });
      const threadId = threadResponse.id;
      console.log("Thread created:", threadId);

      // 2: Create run and send the batch data
      const runResponse = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        additional_messages: [
          { role: "user", content: JSON.stringify(inputData) },
        ],
        metadata: { fileId: fileId },
      });
      const runId = runResponse.id;
      console.log(`Run created with ID: ${runId}`);

      // 2.1: Poll for status and wait for completion
      const runDetails = await waitForRunCompletion(threadId, runId);

      // 3: Fetch token usage and calculate costs/credits
      const inputTokens = runDetails.usage?.prompt_tokens || 0;
      const outputTokens = runDetails.usage?.completion_tokens || 0;

      const inputCost = (inputTokens / 1000000) * TOKEN_COSTS.input;
      const outputCost = (outputTokens / 1000000) * TOKEN_COSTS.output;
      const batchCost = inputCost + outputCost;
      const batchCredits = (batchCost / 0.01) * 100;

      // Increment cumulative totals
      projectInputTokens += inputTokens;
      projectOutputTokens += outputTokens;
      projectTokens += inputTokens + outputTokens;
      totalCost += batchCost;
      projectCredits += batchCredits;

      console.log(
        `Batch Tokens: Input=${inputTokens}, Output=${outputTokens}, Total=${
          inputTokens + outputTokens
        }, Batch Cost=$${batchCost.toFixed(4)}, Batch Credits=${batchCredits}`
      );

      // 4: Retrieve the response content
      const lastMessageId = (
        await openai.beta.threads.messages.list(threadId, { limit: 1 })
      ).data[0].id;

      const lastAssistantMessage = await openai.beta.threads.messages.retrieve(
        threadId,
        lastMessageId
      );
      if (lastAssistantMessage.error) {
        console.error(
          "Error retrieving the last message:",
          lastAssistantMessage.error
        );
      } else {
        console.log(lastAssistantMessage.content[0].text.value);
      }

      let parsedMessage;
      const rawText = lastAssistantMessage.content[0].text.value.trim();

      try {
        parsedMessage = JSON.parse(rawText);
      } catch (e) {
        console.warn("Failed to parse assistant response:", e.message);
        throw new Error("Assistant response is not valid JSON.");
      }

      let parsedOutputData;

      if (Array.isArray(parsedMessage)) {
        parsedOutputData = parsedMessage;
      } else if (Array.isArray(parsedMessage.outputData)) {
        parsedOutputData = parsedMessage.outputData;
      } else {
        console.error("Unexpected response format: No valid outputData found.");
        return;
      }

      //   const match = rawText.match(/{[\s\S]*}/); // extract everything between first `{` and last `}`
      //   if (match) {
      //     try {
      //       parsedMessage = JSON.parse(match[0]);
      //     } catch (e2) {
      //       console.error("Failed to parse cleaned JSON:", e2.message);
      //       throw new Error("Final JSON parse failed in processing.");
      //     }
      //   } else {
      //     console.error("No valid JSON block found in assistant response.");
      //     throw new Error("Malformed assistant response, no JSON detected.");
      //   }
      // }
      // 5: Parse response and update MongoDB
      // const parsedMessage = JSON.parse(
      //   lastAssistantMessage.content[0].text.value
      // );
      // const parsedOutputData = parsedMessage.outputData;

      console.log("Output data: ", parsedOutputData);

      if (Array.isArray(parsedOutputData)) {
        await collection.updateOne(
          { _id: inputDocument[0]._id },
          { $set: { outputData: parsedOutputData } }
        );
      } else {
        console.error(
          "Unexpected response format: 'outputData' not found or is not an array."
        );
      }

      // 6: Delete thread
      // await openai.beta.threads.del(threadId);
      // console.log("Thread deleted:", threadId);

      i++;
    }

    console.log(
      `Total Tokens: Input=${projectInputTokens}, Output=${projectOutputTokens}`
    );
    console.log(
      `Total Credits: ${Math.ceil(
        projectCredits
      )}, Total Cost: $${totalCost.toFixed(4)}` //doubt
    );

    return {
      projectCredits,
      projectTokens,
      projectInputTokens,
      projectOutputTokens,
      totalCost,
    };
  } catch (error) {
    console.error("Error during processing:", error.message);
    throw error;
  }
}

// Wait for the assistant run to complete
async function waitForRunCompletion(threadId, runId) {
  let isComplete = false;
  let attempts = 0;
  let runResponse;

  while (!isComplete && attempts < MAX_RETRIES) {
    try {
      runResponse = await openai.beta.threads.runs.retrieve(threadId, runId);
    } catch (error) {
      console.error(
        `Error retrieving run response for threadId=${threadId} and runId=${runId}:`,
        error.message
      );
      // continue; // Skip this iteration or decide how to handle this failure
    }

    if (!runResponse || !runResponse.status) {
      throw new Error("Invalid runResponse or missing status field.");
    } // removed runStatus - redundant var - @meghav

    if (runResponse.status === "completed") {
      isComplete = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS)); // Wait for 5 seconds before retrying
      attempts++;
    }
  }

  if (runResponse.status !== "completed") {
    throw new Error(
      `Failed to retrieve assistant run response after ${MAX_RETRIES} attempts.`
    );
  }

  return runResponse;
}

// Controller for the start-processing API
exports.startProcessing = async (req, res) => {
  const { sessionId, userId, fileId, inputIndex, projectPrompt, projectId } =
    req.body;

  // Validate input
  if (
    !userId ||
    !fileId ||
    !projectId ||
    !projectPrompt ||
    inputIndex === undefined
  ) {
    return res.status(400).json({
      error:
        "userId, fileId, projectId, projectPrompt, and inputIndex are required",
    });
  }

  try {
    // Step 1: Respond to the API with status as "started"
    res.status(200).json({ status: "started" });

    // Step 2: Log the received data for debugging
    console.log(`Received start-processing request:`, {
      userId,
      fileId,
      inputIndex,
      projectPrompt,
      projectId,
    });

    // Step 3: Perform the actual processing logic
    const {
      projectCredits,
      projectTokens,
      projectInputTokens,
      projectOutputTokens,
      totalCost,
    } = await performProcessing(
      userId,
      fileId,
      projectId,
      projectPrompt,
      inputIndex
    );

    // Step 4: Send a webhook to int-or service with projectId and projectCredits
    await axios.post(`${INTOR_URL}/api/intor/processing-webhook`, {
      sessionId,
      fileId,
      projectId,
      userId,
      projectCredits: Math.ceil(projectCredits), // Send rounded-up credits
      projectTokens,
      projectInputTokens,
      projectOutputTokens,
      totalCost: totalCost.toFixed(4),
      inputIndex,
    });

    console.log("Webhook sent successfully.");
  } catch (error) {
    console.error("Error during start-processing:", error.message);
  }
};
