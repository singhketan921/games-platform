const prisma = require("../prisma/client");
const { Decimal } = require("@prisma/client/runtime/library");
const walletAdapter = require("../services/walletAdapter");
const walletConfigService = require("../services/walletConfigService");
const { requireTenantRole } = require("../utils/tenantRoles");
const { enforceScope } = require("../utils/tenantAuth");

async function ensureWalletRecord(tenantId, playerId) {
    let wallet = await prisma.walletBalance.findFirst({
        where: { tenantId, playerId },
    });

    if (!wallet) {
        wallet = await prisma.walletBalance.create({
            data: {
                tenantId,
                playerId,
                balance: new Decimal(0),
            },
        });
    }

    return wallet;
}

async function updateWalletBalance(tenantId, playerId, delta) {
    const wallet = await ensureWalletRecord(tenantId, playerId);
    const updated = await prisma.walletBalance.update({
        where: { id: wallet.id },
        data: {
            balance: wallet.balance.plus(delta),
        },
    });

    return updated;
}

// Get balance (calls tenant wallet and syncs local mirror)
exports.getBalance = async (req, res) => {
    try {
        if (!enforceScope(req, res, "wallet:read")) {
            return;
        }
        const tenantId = req.tenant.id;
        const playerId = req.params.playerId;

        const config = await walletConfigService.getConfig(tenantId);
        if (!config) {
            return res.status(400).json({ error: "Wallet integration not configured" });
        }

        const result = await walletAdapter.getBalance({
            tenantId,
            payload: { playerId },
            idempotencyKey: `balance-${playerId}`,
        });

        let syncedWallet = await ensureWalletRecord(tenantId, playerId);
        const remoteBalance = Number(result?.balance);
        if (Number.isFinite(remoteBalance)) {
            syncedWallet = await prisma.walletBalance.update({
                where: { id: syncedWallet.id },
                data: { balance: new Decimal(remoteBalance) },
            });
        }

        res.json({
            success: true,
            remote: result,
            wallet: syncedWallet,
        });
    } catch (err) {
        console.error("Balance error:", err);
        res.status(500).json({ error: "Failed to fetch balance" });
    }
};

// Debit
exports.debit = async (req, res) => {
    try {
        if (!enforceScope(req, res, "wallet:write")) {
            return;
        }
        if (!requireTenantRole(req, res, ["OPERATOR"])) {
            return;
        }
        const tenantId = req.tenant.id;
        const { playerId, amount, reference } = req.body;
        const amt = new Decimal(amount);

        const config = await walletConfigService.getConfig(tenantId);
        if (!config) {
            return res.status(400).json({ error: "Wallet integration not configured" });
        }

        const idempotencyKey = reference || `debit-${playerId}-${Date.now()}`;

        const remoteResponse = await walletAdapter.debit({
            tenantId,
            payload: { playerId, amount, reference: idempotencyKey },
            idempotencyKey,
        });

        const updated = await updateWalletBalance(tenantId, playerId, amt.neg());

        await prisma.walletTransaction.create({
            data: {
                tenantId,
                playerId,
                amount: amt,
                type: "DEBIT",
                reference: idempotencyKey,
                walletId: updated.id,
            },
        });

        res.json({ success: true, wallet: updated, remote: remoteResponse });
    } catch (err) {
        console.error("Debit error:", err);
        res.status(500).json({ error: "Failed to debit" });
    }
};

// Credit
exports.credit = async (req, res) => {
    try {
        if (!enforceScope(req, res, "wallet:write")) {
            return;
        }
        if (!requireTenantRole(req, res, ["OPERATOR"])) {
            return;
        }
        const tenantId = req.tenant.id;
        const { playerId, amount, reference } = req.body;
        const amt = new Decimal(amount);

        const config = await walletConfigService.getConfig(tenantId);
        if (!config) {
            return res.status(400).json({ error: "Wallet integration not configured" });
        }

        const idempotencyKey = reference || `credit-${playerId}-${Date.now()}`;

        const remoteResponse = await walletAdapter.credit({
            tenantId,
            payload: { playerId, amount, reference: idempotencyKey },
            idempotencyKey,
        });

        const updated = await updateWalletBalance(tenantId, playerId, amt);

        await prisma.walletTransaction.create({
            data: {
                tenantId,
                playerId,
                amount: amt,
                type: "CREDIT",
                reference: idempotencyKey,
                walletId: updated.id,
            },
        });

        res.json({ success: true, wallet: updated, remote: remoteResponse });
    } catch (err) {
        console.error("Credit error:", err);
        res.status(500).json({ error: "Failed to credit" });
    }
};
