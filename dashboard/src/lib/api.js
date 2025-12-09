import crypto from "crypto";

const API_BASE_URL = process.env.NEXT_PUBLIC_TENANT_API_URL || "http://localhost:4000";
const TENANT_API_KEY = process.env.NEXT_PUBLIC_TENANT_API_KEY;
const TENANT_API_SECRET = process.env.NEXT_PUBLIC_TENANT_API_SECRET;

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

function ensureTenantKeys() {
    if (!TENANT_API_KEY || !TENANT_API_SECRET) {
        throw new Error("set NEXT_PUBLIC_TENANT_API_KEY and NEXT_PUBLIC_TENANT_API_SECRET in your environment");
    }
}

function ensureAdminKeys() {
    if (!ADMIN_API_KEY || !ADMIN_API_SECRET) {
        throw new Error("set ADMIN_API_KEY and ADMIN_API_SECRET in your environment");
    }
}

export function generateHeaders(method, path, body = "") {
    ensureTenantKeys();

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");
    const bodyHash = crypto.createHash("sha256").update(body).digest("hex");

    const stringToSign = [method, path, timestamp, nonce, bodyHash].join("\n");

    const signature = crypto
        .createHmac("sha256", TENANT_API_SECRET)
        .update(stringToSign)
        .digest("hex");

    return {
        "X-API-KEY": TENANT_API_KEY,
        "X-TIMESTAMP": timestamp,
        "X-NONCE": nonce,
        "X-SIGNATURE": signature,
        "Content-Type": "application/json",
    };
}

function generateAdminHeaders(method, path, body = "") {
    ensureAdminKeys();

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");
    const bodyHash = crypto.createHash("sha256").update(body).digest("hex");

    const stringToSign = [method, path, timestamp, nonce, bodyHash].join("\n");

    const signature = crypto
        .createHmac("sha256", ADMIN_API_SECRET)
        .update(stringToSign)
        .digest("hex");

    return {
        "X-API-KEY": ADMIN_API_KEY,
        "X-TIMESTAMP": timestamp,
        "X-NONCE": nonce,
        "X-SIGNATURE": signature,
        "Content-Type": "application/json",
    };
}

