const express = require("express");
const { logUserLogout } = require("../controllers/recordLogoutController");
// const attachUserId = require("../middleware/attachUserId");
const router = express.Router();

// Route to log user logout
router.post("/record-logout", /* attachUserId,*/ logUserLogout);

module.exports = router;
