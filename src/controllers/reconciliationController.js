const prisma = require("../prisma/client");
const { Decimal } = require("@prisma/client/runtime/library");
const metrics = require("../utils/metrics");

const RTP_TARGETS = { HIGH: 0.97, MEDIUM: 0.95, LOW: 0.9 };
const { DEFAULT_CURRENCY, normalizeCurrency } = require("../utils/currency");

function resolveTarget(profile) {
    if (!profile) return 0.95;
    return RTP_TARGETS[profile] || 0.95;
}

function decimalToNumber(value) {
    if (value === undefined || value === null) {
        return 0;
    }
    if (value instanceof Decimal) {
        return Number(value.toString());
    }
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
}

function toDecimal(value, fallback = 0) {
    if (value === undefined || value === null || value === "") {
        return new Decimal(fallback);
    }
    if (value instanceof Decimal) {
        return value;
    }
    const num = new Decimal(value);
    return num;
}

exports.logRoundResult = async (req, res) => {
    try {
        const {
            tenantId,
            gameId,
            playerId,
            sessionId,
            betAmount,
            payoutAmount,
            rtpProfile,
            status,
            walletDebitTxId,
            walletCreditTxId,
            discrepancy,
            currency,
            metadata,
        } = req.body || {};

        if (!tenantId || !gameId || !playerId || betAmount === undefined || payoutAmount === undefined) {
            return res.status(400).json({ error: "tenantId, gameId, playerId, betAmount, payoutAmount are required" });
        }

        const betDecimal = toDecimal(betAmount);
        const payoutDecimal = toDecimal(payoutAmount);
        const discrepancyValue =
            discrepancy !== undefined && discrepancy !== null
                ? toDecimal(discrepancy)
                : payoutDecimal.minus(betDecimal);

        const normalizedCurrency = normalizeCurrency(currency);

        const round = await prisma.roundResult.create({
            data: {
                tenantId,
                gameId,
                playerId,
                sessionId,
                betAmount: betDecimal,
                payoutAmount: payoutDecimal,
                currency: normalizedCurrency,
                rtpProfile,
                status: status || "PENDING",
                walletDebitTxId,
                walletCreditTxId,
                discrepancy: discrepancyValue,
                metadata,
            },
        });

        metrics.recordRoundResult({
            tenantId,
            gameId,
            status: round.status,
            rtpProfile: round.rtpProfile,
            currency: normalizedCurrency,
            betAmount: betDecimal,
            payoutAmount: payoutDecimal,
            discrepancy: discrepancyValue,
        });

        res.status(201).json({ success: true, round });
    } catch (err) {
        console.error("log round result error:", err);
        res.status(500).json({ error: "Failed to record round result" });
    }
};

exports.listRounds = async (req, res) => {
    try {
        const {
            tenantId,
            gameId,
            status,
            minDiscrepancy,
            startDate,
            endDate,
            currency,
            limit = 50,
        } = req.query || {};

        const where = {};
        if (tenantId) where.tenantId = tenantId;
        if (gameId) where.gameId = gameId;
        if (status) where.status = status;
        if (currency) where.currency = normalizeCurrency(currency);
        if (minDiscrepancy) {
            where.discrepancy = {
                gte: toDecimal(minDiscrepancy),
            };
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const take = Math.min(Number(limit) || 50, 200);

        const [rounds, statusCounts, discrepancyAgg] = await Promise.all([
            prisma.roundResult.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take,
            }),
            prisma.roundResult.groupBy({
                by: ["status"],
                where,
                _count: { _all: true },
            }),
            prisma.roundResult.aggregate({
                where,
                _sum: { discrepancy: true },
            }),
        ]);

        const summary = {
            counts: statusCounts.map((entry) => ({
                status: entry.status,
                count: entry._count._all,
            })),
            discrepancyTotal: Number(discrepancyAgg._sum?.discrepancy || 0),
        };

        res.json({ success: true, rounds, summary });
    } catch (err) {
        console.error("list rounds error:", err);
        res.status(500).json({ error: "Failed to load rounds" });
    }
};

exports.listDiscrepancies = async (req, res) => {
    try {
        const { tenantId, minAmount = 0, currency } = req.query || {};
        const where = {
            OR: [
                { status: "MISMATCH" },
                {
                    discrepancy: {
                        gte: toDecimal(minAmount),
                    },
                },
            ],
        };
        if (tenantId) {
            where.tenantId = tenantId;
        }
        if (currency) {
            where.currency = normalizeCurrency(currency);
        }

        const rounds = await prisma.roundResult.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        res.json({ success: true, rounds });
    } catch (err) {
        console.error("list discrepancies error:", err);
        res.status(500).json({ error: "Failed to load discrepancies" });
    }
};

