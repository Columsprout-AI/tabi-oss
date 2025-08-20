const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const creditEstimationRoutes = require("./routes/creditEstimationRoutes");
const startProcessingRoutes = require("./routes/startProcessingRoutes");

const app = express();

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser.json()); // Parse JSON bodies

// Routes
app.use("/api/proc", creditEstimationRoutes); // Route for credit estimation
app.use("/api/proc", startProcessingRoutes); // Route for processing logic

module.exports = app;
