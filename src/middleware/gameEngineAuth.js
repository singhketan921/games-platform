const config = require("../config");

module.exports = function gameEngineAuth(req, res, next) {
    const apiKey = req.header("X-GAME-KEY");

    if (!apiKey || apiKey !== config.gameEngine.apiKey) {
        return res.status(401).json({ error: "Invalid game engine key" });
    }

    next();
};