exports.exportRoundsCsv = async (req, res) => {
    try {
        const { tenantId, status, startDate, endDate, currency } = req.query || {};
        const where = {};
        if (tenantId) where.tenantId = tenantId;
        if (status) where.status = status;
        if (currency) where.currency = normalizeCurrency(currency);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const rounds = await prisma.roundResult.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 1000,
        });

        const header = [
            "roundId",
            "tenantId",
            "gameId",
            "playerId",
            "sessionId",
            "betAmount",
            "payoutAmount",
            "currency",
            "discrepancy",
            "status",
            "walletDebitTxId",
            "walletCreditTxId",
            "createdAt",
        ];

        const rows = rounds.map((round) => {
            const cells = [
                round.id,
                round.tenantId,
                round.gameId,
                round.playerId,
                round.sessionId || "",
                round.betAmount?.toString(),
                round.payoutAmount?.toString(),
                round.currency || DEFAULT_CURRENCY,
                round.discrepancy?.toString(),
                round.status,
                round.walletDebitTxId || "",
                round.walletCreditTxId || "",
                round.createdAt.toISOString(),
            ];
            return cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",");
        });

        const csv = [header.join(","), ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=reconciliation_${Date.now()}.csv`
        );
        res.send(csv);
    } catch (err) {
        console.error("export rounds error:", err);
        res.status(500).json({ error: "Failed to export rounds" });
    }
};

exports.getRtpDeviationSummary = async (req, res) => {
    try {
        const { tenantId, gameId, startDate, endDate, currency, limit = 25 } = req.query || {};
        const where = {};
        if (tenantId) where.tenantId = tenantId;
        if (gameId) where.gameId = gameId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }
        if (currency) {
            where.currency = normalizeCurrency(currency);
        }

        const take = Math.min(Number(limit) || 25, 200);

        const grouped = await prisma.roundResult.groupBy({
            by: ["tenantId", "gameId", "rtpProfile", "currency"],
            where,
            _sum: {
                betAmount: true,
                payoutAmount: true,
            },
            _count: { _all: true },
        });

        const tenantBuckets = {};
        const tenantGameSummaries = grouped
            .map((entry) => {
                const betTotal = decimalToNumber(entry._sum.betAmount);
                const payoutTotal = decimalToNumber(entry._sum.payoutAmount);
                const targetRtp = resolveTarget(entry.rtpProfile);
                const actualRtp = betTotal > 0 ? payoutTotal / betTotal : 0;
                const deviation = actualRtp - targetRtp;
                const currencyCode = normalizeCurrency(entry.currency);

                const bucketKey = `${entry.tenantId}:${currencyCode}`;
                if (!tenantBuckets[bucketKey]) {
                    tenantBuckets[bucketKey] = {
                        tenantId: entry.tenantId,
                        currency: currencyCode,
                        totalBets: 0,
                        totalPayouts: 0,
                        weightedTarget: 0,
                        rounds: 0,
                    };
                }
                tenantBuckets[bucketKey].totalBets += betTotal;
                tenantBuckets[bucketKey].totalPayouts += payoutTotal;
                tenantBuckets[bucketKey].weightedTarget += betTotal * targetRtp;
                tenantBuckets[bucketKey].rounds += entry._count._all;

                return {
                    tenantId: entry.tenantId,
                    gameId: entry.gameId,
                    currency: currencyCode,
                    rtpProfile: entry.rtpProfile || null,
                    rounds: entry._count._all,
                    totalBets: betTotal,
                    totalPayouts: payoutTotal,
                    targetRtp,
                    actualRtp,
                    deviation,
                };
            })
            .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
            .slice(0, take);

        const tenantSummaries = Object.values(tenantBuckets)
            .map((bucket) => {
                const actualRtp = bucket.totalBets > 0 ? bucket.totalPayouts / bucket.totalBets : 0;
                const targetRtp =
                    bucket.totalBets > 0 ? bucket.weightedTarget / bucket.totalBets : resolveTarget();
                return {
                    tenantId: bucket.tenantId,
                    currency: bucket.currency,
                    rounds: bucket.rounds,
                    totalBets: bucket.totalBets,
                    totalPayouts: bucket.totalPayouts,
                    targetRtp,
                    actualRtp,
                    deviation: actualRtp - targetRtp,
                };
            })
            .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

        res.json({
            success: true,
            filters: { tenantId, gameId, startDate, endDate, currency: currency ? normalizeCurrency(currency) : undefined },
            tenantSummaries,
            tenantGameSummaries,
        });
    } catch (err) {
        console.error("get RTP deviation summary error:", err);
        res.status(500).json({ error: "Failed to load RTP deviation summary" });
    }
};
