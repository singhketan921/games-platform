const express = require("express");
const router = express.Router();
const gameEngineAuth = require("../middleware/gameEngineAuth");
const gameEngineController = require("../controllers/gameEngineController");
const reconciliationController = require("../controllers/reconciliationController");

router.get("/sessions/:sessionId", gameEngineAuth, gameEngineController.getSessionContext);
router.get("/tenants/:tenantId/games", gameEngineAuth, gameEngineController.getTenantGames);
router.get("/tenants/:tenantId/games/:gameId", gameEngineAuth, gameEngineController.getTenantGame);
router.post("/rounds", gameEngineAuth, reconciliationController.logRoundResult);

module.exports = router;
