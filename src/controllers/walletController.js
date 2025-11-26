const prisma = require("../prisma/client");
const { Decimal } = require("@prisma/client/runtime/library");

// Get balance (auto-create if missing)
exports.getBalance = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const playerId = req.params.playerId;

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

        res.json({ success: true, wallet });
    } catch (err) {
        console.error("Balance error:", err);
        res.status(500).json({ error: "Failed to fetch balance" });
    }
};

// Debit
exports.debit = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { playerId, amount, reference } = req.body;

        const amt = new Decimal(amount);

        // Get wallet
        let wallet = await prisma.walletBalance.findFirst({
            where: { tenantId, playerId }
        });

        if (!wallet) {
            return res.status(400).json({ error: "Wallet not found. Fetch balance first." });
        }

        if (wallet.balance.lessThan(amt)) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Update balance
        const updated = await prisma.walletBalance.update({
            where: { id: wallet.id },
            data: {
                balance: wallet.balance.minus(amt)
            }
        });

        // Log transaction
        await prisma.walletTransaction.create({
            data: {
                tenantId,
                playerId,
                amount: amt,
                type: "DEBIT",
                reference,
                walletId: wallet.id
            }
        });

        res.json({ success: true, wallet: updated });
    } catch (err) {
        console.error("Debit error:", err);
        res.status(500).json({ error: "Failed to debit" });
    }
};

// Credit
exports.credit = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { playerId, amount, reference } = req.body;

        const amt = new Decimal(amount);

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

        const updated = await prisma.walletBalance.update({
            where: { id: wallet.id },
            data: {
                balance: wallet.balance.plus(amt)
            }
        });

        await prisma.walletTransaction.create({
            data: {
                tenantId,
                playerId,
                amount: amt,
                type: "CREDIT",
                reference,
                walletId: wallet.id
            }
        });

        res.json({ success: true, wallet: updated });
    } catch (err) {
        console.error("Credit error:", err);
        res.status(500).json({ error: "Failed to credit" });
    }
};
