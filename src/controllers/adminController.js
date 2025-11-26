const prisma = require("../prisma/client");

exports.getPlayers = async (req, res) => {
    try {
        const players = await prisma.playerSession.findMany({
            distinct: ['playerId'],
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
