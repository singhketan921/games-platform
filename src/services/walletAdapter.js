const crypto = require("crypto");
const walletConfigService = require("./walletConfigService");

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

class WalletAdapter {
    constructor({ httpClient = fetch, logger = console, maxRetries = 3, retryDelayMs = 500 }) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
    }

    async debit(params) {
        return this.#sendWithRetry({
            ...params,
            type: "DEBIT",
            urlSelector: (config) => config.debitUrl,
            method: "POST",
        });
    }

    async credit(params) {
        return this.#sendWithRetry({
            ...params,
            type: "CREDIT",
            urlSelector: (config) => config.creditUrl,
            method: "POST",
        });
    }

    async getBalance(params) {
        return this.#sendWithRetry({
            ...params,
            type: "BALANCE",
            urlSelector: (config) => config.balanceUrl,
            method: "GET",
        });
    }

    async #sendWithRetry({ tenantId, payload, type, idempotencyKey, urlSelector, method }) {
        const config = await walletConfigService.getConfig(tenantId);
        if (!config || config.status !== "active") {
            throw new Error("Wallet integration not configured for tenant");
        }

        const endpoint = urlSelector(config);
        if (!endpoint) {
            throw new Error("Wallet endpoint missing for tenant");
        }

        const finalKey = idempotencyKey || `wallet-${type}-${Date.now()}`;
        let attempt = 1;

        while (attempt <= this.maxRetries) {
            try {
                const response = await this.#sendRequest({
                    tenantId,
                    config,
                    endpoint,
                    payload,
                    idempotencyKey: finalKey,
                    attempt,
                    method,
                    type,
                });

                await walletConfigService.logCallback({
                    tenantId,
                    type,
                    endpoint,
                    payload,
                    responseCode: response.status,
                    responseBody: response.bodyText,
                    status: response.ok ? "SUCCESS" : "FAILED",
                    idempotencyKey: finalKey,
                    attempt,
                    errorMessage: response.ok ? null : `HTTP ${response.status}`,
                });

                if (!response.ok) {
                    const error = new Error(`Wallet request failed (${response.status})`);
                    error.__walletLogged = true;
                    throw error;
                }

                return response.body;
            } catch (err) {
                this.logger.error("Wallet request error", { tenantId, type, attempt, err });
                if (!err.__walletLogged) {
                    await walletConfigService.logCallback({
                        tenantId,
                        type,
                        endpoint,
                        payload,
                        responseCode: null,
                        responseBody: null,
                        status: "FAILED",
                        idempotencyKey: finalKey,
                        attempt,
                        errorMessage: err.message,
                    });
                }

                if (attempt >= this.maxRetries) {
                    throw err;
                }

                await delay(this.retryDelayMs * attempt);
                attempt += 1;
            }
        }
    }

    async #sendRequest({ config, endpoint, payload, idempotencyKey, method }) {
        let url = endpoint;
        let bodyString = "";
        if (method === "GET" && payload && Object.keys(payload).length > 0) {
            const params = new URLSearchParams(
                Object.entries(payload).map(([key, value]) => [key, String(value)])
            ).toString();
            url += url.includes("?") ? `&${params}` : `?${params}`;
        } else if (payload && method !== "GET") {
            bodyString = JSON.stringify(payload);
        }
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = crypto.createHmac("sha256", config.hmacSecret).update(bodyString).digest("base64");

        const headers = {
            "Content-Type": "application/json",
            "X-TIMESTAMP": timestamp,
            "X-SIGNATURE": signature,
            "Idempotency-Key": idempotencyKey,
        };

        const request = {
            method,
            headers,
        };

        if (method !== "GET") {
            request.body = bodyString;
        }

        const response = await this.httpClient(url, request);
        const text = await response.text();
        let jsonBody = null;
        try {
            jsonBody = JSON.parse(text);
        } catch {
            // ignore
        }

        return {
            ok: response.ok,
            status: response.status,
            body: jsonBody || { raw: text },
            bodyText: text,
        };
    }
}

module.exports = new WalletAdapter({ logger: console });
