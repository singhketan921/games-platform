const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const hmacAuth = require("../middleware/hmacAuth");

// ADMIN ROUTES (no HMAC needed for now)
router.post("/create", gameController.createGame);
router.get("/all", gameController.getAllGames);

// TENANT ROUTES (HMAC protected)
router.post("/assign", hmacAuth, gameController.assignGameToTenant);
router.get("/", hmacAuth, gameController.getTenantGames);
router.post("/launch", hmacAuth, gameController.launchGame);

router.post("/launch", hmacAuth, gameController.launchGame);

module.exports = router;
