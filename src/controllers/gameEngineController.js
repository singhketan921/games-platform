const prisma = require("../prisma/client");
const accessSessionService = require("../services/accessSessionService");

exports.getSessionContext = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await accessSessionService.getActiveSession(sessionId);

        if (!session) {
            return res.status(404).json({ error: "Session not found or expired" });
        }

        const tenantGames = await prisma.tenantGame.findMany({
            where: { tenantId: session.tenantId, isActive: true },
            include: { game: true },
        });

        res.json({
            success: true,
            session,
            games: tenantGames.map((assignment) => ({
                gameId: assignment.gameId,
                name: assignment.game?.name || assignment.gameId,
                type: assignment.game?.type,
                launchUrl: assignment.game?.launchUrl,
                rtpProfile: assignment.rtpProfile,
            })),
        });
    } catch (err) {
        console.error("Game engine session error:", err);
        res.status(500).json({ error: "Failed to resolve session context" });
    }
};

exports.getTenantGames = async (req, res) => {
    try {
        const { tenantId } = req.params;

        const assignments = await prisma.tenantGame.findMany({
            where: { tenantId },
            include: { game: true },
        });

        res.json({
            success: true,
            assignments: assignments.map((assignment) => ({
                gameId: assignment.gameId,
                name: assignment.game?.name || assignment.gameId,
                type: assignment.game?.type,
                isActive: assignment.isActive,
                rtpProfile: assignment.rtpProfile,
            })),
        });
    } catch (err) {
        console.error("Game engine tenant games error:", err);
        res.status(500).json({ error: "Failed to load tenant games" });
    }
};

exports.getTenantGame = async (req, res) => {
    try {
        const { tenantId, gameId } = req.params;

        const assignment = await prisma.tenantGame.findUnique({
            where: {
                tenantId_gameId: { tenantId, gameId },
            },
            include: { game: true },
        });

        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        res.json({
            success: true,
            assignment: {
                gameId: assignment.gameId,
                name: assignment.game?.name || assignment.gameId,
                type: assignment.game?.type,
                isActive: assignment.isActive,
                rtpProfile: assignment.rtpProfile,
            },
        });
    } catch (err) {
        console.error("Game engine assignment error:", err);
        res.status(500).json({ error: "Failed to load tenant game" });
    }
};
