const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");
const config = require("../config");

const randomHex = (bytes) => crypto.randomBytes(bytes).toString("hex");
const TOKEN_SECRET = config.auth?.tokenSecret || "dev-auth-secret";
const TOKEN_TTL_SECONDS = config.auth?.tokenTtlSeconds || 900;

function base64UrlEncode(value) {
    return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
    return Buffer.from(value, "base64url").toString("utf8");
}

function signSegment(segment) {
    return crypto.createHmac("sha256", TOKEN_SECRET).update(segment).digest("hex");
}

function normalizeScope(scope) {
    if (!scope) return [];
    if (Array.isArray(scope)) return scope.filter(Boolean);
    return scope
        .split(" ")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

async function findCredentialByClientId(clientId) {
    if (!clientId) return null;
    return prisma.tenantCredential.findUnique({
        where: { clientId },
    });
}

async function upsertTenantCredential(tenantId) {
    const clientId = `cl_${randomHex(12)}`;
    const clientSecret = randomHex(32);
    const clientSecretHash = await bcrypt.hash(clientSecret, 12);

    await prisma.tenantCredential.upsert({
        where: { tenantId },
        update: {
            clientId,
            clientSecretHash,
            status: "active",
        },
        create: {
            tenantId,
            clientId,
            clientSecretHash,
        },
    });

    return { clientId, clientSecret };
}

async function getTenantCredential(tenantId) {
    return prisma.tenantCredential.findUnique({ where: { tenantId } });
}

async function issueAccessToken({ clientId, clientSecret, scope }) {
    const credential = await findCredentialByClientId(clientId);
    if (!credential || credential.status !== "active") {
        const error = new Error("Invalid client credentials");
        error.code = "INVALID_CLIENT";
        throw error;
    }

    const secretMatches = await bcrypt.compare(clientSecret || "", credential.clientSecretHash);
    if (!secretMatches) {
        const error = new Error("Invalid client credentials");
        error.code = "INVALID_CLIENT";
        throw error;
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + TOKEN_TTL_SECONDS;
    const payload = {
        tenantId: credential.tenantId,
        clientId: credential.clientId,
        scope: normalizeScope(scope),
        iat: issuedAt,
        exp: expiresAt,
        jti: randomHex(12),
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = signSegment(encodedPayload);
    const token = `${encodedPayload}.${signature}`;

    return {
        accessToken: token,
        expiresIn: TOKEN_TTL_SECONDS,
        payload,
    };
}

async function verifyAccessToken(token) {
    if (!token || typeof token !== "string") {
        return null;
    }
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) {
        return null;
    }
    const expectedSig = signSegment(encoded);
    const provided = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSig, "hex");
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
        return null;
    }

    let payload;
    try {
        payload = JSON.parse(base64UrlDecode(encoded));
    } catch (err) {
        return null;
    }

    if (!payload?.tenantId || !payload?.clientId) {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
        return null;
    }

    payload.scope = normalizeScope(payload.scope);
    return payload;
}

module.exports = {
    upsertTenantCredential,
    getTenantCredential,
    issueAccessToken,
    verifyAccessToken,
};
