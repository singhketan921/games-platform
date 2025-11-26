const prisma = require("../prisma/client");

// 1) Get all sessions for this tenant
exports.getAllSessions = async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    const sessions = await prisma.playerSession.findMany({
      where: { tenantId },
      orderBy: { startedAt: "desc" },
    });

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (err) {
    console.error("History getAllSessions error:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
};

// 2) Get one session + related transactions
exports.getSessionById = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { sessionId } = req.params;

    const session = await prisma.playerSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.tenantId !== tenantId) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Fetch related transactions for this player and tenant.
    // We try to capture launch + callback txs using reference.
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        tenantId,
        playerId: session.playerId,
        OR: [
          { reference: { contains: session.id } },          // e.g. "callback-<sessionId>" or callbackId including session
          { reference: `launch-${session.gameId}` },        // launch debit for that game
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      success: true,
      session,
      transactions,
    });
  } catch (err) {
    console.error("History getSessionById error:", err);
    res.status(500).json({ error: "Failed to load session details" });
  }
};

// 3) Get all sessions for a specific player (for this tenant)
exports.getPlayerHistory = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { playerId } = req.params;

    const sessions = await prisma.playerSession.findMany({
      where: {
        tenantId,
        playerId,
      },
      orderBy: { startedAt: "desc" },
    });

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (err) {
    console.error("History getPlayerHistory error:", err);
    res.status(500).json({ error: "Failed to load player history" });
  }
};

// 4) Get wallet history for a particular player in this tenant
exports.getWalletHistory = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { playerId } = req.params;

    const transactions = await prisma.walletTransaction.findMany({
      where: {
        tenantId,
        playerId,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error("History getWalletHistory error:", err);
    res.status(500).json({ error: "Failed to load wallet history" });
  }
};

// 5) Get closed sessions (callbacks) for this tenant
exports.getCallbackHistory = async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    const callbacks = await prisma.playerSession.findMany({
      where: {
        tenantId,
        isClosed: true,
      },
      orderBy: { endedAt: "desc" },
    });

    res.json({
      success: true,
      count: callbacks.length,
      callbacks,
    });
  } catch (err) {
    console.error("History getCallbackHistory error:", err);
    res.status(500).json({ error: "Failed to load callback history" });
  }
};

// 4) Get wallet transactions history for this tenant
exports.getTransactions = async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    const transactions = await prisma.walletTransaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error("History getTransactions error:", err);
    res.status(500).json({ error: "Failed to load transactions" });
  }
};
