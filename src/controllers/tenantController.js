const prisma = require("../prisma/client");
const crypto = require("crypto");
const tenantUserService = require("../services/tenantUserService");

const DEFAULT_PLATFORM_FEE_PERCENT = 10;

function toNumber(value) {
    if (!value) {
        return 0;
    }
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "bigint") {
        return Number(value);
    }
    if (typeof value.toNumber === "function") {
        return value.toNumber();
    }
    return Number(value);
}

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

exports.createTenant = async (req, res) => {
    try {
        const { name } = req.body;

        const apiKey = crypto.randomBytes(16).toString("hex");
        const apiSecret = crypto.randomBytes(32).toString("hex");

        const tenant = await prisma.tenant.create({
            data: {
                name,
                apiKey,
                apiSecret
            }
        });

        res.json({ success: true, tenant });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create tenant" });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const tenantId = req.tenant.id;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                walletConfig: true,
                games: {
                    include: {
                        game: true,
                    },
                },
            },
        });

        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const [
            sessionAggregate,
            activeSessionCount,
            uniquePlayers,
            creditAggregate,
            debitAggregate,
            currencyBalances,
        ] = await Promise.all([
            prisma.playerSession.aggregate({
                where: { tenantId },
                _count: { _all: true },
                _sum: { betAmount: true },
            }),
            prisma.playerSession.count({
                where: { tenantId, isClosed: false },
            }),
            prisma.playerSession.count({
                where: { tenantId },
                distinct: ["playerId"],
            }),
            prisma.walletTransaction.aggregate({
                where: { tenantId, type: "CREDIT" },
                _sum: { amount: true },
            }),
            prisma.walletTransaction.aggregate({
                where: { tenantId, type: "DEBIT" },
                _sum: { amount: true },
            }),
            prisma.walletBalance.groupBy({
                by: ["currency"],
                where: { tenantId },
                _sum: { balance: true },
            }),
        ]);

        const totalSessions = sessionAggregate._count?._all || 0;
        const totalBetVolume = toNumber(sessionAggregate._sum?.betAmount);
        const totalPayouts = toNumber(creditAggregate._sum?.amount);
        const totalDebits = toNumber(debitAggregate._sum?.amount);
        const grossGamingRevenue = totalBetVolume - totalPayouts;

        const games = tenant.games.map((assignment) => ({
            id: assignment.id,
            gameId: assignment.gameId,
            name: assignment.game?.name || "Game",
            status: assignment.isActive ? "ACTIVE" : "INACTIVE",
            rtpProfile: assignment.rtpProfile,
        }));

        const balances = currencyBalances.map((row) => ({
            currency: row.currency,
            balance: toNumber(row._sum.balance),
        }));

        const currentUser = req.tenantUser
            ? {
                  id: req.tenantUser.id,
                  email: req.tenantUser.email,
                  role: req.tenantUser.role,
              }
            : null;

        res.json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                status: tenant.status,
                domain: tenant.domain,
                contactEmail: tenant.contactEmail,
                createdAt: tenant.createdAt,
            },
            metrics: {
                totalSessions,
                activeSessions: activeSessionCount,
                distinctPlayers: uniquePlayers,
                totalBetVolume,
                totalPayouts,
                totalDebits,
                grossGamingRevenue,
            },
            user: currentUser,
            balances,
            walletConfig: tenant.walletConfig
                ? {
                      debitUrl: tenant.walletConfig.debitUrl,
                      creditUrl: tenant.walletConfig.creditUrl,
                      balanceUrl: tenant.walletConfig.balanceUrl,
                      status: tenant.walletConfig.status,
                  }
                : null,
            games,
        });
    } catch (err) {
        console.error("Tenant profile error:", err);
        res.status(500).json({ error: "Failed to load tenant profile" });
    }
};

exports.loginTenantUser = async (req, res) => {
    try {
        const { tenantId, email, password } = req.body || {};

        if (!tenantId || !email || !password) {
            return res.status(400).json({ error: "Missing tenant credentials" });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant || tenant.status !== "active") {
            return res.status(401).json({ error: "Invalid tenant" });
        }

        const user = await tenantUserService.verifyTenantUser({
            tenantId: tenant.id,
            email,
            password,
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                status: tenant.status,
            },
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            credentials: {
                apiKey: tenant.apiKey,
                apiSecret: tenant.apiSecret,
            },
        });
    } catch (err) {
        console.error("Tenant login error:", err);
        res.status(500).json({ error: "Failed to authenticate tenant user" });
    }
};

exports.getGgrReport = async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const defaultStart = new Date();
        defaultStart.setHours(0, 0, 0, 0);
        const startDate = parseDate(req.query?.startDate, defaultStart);
        const endDate = parseDate(req.query?.endDate, new Date());
        const currencyFilter = (req.query?.currency || "").toUpperCase();

        const roundWhere = {
            tenantId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };

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
        });
    } catch (err) {
        console.error("Tenant GGR report error:", err);
        res.status(500).json({ error: "Failed to compute tenant GGR report" });
    }
};
