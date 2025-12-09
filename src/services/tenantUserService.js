const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");

async function createTenantUser({ tenantId, email, password, role = "OPERATOR" }) {
    const hash = await bcrypt.hash(password, 10);
    return prisma.tenantUser.create({
        data: {
            tenantId,
            email: email.toLowerCase(),
            passwordHash: hash,
            role,
        },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
        },
    });
}

async function listTenantUsers(tenantId) {
    return prisma.tenantUser.findMany({
        where: { tenantId },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            tenantId: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

async function getTenantUserById(tenantId, userId) {
    return prisma.tenantUser.findFirst({
        where: { id: userId, tenantId },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            tenantId: true,
        },
    });
}

async function updateTenantUserStatus(tenantId, userId, status) {
    const existing = await getTenantUserById(tenantId, userId);
    if (!existing) {
        const error = new Error("Tenant user not found");
        error.code = "TENANT_USER_NOT_FOUND";
        throw error;
    }

    return prisma.tenantUser.update({
        where: { id: userId },
        data: { status },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
        },
    });
}

async function resetTenantUserPassword(tenantId, userId, password) {
    const hash = await bcrypt.hash(password, 10);
    const existing = await getTenantUserById(tenantId, userId);
    if (!existing) {
        const error = new Error("Tenant user not found");
        error.code = "TENANT_USER_NOT_FOUND";
        throw error;
    }

    return prisma.tenantUser.update({
        where: {
            id: userId,
        },
        data: { passwordHash: hash },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
        },
    });
}

async function getTenantUser(tenantId, email) {
    return prisma.tenantUser.findFirst({
        where: {
            tenantId,
            email: email.toLowerCase(),
        },
    });
}

async function verifyTenantUser({ tenantId, email, password }) {
    const user = await getTenantUser(tenantId, email);
    if (!user || user.status !== "active") {
        return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return null;
    }

    return user;
}

module.exports = {
    createTenantUser,
    listTenantUsers,
    getTenantUserById,
    updateTenantUserStatus,
    resetTenantUserPassword,
    getTenantUser,
    verifyTenantUser,
};
