const crypto = require("crypto");
const prisma = require("../prisma/client");
const tenantUserService = require("../services/tenantUserService");
const authService = require("../services/authService");

// Cache recent nonces to prevent replay attacks (simple version)
let usedNonces = new Set();
const nonceInterval = setInterval(() => usedNonces.clear(), 1000 * 60 * 10); // clear every 10 minutes
if (typeof nonceInterval.unref === "function") {
    nonceInterval.unref();
}

function resolveRequestIp(req) {
    const forwarded = req.header("x-forwarded-for");
    if (forwarded) {
        const candidate = forwarded.split(",").map((entry) => entry.trim()).find(Boolean);
        if (candidate) {
            return candidate;
        }
    }
    if (req.ip) return req.ip;
    if (req.connection?.remoteAddress) return req.connection.remoteAddress;
    if (req.socket?.remoteAddress) return req.socket.remoteAddress;
    return null;
}

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization") || "";
        let tenant = null;
        let authContext = null;

        if (authHeader.startsWith("Bearer ")) {
            const token = authHeader.slice("Bearer ".length).trim();
            const payload = await authService.verifyAccessToken(token);
            if (!payload) {
                return res.status(401).json({ error: "Invalid bearer token" });
            }
            tenant = await prisma.tenant.findUnique({
                where: { id: payload.tenantId },
                include: { ipAllowlist: true },
            });
            if (!tenant || tenant.status !== "active") {
                return res.status(401).json({ error: "Tenant not found or inactive" });
            }
            authContext = { method: "oauth", clientId: payload.clientId, scope: payload.scope };
        } else {
            const apiKey = req.header("X-API-KEY");
            const timestamp = req.header("X-TIMESTAMP");
            const nonce = req.header("X-NONCE");
            const signature = req.header("X-SIGNATURE");

            if (!apiKey || !timestamp || !nonce || !signature) {
                return res.status(401).json({ error: "Missing HMAC headers" });
            }

            if (usedNonces.has(nonce)) {
                return res.status(401).json({ error: "Replay attack detected" });
            }
            usedNonces.add(nonce);

            const now = Math.floor(Date.now() / 1000);
            if (Math.abs(now - Number(timestamp)) > 300) {
                return res.status(401).json({ error: "Timestamp expired" });
            }

            tenant = await prisma.tenant.findUnique({
                where: { apiKey },
                include: { ipAllowlist: true },
            });

            if (!tenant) {
                return res.status(401).json({ error: "Invalid API key" });
            }

            const rawBody = req.rawBody ?? "";
            const bodyHash = crypto.createHash("sha256").update(rawBody).digest("hex");

            const stringToSign = [req.method, req.originalUrl, timestamp, nonce, bodyHash].join("\n");

            const computedSignature = crypto.createHmac("sha256", tenant.apiSecret).update(stringToSign).digest("hex");

            if (computedSignature !== signature) {
                console.warn("HMAC mismatch", {
                    method: req.method,
                    path: req.originalUrl,
                    timestamp,
                    nonce,
                    bodyHash,
                    headerSignature: signature,
                    computedSignature,
                });
                return res.status(401).json({ error: "Invalid signature" });
            }

            authContext = { method: "hmac" };
        }

        const allowlist = tenant.ipAllowlist || [];
        if (allowlist.length > 0) {
            const requestIp = resolveRequestIp(req);
            const normalizedIp = requestIp ? requestIp.replace("::ffff:", "") : null;
            const isAllowed = normalizedIp ? allowlist.some((entry) => entry.ipAddress === normalizedIp) : false;
            if (!isAllowed) {
                console.warn("Tenant IP denied", {
                    tenantId: tenant.id,
                    requestIp: normalizedIp,
                    allowlisted: allowlist.map((entry) => entry.ipAddress),
                });
                return res.status(403).json({ error: "IP not allowlisted for tenant", code: "TENANT_IP_DENIED" });
            }
        }

        req.tenant = tenant;
        if (authContext) {
            req.auth = authContext;
        }

        if (authContext?.method !== "oauth") {
            const tenantUserId = req.header("X-TENANT-USER-ID");
            if (tenantUserId) {
                const tenantUser = await tenantUserService.getTenantUserById(tenant.id, tenantUserId);
                if (!tenantUser || tenantUser.status !== "active") {
                    return res.status(403).json({ error: "Tenant user is not active", code: "TENANT_USER_INACTIVE" });
                }
                req.tenantUser = tenantUser;
            }
        }

        next();
    } catch (err) {
        console.error("HMAC/OAuth validation error:", err);
        res.status(500).json({ error: "Authentication failed" });
    }
};
