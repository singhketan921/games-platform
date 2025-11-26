const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");

router.post("/create", tenantController.createTenant);

module.exports = router;
