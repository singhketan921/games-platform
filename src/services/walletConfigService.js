const prisma = require("../prisma/client");
const metrics = require("../utils/metrics");

async function getConfig(tenantId) {
    if (!tenantId) return null;
    return prisma.tenantWalletConfig.findUnique({
        where: { tenantId },
    });
}

async function upsertConfig(tenantId, payload) {
    if (!tenantId) throw new Error("tenantId is required");
    const data = {
        debitUrl: payload.debitUrl,
        creditUrl: payload.creditUrl,
        balanceUrl: payload.balanceUrl,
        hmacSecret: payload.hmacSecret,
        status: payload.status || "active",
    };

    return prisma.tenantWalletConfig.upsert({
        where: { tenantId },
        update: data,
        create: { tenantId, ...data },
    });
}

async function logCallback({
    tenantId,
    type,
    endpoint,
    payload,
    responseCode,
    responseBody,
    status,
    idempotencyKey,
    attempt,
    errorMessage,
}) {
    const record = await prisma.walletCallbackLog.create({
        data: {
            tenantId,
            type,
            endpoint,
            payload,
            responseCode,
            responseBody,
            status,
            idempotencyKey,
            attempt,
            errorMessage,
        },
    });

    metrics.recordWalletCallback({
        tenantId,
        type,
        status,
    });

    return record;
}

async function listLogs(tenantId, options = {}) {
    const where = { tenantId };
    if (options.status) {
        where.status = options.status;
    }
    if (options.type) {
        where.type = options.type;
    }

    return prisma.walletCallbackLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options.limit || 50,
    });
}

async function listAllLogs(options = {}) {
    const where = {};
    if (options.tenantId) {
        where.tenantId = options.tenantId;
    }
    if (options.status) {
        where.status = options.status;
    }
    if (options.type) {
        where.type = options.type;
    }
    if (options.since) {
        where.createdAt = where.createdAt || {};
        where.createdAt.gte = options.since;
    }
    return prisma.walletCallbackLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options.limit || 100,
    });
}

async function getGlobalMetrics(options = {}) {
    const hours = Number(options.hours || 24);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const where = { createdAt: { gte: since } };

    const [statusCounts, typeCounts, retryCount, topTenants] = await Promise.all([
        prisma.walletCallbackLog.groupBy({
            by: ["status"],
            where,
            _count: { _all: true },
        }),
        prisma.walletCallbackLog.groupBy({
            by: ["type"],
            where,
            _count: { _all: true },
        }),
        prisma.walletCallbackLog.count({
            where: { ...where, attempt: { gt: 1 } },
        }),
        prisma.walletCallbackLog.groupBy({
            by: ["tenantId"],
            where: { ...where, status: { not: "SUCCESS" } },
            _count: { _all: true },
            orderBy: { _count: { _all: "desc" } },
            take: 5,
        }),
    ]);

    return {
        since,
        statusCounts: statusCounts.map((entry) => ({
            status: entry.status,
            count: entry._count._all,
        })),
        typeCounts: typeCounts.map((entry) => ({
            type: entry.type,
            count: entry._count._all,
        })),
        retryCount,
        topTenants: topTenants.map((entry) => ({
            tenantId: entry.tenantId,
            count: entry._count._all,
        })),
    };
}

module.exports = {
    getConfig,
    upsertConfig,
    logCallback,
    listLogs,
    listAllLogs,
    getGlobalMetrics,
};
