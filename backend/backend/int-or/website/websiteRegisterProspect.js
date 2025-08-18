require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Create an Express router
const router = express.Router();

const COLLECTION_NAME = process.env.PROSPECTS_COLLECTION;

// Create (or reuse) a Mongoose model for prospects.
const Prospect =
  mongoose.models.Prospect ||
  mongoose.model(
    "Prospect",
    new mongoose.Schema(
      {
        prospectId: { type: String, required: true },
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        createdAt: { type: Date, required: true },
      },
      { collection: COLLECTION_NAME }
    )
  );

// Controller logic to handle the prospect registration
const handleRegisterProspect = async (req, res) => {
  const { fullName, email, phoneNumber, createdAt } = req.body;

  // Validate required fields
  if (!fullName || !email || !phoneNumber || !createdAt) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  console.log("User details received");

  try {
    // Generate a new UUID for the prospectId
    const prospectId = uuidv4();

    // Create and save a new prospect document
    const newProspect = new Prospect({
      prospectId,
      fullName,
      email,
      phoneNumber,
      createdAt,
    });
    await newProspect.save();

    console.log("Prospect created: ", newProspect.prospectId);

    return res.status(201).json({
      prospectId,
    });
  } catch (error) {
    console.error("Error processing prospect:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Define the POST route for registering prospect
router.post("/website-register-prospect", handleRegisterProspect);

module.exports = router;
