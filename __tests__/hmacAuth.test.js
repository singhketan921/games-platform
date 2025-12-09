const crypto = require("crypto");

jest.useFakeTimers();

jest.mock("../src/prisma/client", () => ({
    tenant: {
        findUnique: jest.fn(),
    },
}));

jest.mock("../src/services/tenantUserService", () => ({
    getTenantUserById: jest.fn(),
}));

jest.mock("../src/services/authService", () => ({
    verifyAccessToken: jest.fn(),
}));

const prisma = require("../src/prisma/client");
const authService = require("../src/services/authService");
const hmacAuth = require("../src/middleware/hmacAuth");

afterAll(() => {
    jest.useRealTimers();
});

function createRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
}

function generateSignature({ method, path, body, timestamp, nonce, secret }) {
    const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
    const stringToSign = [method, path, timestamp, nonce, bodyHash].join("\n");
    return crypto.createHmac("sha256", secret).update(stringToSign).digest("hex");
}

function uniqueNonce() {
    return `nonce-${Date.now()}-${Math.random()}`;
}

describe("hmacAuth middleware", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("allows valid HMAC requests", async () => {
        const tenant = { id: "tenant-1", apiSecret: "secret", ipAllowlist: [], status: "active" };
        prisma.tenant.findUnique.mockResolvedValue(tenant);

        const method = "POST";
        const path = "/wallet/balance/123";
        const rawBody = JSON.stringify({ sample: true });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = uniqueNonce();
        const signature = generateSignature({ method, path, body: rawBody, timestamp, nonce, secret: tenant.apiSecret });

        const req = {
            method,
            originalUrl: path,
            rawBody,
            ip: "1.1.1.1",
            header(name) {
                const normalized = name.toUpperCase();
                if (normalized === "X-API-KEY") return "tenant-key";
                if (normalized === "X-TIMESTAMP") return timestamp;
                if (normalized === "X-NONCE") return nonce;
                if (normalized === "X-SIGNATURE") return signature;
                return undefined;
            },
        };

        const res = createRes();
        const next = jest.fn();
        await hmacAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.tenant).toBe(tenant);
        expect(res.statusCode).toBe(200);
    });

    test("rejects invalid HMAC signatures", async () => {
        const tenant = { id: "tenant-1", apiSecret: "secret", ipAllowlist: [], status: "active" };
        prisma.tenant.findUnique.mockResolvedValue(tenant);

        const method = "POST";
        const path = "/wallet/balance/123";
        const rawBody = JSON.stringify({ sample: true });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = uniqueNonce();

        const req = {
            method,
            originalUrl: path,
            rawBody,
            header(name) {
                const normalized = name.toUpperCase();
                if (normalized === "X-API-KEY") return "tenant-key";
                if (normalized === "X-TIMESTAMP") return timestamp;
                if (normalized === "X-NONCE") return nonce;
                if (normalized === "X-SIGNATURE") return "bad-signature";
                return undefined;
            },
        };

        const res = createRes();
        const next = jest.fn();
        await hmacAuth(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Invalid signature");
    });

    test("allows bearer token when auth service verifies payload", async () => {
        authService.verifyAccessToken.mockResolvedValue({
            tenantId: "tenant-1",
            clientId: "cl_123",
            scope: ["wallet:read"],
        });
        const tenant = { id: "tenant-1", apiSecret: "secret", ipAllowlist: [], status: "active" };
        prisma.tenant.findUnique.mockResolvedValue(tenant);

        const req = {
            method: "GET",
            originalUrl: "/tenant/me",
            rawBody: "",
            header(name) {
                if (name.toLowerCase() === "authorization") {
                    return "Bearer token-123";
                }
                return undefined;
            },
        };

        const res = createRes();
        const next = jest.fn();
        await hmacAuth(req, res, next);

        expect(authService.verifyAccessToken).toHaveBeenCalledWith("token-123");
        expect(req.tenant).toBe(tenant);
        expect(req.auth).toEqual({ method: "oauth", clientId: "cl_123", scope: ["wallet:read"] });
        expect(next).toHaveBeenCalled();
    });

    test("rejects bearer token when verification fails", async () => {
        authService.verifyAccessToken.mockResolvedValue(null);
        const req = {
            method: "GET",
            originalUrl: "/tenant/me",
            rawBody: "",
            header(name) {
                if (name.toLowerCase() === "authorization") return "Bearer invalid";
                return undefined;
            },
        };
        const res = createRes();
        const next = jest.fn();
        await hmacAuth(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Invalid bearer token");
    });

    test("enforces tenant IP allowlist", async () => {
        const tenant = {
            id: "tenant-1",
            apiSecret: "secret",
            ipAllowlist: [{ ipAddress: "203.0.113.10" }],
            status: "active",
        };
        prisma.tenant.findUnique.mockResolvedValue(tenant);

        const method = "POST";
        const path = "/wallet/balance/123";
        const rawBody = JSON.stringify({ sample: true });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = uniqueNonce();
        const signature = generateSignature({ method, path, body: rawBody, timestamp, nonce, secret: tenant.apiSecret });

        const req = {
            method,
            originalUrl: path,
            rawBody,
            ip: "10.0.0.5",
            header(name) {
                const normalized = name.toUpperCase();
                if (normalized === "X-API-KEY") return "tenant-key";
                if (normalized === "X-TIMESTAMP") return timestamp;
                if (normalized === "X-NONCE") return nonce;
                if (normalized === "X-SIGNATURE") return signature;
                return undefined;
            },
        };

        const res = createRes();
        const next = jest.fn();
        await hmacAuth(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
        expect(res.body.code).toBe("TENANT_IP_DENIED");
    });
});
