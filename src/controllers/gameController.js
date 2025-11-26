const prisma = require("../prisma/client");

exports.createGame = async (req, res) => {
    try {
        const { name, description, launchUrl, type } = req.body;

        const game = await prisma.game.create({
            data: { name, description, launchUrl, type }
        });

        res.json({ success: true, game });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create game" });
    }
};

exports.getAllGames = async (req, res) => {
    try {
        const games = await prisma.game.findMany();
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch games" });
    }
};

exports.assignGameToTenant = async (req, res) => {
    try {
        const { gameId } = req.body;
        const tenantId = req.tenant.id;

        const assigned = await prisma.tenantGame.create({
            data: { tenantId, gameId }
        });

        res.json({ success: true, assigned });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to assign game to tenant" });
    }
};

exports.getTenantGames = async (req, res) => {
    try {
        const tenantId = req.tenant.id;

        const games = await prisma.tenantGame.findMany({
            where: { tenantId },
            include: { game: true }
        });

        res.json(games);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tenant games" });
    }
};


const { Decimal } = require("@prisma/client/runtime/library");

exports.launchGame = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { gameId, playerId, amount } = req.body;

        // 1. Validate game assigned to tenant
        const tg = await prisma.tenantGame.findFirst({
            where: { tenantId, gameId },
            include: { game: true }
        });

        if (!tg) {
            return res.status(404).json({ error: "Game not assigned to tenant" });
        }

        // 2. Fetch or create wallet
        let wallet = await prisma.walletBalance.findFirst({
            where: { tenantId, playerId }
        });

        if (!wallet) {
            wallet = await prisma.walletBalance.create({
                data: {
                    tenantId,
                    playerId,
                    balance: new Decimal(0)
                }
            });
        }

        const betAmount = new Decimal(amount);

        // 3. Check balance
        if (wallet.balance.lessThan(betAmount)) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // 4. Auto-debit BEFORE launch
        const updatedWallet = await prisma.walletBalance.update({
            where: { id: wallet.id },
            data: { balance: wallet.balance.minus(betAmount) }
        });

        // 5. Log transaction
        await prisma.walletTransaction.create({
            data: {
                tenantId,
                playerId,
                amount: betAmount,
                type: "DEBIT",
                reference: `launch-${gameId}`,
                walletId: wallet.id
            }
        });

        // 6. Create Player Session
        const session = await prisma.playerSession.create({
            data: {
                tenantId,
                playerId,
                gameId,
                betAmount
            }
        });

        // 7. Generate launch URL with session ID
        const launchUrl =
            `${tg.game.launchUrl}?player=${playerId}` +
            `&tenant=${tenantId}` +
            `&session=${session.id}`;

        res.json({
            success: true,
            launchUrl,
            session
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to launch game" });
    }
};

