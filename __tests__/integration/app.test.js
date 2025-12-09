const request = require("supertest");
const { Decimal } = require("@prisma/client/runtime/library");

jest.mock("../../src/prisma/client", () => ({
    tenant: {
        findUnique: jest.fn(),
    },
    playerSession: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
    },
    walletTransaction: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
    walletBalance: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    roundResult: {
        groupBy: jest.fn(),
    },
}));

jest.mock("../../src/services/authService", () => ({
    issueAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
}));

jest.mock("../../src/services/walletAdapter", () => ({
    getBalance: jest.fn(),
    debit: jest.fn(),
    credit: jest.fn(),
}));

jest.mock("../../src/services/walletConfigService", () => ({
    getConfig: jest.fn(),
}));

jest.mock("../../src/services/accessSessionService", () => ({
    createSession: jest.fn(),
    getActiveSession: jest.fn(),
    closeSession: jest.fn(),
}));

jest.mock("../../src/services/tenantUserService", () => ({
    getTenantUserById: jest.fn(),
}));

const prisma = require("../../src/prisma/client");
const authService = require("../../src/services/authService");
const walletAdapter = require("../../src/services/walletAdapter");
const walletConfigService = require("../../src/services/walletConfigService");
const accessSessionService = require("../../src/services/accessSessionService");
const tenantUserService = require("../../src/services/tenantUserService");
const createServer = require("../../src/server/createServer");
const metrics = require("../../src/utils/metrics");

const app = createServer();

beforeEach(() => {
    jest.clearAllMocks();
    prisma.tenant.findUnique.mockReset();
    prisma.playerSession.findMany.mockReset();
    prisma.playerSession.findUnique.mockReset();
    prisma.walletTransaction.findMany.mockReset();
    prisma.walletTransaction.create.mockReset();
    prisma.walletBalance.findFirst.mockReset();
    prisma.walletBalance.create.mockReset();
    prisma.walletBalance.update.mockReset();
    prisma.roundResult.groupBy.mockReset();
    walletConfigService.getConfig.mockReset();
    walletAdapter.getBalance.mockReset();
    walletAdapter.debit.mockReset();
    walletAdapter.credit.mockReset();
    accessSessionService.createSession.mockReset();
    tenantUserService.getTenantUserById.mockReset();
});

afterAll(() => {
    metrics.stopDefaultMetrics();
});

function signBody({ method, path, body = "", secret, apiKey }) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = `nonce-${Date.now()}-${Math.random()}`;
    const bodyHash = require("crypto").createHash("sha256").update(body).digest("hex");
    const stringToSign = [method, path, timestamp, nonce, bodyHash].join("\n");
    const signature = require("crypto").createHmac("sha256", secret).update(stringToSign).digest("hex");
    return { apiKey, timestamp, nonce, signature };
}

const TENANT_API_KEY = "tenant-api-key";
const TENANT_SECRET = "tenant-secret";
const BASE_TENANT = {
    id: "tenant-1",
    apiKey: TENANT_API_KEY,
    apiSecret: TENANT_SECRET,
    ipAllowlist: [],
    status: "active",
};

function buildTenant(overrides = {}) {
    return {
        ...BASE_TENANT,
        ...overrides,
        ipAllowlist: overrides.ipAllowlist ?? [],
    };
}

function buildHmacHeaders({ method, path, body = "" }) {
    const signed = signBody({ method, path, body, secret: TENANT_SECRET, apiKey: TENANT_API_KEY });
    return {
        "X-API-KEY": TENANT_API_KEY,
        "X-TIMESTAMP": signed.timestamp,
        "X-NONCE": signed.nonce,
        "X-SIGNATURE": signed.signature,
    };
}

test("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
});

test("POST /oauth/token issues access token", async () => {
    authService.issueAccessToken.mockResolvedValue({
        accessToken: "integration-token",
        expiresIn: 900,
        payload: { scope: ["wallet:read"] },
    });

    const basic = Buffer.from("client-id:client-secret").toString("base64");
    const res = await request(app)
        .post("/oauth/token")
        .set("Authorization", `Basic ${basic}`)
        .send({ grant_type: "client_credentials" });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe("integration-token");
    expect(authService.issueAccessToken).toHaveBeenCalledWith({
        clientId: "client-id",
        clientSecret: "client-secret",
        scope: undefined,
    });
});

