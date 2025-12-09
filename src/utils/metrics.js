const client = require("prom-client");

const register = new client.Registry();
let stopDefaultMetrics = null;
const shouldCollect = process.env.NODE_ENV !== "test" && process.env.DISABLE_PROM_METRICS !== "true";
if (shouldCollect) {
    stopDefaultMetrics = client.collectDefaultMetrics({ register });
}

const walletCallbackCounter = new client.Counter({
    name: "wallet_callback_total",
    help: "Total wallet adapter callbacks recorded by status and tenant",
    labelNames: ["tenantId", "type", "status"],
    registers: [register],
});

const roundResultCounter = new client.Counter({
    name: "round_result_total",
    help: "Total game round results recorded",
    labelNames: ["tenantId", "gameId", "status", "currency"],
    registers: [register],
});

const roundBetAmount = new client.Counter({
    name: "round_result_bet_amount",
    help: "Aggregate bet amount recorded for reconciliation",
    labelNames: ["tenantId", "gameId", "rtpProfile", "currency"],
    registers: [register],
});

const roundPayoutAmount = new client.Counter({
    name: "round_result_payout_amount",
    help: "Aggregate payout amount recorded for reconciliation",
    labelNames: ["tenantId", "gameId", "rtpProfile", "currency"],
    registers: [register],
});

const roundDiscrepancyAmount = new client.Counter({
    name: "round_result_discrepancy_amount",
    help: "Aggregate discrepancy amount (payout minus bet) recorded",
    labelNames: ["tenantId", "gameId", "rtpProfile", "currency"],
    registers: [register],
});

function normalize(value, fallback = "unknown") {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
}

function toNumber(value) {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function recordWalletCallback({ tenantId, type, status }) {
    walletCallbackCounter.inc({
        tenantId: normalize(tenantId),
        type: normalize(type),
        status: normalize(status),
    });
}

function recordRoundResult({ tenantId, gameId, status, rtpProfile, currency, betAmount, payoutAmount, discrepancy }) {
    const labels = {
        tenantId: normalize(tenantId),
        gameId: normalize(gameId),
        status: normalize(status),
        currency: normalize(currency),
    };
    roundResultCounter.inc(labels);

    const amountLabels = {
        tenantId: labels.tenantId,
        gameId: labels.gameId,
        rtpProfile: normalize(rtpProfile),
        currency: labels.currency,
    };
    roundBetAmount.inc(amountLabels, toNumber(betAmount));
    roundPayoutAmount.inc(amountLabels, toNumber(payoutAmount));
    roundDiscrepancyAmount.inc(amountLabels, toNumber(discrepancy));
}

async function getMetrics() {
    return register.metrics();
}

module.exports = {
    register,
    recordWalletCallback,
    recordRoundResult,
    getMetrics,
    stopDefaultMetrics: () => {
        if (typeof stopDefaultMetrics === "function") {
            stopDefaultMetrics();
            stopDefaultMetrics = null;
        }
    },
};
