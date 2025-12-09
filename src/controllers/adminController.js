const prisma = require("../prisma/client");
const crypto = require("crypto");
const tenantService = require("../services/tenantService");
const authService = require("../services/authService");
const rtpService = require("../services/rtpService");
const walletConfigService = require("../services/walletConfigService");
const tenantUserService = require("../services/tenantUserService");
const ipAllowlistService = require("../services/ipAllowlistService");

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
        const games = await prisma.game.findMany({
            include: {
                _count: {
                    select: {
                        sessions: true,
                    },
                },
            },
        });

        const shaped = games.map((game) => ({
            id: game.id,
            name: game.name,
            status: game.status,
            description: game.description,
            type: game.type,
            volatility: game.volatility,
            rtp: Number(game.rtp),
            sessions: game._count.sessions,
            callbacks: 0,
        }));

        res.json({ success: true, games: shaped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load games" });
    }
};

exports.getTenants = async (req, res) => {
    try {
        const tenants = await tenantService.listTenants({ includeRelations: true });

        const shaped = tenants.map((tenant) => {
            const revenue = tenant.walletTxs.reduce((sum, tx) => {
                return sum + Number(tx.amount);
            }, 0);

            const gameAssignments = tenant.games.map((assignment) => ({
                gameId: assignment.gameId,
                name: assignment.game?.name || assignment.gameId,
                isActive: assignment.isActive,
                rtpProfile: assignment.rtpProfile,
            }));

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
                oauthClientId: tenant.credential?.clientId || null,
                gameAssignments,
            };
        });

        res.json({ success: true, tenants: shaped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load tenants" });
    }
};

exports.listTenantUsers = async (req, res) => {
    try {
        const { id } = req.params || {};
        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }

        const tenant = await tenantService.getTenantById(id);
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const users = await tenantUserService.listTenantUsers(id);
        res.json({ success: true, users });
    } catch (err) {
        console.error("List tenant users error:", err);
        res.status(500).json({ error: "Failed to load tenant users" });
    }
};

exports.createTenantUser = async (req, res) => {
    try {
        const { id } = req.params || {};
        const { email, password, role = "OPERATOR" } = req.body || {};

        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        const allowedRoles = new Set(["OPERATOR", "ANALYST", "READ_ONLY"]);
        if (!allowedRoles.has(role)) {
            return res.status(400).json({ error: "Invalid tenant user role" });
        }

        const tenant = await tenantService.getTenantById(id);
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const user = await tenantUserService.createTenantUser({
            tenantId: id,
            email,
            password,
            role,
        });

        res.status(201).json({ success: true, user });
    } catch (err) {
        if (err?.code === "P2002") {
            return res.status(409).json({ error: "User already exists for this tenant" });
        }

        console.error("Create tenant user error:", err);
        res.status(500).json({ error: "Failed to create tenant user" });
    }
};

exports.updateTenantUserStatus = async (req, res) => {
    try {
        const { id, userId } = req.params || {};
        const { status } = req.body || {};

        if (!id || !userId) {
            return res.status(400).json({ error: "Missing tenant or user id" });
        }

        if (!status || !["active", "suspended"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const user = await tenantUserService.updateTenantUserStatus(id, userId, status);
        res.json({ success: true, user });
    } catch (err) {
        if (err?.code === "P2025" || err?.code === "TENANT_USER_NOT_FOUND") {
            return res.status(404).json({ error: "Tenant user not found" });
        }
        console.error("Update tenant user status error:", err);
        res.status(500).json({ error: "Failed to update tenant user status" });
    }
};

exports.resetTenantUserPassword = async (req, res) => {
    try {
        const { id, userId } = req.params || {};
        const { password } = req.body || {};

        if (!id || !userId) {
            return res.status(400).json({ error: "Missing tenant or user id" });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        const user = await tenantUserService.resetTenantUserPassword(id, userId, password);
        res.json({ success: true, user });
    } catch (err) {
        if (err?.code === "P2025" || err?.code === "TENANT_USER_NOT_FOUND") {
            return res.status(404).json({ error: "Tenant user not found" });
        }
        console.error("Reset tenant user password error:", err);
        res.status(500).json({ error: "Failed to reset tenant user password" });
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

        const tenant = await tenantService.createTenant({
            name,
            domain,
            contactEmail,
            status,
            apiKey,
            apiSecret,
        });

        const credentials = await authService.upsertTenantCredential(tenant.id);

        res.status(201).json({ success: true, tenant, credentials });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create tenant" });
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, domain, contactEmail } = req.body;

        const updated = await tenantService.updateTenantById(id, {
            ...(name && { name }),
            ...(status && { status }),
            ...(domain !== undefined && { domain }),
            ...(contactEmail !== undefined && { contactEmail }),
        });

        res.json({ success: true, tenant: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update tenant" });
    }
};

exports.updateTenantStatus = async (req, res) => {
    try {
        const { id } = req.params || {};
        const rawStatus = req.body?.status;

        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }

        if (typeof rawStatus !== "string" || !rawStatus.trim()) {
            return res.status(400).json({ error: "Missing status" });
        }

        const status = rawStatus.trim().toLowerCase();
        const allowedStatuses = new Set(["active", "suspended"]);

        if (!allowedStatuses.has(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        const updated = await tenantService.updateTenantById(id, { status });

        res.json({ success: true, tenant: updated });
    } catch (err) {
        if (err?.code === "P2025") {
            return res.status(404).json({ error: "Tenant not found" });
        }

        console.error(err);
        res.status(500).json({ error: "Failed to update tenant status" });
    }
};

exports.deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;

        await tenantService.deleteTenantById(id);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete tenant" });
    }
};

exports.rotateTenantCredential = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }

        const tenant = await tenantService.getTenantById(id);
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const credentials = await authService.upsertTenantCredential(id);

        res.json({ success: true, credentials });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to rotate tenant credentials" });
    }
};