test("POST /oauth/token requires credentials", async () => {
    const res = await request(app).post("/oauth/token").send({ grant_type: "client_credentials" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_client");
});

test("GET /history/sessions returns tenant-scoped records via HMAC", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    const sessions = [
        {
            id: "session-1",
            tenantId: tenant.id,
            playerId: "player-1",
            startedAt: "2023-01-01T00:00:00.000Z",
        },
    ];
    prisma.playerSession.findMany.mockResolvedValue(sessions);

    const headers = buildHmacHeaders({ method: "GET", path: "/history/sessions" });
    const res = await request(app).get("/history/sessions").set(headers);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(prisma.playerSession.findMany).toHaveBeenCalledWith({
        where: { tenantId: tenant.id },
        orderBy: { startedAt: "desc" },
    });
});

test("GET /history/players/:playerId returns only that player's sessions", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);

    const playerId = "player-99";
    const records = [
        { id: "s1", tenantId: tenant.id, playerId, startedAt: "2023-01-02T00:00:00.000Z" },
        { id: "s2", tenantId: tenant.id, playerId, startedAt: "2023-01-01T00:00:00.000Z" },
    ];
    prisma.playerSession.findMany.mockResolvedValue(records);

    const headers = buildHmacHeaders({ method: "GET", path: `/history/players/${playerId}` });
    const res = await request(app).get(`/history/players/${playerId}`).set(headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(prisma.playerSession.findMany).toHaveBeenCalledWith({
        where: { tenantId: tenant.id, playerId },
        orderBy: { startedAt: "desc" },
    });
});

test("GET /history/transactions returns tenant wallet activity", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    const transactions = [
        {
            id: "tx-1",
            tenantId: tenant.id,
            playerId: "p1",
            amount: new Decimal(10),
            type: "DEBIT",
            createdAt: "2023-01-01T01:00:00.000Z",
        },
    ];
    prisma.walletTransaction.findMany.mockResolvedValue(transactions);

    const headers = buildHmacHeaders({ method: "GET", path: "/history/transactions" });
    const res = await request(app).get("/history/transactions").set(headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
    });
});

test("GET /history/wallet/:playerId unwraps wallet currency", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    const playerId = "player-22";
    const txs = [
        {
            id: "tx-1",
            tenantId: tenant.id,
            playerId,
            amount: new Decimal(50),
            type: "CREDIT",
            createdAt: "2023-01-03T00:00:00.000Z",
            wallet: { currency: "USD" },
        },
        {
            id: "tx-2",
            tenantId: tenant.id,
            playerId,
            amount: new Decimal(25),
            type: "DEBIT",
            createdAt: "2023-01-02T00:00:00.000Z",
            wallet: null,
        },
    ];
    prisma.walletTransaction.findMany.mockResolvedValue(txs);

    const headers = buildHmacHeaders({ method: "GET", path: `/history/wallet/${playerId}` });
    const res = await request(app).get(`/history/wallet/${playerId}`).set(headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.transactions[0].currency).toBe("USD");
    expect(res.body.transactions[1].currency).toBe("INR");
    expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith({
        where: { tenantId: tenant.id, playerId },
        include: { wallet: { select: { currency: true } } },
        orderBy: { createdAt: "desc" },
    });
});

test("GET /history/callbacks returns closed sessions", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    const callbacks = [
        { id: "cb-1", tenantId: tenant.id, isClosed: true, endedAt: "2023-01-04T00:00:00.000Z" },
    ];
    prisma.playerSession.findMany.mockResolvedValue(callbacks);

    const headers = buildHmacHeaders({ method: "GET", path: "/history/callbacks" });
    const res = await request(app).get("/history/callbacks").set(headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(prisma.playerSession.findMany).toHaveBeenCalledWith({
        where: { tenantId: tenant.id, isClosed: true },
        orderBy: { endedAt: "desc" },
    });
});

test("GET /history/sessions/:id returns session + related transactions", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);

    const session = {
        id: "session-55",
        tenantId: tenant.id,
        playerId: "player-5",
        gameId: "teen-patti",
    };
    prisma.playerSession.findUnique.mockResolvedValue(session);
    const transactions = [
        { id: "tx-launch", reference: "launch-teen-patti", playerId: "player-5" },
        { id: "tx-callback", reference: "callback-session-55", playerId: "player-5" },
    ];
    prisma.walletTransaction.findMany.mockResolvedValue(transactions);

    const headers = buildHmacHeaders({ method: "GET", path: `/history/sessions/${session.id}` });
    const res = await request(app).get(`/history/sessions/${session.id}`).set(headers);

    expect(res.status).toBe(200);
    expect(res.body.session.id).toBe(session.id);
    expect(res.body.transactions).toHaveLength(2);
    expect(prisma.playerSession.findUnique).toHaveBeenCalledWith({ where: { id: session.id } });
    expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith({
        where: {
            tenantId: tenant.id,
            playerId: session.playerId,
            OR: [{ reference: { contains: session.id } }, { reference: `launch-${session.gameId}` }],
        },
        orderBy: { createdAt: "asc" },
    });
});

