const crypto = require("crypto");

// TODO: FILL THESE FROM YOUR /tenant/create RESPONSE
const apiKey = "df3b6754f80361e45204962398832f97";
const apiSecret = "a41152935089151c03b976a93603c603b1f8c4d301d2146b01ebc66ac678afae";

// Request details:
const method = "POST";
const path = "/games/launch";

// Body:
const body = JSON.stringify({
    gameId: "cmiddlhzj0001u8k8yd949qtq",
    playerId: "12345"
});

// Generate timestamp & nonce
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomBytes(8).toString("hex");

// Body hash
const bodyHash = crypto
    .createHash("sha256")
    .update(body)
    .digest("hex");

// String to sign
const stringToSign = [
    method,
    path,
    timestamp,
    nonce,
    bodyHash
].join("\n");

// Signature
const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(stringToSign)
    .digest("hex");

console.log("\n=== HEADERS FOR POSTMAN ===");
console.log("X-API-KEY:", apiKey);
console.log("X-TIMESTAMP:", timestamp);
console.log("X-NONCE:", nonce);
console.log("X-SIGNATURE:", signature);
console.log("Content-Type: application/json");

console.log("\n=== BODY FOR POSTMAN ===");
console.log(body);
console.log("\nPaste these into Postman.\n");
