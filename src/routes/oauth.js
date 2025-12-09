const express = require("express");
const router = express.Router();
const oauthController = require("../controllers/oauthController");

router.post("/token", oauthController.token);

module.exports = router;
