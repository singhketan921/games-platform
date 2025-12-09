import crypto from "crypto";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_TENANT_API_URL || "http://localhost:4000";

function requireTenantCredentials() {
  const store = cookies();
  const apiKey = store.get("tenant-key")?.value;
  const apiSecret = store.get("tenant-secret")?.value;

  if (!apiKey || !apiSecret) {
    throw new Error("Tenant authentication required. Please sign in again.");
  }

  return { apiKey, apiSecret };
}

function buildHeaders(apiKey, apiSecret, method, path, body = "") {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
  const stringToSign = [method, path, timestamp, nonce, bodyHash].join("\n");

  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(stringToSign)
    .digest("hex");

  return {
    "X-API-KEY": apiKey,
    "X-TIMESTAMP": timestamp,
    "X-NONCE": nonce,
    "X-SIGNATURE": signature,
    "Content-Type": "application/json",
  };
}

async function tenantFetch(method, path, { body, credentials } = {}) {
  const payload =
    body && typeof body !== "string" ? JSON.stringify(body) : body || "";
  const canonicalPath = path.split("?")[0];
  const { apiKey, apiSecret } = credentials || requireTenantCredentials();
  const headers = buildHeaders(apiKey, apiSecret, method, canonicalPath, payload);
  const store = cookies();
  const userId = store.get("tenant-user-id")?.value;
  const userRole = store.get("tenant-user-role")?.value;
  if (userId) {
    headers["X-TENANT-USER-ID"] = userId;
  }
  if (userRole) {
    headers["X-TENANT-USER-ROLE"] = userRole;
  }

  const fetchOptions = {
    method,
    headers,
    cache: "no-store",
  };

  if (payload) {
    fetchOptions.body = payload;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data;
}

export async function getTenantSessions() {
  return tenantFetch("GET", "/history/sessions");
}

export async function getTenantPlayerSessions(playerId) {
  if (!playerId) throw new Error("playerId is required");
  return tenantFetch("GET", `/history/players/${encodeURIComponent(playerId)}`);
}

export async function getTenantSessionDetail(sessionId) {
  if (!sessionId) throw new Error("sessionId is required");
  return tenantFetch("GET", `/history/sessions/${encodeURIComponent(sessionId)}`);
}

export async function getTenantCallbacks() {
  return tenantFetch("GET", "/history/callbacks");
}

export async function getTenantWalletHistory(playerId) {
  return tenantFetch("GET", `/history/wallet/${playerId}`);
}

export async function debitTenantWallet({ playerId, amount, reference }) {
  return tenantFetch("POST", "/wallet/debit", { body: { playerId, amount, reference } });
}

export async function creditTenantWallet({ playerId, amount, reference }) {
  return tenantFetch("POST", "/wallet/credit", { body: { playerId, amount, reference } });
}

export async function testTenantCredentials(apiKey, apiSecret) {
  await tenantFetch("GET", "/history/sessions", { credentials: { apiKey, apiSecret } });
}

export async function getTenantProfile() {
  return tenantFetch("GET", "/tenant/me");
}

export async function launchTenantGame({ playerId, gameId, amount }) {
  return tenantFetch("POST", "/games/launch", {
    body: { playerId, gameId, amount },
  });
}

export async function getTenantGgrReport(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) {
    query.set("startDate", params.startDate);
  }
  if (params.endDate) {
    query.set("endDate", params.endDate);
  }
  if (params.currency) {
    query.set("currency", params.currency);
  }
  if (params.platformPercent) {
    query.set("platformPercent", params.platformPercent);
  }
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return tenantFetch("GET", `/tenant/reports/ggr${queryString}`);
}
