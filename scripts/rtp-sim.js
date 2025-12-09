#!/usr/bin/env node
require("dotenv").config();

const prisma = require("../src/prisma/client");

const TARGET_RTPS = {
    HIGH: 0.97,
    MEDIUM: 0.95,
    LOW: 0.9,
};

function getArg(name, fallback) {
    const argv = process.argv.slice(2);
    const prefixed = `--${name}=`;
    const direct = argv.find((arg) => arg.startsWith(prefixed));
    if (direct) {
        return direct.slice(prefixed.length);
    }
    const index = argv.indexOf(`--${name}`);
    if (index !== -1 && argv[index + 1]) {
        return argv[index + 1];
    }
    return fallback;
}

function hasFlag(name) {
    return process.argv.includes(`--${name}`);
}

function printUsage() {
    console.log("Usage: node scripts/rtp-sim.js --tenant <tenantId> --game <gameId> [options]");
    console.log("");
    console.log("Options:");
    console.log("  --profile HIGH|MEDIUM|LOW   Target RTP profile (default MEDIUM)");
    console.log("  --rounds <number>           Number of rounds to simulate (default 5000)");
    console.log("  --bet <amount>              Bet amount per round (default 100)");
    console.log("  --currency <code>           Currency code (default INR)");
    console.log("  --playerPrefix <prefix>     Prefix for generated playerIds (default rtp-sim-player)");
    console.log("  --variance <ratio>          Noise multiplier around expected payout (default 0.1)");
    console.log("  --tolerance <ratio>         Allowed RTP deviation before FAIL (default 0.005)");
    console.log("  --batch <number>            Batch size for DB writes (default 500)");
    console.log("  --dry-run                   Skip database writes");
    console.log("  --help                      Show this message");
}

function roundCurrency(value) {
    return Math.round(Number(value) * 100) / 100;
}

async function main() {
    if (hasFlag("help")) {
        printUsage();
        process.exit(0);
    }

    const tenantId = getArg("tenant");
    const gameId = getArg("game");
    const profileInput = (getArg("profile", "MEDIUM") || "MEDIUM").toUpperCase();
    const targetRtp = TARGET_RTPS[profileInput];

    if (!tenantId || !gameId) {
        printUsage();
        process.exit(1);
    }
    if (!targetRtp) {
        console.error(`Unknown RTP profile "${profileInput}". Use HIGH, MEDIUM, or LOW.`);
        process.exit(1);
    }

    const roundCount = Number(getArg("rounds", 5000));
    const betAmount = Number(getArg("bet", 100));
    const currency = (getArg("currency", "INR") || "INR").toUpperCase();
    const playerPrefix = getArg("playerPrefix", "rtp-sim-player");
    const variance = Number(getArg("variance", 0.1));
    const tolerance = Number(getArg("tolerance", 0.005));
    const batchSize = Number(getArg("batch", 500));
    const dryRun = hasFlag("dry-run");

    if (!Number.isFinite(roundCount) || roundCount <= 0) {
        console.error("Round count must be a positive number");
        process.exit(1);
    }
    if (!Number.isFinite(betAmount) || betAmount <= 0) {
        console.error("Bet amount must be a positive number");
        process.exit(1);
    }

    let totalBets = 0;
    let totalPayouts = 0;
    let inserted = 0;
    const dataBatch = [];

    const saveBatch = async () => {
        if (dryRun || dataBatch.length === 0) {
            dataBatch.length = 0;
            return;
        }
        await prisma.roundResult.createMany({
            data: dataBatch,
        });
        inserted += dataBatch.length;
        dataBatch.length = 0;
    };

    for (let i = 0; i < roundCount; i += 1) {
        const bet = betAmount;
        totalBets += bet;
        const randomNoise = (Math.random() * 2 - 1) * bet * variance;
        const expected = bet * targetRtp;
        let payout = roundCurrency(expected + randomNoise);
        if (payout < 0) payout = 0;
        totalPayouts += payout;

        const discrepancy = payout - bet;
        const perRoundDeviation = Math.abs(payout - expected);
        const status = perRoundDeviation > bet * variance * 1.5 ? "MISMATCH" : "RECONCILED";

        const roundRecord = {
            tenantId,
            gameId,
            playerId: `${playerPrefix}-${i}`,
            betAmount: bet.toFixed(2),
            payoutAmount: payout.toFixed(2),
            currency,
            rtpProfile: profileInput,
            status,
            discrepancy: discrepancy.toFixed(2),
            metadata: {
                simulation: true,
                iteration: i,
                targetRtp,
            },
        };

        dataBatch.push(roundRecord);
        if (!dryRun && dataBatch.length >= batchSize) {
            await saveBatch();
        }
    }

    await saveBatch();

    const actualRtp = totalPayouts / totalBets;
    const delta = actualRtp - targetRtp;
    const withinTolerance = Math.abs(delta) <= tolerance;

    console.log("RTP Simulation Summary");
    console.log("----------------------");
    console.log(`Tenant/Game: ${tenantId} / ${gameId}`);
    console.log(`Profile: ${profileInput} (target ${(targetRtp * 100).toFixed(2)}%)`);
    console.log(`Rounds simulated: ${roundCount}`);
    console.log(`Total bets: ${totalBets.toFixed(2)} ${currency}`);
    console.log(`Total payouts: ${totalPayouts.toFixed(2)} ${currency}`);
    console.log(`Actual RTP: ${(actualRtp * 100).toFixed(2)}% (delta ${(delta * 100).toFixed(2)}%)`);
    console.log(`Tolerance: ±${(tolerance * 100).toFixed(2)}% -> ${withinTolerance ? "PASS" : "FAIL"}`);
    console.log(`Database writes: ${dryRun ? "skipped (dry run)" : inserted}`);

    if (!withinTolerance) {
        console.warn("WARNING: Simulation deviated beyond tolerance. Investigate RTP configuration or adjust variance.");
    }
}

main()
    .catch((err) => {
        console.error("Simulation failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
