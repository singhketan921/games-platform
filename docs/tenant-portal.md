# Tenant Portal Usage Guide

## Overview
The tenant dashboard (Next.js app under dashboard/app/tenant) lets operators monitor sessions, callbacks, wallet activity, and reports using HMAC-signed API calls.

## Login Flow
1. Admin creates tenant users via /admin/tenants/:id/users.
2. Tenant user logs in at /tenant/login, entering tenant ID + credentials.
3. Success stores 	enant-key, 	enant-secret, and user metadata as HttpOnly cookies for use by 	enantApi.

## Navigation
- Overview: snapshots (sessions, callbacks, wallet balances).
- Sessions: list with optional playerId filter and links to /tenant/sessions/[sessionId] detail page (includes related wallet transactions).
- Callbacks: filter closed sessions by status.
- Wallet: view per-player wallet history, export CSV, and (for operators) debit/credit via the embedded form.
- Reports: Displays tenant-scoped GGR totals with date + currency filters (backed by `GET /tenant/reports/ggr`). Operators can select a currency, adjust platform percentage, and download wallet balances for reconciliation.
- Preferred currency selector: Choose a preferred currency from the wallet sidebar; the value is stored server-side (cookie) and used as the default filter across reports.

## Wallet Actions
Only OPERATOR users see the debit/credit forms.
- POST /wallet/debit or /wallet/credit via API proxies under dashboard/app/api/tenant/wallet. Client forms call these routes, which re-sign using tenant credentials from cookies.
- Amounts require positive decimal input; references optional but recommended for reconciliation.
- Errors bubble up to the form via alerts.

## Session Drilldown
- /tenant/sessions allows filtering by playerId. The main table links to /tenant/sessions/[sessionId], showing metadata + wallet transactions as returned by historyController.getSessionById.

## CSV Export
- Wallet history view renders a client-side CSV download (uses WalletCsvButton) to share transactions externally.

## Security Notes
- All tenant API calls go through 	enantApi which reads cookies and sets X-TENANT-USER-ID + role headers for backend RBAC.
- Sensitive endpoints (debit/credit) are proxied through Next.js API routes so secrets never leak to the browser.
- Ensure HTTPS + HttpOnly cookies in production deployments.
- Platform admins can restrict access further by configuring the tenant IP allowlist (see `/admin/tenants/{id}/ip-allowlist`). When populated, only calls originating from those IPs will pass HMAC validation, so keep VPN ranges updated as operations change.

## Future Enhancements
- Multi-currency selector that persists preferred denomination across pages
- Tenant-specific anomaly reports (wallet failures, RTP variance heatmaps)
