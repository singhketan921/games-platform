const prisma = require("../prisma/client");
const crypto = require("crypto");

exports.getPlayers = async (req, res) => {
    try {
        const players = await prisma.playerSession.findMany({
            distinct: ["playerId"],
            select: { playerId: true }
        });

        res.json({ success: true, players });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load players" });
    }
};

exports.getWallets = async (req, res) => {
    try {
        const wallets = await prisma.walletBalance.findMany();
        res.json({ success: true, wallets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load wallets" });
    }
};

exports.getGames = async (req, res) => {
    try {
        const games = await prisma.game.findMany();
        res.json({ success: true, games });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load games" });
    }
};

exports.getTenants = async (req, res) => {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                games: true,
                sessions: true,
                walletTxs: true,
            }
        });

        const shaped = tenants.map((tenant) => {
            const revenue = tenant.walletTxs.reduce((sum, tx) => {
                return sum + Number(tx.amount);
            }, 0);

            return {
                id: tenant.id,
                name: tenant.name,
                status: tenant.status,
                domain: tenant.domain,
                contactEmail: tenant.contactEmail,
                games: tenant.games.length,
                sessions: tenant.sessions.length,
                revenue,
                createdAt: tenant.createdAt,
            };
        });

        res.json({ success: true, tenants: shaped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load tenants" });
    }
};

exports.createTenant = async (req, res) => {
    try {
        const { name, domain, contactEmail, status = "active" } = req.body || {};

        if (!name) {
            return res.status(400).json({ error: "Tenant name is required" });
        }

        const apiKey = crypto.randomBytes(16).toString("hex");
        const apiSecret = crypto.randomBytes(32).toString("hex");

        const tenant = await prisma.tenant.create({
            data: {
                name,
                domain,
                contactEmail,
                status,
                apiKey,
                apiSecret,
            },
        });

        res.status(201).json({ success: true, tenant });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create tenant" });
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, domain, contactEmail } = req.body;

        const updated = await prisma.tenant.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(status && { status }),
                ...(domain !== undefined && { domain }),
                ...(contactEmail !== undefined && { contactEmail }),
            },
        });

        res.json({ success: true, tenant: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update tenant" });
    }
};

exports.updateTenantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Missing status" });
        }

        const updated = await prisma.tenant.update({
            where: { id },
            data: { status },
        });

        res.json({ success: true, tenant: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update tenant status" });
    }
};

exports.deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.tenant.delete({
            where: { id },
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete tenant" });
    }
};
