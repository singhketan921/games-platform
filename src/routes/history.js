const express = require("express");
const router = express.Router();

const hmacAuth = require("../middleware/hmacAuth");
const historyController = require("../controllers/historyController");

// List all sessions for this tenant
router.get("/sessions", hmacAuth, historyController.getAllSessions);

// One session + related transactions
router.get("/sessions/:sessionId", hmacAuth, historyController.getSessionById);

// All sessions for a specific player
router.get("/players/:playerId", hmacAuth, historyController.getPlayerHistory);

// All wallet transactions for this tenant
router.get("/transactions", hmacAuth, historyController.getTransactions);

// Wallet tx history for a single player
router.get("/wallet/:playerId", hmacAuth, historyController.getWalletHistory);

// Closed sessions seen as callbacks
router.get("/callbacks", hmacAuth, historyController.getCallbackHistory);

module.exports = router;
