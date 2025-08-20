// clerkWebhookRoutes.js
const express = require("express");
const router = express.Router();
const { handleClerkWebhook } = require("../controllers/clerkWebhookController");

// define the route and import `express.raw`
router.post(
  "/clerk",
  express.raw({ type: "application/json", limit: "1mb" }),
  handleClerkWebhook
);

module.exports = router;
