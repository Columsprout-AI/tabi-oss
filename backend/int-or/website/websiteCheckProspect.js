require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

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

// Controller logic to handle the prospect check
const handleCheckProspect = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ message: "Missing phone number" });
  }

  console.log("Prospect check request received.");

  try {
    const existingProspect = await Prospect.findOne({ phoneNumber });
    if (existingProspect) {
      console.log("Existing prospect: ", existingProspect);
      return res.status(200).json({
        status: 1,
        prospectId: existingProspect.prospectId,
      });
    }
    return res.status(200).json({
      status: 0,
    });
  } catch (error) {
    console.error("Error checking prospect:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Define the POST route for checking prospect
router.post("/website-check-prospect", handleCheckProspect);

module.exports = router;
