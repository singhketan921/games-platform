process.env.AUTH_TOKEN_SECRET = "unit-test-secret";
process.env.OAUTH_TOKEN_TTL_SECONDS = "60";

jest.mock("../src/prisma/client", () => ({
    tenantCredential: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
    },
}));

jest.mock("bcryptjs", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

const authService = require("../src/services/authService");
const prisma = require("../src/prisma/client");
const bcrypt = require("bcryptjs");

beforeEach(() => {
    jest.clearAllMocks();
});

test("upsertTenantCredential stores hashed secret and returns raw credentials", async () => {
    bcrypt.hash.mockResolvedValue("hashed-secret");
    prisma.tenantCredential.upsert.mockResolvedValue({});

    const result = await authService.upsertTenantCredential("tenant-1");

    expect(result.clientId).toMatch(/^cl_/);
    expect(result.clientSecret).toHaveLength(64);

    const upsertArgs = prisma.tenantCredential.upsert.mock.calls[0][0];
    expect(upsertArgs.where.tenantId).toBe("tenant-1");
    expect(upsertArgs.update.clientSecretHash).toBe("hashed-secret");
    expect(upsertArgs.create.clientSecretHash).toBe("hashed-secret");
});

test("issueAccessToken verifies client secret and returns bearer token", async () => {
    prisma.tenantCredential.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        clientId: "cl_test",
        clientSecretHash: "hashed-secret",
        status: "active",
    });
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.issueAccessToken({
        clientId: "cl_test",
        clientSecret: "plain-secret",
        scope: "wallet:read wallet:write",
    });

    expect(result.accessToken).toBeDefined();
    expect(result.expiresIn).toBe(60);
    expect(result.payload.scope).toEqual(["wallet:read", "wallet:write"]);

    const payload = await authService.verifyAccessToken(result.accessToken);
    expect(payload.tenantId).toBe("tenant-1");
    expect(payload.scope).toEqual(["wallet:read", "wallet:write"]);
});

test("verifyAccessToken returns null for invalid or expired signatures", async () => {
    const invalid = await authService.verifyAccessToken("not-a-token");
    expect(invalid).toBeNull();
});

test("issueAccessToken rejects invalid client secrets", async () => {
    prisma.tenantCredential.findUnique.mockResolvedValue({
        tenantId: "tenant-1",
        clientId: "cl_test",
        clientSecretHash: "hashed-secret",
        status: "active",
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
        authService.issueAccessToken({ clientId: "cl_test", clientSecret: "bad" })
    ).rejects.toMatchObject({ code: "INVALID_CLIENT" });
});
