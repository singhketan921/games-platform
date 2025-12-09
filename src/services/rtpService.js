const prisma = require("../prisma/client");

const GLOBAL_ID = "global";

async function getGlobalConfig() {
    let config = await prisma.globalRtpConfig.findUnique({
        where: { id: GLOBAL_ID },
    });

    if (!config) {
        config = await prisma.globalRtpConfig.create({
            data: {
                id: GLOBAL_ID,
                profile: "MEDIUM",
                updatedBy: "system",
            },
        });
    }

    return config;
}

async function updateGlobalConfig(profile, actor) {
    const previous = await getGlobalConfig();
    const updated = await prisma.globalRtpConfig.upsert({
        where: { id: GLOBAL_ID },
        update: {
            profile,
            updatedBy: actor,
        },
        create: {
            id: GLOBAL_ID,
            profile,
            updatedBy: actor,
        },
    });

    await prisma.rtpChangeLog.create({
        data: {
            tenantId: null,
            tenantGameId: null,
            previousProfile: previous?.profile || null,
            newProfile: profile,
            actor,
        },
    });

    return updated;
}

async function logTenantGameChange({ tenantId, tenantGameId, previousProfile, newProfile, actor }) {
    return prisma.rtpChangeLog.create({
        data: {
            tenantId,
            tenantGameId,
            previousProfile,
            newProfile,
            actor,
        },
    });
}

async function listLogs(limit = 50) {
    return prisma.rtpChangeLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

module.exports = {
    getGlobalConfig,
    updateGlobalConfig,
    logTenantGameChange,
    listLogs,
};