async function fetchWithHmac(method, path, { body } = {}) {
    const payload = body && typeof body !== "string" ? JSON.stringify(body) : body || "";
    const headers = generateHeaders(method, path, payload);

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

async function fetchAdminWithHmac(method, path, { body } = {}) {
    const payload = body && typeof body !== "string" ? JSON.stringify(body) : body || "";
    const canonicalPath = path.split("?")[0];
    const headers = generateAdminHeaders(method, canonicalPath, payload);

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

export async function getSessions() {
    return fetchWithHmac("GET", "/history/sessions");
}

export async function getCallbackHistory() {
    return fetchWithHmac("GET", "/history/callbacks");
}

export async function getWalletHistory(playerId) {
    return fetchWithHmac("GET", `/history/wallet/${playerId}`);
}

export async function getWalletBalance(playerId) {
    return fetchWithHmac("GET", `/wallet/balance/${playerId}`);
}

export async function getAdminTenants() {
    return fetchAdminWithHmac("GET", "/admin/tenants");
}

export async function updateAdminTenant(id, payload) {
    return fetchAdminWithHmac("PATCH", `/admin/tenants/${id}`, { body: payload });
}

export async function updateAdminTenantStatus(id, status) {
    return fetchAdminWithHmac("PATCH", `/admin/tenants/${id}/status`, {
        body: { status },
    });
}

export async function deleteAdminTenant(id) {
    // Send an explicit empty JSON body so the backend sees `{}` and hashes match
    return fetchAdminWithHmac("DELETE", `/admin/tenants/${id}`, { body: {} });
}

export async function createAdminTenant(payload) {
    return fetchAdminWithHmac("POST", "/admin/tenants", { body: payload });
}

export async function rotateAdminTenantCredential(id) {
    return fetchAdminWithHmac("POST", `/admin/tenants/${id}/credentials/rotate`, {
        body: {},
    });
}

export async function getAdminUsers() {
    return fetchAdminWithHmac("GET", "/admin/users");
}

export async function createAdminUser(payload) {
    return fetchAdminWithHmac("POST", "/admin/users", { body: payload });
}

export async function updateAdminUser(id, payload) {
    return fetchAdminWithHmac("PATCH", `/admin/users/${id}`, { body: payload });
}

export async function getAdminTenantWalletConfig(id) {
    return fetchAdminWithHmac("GET", `/admin/tenants/${id}/wallet-config`);
}

export async function updateAdminTenantWalletConfig(id, payload) {
    return fetchAdminWithHmac("POST", `/admin/tenants/${id}/wallet-config`, { body: payload });
}

export async function getAdminTenantIpAllowlist(id) {
    return fetchAdminWithHmac("GET", `/admin/tenants/${id}/ip-allowlist`);
}

export async function addAdminTenantIpAllowlistEntry(id, payload) {
    return fetchAdminWithHmac("POST", `/admin/tenants/${id}/ip-allowlist`, { body: payload });
}

export async function deleteAdminTenantIpAllowlistEntry(tenantId, entryId) {
    return fetchAdminWithHmac("DELETE", `/admin/tenants/${tenantId}/ip-allowlist/${entryId}`, { body: {} });
}

export async function updateAdminTenantGame(tenantId, gameId, payload) {
    return fetchAdminWithHmac("PATCH", `/admin/tenants/${tenantId}/games/${gameId}`, { body: payload });
}

export async function getAdminTenantUsers(id) {
    return fetchAdminWithHmac("GET", `/admin/tenants/${id}/users`);
}

export async function createAdminTenantUser(id, payload) {
    return fetchAdminWithHmac("POST", `/admin/tenants/${id}/users`, { body: payload });
}

export async function updateAdminTenantUserStatus(tenantId, userId, status) {
    return fetchAdminWithHmac("PATCH", `/admin/tenants/${tenantId}/users/${userId}/status`, {
        body: { status },
    });
}

export async function resetAdminTenantUserPassword(tenantId, userId, password) {
    return fetchAdminWithHmac("POST", `/admin/tenants/${tenantId}/users/${userId}/password`, {
        body: { password },
    });
}

export async function getAdminMetrics() {
    return fetchAdminWithHmac("GET", "/admin/metrics/summary");
}

export async function getAdminGgrReport({ startDate, endDate, tenantId, platformPercent } = {}) {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (tenantId) params.set("tenantId", tenantId);
    if (platformPercent) params.set("platformPercent", platformPercent);
    const qs = params.toString();
    const path = qs ? `/admin/reports/ggr?${qs}` : "/admin/reports/ggr";
    return fetchAdminWithHmac("GET", path);
}

export async function getGlobalRtpConfig() {
    return fetchAdminWithHmac("GET", "/admin/rtp/global");
}

export async function updateGlobalRtpConfig(profile) {
    return fetchAdminWithHmac("POST", "/admin/rtp/global", {
        body: { profile },
    });
}

export async function getRtpChangeLogs(limit = 50) {
    return fetchAdminWithHmac("GET", `/admin/rtp/logs?limit=${limit}`);
}

export async function getAdminGames() {
    return fetchAdminWithHmac("GET", "/admin/games");
}

export async function getAdminGame(id) {
    return fetchAdminWithHmac("GET", `/admin/games/${id}`);
}

export async function updateAdminGame(id, payload) {
    return fetchAdminWithHmac("PATCH", `/admin/games/${id}`, { body: payload });
}

export async function createAdminGame(payload) {
    return fetchAdminWithHmac("POST", "/admin/games", { body: payload });
}

export async function getAdminReconciliationRounds(params = {}) {
    const search = new URLSearchParams();
    if (params.tenantId) search.set("tenantId", params.tenantId);
    if (params.gameId) search.set("gameId", params.gameId);
    if (params.status) search.set("status", params.status);
    if (params.minDiscrepancy) search.set("minDiscrepancy", params.minDiscrepancy);
    if (params.startDate) search.set("startDate", params.startDate);
    if (params.endDate) search.set("endDate", params.endDate);
    if (params.currency) search.set("currency", params.currency);
    if (params.limit) search.set("limit", params.limit);
    const qs = search.toString();
    const path = qs ? `/admin/reconciliation/rounds?${qs}` : `/admin/reconciliation/rounds`;
    return fetchAdminWithHmac("GET", path);
}

export async function getAdminReconciliationDiscrepancies(params = {}) {
    const search = new URLSearchParams();
    if (params.tenantId) search.set("tenantId", params.tenantId);
    if (params.minAmount) search.set("minAmount", params.minAmount);
    if (params.currency) search.set("currency", params.currency);
    const qs = search.toString();
    const path = qs ? `/admin/reconciliation/discrepancies?${qs}` : `/admin/reconciliation/discrepancies`;
    return fetchAdminWithHmac("GET", path);
}

export async function getAdminRtpDeviationSummary(params = {}) {
    const search = new URLSearchParams();
    if (params.tenantId) search.set("tenantId", params.tenantId);
    if (params.gameId) search.set("gameId", params.gameId);
    if (params.startDate) search.set("startDate", params.startDate);
    if (params.endDate) search.set("endDate", params.endDate);
    if (params.currency) search.set("currency", params.currency);
    if (params.limit) search.set("limit", params.limit);
    const qs = search.toString();
    const path = qs ? `/admin/reconciliation/rtp-summary?${qs}` : `/admin/reconciliation/rtp-summary`;
    return fetchAdminWithHmac("GET", path);
}

export async function getAdminWalletLogs(params = {}) {
    const search = new URLSearchParams();
    if (params.tenantId) search.set("tenantId", params.tenantId);
    if (params.status) search.set("status", params.status);
    if (params.type) search.set("type", params.type);
    if (params.hours) search.set("hours", params.hours);
    if (params.limit) search.set("limit", params.limit);
    const qs = search.toString();
    const path = qs ? `/admin/wallet/logs?${qs}` : `/admin/wallet/logs`;
    return fetchAdminWithHmac("GET", path);
}

export async function getAdminWalletLogMetrics(hours) {
    const qs = hours ? `?hours=${hours}` : "";
    return fetchAdminWithHmac("GET", `/admin/wallet/logs/metrics${qs}`);
}
