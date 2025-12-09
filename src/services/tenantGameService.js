const prisma = require("../prisma/client");

async function listTenantGames(tenantId) {
    return prisma.tenantGame.findMany({
        where: { tenantId },
        include: {
            game: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
}

async function updateTenantGame(tenantId, gameId, data) {
    return prisma.tenantGame.update({
        where: {
            tenantId_gameId: {
                tenantId,
                gameId,
            },
        },
        data,
        include: {
            game: true,
        },
    });
}

module.exports = {
    listTenantGames,
    updateTenantGame,
};
