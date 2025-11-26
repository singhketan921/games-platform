const hmacAuth = require("../middleware/hmacAuth");

module.exports = (app) => {
    app.use("/tenant", require("./tenant")); // for creating tenants
    
    // Game routes
    app.use("/games", require("./games"));
    app.use("/wallet", require("./wallet"));
    app.use("/game-callback", require("./callback"));
    app.use("/history", require("./history"));
    app.use("/admin", require("./admin"));




};
