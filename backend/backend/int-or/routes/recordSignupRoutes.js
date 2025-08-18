const express = require("express");
const { recordSignup } = require("../controllers/recordSignUpController");

const router = express.Router();

// Route for recording user signup
router.post("/record-signup", recordSignup);

module.exports = router;
