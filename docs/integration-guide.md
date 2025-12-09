# Integration Guide

This document explains how tenant partners integrate with the platform using the existing APIs.

## Prerequisites
- Admin has created your tenant and shared the tenant ID, API key/secret, and wallet adapter credentials.
- You have at least one tenant user account (created via admin portal) to access the dashboard and retrieve launch/session data.

## Authentication
All tenant API calls are signed with HMAC SHA-256 and require the following headers:

```
X-API-KEY, X-TIMESTAMP, X-NONCE, X-SIGNATURE, Content-Type
```

Signature string:
```
<HTTP_METHOD>\n<PATH>\n<TIMESTAMP>\n<NONCE>\n<SHA256_RAW_BODY>
```

### OAuth Access Tokens (Optional)
- Service-to-service clients may request a `Bearer` token via `POST /oauth/token` using the OAuth 2.0 client credentials flow.
- Send an `Authorization: Basic base64(client_id:client_secret)` header (preferred) or include `client_id`/`client_secret` and `grant_type=client_credentials` in the JSON body.
- Successful responses return `{ "access_token": "...", "token_type": "Bearer", "expires_in": 900 }`. Include this token as `Authorization: Bearer <token>` instead of HMAC headers for API calls.
- Tokens inherit the same IP allowlist restrictions as HMAC requests. Rotate secrets via the admin dashboard if a client is compromised.
- Scopes gate what an access token may do. Current scopes:
  - `wallet:read` – required for `GET /wallet/balance/:playerId`
  - `wallet:write` – required for `POST /wallet/debit|credit`
  - `session:write` – required for `POST /sessions/verify`
  - `*` – wildcard (full tenant access; avoid unless necessary)
  HMAC requests bypass scope checks and continue to require tenant user roles where applicable.

## Network Access & IP Allowlist
- The platform can enforce an IP allowlist per tenant. When enabled, any request whose source IP does not match the allowlist is rejected before signature verification.
- Provide the operations team with the public IPv4/IPv6 addresses of your API gateway, VPN, or egress proxies. They will add entries via `POST /admin/tenants/{id}/ip-allowlist`.
- To retire an address, request a removal or call `DELETE /admin/tenants/{id}/ip-allowlist/{entryId}` using admin credentials. Keep the list current before rotating infrastructure to avoid accidental lockouts.

## Session Lifecycle
1. Tenant player initiates play ? call `POST /games/launch` with `playerId`, `gameId`, `amount`.
2. Backend debits wallet via configured adapter, opens `PlayerSession`, returns `launchUrl`.
3. Game engine plays round; callbacks arrive at tenant wallet endpoints and `POST /game-callback` (handled by platform).
4. Tenant can query `GET /history/sessions` or `/history/wallet/{playerId}` for reconciliation.

## Wallet Callbacks
Tenant must implement:
- `POST /wallet/debit`
- `POST /wallet/credit`
- `GET /wallet/balance`

Each endpoint must accept HMAC signed payloads (shared secret configured via admin portal). Respond with JSON `{ "success": true }` and maintain idempotency using `reference` and `X-Idempotency-Key` headers.

## Multi-Currency Round Logging
- The game engine posts round data to the platform (`POST /game-engine/rounds`). Include the ISO 4217 `currency` used for the bet/payout (e.g., `INR`, `USD`). If omitted the platform assumes `INR`.
- Admin reconciliation reports and RTP deviation summaries can be filtered by currency; log rounds using the same code you expect to reconcile against tenant wallets.

## Error Catalogue
| Code | Meaning | Action |
|------|---------|--------|
| TENANT_ROLE_DENIED | Tenant user lacks required role | Use operator account |
| TENANT_USER_INACTIVE | Tenant user disabled | Admin must reactivate |
| WALLET_ADAPTER_ERROR | Upstream wallet failed | Retry per wallet policy |

## Testing Checklist
- [ ] Generate admin + tenant keys in staging.
- [ ] Configure wallet endpoints with mock server.
- [ ] Run launch + callback flow end-to-end.
- [ ] Confirm wallet reconciliation using `/history/wallet/{playerId}`.
- [ ] Verify GGR dashboard shows expected totals.
