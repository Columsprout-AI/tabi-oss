// utils/Mongo.js
require("dotenv").config();
const { MongoClient } = require("mongodb");
const OpenAI = require("openai");

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not set");
}

const mongoClient = new MongoClient(process.env.MONGO_URI);

// single connect for the whole process
let connectPromise = null;
async function connectToMongoDB() {
  if (!connectPromise) {
    connectPromise = mongoClient
      .connect()
      .then(() => {
        console.log("Connected to MongoDB successfully.");
        return mongoClient;
      })
      .catch((err) => {
        connectPromise = null; // allow retry on next call
        console.error("Error connecting to MongoDB:", err);
        throw err;
      });
  }
  return connectPromise;
}

// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const assistantId = process.env.ASSISTANT_ID;

module.exports = { mongoClient, connectToMongoDB, openai, assistantId };
