const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const hmacAuth = require("../middleware/hmacAuth");

router.post("/create", tenantController.createTenant);
router.post("/auth/login", tenantController.loginTenantUser);
router.get("/me", hmacAuth, tenantController.getProfile);
router.get("/reports/ggr", hmacAuth, tenantController.getGgrReport);

module.exports = router;
