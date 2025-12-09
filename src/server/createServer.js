const express = require("express");
const cors = require("cors");
const routes = require("../routes");
const metrics = require("../utils/metrics");

const captureRawBody = (req, res, buf) => {
    req.rawBody = buf?.toString("utf8") ?? "";
};

function createServer() {
    const app = express();
    app.use(cors());
    app.use(express.json({ verify: captureRawBody }));
    app.use(express.urlencoded({ extended: true, verify: captureRawBody }));

    app.get("/health", (req, res) => {
        res.json({ status: "ok" });
    });
    app.get("/metrics", async (_req, res) => {
        res.setHeader("Content-Type", metrics.register.contentType);
        res.send(await metrics.getMetrics());
    });

    routes(app);
    return app;
}

module.exports = createServer;
