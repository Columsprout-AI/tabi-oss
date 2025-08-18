const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectMongoDB } = require("./utils/mongoConfig");

const ingestionRoutes = require("./routes/ingestionRoutes");
const outputPathRoutes = require("./routes/outputPathRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize MongoDB Connection
connectMongoDB();

// Routes
app.use("/api/ing", ingestionRoutes);
app.use("/api/ing", outputPathRoutes);

// Start the server
module.exports = app;
