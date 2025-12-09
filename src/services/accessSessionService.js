const prisma = require("../prisma/client");
const config = require("../config");

function computeExpiry(ttlSeconds = config.sessions.accessTtlSeconds) {
    const expires = new Date(Date.now() + ttlSeconds * 1000);
    return expires;
}

async function createSession({ tenantId, playerId, metadata, ttlSeconds }) {
    const expiresAt = computeExpiry(ttlSeconds || config.sessions.accessTtlSeconds);
    return prisma.accessSession.create({
        data: {
            tenantId,
            playerId,
            metadata,
            expiresAt,
        },
        select: {
            id: true,
            tenantId: true,
            playerId: true,
            status: true,
            metadata: true,
            expiresAt: true,
            createdAt: true,
        },
    });
}

async function getActiveSession(sessionId) {
    const session = await prisma.accessSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        return null;
    }

    const now = new Date();
    if (session.status !== "active" || session.expiresAt <= now) {
        return null;
    }

    return session;
}

async function closeSession(sessionId, status = "consumed") {
    return prisma.accessSession.update({
        where: { id: sessionId },
        data: {
            status,
        },
        select: {
            id: true,
            status: true,
            updatedAt: true,
        },
    });
}

module.exports = {
    createSession,
    getActiveSession,
    closeSession,
};
