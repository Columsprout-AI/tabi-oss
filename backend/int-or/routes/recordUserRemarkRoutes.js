const express = require("express");
const router = express.Router();
const {
  recordUserRemark,
} = require("../controllers/recordUserRemarkController");

// Webhook endpoint for recording user remark
router.post("/record-user-remark", recordUserRemark);

module.exports = router;