exports.getTenantWalletConfig = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }

        const config = await walletConfigService.getConfig(id);
        const logs = await walletConfigService.listLogs(id, { limit: 20 });

        res.json({ success: true, config, logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load wallet config" });
    }
};

exports.upsertTenantWalletConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { debitUrl, creditUrl, balanceUrl, hmacSecret, status } = req.body || {};

        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }

        if (!debitUrl || !creditUrl || !balanceUrl || !hmacSecret) {
            return res.status(400).json({ error: "All wallet endpoints and secret are required" });
        }

        const config = await walletConfigService.upsertConfig(id, {
            debitUrl,
            creditUrl,
            balanceUrl,
            hmacSecret,
            status,
        });

        res.json({ success: true, config });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update wallet config" });
    }
};

exports.listTenantIpAllowlist = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }

        const tenant = await tenantService.getTenantById(id);
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const entries = await ipAllowlistService.listEntries(id);
        res.json({ success: true, entries });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load IP allowlist" });
    }
};

exports.addTenantIpAllowlistEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { ipAddress, label } = req.body || {};
        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }
        if (!ipAddress) {
            return res.status(400).json({ error: "IP address is required" });
        }

        const tenant = await tenantService.getTenantById(id);
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const entry = await ipAllowlistService.addEntry({
            tenantId: id,
            ipAddress,
            label,
        });

        res.status(201).json({ success: true, entry });
    } catch (err) {
        if (err.code === "INVALID_IP") {
            return res.status(400).json({ error: "Invalid IP address format" });
        }
        if (err.code === "P2002") {
            return res.status(409).json({ error: "IP already allowlisted for tenant" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to create allowlist entry" });
    }
};

exports.removeTenantIpAllowlistEntry = async (req, res) => {
    try {
        const { id, entryId } = req.params;
        if (!id || !entryId) {
            return res.status(400).json({ error: "Missing tenant or entry id" });
        }

        await ipAllowlistService.removeEntry({ tenantId: id, entryId });
        res.json({ success: true });
    } catch (err) {
        if (err.code === "NOT_FOUND") {
            return res.status(404).json({ error: "Allowlist entry not found" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to delete allowlist entry" });
    }
};

exports.getTenantWalletLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, type } = req.query || {};

        if (!id) {
            return res.status(400).json({ error: "Missing tenant id" });
        }

        const logs = await walletConfigService.listLogs(id, {
            status,
            type,
            limit: Number(req.query?.limit) || 50,
        });

        res.json({ success: true, logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load wallet logs" });
    }
};

exports.listWalletLogs = async (req, res) => {
    try {
        const { tenantId, status, type, hours, limit } = req.query || {};
        const since = hours ? new Date(Date.now() - Number(hours) * 60 * 60 * 1000) : undefined;
        const logs = await walletConfigService.listAllLogs({
            tenantId,
            status,
            type,
            since,
            limit: Number(limit) || 100,
        });
        res.json({ success: true, logs });
    } catch (err) {
        console.error("List wallet logs error:", err);
        res.status(500).json({ error: "Failed to load wallet logs" });
    }
};

exports.getWalletLogMetrics = async (req, res) => {
    try {
        const { hours } = req.query || {};
        const metrics = await walletConfigService.getGlobalMetrics({ hours });
        res.json({ success: true, metrics });
    } catch (err) {
        console.error("Wallet log metrics error:", err);
        res.status(500).json({ error: "Failed to load wallet log metrics" });
    }
};

exports.createGame = async (req, res) => {
    try {
        const {
            name,
            description,
            launchUrl,
            type,
            status = "active",
            volatility = "Medium",
            rtp = 95,
        } = req.body || {};

        if (!name) {
            return res.status(400).json({ error: "Game name is required" });
        }

        const game = await prisma.game.create({
            data: {
                name,
                description,
                launchUrl,
                type,
                status,
                volatility,
                rtp,
            },
        });

        res.status(201).json({ success: true, game });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create game" });
    }
};

exports.getGame = async (req, res) => {
    try {
        const { id } = req.params;
        const game = await prisma.game.findUnique({
            where: { id },
        });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        res.json({
            success: true,
            game: {
                id: game.id,
                name: game.name,
                status: game.status,
                description: game.description,
                volatility: game.volatility,
                rtp: Number(game.rtp),
                type: game.type,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load game" });
    }
};

exports.updateGame = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, description, volatility, rtp } = req.body || {};

        const data = {};
        if (name) data.name = name;
        if (status) data.status = status;
        if (description !== undefined) data.description = description;
        if (volatility) data.volatility = volatility;
        if (rtp !== undefined) data.rtp = Number(rtp);

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: "No updates provided" });
        }

        const updated = await prisma.game.update({
            where: { id },
            data,
        });

        res.json({ success: true, game: updated });
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Game not found" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to update game" });
    }
};

