const crypto = require("crypto");
const prisma = require("../prisma/client");

// Cache recent nonces to prevent replay attacks (simple version)
let usedNonces = new Set();
setInterval(() => usedNonces.clear(), 1000 * 60 * 10); // clear every 10 minutes

module.exports = async (req, res, next) => {
    try {
        const apiKey = req.header("X-API-KEY");
        const timestamp = req.header("X-TIMESTAMP");
        const nonce = req.header("X-NONCE");
        const signature = req.header("X-SIGNATURE");

        if (!apiKey || !timestamp || !nonce || !signature) {
            return res.status(401).json({ error: "Missing HMAC headers" });
        }

        // Check replay attacks
        if (usedNonces.has(nonce)) {
            return res.status(401).json({ error: "Replay attack detected" });
        }

        usedNonces.add(nonce);

        // Ensure timestamp is fresh (5 minutes window)
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - Number(timestamp)) > 300) {
            return res.status(401).json({ error: "Timestamp expired" });
        }

        // Find tenant by API Key
        const tenant = await prisma.tenant.findUnique({
            where: { apiKey }
        });

        if (!tenant) {
            return res.status(401).json({ error: "Invalid API key" });
        }

        // Compute hash of the raw body so the signature matches exactly what the client sent
        const rawBody = req.rawBody ?? "";
        const bodyHash = crypto
            .createHash("sha256")
            .update(rawBody)
            .digest("hex");

        const stringToSign = [
            req.method,
            req.originalUrl,
            timestamp,
            nonce,
            bodyHash
        ].join("\n");

        const computedSignature = crypto
            .createHmac("sha256", tenant.apiSecret)
            .update(stringToSign)
            .digest("hex");

        if (computedSignature !== signature) {
            console.warn("HMAC mismatch", {
                method: req.method,
                path: req.originalUrl,
                timestamp,
                nonce,
                bodyHash,
                headerSignature: signature,
                computedSignature
            });
            return res.status(401).json({ error: "Invalid signature" });
        }

        // Attach tenant to the request object
        req.tenant = tenant;
        
        next();
    } catch (err) {
        console.error("HMAC Error:", err);
        res.status(500).json({ error: "HMAC validation failed" });
    }
};
