#!/usr/bin/env node
const path = require("path");

// Ensure dotenv loads values from repo root .env when available.
const dotenvPath = path.resolve(__dirname, "../../.env");
try {
    require("dotenv").config({ path: dotenvPath });
} catch {
    // no-op if dotenv missing
}

const bcrypt = require("bcryptjs");
const prisma = require("../../src/prisma/client");

const DEFAULTS = Object.freeze({
    tenantId: "cmiii1xrl0000u8001obvgpsn",
    tenantName: "bluorng",
    tenantApiKey: "044aae64a33a86bf29d811c3d7cf8043",
    tenantApiSecret: "548ac7141a53ceb18614f8c2c3c6b31e5286826046cc7883eb5235a93a369b67",
    tenantUserId: "cmix7jsnm0001u8xwem0jhblg",
    tenantUserEmail: "loadtest-operator@bluorng.test",
    tenantUserPassword: "LoadTest123!",
    gameId: "cmiddlhzj0001u8k8yd949qtq",
    gameName: "Teen Patti",
    gameType: "teen_patti",
    gameLaunchUrl: "https://example.com/teen_patti",
});

const WALLET_MODES = Object.freeze({
    mock: {
        debitUrl: "http://127.0.0.1:5050/debit",
        creditUrl: "http://127.0.0.1:5050/credit",
        balanceUrl: "http://127.0.0.1:5050/balance",
    },
    httpbin: {
        debitUrl: "https://httpbin.org/post",
        creditUrl: "https://httpbin.org/post",
        balanceUrl: "https://httpbin.org/get",
    },
});

function parseArgs(argv) {
    return argv.reduce((acc, entry) => {
        if (!entry.startsWith("--")) {
            return acc;
        }
        const [key, ...rest] = entry.slice(2).split("=");
        acc[key] = rest.length ? rest.join("=") : "true";
        return acc;
    }, {});
}

function resolveOption(args, name, envKey, fallback) {
    if (args[name]) return args[name];
    if (envKey && process.env[envKey]) return process.env[envKey];
    return fallback;
}

async function ensureTenant({ tenantId, name, apiKey, apiSecret }) {
    return prisma.tenant.upsert({
        where: { id: tenantId },
        update: {
            name,
            apiKey,
            apiSecret,
            status: "active",
        },
        create: {
            id: tenantId,
            name,
            apiKey,
            apiSecret,
            status: "active",
        },
    });
}

async function ensureGame({ gameId, name, type, launchUrl }) {
    return prisma.game.upsert({
        where: { id: gameId },
        update: {
            name,
            type,
            launchUrl,
        },
        create: {
            id: gameId,
            name,
            description: "Load-test harness game",
            launchUrl,
            type,
            status: "active",
            volatility: "Medium",
            rtp: 95.0,
        },
    });
}

async function ensureTenantGame(tenantId, gameId) {
    return prisma.tenantGame.upsert({
        where: {
            tenantId_gameId: {
                tenantId,
                gameId,
            },
        },
        update: {
            isActive: true,
            rtpProfile: "MEDIUM",
        },
        create: {
            tenantId,
            gameId,
            isActive: true,
            rtpProfile: "MEDIUM",
        },
    });
}

async function ensureWalletConfig(tenantId, config) {
    return prisma.tenantWalletConfig.upsert({
        where: { tenantId },
        update: {
            ...config,
            status: "active",
        },
        create: {
            tenantId,
            ...config,
            status: "active",
        },
    });
}

async function ensureTenantUser({ tenantId, userId, email, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.tenantUser.upsert({
        where: { id: userId },
        update: {
            email: email.toLowerCase(),
            role: "OPERATOR",
            status: "active",
            passwordHash,
        },
        create: {
            id: userId,
            tenantId,
            email: email.toLowerCase(),
            role: "OPERATOR",
            status: "active",
            passwordHash,
        },
    });
}

async function seed() {
    const args = parseArgs(process.argv.slice(2));
    const tenantId = resolveOption(args, "tenant-id", "LOADTEST_TENANT_ID", DEFAULTS.tenantId);
    const walletMode = resolveOption(args, "wallet-mode", "LOADTEST_WALLET_MODE", "httpbin").toLowerCase();

    const walletBase =
        WALLET_MODES[walletMode] ||
        WALLET_MODES.httpbin;

    const walletConfig = {
        debitUrl: resolveOption(args, "wallet-debit-url", "LOADTEST_WALLET_DEBIT_URL", walletBase.debitUrl),
        creditUrl: resolveOption(args, "wallet-credit-url", "LOADTEST_WALLET_CREDIT_URL", walletBase.creditUrl),
        balanceUrl: resolveOption(args, "wallet-balance-url", "LOADTEST_WALLET_BALANCE_URL", walletBase.balanceUrl),
        hmacSecret: resolveOption(args, "wallet-secret", "LOADTEST_WALLET_SECRET", "tenant-wallet-secret"),
    };

    const tenant = await ensureTenant({
        tenantId,
        name: resolveOption(args, "tenant-name", "LOADTEST_TENANT_NAME", DEFAULTS.tenantName),
        apiKey: resolveOption(args, "tenant-api-key", "LOADTEST_TENANT_API_KEY", DEFAULTS.tenantApiKey),
        apiSecret: resolveOption(args, "tenant-api-secret", "LOADTEST_TENANT_API_SECRET", DEFAULTS.tenantApiSecret),
    });

    const game = await ensureGame({
        gameId: resolveOption(args, "game-id", "LOADTEST_GAME_ID", DEFAULTS.gameId),
        name: resolveOption(args, "game-name", "LOADTEST_GAME_NAME", DEFAULTS.gameName),
        type: resolveOption(args, "game-type", "LOADTEST_GAME_TYPE", DEFAULTS.gameType),
        launchUrl: resolveOption(
            args,
            "game-launch-url",
            "LOADTEST_GAME_LAUNCH_URL",
            DEFAULTS.gameLaunchUrl
        ),
    });

    await ensureTenantGame(tenant.id, game.id);
    const wallet = await ensureWalletConfig(tenant.id, walletConfig);
    const user = await ensureTenantUser({
        tenantId: tenant.id,
        userId: resolveOption(args, "tenant-user-id", "LOADTEST_TENANT_USER_ID", DEFAULTS.tenantUserId),
        email: resolveOption(args, "tenant-user-email", "LOADTEST_TENANT_USER_EMAIL", DEFAULTS.tenantUserEmail),
        password: resolveOption(
            args,
            "tenant-user-password",
            "LOADTEST_TENANT_USER_PASSWORD",
            DEFAULTS.tenantUserPassword
        ),
    });

    console.log("Load-test seed complete:");
    console.table([
        { item: "Tenant", id: tenant.id, apiKey: tenant.apiKey, apiSecret: tenant.apiSecret },
        { item: "Game", id: game.id, name: game.name },
        { item: "Operator", id: user.id, email: user.email },
        { item: "Wallet", debitUrl: wallet.debitUrl, creditUrl: wallet.creditUrl },
    ]);
}

seed()
    .catch((err) => {
        console.error("Failed to seed load-test data:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
