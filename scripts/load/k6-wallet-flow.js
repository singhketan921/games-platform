import http from "k6/http";
import { check, sleep } from "k6";
import crypto from "k6/crypto";

const API_BASE_URL = __ENV.API_BASE_URL || "http://localhost:3000";
const API_KEY = __ENV.TENANT_API_KEY;
const API_SECRET = __ENV.TENANT_SECRET;
const TENANT_USER_ID = __ENV.TENANT_USER_ID || "loadtest-operator";
const PLAYER_PREFIX = __ENV.PLAYER_PREFIX || "loadtest-player";
const SESSION_TTL = Number(__ENV.SESSION_TTL || 120);
const BET_AMOUNT = __ENV.BET_AMOUNT || "25";
const PAYOUT_MULTIPLIER = Number(__ENV.PAYOUT_MULTIPLIER || 0.92);
const SLEEP_SECONDS = Number(__ENV.SLEEP_SECONDS || 1);

if (!API_KEY || !API_SECRET) {
    throw new Error("TENANT_API_KEY and TENANT_SECRET env vars must be provided");
}

export const options = {
    vus: Number(__ENV.VUS || 20),
    duration: __ENV.DURATION || "2m",
    thresholds: {
        http_req_failed: ["rate<0.02"],
        http_req_duration: ["p(95)<900"],
    },
};

function buildHeaders(method, path, bodyString) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = `${timestamp}-${Math.random()}`;
    const hash = crypto.sha256(bodyString || "", "hex");
    const stringToSign = [method, path, timestamp, nonce, hash].join("\n");
    const signature = crypto.hmac("sha256", API_SECRET, stringToSign, "hex");

    return {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
        "X-TIMESTAMP": timestamp,
        "X-NONCE": nonce,
        "X-SIGNATURE": signature,
    };
}

function hmacRequest(method, path, payload, extraHeaders = {}) {
    const bodyString = payload ? JSON.stringify(payload) : "";
    const headers = { ...buildHeaders(method, path, bodyString), ...extraHeaders };
    return http.request(method, `${API_BASE_URL}${path}`, bodyString, { headers });
}

function asNumber(amount) {
    return Math.round(Number(amount) * 100) / 100;
}

export default function () {
    const playerId = `${PLAYER_PREFIX}-${__VU}-${__ITER}`;
    const sessionPayload = {
        playerId,
        ttlSeconds: SESSION_TTL,
        metadata: { source: "k6" },
    };

    const sessionRes = hmacRequest("POST", "/sessions/verify", sessionPayload);
    check(sessionRes, {
        "session issued": (res) => res.status === 200,
    });

    if (sessionRes.status !== 200) {
        sleep(SLEEP_SECONDS);
        return;
    }

    const sessionId = sessionRes.json("sessionId");
    const betReference = `lt-debit-${sessionId}-${__ITER}`;
    const debitPayload = {
        playerId,
        amount: BET_AMOUNT,
        reference: betReference,
    };

    const tenantUserHeaders = TENANT_USER_ID ? { "X-TENANT-USER-ID": TENANT_USER_ID } : {};
    const debitRes = hmacRequest("POST", "/wallet/debit", debitPayload, tenantUserHeaders);
    check(debitRes, {
        "wallet debit ok": (res) => res.status === 200,
    });

    const creditAmount = asNumber(Number(BET_AMOUNT) * PAYOUT_MULTIPLIER).toFixed(2);
    const creditPayload = {
        playerId,
        amount: creditAmount,
        reference: `lt-credit-${sessionId}-${__ITER}`,
    };

    const creditRes = hmacRequest("POST", "/wallet/credit", creditPayload, tenantUserHeaders);
    check(creditRes, {
        "wallet credit ok": (res) => res.status === 200,
    });

    sleep(SLEEP_SECONDS);
}
