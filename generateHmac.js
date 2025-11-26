const crypto = require("crypto");
const fs = require("fs");

// === YOUR TENANT KEYS ===
const apiKey = "df3b6754f80361e45204962398832f97";
const apiSecret = "a41152935089151c03b976a93603c603b1f8c4d301d2146b01ebc66ac678afae";

// === CLI HELPERS ===
const args = process.argv.slice(2);
let method = "GET";
let path = "/history/sessions";
let body = "";

const printHelp = () => {
    console.log(`Usage: node generateHmac.js [options]

Options:
  -m, --method         HTTP method (defaults to GET)
  -p, --path           Exact URL path you will hit (e.g. /history/sessions/<id>)
  -b, --body           Literal request body string (for POST/PUT/PATCH)
  -f, --body-file      Path to a file whose contents become the request body
  -h, --help           Show this help message

Examples:
  node generateHmac.js -p /history/sessions/cm123
  node generateHmac.js -m POST -p /games/launch -b '{"gameId":"foo"}'
`);
};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-m" || arg === "--method") {
        method = (args[++i] || method).toUpperCase();
    } else if (arg === "-p" || arg === "--path") {
        path = args[++i] || path;
    } else if (arg === "-b" || arg === "--body") {
        body = args[++i] || "";
    } else if (arg === "-f" || arg === "--body-file") {
        const filePath = args[++i];
        if (!filePath) {
            console.error("Body file path expected after", arg);
            process.exit(1);
        }
        body = fs.readFileSync(filePath, "utf8");
    } else if (arg === "-h" || arg === "--help") {
        printHelp();
        process.exit(0);
    } else {
        console.warn("Unrecognized argument:", arg);
    }
}

// === HASH PREP ===
const bodyHash = crypto.createHash("sha256").update(body).digest("hex");

// === Generate timestamp + nonce ===
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomBytes(16).toString("hex");

// === STRING TO SIGN ===
const stringToSign = [method, path, timestamp, nonce, bodyHash].join("\n");

// === SIGNATURE ===
const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(stringToSign)
    .digest("hex");

// === OUTPUT ===
console.log("\n=== STRING TO SIGN ===");
console.log(stringToSign);

console.log("\n=== HEADERS FOR POSTMAN ===");
console.log("X-API-KEY:", apiKey);
console.log("X-TIMESTAMP:", timestamp);
console.log("X-NONCE:", nonce);
console.log("X-SIGNATURE:", signature);
console.log("Content-Type: application/json");
