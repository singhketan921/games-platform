const express = require("express");

module.exports = (app) => {
    const gateway = express.Router();

    gateway.use("/tenant", require("./tenant"));
    gateway.use("/games", require("./games"));
    gateway.use("/wallet", require("./wallet"));
    gateway.use("/game-callback", require("./callback"));
    gateway.use("/history", require("./history"));
    gateway.use("/sessions", require("./session"));
    gateway.use("/game-engine", require("./gameEngine"));
    gateway.use("/admin/users", require("./adminUsers"));
    gateway.use("/admin", require("./admin"));
    gateway.use("/oauth", require("./oauth"));

    app.use("/", gateway);
};
