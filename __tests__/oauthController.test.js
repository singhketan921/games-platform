jest.mock("../src/services/authService", () => ({
    issueAccessToken: jest.fn(),
}));

const authService = require("../src/services/authService");
const oauthController = require("../src/controllers/oauthController");

function createMockRes() {
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

describe("oauthController.token", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("issues access token with basic auth header", async () => {
        const credentials = Buffer.from("client-id:client-secret").toString("base64");
        const req = {
            body: { grant_type: "client_credentials", scope: "wallet:read" },
            header: (name) => (name.toLowerCase() === "authorization" ? `Basic ${credentials}` : undefined),
        };

        authService.issueAccessToken.mockResolvedValue({
            accessToken: "token123",
            expiresIn: 900,
            payload: { scope: ["wallet:read"] },
        });

        const res = createMockRes();
        await oauthController.token(req, res);

        expect(authService.issueAccessToken).toHaveBeenCalledWith({
            clientId: "client-id",
            clientSecret: "client-secret",
            scope: "wallet:read",
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            access_token: "token123",
            token_type: "Bearer",
            expires_in: 900,
            scope: "wallet:read",
        });
    });

    test("rejects unsupported grant types", async () => {
        const req = {
            body: { grant_type: "password" },
            header: () => undefined,
        };
        const res = createMockRes();
        await oauthController.token(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("unsupported_grant_type");
    });

    test("returns invalid_client when credentials missing", async () => {
        const req = {
            body: { grant_type: "client_credentials" },
            header: () => undefined,
        };
        const res = createMockRes();
        await oauthController.token(req, res);
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("invalid_client");
    });

    test("bubbles invalid_client error from auth service", async () => {
        const credentials = Buffer.from("client-id:client-secret").toString("base64");
        const req = {
            body: { grant_type: "client_credentials" },
            header: (name) => (name.toLowerCase() === "authorization" ? `Basic ${credentials}` : undefined),
        };
        authService.issueAccessToken.mockRejectedValue(Object.assign(new Error("bad creds"), { code: "INVALID_CLIENT" }));
        const res = createMockRes();
        await oauthController.token(req, res);
        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("invalid_client");
    });
});
