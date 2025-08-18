const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Import routes
const experimentRoutes = require("./routes/startExperimentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/exp", experimentRoutes);

module.exports = app;
