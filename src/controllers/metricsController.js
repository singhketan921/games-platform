const prisma = require("../prisma/client");

const DAY_MS = 24 * 60 * 60 * 1000;

async function sumWalletTransactions(where) {
    const result = await prisma.walletTransaction.aggregate({
        where,
        _sum: {
            amount: true,
        },
    });
    return Number(result._sum?.amount || 0);
}

exports.getSummary = async (_req, res) => {
    try {
        const now = Date.now();
        const since24h = new Date(now - DAY_MS);

        const [tenantCount, gameCount, sessionCount24h, revenue24h, debit24h] = await Promise.all([
            prisma.tenant.count(),
            prisma.game.count(),
            prisma.playerSession.count({
                where: {
                    startedAt: {
                        gte: since24h,
                    },
                },
            }),
            sumWalletTransactions({
                type: "CREDIT",
                createdAt: { gte: since24h },
            }),
            sumWalletTransactions({
                type: "DEBIT",
                createdAt: { gte: since24h },
            }),
        ]);

        const walletFailures = await prisma.walletCallbackLog.findMany({
            where: {
                status: { not: "SUCCESS" },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        const rtpTrend = [];
        for (let i = 6; i >= 0; i -= 1) {
            const dayStart = new Date(now - i * DAY_MS);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart.getTime() + DAY_MS);
            const bets = await sumWalletTransactions({
                type: "DEBIT",
                createdAt: { gte: dayStart, lt: dayEnd },
            });
            const payouts = await sumWalletTransactions({
                type: "CREDIT",
                createdAt: { gte: dayStart, lt: dayEnd },
            });
            const rtp = bets === 0 ? 0 : Math.min(1, payouts / bets);
            rtpTrend.push({
                date: dayStart.toISOString().slice(0, 10),
                rtp,
                target: 0.95,
            });
        }

        res.json({
            success: true,
            summary: {
                tenants: tenantCount,
                games: gameCount,
                sessions24h: sessionCount24h,
                revenue24h,
                betVolume24h: debit24h,
            },
            walletFailures,
            rtpTrend,
        });
    } catch (err) {
        console.error("Metrics summary error:", err);
        res.status(500).json({ error: "Failed to load metrics" });
    }
};
