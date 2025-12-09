const accessSessionService = require("../services/accessSessionService");
const config = require("../config");

const MAX_TTL = config.sessions.accessTtlSeconds;
const MIN_TTL = 60;

const { enforceScope } = require("../utils/tenantAuth");

exports.verifyToken = async (req, res) => {
    try {
        const tenant = req.tenant;
        const { playerId, ttlSeconds, metadata } = req.body || {};

        if (!enforceScope(req, res, "session:write")) {
            return;
        }

        if (!playerId) {
            return res.status(400).json({ error: "playerId is required" });
        }

        let ttl = Number(ttlSeconds);
        if (!Number.isFinite(ttl)) {
            ttl = MAX_TTL;
        }
        ttl = Math.max(MIN_TTL, Math.min(ttl, MAX_TTL));

        const session = await accessSessionService.createSession({
            tenantId: tenant.id,
            playerId,
            metadata: typeof metadata === "object" && metadata !== null ? metadata : {},
            ttlSeconds: ttl,
        });

        res.json({
            success: true,
            sessionId: session.id,
            expiresAt: session.expiresAt,
            playerId: session.playerId,
        });
    } catch (err) {
        console.error("Session verify error:", err);
        res.status(500).json({ error: "Failed to verify session" });
    }
};

exports.resolve = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await accessSessionService.getActiveSession(sessionId);

        if (!session) {
            return res.status(404).json({ error: "Session not found or expired" });
        }

        res.json({ success: true, session });
    } catch (err) {
        console.error("Session resolve error:", err);
        res.status(500).json({ error: "Failed to resolve session" });
    }
};

exports.close = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await accessSessionService.getActiveSession(sessionId);

        if (!session) {
            return res.status(404).json({ error: "Session not found or expired" });
        }

        const closed = await accessSessionService.closeSession(sessionId);
        res.json({ success: true, session: closed });
    } catch (err) {
        console.error("Session close error:", err);
        res.status(500).json({ error: "Failed to close session" });
    }
};
