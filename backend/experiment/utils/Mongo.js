require("dotenv").config();
const { MongoClient } = require("mongodb");
const OpenAI = require("openai");

// MongoDB configuration
const mongoClient = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongoDB() {
  try {
    if (!mongoClient.isConnected) {
      await mongoClient.connect();
      console.log("Connected to MongoDB successfully.");
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // OpenAI API Key from .env
});

// Assistant ID configuration
const assistantId = process.env.ASSISTANT_ID;

module.exports = { mongoClient, connectToMongoDB, openai, assistantId };
