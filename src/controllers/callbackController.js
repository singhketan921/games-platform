const prisma = require("../prisma/client");
const { Decimal } = require("@prisma/client/runtime/library");

exports.handleGameCallback = async (req, res) => {
    try {
        const { sessionId, delta, callbackId } = req.body;

        if (!sessionId || typeof delta === "undefined") {
            return res.status(400).json({ error: "sessionId and delta are required" });
        }

        // 0. IDEMPOTENCY CHECK FIRST - ALWAYS RUNS
        if (callbackId) {
            const existingTx = await prisma.walletTransaction.findFirst({
                where: { reference: callbackId }
            });

            if (existingTx) {
                // Fetch latest state
                const session = await prisma.playerSession.findUnique({
                    where: { id: sessionId }
                });

                if (!session) {
                    return res.status(404).json({ error: "Session not found" });
                }

                const wallet = await prisma.walletBalance.findFirst({
                    where: {
                        tenantId: session.tenantId,
                        playerId: session.playerId
                    }
                });

                return res.json({
                    success: true,
                    idempotent: true,
                    wallet,
                    session
                });
            }
        }

        // 1. Load session
        const session = await prisma.playerSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // 2. If session is closed AND callbackId is missing → reject
        if (session.isClosed && !callbackId) {
            return res.status(400).json({ error: "Session already closed" });
        }

        // 3. Load wallet
        const wallet = await prisma.walletBalance.findFirst({
            where: {
                tenantId: session.tenantId,
                playerId: session.playerId
            }
        });

        if (!wallet) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        const change = new Decimal(delta);
        let newBalance = wallet.balance.plus(change);

        if (newBalance.lessThan(0)) {
            newBalance = new Decimal(0);
        }

        // 4. Update wallet
        const updatedWallet = await prisma.walletBalance.update({
            where: { id: wallet.id },
            data: { balance: newBalance }
        });

        // 5. Create transaction with idempotency key
        await prisma.walletTransaction.create({
            data: {
                tenantId: session.tenantId,
                playerId: session.playerId,
                amount: change.abs(),
                type: change.greaterThan(0) ? "CREDIT" : "DEBIT",
                reference: callbackId || `callback-${sessionId}`,
                walletId: wallet.id
            }
        });

        // 6. Close session
        const closedSession = await prisma.playerSession.update({
            where: { id: sessionId },
            data: {
                isClosed: true,
                endedAt: new Date(),
                result: delta.toString()
            }
        });

        return res.json({
            success: true,
            idempotent: false,
            wallet: updatedWallet,
            session: closedSession
        });

    } catch (err) {
        console.error("Callback error:", err);
        return res.status(500).json({ error: "Callback failed" });
    }
};
