const crypto = require("crypto");

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

module.exports = function adminHmacAuth(req, res, next) {
  try {
    const apiKey = req.header("X-API-KEY");
    const timestampHeader = req.header("X-TIMESTAMP");
    const nonce = req.header("X-NONCE");
    const signature = req.header("X-SIGNATURE");

    if (!apiKey || !timestampHeader || !nonce || !signature) {
      return res.status(401).json({ error: "Missing admin HMAC headers" });
    }

    if (!ADMIN_API_KEY || !ADMIN_API_SECRET) {
      console.error("Admin HMAC config missing (ADMIN_API_KEY / ADMIN_API_SECRET)");
      return res.status(500).json({ error: "Admin HMAC config missing" });
    }

    if (apiKey !== ADMIN_API_KEY) {
      return res.status(401).json({ error: "Invalid admin API key" });
    }

    const timestamp = parseInt(timestampHeader, 10);
    if (!Number.isFinite(timestamp)) {
      return res.status(401).json({ error: "Invalid admin timestamp" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return res.status(401).json({ error: "Admin timestamp expired" });
    }

    let rawBody = "";
    const method = req.method.toUpperCase();

    if (method !== "GET" && method !== "HEAD") {
      rawBody = JSON.stringify(req.body || {});
    }

    const bodyHash = crypto.createHash("sha256").update(rawBody).digest("hex");

    const path = req.originalUrl.split("?")[0];

    const stringToSign = [method, path, timestampHeader, nonce, bodyHash].join("\n");

    const expected = crypto
      .createHmac("sha256", ADMIN_API_SECRET)
      .update(stringToSign)
      .digest("hex");

    const providedBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");

    if (providedBuf.length !== expectedBuf.length) {
      return res.status(401).json({ error: "Invalid admin signature" });
    }

    if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return res.status(401).json({ error: "Invalid admin signature" });
    }

    req.admin = { id: "admin", role: "SUPER_ADMIN" };
    next();
  } catch (err) {
    console.error("Admin HMAC verification failed:", err);
    res.status(500).json({ error: "Admin HMAC verification failed" });
  }
};

