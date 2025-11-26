const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const hmacAuth = require("../middleware/hmacAuth");

// Protect with HMAC because only tenant dashboards should access
router.get("/players", hmacAuth, adminController.getPlayers);
router.get("/wallets", hmacAuth, adminController.getWallets);
router.get("/games", hmacAuth, adminController.getGames);

module.exports = router;
