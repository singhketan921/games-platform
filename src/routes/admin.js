const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminHmacAuth = require("../middleware/adminHmacAuth");

router.get("/players", adminHmacAuth, adminController.getPlayers);
router.get("/wallets", adminHmacAuth, adminController.getWallets);
router.get("/games", adminHmacAuth, adminController.getGames);

router.get("/tenants", adminHmacAuth, adminController.getTenants);
router.patch("/tenants/:id", adminHmacAuth, adminController.updateTenant);
router.patch("/tenants/:id/status", adminHmacAuth, adminController.updateTenantStatus);
router.delete("/tenants/:id", adminHmacAuth, adminController.deleteTenant);

module.exports = router;
