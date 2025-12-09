const express = require("express");
const router = express.Router();
const hmacAuth = require("../middleware/hmacAuth");
const gameEngineAuth = require("../middleware/gameEngineAuth");
const sessionController = require("../controllers/sessionController");

router.post("/verify", hmacAuth, sessionController.verifyToken);
router.get("/access/:sessionId", gameEngineAuth, sessionController.resolve);
router.post("/access/:sessionId/close", gameEngineAuth, sessionController.close);

module.exports = router;
