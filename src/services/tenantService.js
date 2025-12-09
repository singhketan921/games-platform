const prisma = require("../prisma/client");

const DEFAULT_RELATIONS = Object.freeze({
    games: {
        include: {
            game: true,
        },
    },
    sessions: true,
    walletTxs: true,
    credential: true,
});

async function listTenants(options = {}) {
    const query = {};
    if (options.includeRelations) {
        query.include = DEFAULT_RELATIONS;
    }
    return prisma.tenant.findMany(query);
}

async function getTenantById(id, options = {}) {
    const query = { where: { id } };
    if (options.includeRelations) {
        query.include = DEFAULT_RELATIONS;
    }
    return prisma.tenant.findUnique(query);
}

async function createTenant(data) {
    return prisma.tenant.create({ data });
}

async function updateTenantById(id, data) {
    return prisma.tenant.update({
        where: { id },
        data,
    });
}

async function deleteTenantById(id) {
    return prisma.tenant.delete({
        where: { id },
    });
}

module.exports = {
    listTenants,
    getTenantById,
    createTenant,
    updateTenantById,
    deleteTenantById,
};
