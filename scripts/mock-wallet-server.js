#!/usr/bin/env node
/**
 * Minimal wallet stub for local load testing.
 * Responds to debit/credit/balance calls with success payloads instantly.
 */

const http = require("http");

const port = Number(process.env.MOCK_WALLET_PORT || 5050);
const host = process.env.MOCK_WALLET_HOST || "127.0.0.1";

const server = http.createServer((req, res) => {
    const respond = (status, payload) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(payload));
    };

    const url = req.url.split("?")[0];
    const method = req.method.toUpperCase();
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
        let payload = {};
        if (chunks.length) {
            try {
                payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            } catch (err) {
                return respond(400, { error: "Invalid JSON payload", details: err.message });
            }
        }

        if (url === "/balance" && method === "GET") {
            return respond(200, { success: true, balance: "1000.00", currency: "USD" });
        }

        if (url === "/debit" && method === "POST") {
            const reference = payload.reference || `mock-debit-${Date.now()}`;
            return respond(200, { success: true, reference });
        }

        if (url === "/credit" && method === "POST") {
            const reference = payload.reference || `mock-credit-${Date.now()}`;
            return respond(200, { success: true, reference });
        }

        return respond(404, { error: "Not found", method, url });
    });
});

server.listen(port, host, () => {
    console.log(`[mock-wallet] listening on http://${host}:${port}`);
});

const shutdown = () => {
    server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