exports.updateTenantGame = async (req, res) => {
    try {
        const { id, gameId } = req.params;
        const { rtpProfile, isActive } = req.body || {};

        if (!id || !gameId) {
            return res.status(400).json({ error: "Missing tenant or game id" });
        }

        if (!rtpProfile && typeof isActive === "undefined") {
            return res.status(400).json({ error: "No updates provided" });
        }

        const normalizedProfile = rtpProfile ? rtpProfile.toUpperCase() : undefined;
        const allowedProfiles = ["HIGH", "MEDIUM", "LOW"];
        if (normalizedProfile && !allowedProfiles.includes(normalizedProfile)) {
            return res.status(400).json({ error: "Invalid RTP profile" });
        }
        const assignment = await prisma.tenantGame.findUnique({
            where: {
                tenantId_gameId: { tenantId: id, gameId },
            },
            include: { game: true },
        });

        if (!assignment) {
            return res.status(404).json({ error: "Tenant game assignment not found" });
        }

        const updateData = {};
        if (typeof isActive !== "undefined") {
            updateData.isActive = Boolean(isActive);
        }
        if (normalizedProfile) {
            updateData.rtpProfile = normalizedProfile;
        }

        const updated = await prisma.tenantGame.update({
            where: {
                tenantId_gameId: {
                    tenantId: id,
                    gameId,
                },
            },
            data: updateData,
            include: {
                game: true,
            },
        });

        if (updateData.rtpProfile) {
            await rtpService.logTenantGameChange({
                tenantId: id,
                tenantGameId: updated.id,
                previousProfile: assignment.rtpProfile,
                newProfile: updated.rtpProfile,
                actor: req.admin?.id || "admin-hmac",
            });
        }

        res.json({
            success: true,
            assignment: {
                gameId: updated.gameId,
                name: updated.game?.name || updated.gameId,
                isActive: updated.isActive,
                rtpProfile: updated.rtpProfile,
            },
        });
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Tenant game assignment not found" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to update tenant game" });
    }
};

exports.getGlobalRtp = async (_req, res) => {
    try {
        const config = await rtpService.getGlobalConfig();
        res.json({ success: true, config });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load global RTP" });
    }
};

exports.updateGlobalRtp = async (req, res) => {
    try {
        const { profile } = req.body || {};
        const allowedProfiles = ["HIGH", "MEDIUM", "LOW"];
        const normalized = profile?.toUpperCase();

        if (!normalized || !allowedProfiles.includes(normalized)) {
            return res.status(400).json({ error: "Invalid RTP profile" });
        }

        const updated = await rtpService.updateGlobalConfig(normalized, req.admin?.id || "admin-hmac");
        res.json({ success: true, config: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update global RTP" });
    }
};

exports.listRtpLogs = async (req, res) => {
    try {
        const limit = Number(req.query?.limit) || 50;
        const logs = await rtpService.listLogs(limit);
        res.json({ success: true, logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load RTP change logs" });
    }
};
