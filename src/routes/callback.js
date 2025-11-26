const express = require("express");
const router = express.Router();
const callbackController = require("../controllers/callbackController");

// No tenant HMAC here — this is called by your internal game engine
router.post("/", callbackController.handleGameCallback);

module.exports = router;
