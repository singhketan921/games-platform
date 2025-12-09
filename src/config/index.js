const path = require("path");

// Load environment variables once for the entire process.
const dotenvPath = process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), ".env");
require("dotenv").config({ path: dotenvPath });

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
    env: process.env.NODE_ENV || "development",
    port: toNumber(process.env.PORT, 4000),
    databaseUrl: process.env.DATABASE_URL,
    admin: {
        apiKey: process.env.ADMIN_API_KEY,
        apiSecret: process.env.ADMIN_API_SECRET,
    },
    auth: {
        tokenSecret: process.env.AUTH_TOKEN_SECRET || process.env.ADMIN_API_SECRET || "dev-auth-secret",
        tokenTtlSeconds: toNumber(process.env.OAUTH_TOKEN_TTL_SECONDS, 900),
    },
    security: {
        hmacWindowSeconds: toNumber(process.env.HMAC_WINDOW_SECONDS, 300),
        nonceCacheMinutes: toNumber(process.env.HMAC_NONCE_CACHE_MINUTES, 10),
    },
    sessions: {
        accessTtlSeconds: toNumber(process.env.SESSION_TTL_SECONDS, 600),
    },
    gameEngine: {
        apiKey: process.env.GAME_ENGINE_API_KEY || "game-engine-dev-key",
    },
};

module.exports = config;