test("GET /history/sessions/:id returns 404 when session missing or other tenant", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    prisma.playerSession.findUnique.mockResolvedValue(null);

    const headers = buildHmacHeaders({ method: "GET", path: "/history/sessions/unknown" });
    const res = await request(app).get("/history/sessions/unknown").set(headers);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Session not found");
});

test("GET /wallet/balance/:playerId syncs remote balance", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);

    walletConfigService.getConfig.mockResolvedValue({ tenantId: tenant.id, status: "active" });
    walletAdapter.getBalance.mockResolvedValue({ balance: 300 });

    const playerId = "player-42";
    const walletRecord = {
        id: "wallet-1",
        tenantId: tenant.id,
        playerId,
        balance: new Decimal(50),
    };
    prisma.walletBalance.findFirst.mockResolvedValue(walletRecord);
    prisma.walletBalance.update.mockResolvedValue({
        ...walletRecord,
        balance: new Decimal(300),
    });

    const headers = buildHmacHeaders({ method: "GET", path: `/wallet/balance/${playerId}` });
    const res = await request(app).get(`/wallet/balance/${playerId}`).set(headers);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(walletAdapter.getBalance).toHaveBeenCalledWith({
        tenantId: tenant.id,
        payload: { playerId },
        idempotencyKey: `balance-${playerId}`,
    });
    expect(prisma.walletBalance.update).toHaveBeenCalledWith({
        where: { id: walletRecord.id },
        data: { balance: expect.any(Decimal) },
    });
    expect(res.body.remote.balance).toBe(300);
    expect(res.body.wallet.id).toBe(walletRecord.id);
    expect(Number(res.body.wallet.balance)).toBe(300);
});

test("POST /wallet/debit records transaction for operator user", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    walletConfigService.getConfig.mockResolvedValue({ tenantId: tenant.id, status: "active" });
    walletAdapter.debit.mockResolvedValue({ status: "OK" });

    const walletRecord = {
        id: "wallet-2",
        tenantId: tenant.id,
        playerId: "player-55",
        balance: new Decimal(200),
    };
    prisma.walletBalance.findFirst.mockResolvedValue(walletRecord);
    prisma.walletBalance.update.mockResolvedValue({
        ...walletRecord,
        balance: new Decimal(150),
    });

    tenantUserService.getTenantUserById.mockResolvedValue({
        id: "tenant-user",
        role: "OPERATOR",
        status: "active",
    });

    const payload = { playerId: "player-55", amount: "50", reference: "debit-ref" };
    const body = JSON.stringify(payload);
    const headers = buildHmacHeaders({ method: "POST", path: "/wallet/debit", body });

    const res = await request(app)
        .post("/wallet/debit")
        .set(headers)
        .set("X-TENANT-USER-ID", "tenant-user")
        .set("Content-Type", "application/json")
        .send(body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(walletAdapter.debit).toHaveBeenCalledWith({
        tenantId: tenant.id,
        payload: { playerId: payload.playerId, amount: payload.amount, reference: payload.reference },
        idempotencyKey: payload.reference,
    });
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
        data: {
            tenantId: tenant.id,
            playerId: payload.playerId,
            amount: expect.any(Decimal),
            type: "DEBIT",
            reference: payload.reference,
            walletId: walletRecord.id,
        },
    });
    expect(Number(res.body.wallet.balance)).toBe(150);
});

test("POST /wallet/debit denies non-operator tenant user", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    tenantUserService.getTenantUserById.mockResolvedValue({
        id: "tenant-user",
        role: "READ_ONLY",
        status: "active",
    });

    const payload = { playerId: "p1", amount: "10" };
    const body = JSON.stringify(payload);
    const headers = buildHmacHeaders({ method: "POST", path: "/wallet/debit", body });

    const res = await request(app)
        .post("/wallet/debit")
        .set(headers)
        .set("X-TENANT-USER-ID", "tenant-user")
        .set("Content-Type", "application/json")
        .send(body);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("TENANT_ROLE_DENIED");
    expect(walletAdapter.debit).not.toHaveBeenCalled();
});

