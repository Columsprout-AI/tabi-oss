require("./utils/cronConversionRate"); // cron scheduler for the daily conversion rate update
require("./utils/cronPGCleanup"); // cron scheduler for pgsql cleanup

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectMongoDB } = require("./utils/mongoConfig");

const loginRoutes = require("./routes/recordLoginRoutes");
const uploadRoutes = require("./routes/uploadFiletoGCPRoutes");
const fileRoutes = require("./routes/uploadFileRoutes"); // File routes
const ingestionRoutes = require("./routes/ingestionRoutes");
const experimentRoutes = require("./routes/experimentRoutes");
const creditEstimationRoutes = require("./routes/creditEstimationRoutes");
const processingRoutes = require("./routes/processingRoutes"); // Routes for processing prompts
const exportRoutes = require("./routes/exportRoutes");
const logoutRoutes = require("./routes/recordLogoutRoutes");
const recordUserRemarkRoutes = require("./routes/recordUserRemarkRoutes");
const recordSignupRoutes = require("./routes/recordSignupRoutes");
const clerkWebhookRoutes = require("./routes/clerkWebhookRoutes");
const paymentRoutes = require("./routes/razorpayPaymentsRoutes");
const statusRoutes = require("./routes/razorpayStatusRoutes");
const websiteCheckProspect = require("./website/websiteCheckProspect");
const websiteRegisterProspect = require("./website/websiteRegisterProspect");
const websiteConversations = require("./website/websiteConversations");

const app = express();

app.use(cors()); // CORS Middleware

app.use("/webhook/intor", clerkWebhookRoutes); // Clerk webhook to be mounted before the body parser

app.use(bodyParser.json()); // Body parser middleware

// Connect to MongoDB using Mongoose
connectMongoDB();

// Routes
app.use("/api/intor", recordSignupRoutes); //Register sign-up route
app.use("/api/intor", loginRoutes);
app.use("/api/intor", uploadRoutes);
app.use("/api/intor", fileRoutes); // New file route
app.use("/api/intor", ingestionRoutes); // Ingestion route
app.use("/api/intor", experimentRoutes); // Ingestion route
app.use("/api/intor", creditEstimationRoutes); // Route for credit estimation
app.use("/api/intor", processingRoutes); // Register the processing routes
app.use("/api/intor", exportRoutes); // Register export-related routes
app.use("/api/intor", logoutRoutes); // Register logout-related routes
app.use("/api/intor", recordUserRemarkRoutes); // Register user remark-related routes
app.use("/api/intor", paymentRoutes); // Register Payment Routes
app.use("/api/intor", statusRoutes); // Register payment status routes

// Website routes
app.use("/api/intor", websiteCheckProspect);
app.use("/api/intor", websiteRegisterProspect);
app.use("/api/intor", websiteConversations);

module.exports = app;
