const authService = require("../services/authService");

function parseBasicAuth(header) {
    if (!header || !header.startsWith("Basic ")) {
        return null;
    }
    const base64Credentials = header.slice("Basic ".length).trim();
    const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");
    const [clientId, clientSecret] = decoded.split(":");
    if (!clientId || !clientSecret) {
        return null;
    }
    return { clientId, clientSecret };
}

exports.token = async (req, res) => {
    try {
        const grantType = req.body?.grant_type || req.query?.grant_type;
        if (grantType !== "client_credentials") {
            return res.status(400).json({ error: "unsupported_grant_type", message: "Only client_credentials is supported" });
        }

        const basicCredentials = parseBasicAuth(req.header("authorization"));
        const clientId = basicCredentials?.clientId || req.body?.client_id;
        const clientSecret = basicCredentials?.clientSecret || req.body?.client_secret;

        if (!clientId || !clientSecret) {
            return res.status(401).json({ error: "invalid_client", message: "Missing client credentials" });
        }

        const scope = req.body?.scope || req.query?.scope;
        const result = await authService.issueAccessToken({ clientId, clientSecret, scope });

        res.json({
            access_token: result.accessToken,
            token_type: "Bearer",
            expires_in: result.expiresIn,
            scope: result.payload.scope?.join(" "),
        });
    } catch (err) {
        if (err.code === "INVALID_CLIENT") {
            return res.status(401).json({ error: "invalid_client", message: "Invalid client credentials" });
        }
        console.error("OAuth token issue error:", err);
        res.status(500).json({ error: "server_error", message: "Failed to issue access token" });
    }
};
