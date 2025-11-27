import crypto from "crypto";

const API_BASE_URL = process.env.NEXT_PUBLIC_TENANT_API_URL || "http://localhost:3000";
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
    const headers = generateAdminHeaders(method, path, payload);

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

export async function launchGame({ playerId, gameId, betAmount }) {
    return fetchWithHmac("POST", "/games/launch", {
        body: {
            playerId,
            gameId,
            betAmount,
        },
    });
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
