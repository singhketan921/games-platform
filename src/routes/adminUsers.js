const express = require("express");
const router = express.Router();
const adminHmacAuth = require("../middleware/adminHmacAuth");
const adminUserController = require("../controllers/adminUserController");

router.get("/", adminHmacAuth, adminUserController.list);
router.post("/", adminHmacAuth, adminUserController.create);
router.patch("/:id", adminHmacAuth, adminUserController.update);

module.exports = router;
