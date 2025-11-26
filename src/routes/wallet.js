const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const hmacAuth = require("../middleware/hmacAuth");

router.get("/balance/:playerId", hmacAuth, walletController.getBalance);
router.post("/debit", hmacAuth, walletController.debit);
router.post("/credit", hmacAuth, walletController.credit);

module.exports = router;
