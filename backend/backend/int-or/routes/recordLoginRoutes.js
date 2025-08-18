const express = require("express");
const { recordLogin } = require("../controllers/recordLoginController");
const router = express.Router();

router.post("/record-login", recordLogin);

module.exports = router;
