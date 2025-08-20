const express = require("express");
const { runExperiment } = require("../controllers/startExperimentController");

const router = express.Router();

// Route for running an experiment
router.post("/start-experiment", runExperiment);

module.exports = router;
