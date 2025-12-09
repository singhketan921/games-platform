const prisma = require("../prisma/client");

const DEFAULT_PLATFORM_FEE_PERCENT = 10;
const STATIC_NUMBER_SERIES = Object.freeze([
    { number: 0, playerCount: 150, betAmount: 70000, win: false },
    { number: 1, playerCount: 10, betAmount: 2000, win: false },
    { number: 2, playerCount: 25, betAmount: 4000, win: false },
    { number: 3, playerCount: 10, betAmount: 10000, win: false },
    { number: 4, playerCount: 40, betAmount: 3000, win: true },
    { number: 5, playerCount: 45, betAmount: 100000, win: false },
    { number: 6, playerCount: 100, betAmount: 20000, win: false },
    { number: 7, playerCount: 50, betAmount: 100000, win: false },
    { number: 8, playerCount: 50, betAmount: 50000, win: false },
    { number: 9, playerCount: 30, betAmount: 10000, win: false },
]);

function parseDate(value, fallback) {
    if (!value) return fallback;
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? fallback : dt;
}

function decimalToNumber(value) {
    if (value === undefined || value === null) return 0;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function resolvePlatformSharePercent(raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
    }
    return DEFAULT_PLATFORM_FEE_PERCENT;
}

exports.getGgrReport = async (req, res) => {
    try {
        const defaultStart = new Date();
        defaultStart.setHours(0, 0, 0, 0);
        const startDate = parseDate(req.query?.startDate, defaultStart);
        const endDate = parseDate(req.query?.endDate, new Date());
        const currencyFilter = (req.query?.currency || "").toUpperCase();

        const roundWhere = {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };

        if (req.query?.tenantId) {
            roundWhere.tenantId = req.query.tenantId;
        }
        if (currencyFilter) {
            roundWhere.currency = currencyFilter;
        }

        const roundGroups = await prisma.roundResult.groupBy({
            by: ["currency"],
            where: roundWhere,
            _sum: {
                betAmount: true,
                payoutAmount: true,
            },
        });

        const currencyBreakdown = roundGroups.map((entry) => {
            const betVolume = decimalToNumber(entry._sum.betAmount);
            const payouts = decimalToNumber(entry._sum.payoutAmount);
            return {
                currency: entry.currency || "INR",
                betVolume,
                payouts,
                ggr: betVolume - payouts,
            };
        });

        const totals = currencyBreakdown.reduce(
            (acc, row) => {
                acc.betVolume += row.betVolume;
                acc.payouts += row.payouts;
                acc.ggr += row.ggr;
                return acc;
            },
            { betVolume: 0, payouts: 0, ggr: 0 }
        );

        const platformSharePercent = resolvePlatformSharePercent(req.query?.platformPercent);
        const canComputeShare = currencyFilter || currencyBreakdown.length <= 1;
        const platformShareAmount = canComputeShare
            ? Number(((totals.ggr * platformSharePercent) / 100).toFixed(2))
            : null;

        res.json({
            success: true,
            range: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            totals: {
                betVolume: totals.betVolume,
                payouts: totals.payouts,
                ggr: totals.ggr,
                currency: currencyFilter || (currencyBreakdown.length === 1 ? currencyBreakdown[0].currency : "MIXED"),
                platformShare: {
                    percentage: platformSharePercent,
                    amount: platformShareAmount,
                },
            },
            currencyBreakdown,
            numberSeries: STATIC_NUMBER_SERIES,
        });
    } catch (err) {
        console.error("GGR report error:", err);
        res.status(500).json({ error: "Failed to compute GGR report" });
    }
};

exports.exportTransactionsCsv = async (req, res) => {
    try {
        const startDate = parseDate(req.query?.startDate, null);
        const endDate = parseDate(req.query?.endDate, null);
        const where = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        if (req.query?.tenantId) {
            where.tenantId = req.query.tenantId;
        }

        const transactions = await prisma.walletTransaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: Number(req.query?.limit) || 5_000,
        });

        const header = [
            "transactionId",
            "tenantId",
            "playerId",
            "type",
            "amount",
            "reference",
            "createdAt",
        ];

        const lines = transactions.map((tx) => {
            const cells = [
                tx.id,
                tx.tenantId,
                tx.playerId,
                tx.type,
                Number(tx.amount || 0).toString(),
                tx.reference || "",
                tx.createdAt.toISOString(),
            ];
            return cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",");
        });

        const csv = [header.join(","), ...lines].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=wallet_transactions_${Date.now()}.csv`
        );
        res.send(csv);
    } catch (err) {
        console.error("CSV export error:", err);
        res.status(500).json({ error: "Failed to export transactions" });
    }
};
