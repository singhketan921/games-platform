const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");

async function listAdminUsers() {
    return prisma.adminUser.findMany({
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}

async function createAdminUser({ email, password, role }) {
    const passwordHash = await bcrypt.hash(password, 12);
    return prisma.adminUser.create({
        data: {
            email,
            passwordHash,
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

async function updateAdminUser(id, { role, status, password }) {
    const data = {};
    if (role) data.role = role;
    if (status) data.status = status;
    if (password) {
        data.passwordHash = await bcrypt.hash(password, 12);
    }
    return prisma.adminUser.update({
        where: { id },
        data,
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            updatedAt: true,
        },
    });
}

module.exports = {
    listAdminUsers,
    createAdminUser,
    updateAdminUser,
};