test("POST /wallet/credit updates wallet balance", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    walletConfigService.getConfig.mockResolvedValue({ tenantId: tenant.id, status: "active" });
    walletAdapter.credit.mockResolvedValue({ status: "OK" });
    tenantUserService.getTenantUserById.mockResolvedValue({
        id: "tenant-user",
        role: "OPERATOR",
        status: "active",
    });

    const walletRecord = {
        id: "wallet-3",
        tenantId: tenant.id,
        playerId: "player-88",
        balance: new Decimal(75),
    };
    prisma.walletBalance.findFirst.mockResolvedValue(walletRecord);
    prisma.walletBalance.update.mockResolvedValue({
        ...walletRecord,
        balance: new Decimal(95),
    });

    const payload = { playerId: "player-88", amount: "20" };
    const body = JSON.stringify(payload);
    const headers = buildHmacHeaders({ method: "POST", path: "/wallet/credit", body });

    const res = await request(app)
        .post("/wallet/credit")
        .set(headers)
        .set("X-TENANT-USER-ID", "tenant-user")
        .set("Content-Type", "application/json")
        .send(body);

    expect(res.status).toBe(200);
    expect(walletAdapter.credit).toHaveBeenCalledWith({
        tenantId: tenant.id,
        payload: {
            playerId: payload.playerId,
            amount: payload.amount,
            reference: expect.stringMatching(/^credit-player-88-/),
        },
        idempotencyKey: expect.stringMatching(/^credit-player-88-/),
    });
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
        data: {
            tenantId: tenant.id,
            playerId: payload.playerId,
            amount: expect.any(Decimal),
            type: "CREDIT",
            reference: expect.any(String),
            walletId: walletRecord.id,
        },
    });
    expect(Number(res.body.wallet.balance)).toBe(95);
});

test("POST /sessions/verify issues a session for valid HMAC request", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    const sessionResponse = {
        id: "session-abc",
        playerId: "player-9",
        expiresAt: "2023-01-01T00:10:00.000Z",
    };
    accessSessionService.createSession.mockResolvedValue(sessionResponse);

    const payload = {
        playerId: "player-9",
        ttlSeconds: 10,
        metadata: { lobby: "alpha" },
    };
    const body = JSON.stringify(payload);
    const headers = buildHmacHeaders({ method: "POST", path: "/sessions/verify", body });

    const res = await request(app)
        .post("/sessions/verify")
        .set(headers)
        .set("Content-Type", "application/json")
        .send(body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sessionId).toBe(sessionResponse.id);
    expect(accessSessionService.createSession).toHaveBeenCalledWith({
        tenantId: tenant.id,
        playerId: payload.playerId,
        metadata: payload.metadata,
        ttlSeconds: 60,
    });
});

test("GET /tenant/reports/ggr returns tenant-scoped breakdown", async () => {
    const tenant = buildTenant();
    prisma.tenant.findUnique.mockResolvedValue(tenant);
    prisma.roundResult.groupBy.mockResolvedValue([
        {
            currency: "INR",
            _sum: { betAmount: new Decimal(1000), payoutAmount: new Decimal(800) },
        },
        {
            currency: "USD",
            _sum: { betAmount: new Decimal(300), payoutAmount: new Decimal(200) },
        },
    ]);

    const headers = buildHmacHeaders({ method: "GET", path: "/tenant/reports/ggr" });
    const res = await request(app).get("/tenant/reports/ggr").set(headers);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.currencyBreakdown).toHaveLength(2);
    expect(res.body.totals.ggr).toBe(300);
    expect(prisma.roundResult.groupBy).toHaveBeenCalledWith({
        by: ["currency"],
        where: expect.objectContaining({
            tenantId: tenant.id,
        }),
        _sum: { betAmount: true, payoutAmount: true },
    });
});

test("Requests from non-allowlisted IPs are rejected", async () => {
    const tenant = buildTenant({
        ipAllowlist: [{ ipAddress: "203.0.113.10" }],
    });
    prisma.tenant.findUnique.mockResolvedValue(tenant);

    const headers = buildHmacHeaders({ method: "GET", path: "/history/sessions" });
    const res = await request(app).get("/history/sessions").set(headers);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("TENANT_IP_DENIED");
});
