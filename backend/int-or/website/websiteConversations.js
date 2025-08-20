// websiteConversations.js
require("dotenv").config(); // Load dotenv configuration

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Define the message sub-schema
const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

// Define the conversation schema using the collection name from the environment variable
const conversationSchema = new mongoose.Schema(
  {
    prospectId: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    startedAt: { type: Date, required: true },
    messages: [messageSchema],
    endedAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: process.env.CONVERSATIONS_COLLECTION,
  }
);

// Create the model
const Conversation = mongoose.model("Conversation", conversationSchema);

// Controller function to create a conversation document
const createConversation = async (req, res) => {
  try {
    // Retrieve data from the request body
    const conversationData = req.body;

    console.log("Conversation received");

    // Optionally, add createdAt (schema default will work as well)
    conversationData.createdAt = new Date();

    // Create and save the conversation document in MongoDB
    const conversation = await Conversation.create(conversationData);

    console.log("Conversation logged");
    // Respond with success and the document ID
    res.status(201).json({
      message: "Conversation saved successfully",
      id: conversation._id,
    });
  } catch (error) {
    console.error("Error saving conversation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Define the POST route for website conversations
router.post("/website-conversations", createConversation);

// Export the router so it can be imported in app.js
module.exports = router;
