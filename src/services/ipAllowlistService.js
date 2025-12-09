const net = require("net");
const prisma = require("../prisma/client");

function normalizeIp(ip) {
    if (!ip) return null;
    return String(ip).trim();
}

function assertValidIp(ip) {
    if (!ip) {
        throw new Error("IP address is required");
    }
    if (!net.isIP(ip)) {
        const error = new Error("Invalid IP address");
        error.code = "INVALID_IP";
        throw error;
    }
}

async function listEntries(tenantId) {
    return prisma.tenantIpAllowlist.findMany({
        where: { tenantId },
        orderBy: { createdAt: "asc" },
    });
}

async function addEntry({ tenantId, ipAddress, label }) {
    const normalized = normalizeIp(ipAddress);
    assertValidIp(normalized);

    return prisma.tenantIpAllowlist.create({
        data: {
            tenantId,
            ipAddress: normalized,
            label: label?.trim() || null,
        },
    });
}

async function removeEntry({ tenantId, entryId }) {
    const entry = await prisma.tenantIpAllowlist.findFirst({
        where: {
            id: entryId,
            tenantId,
        },
    });

    if (!entry) {
        const error = new Error("Allowlist entry not found");
        error.code = "NOT_FOUND";
        throw error;
    }

    await prisma.tenantIpAllowlist.delete({
        where: { id: entry.id },
    });

    return entry;
}

module.exports = {
    listEntries,
    addEntry,
    removeEntry,
};
