const crypto = require("crypto");

function generateAdminKeys() {
  const ADMIN_API_KEY = crypto.randomBytes(16).toString("hex");
  const ADMIN_API_SECRET = crypto.randomBytes(32).toString("hex");

  console.log("\n=== ADMIN API CREDENTIALS ===");
  console.log("ADMIN_API_KEY   :", ADMIN_API_KEY);
  console.log("ADMIN_API_SECRET:", ADMIN_API_SECRET, "\n");
}

generateAdminKeys();

