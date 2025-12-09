# Tenant Onboarding Runbook

Steps the platform team follows to onboard a new tenant and provide access to operators.

## 1. Create Tenant
- Admin portal > Tenants > "Create Tenant".
- Populate name, domain, contact email.
- API keys (HMAC) and OAuth client are generated automatically.

## 2. Provision Wallet Adapter
- Admin portal > Tenant detail > Wallet Integration.
- Enter debit, credit, balance URLs and wallet secret provided by tenant.
- Test endpoints (use Postman collection) to confirm 2xx responses.

## 3. Configure Network Access (Optional but recommended)
- Collect the tenant's static egress IPs/VPN ranges.
- Admin portal > Tenant detail > IP Allowlist (or use /admin/tenants/{id}/ip-allowlist).
- Add each IPv4/IPv6 address; verify tenants can still call `/tenant/me`.
- Reminder: if the allowlist is non-empty, any call from an unknown IP fails with `TENANT_IP_DENIED`.

## 3. Assign Games
- Admin portal > **Assignments** to view every tenant/game combination.
- Filter by tenant or game (URL parameters persist) and use the inline RTP drop-down or Enable/Disable button. Each action calls `PATCH /admin/tenants/{tenantId}/games/{gameId}` via the dashboard API route.
- Changes take effect immediately in `/admin/reports/ggr` and tenant dashboards; record any overrides in the hand-off notes.

## 4. Create Tenant Users
- Tenant detail > "Tenant Users".
- Add operator/analyst accounts (email + password).
- Share login URL /tenant/login and credentials with tenant securely.

## 5. Share Credentials
- Provide tenant: ID, API key/secret, wallet secret, list of assigned games.
- Include HMAC signing instructions (see integration guide) and Postman collection.

## 6. Perform Smoke Tests
- Log into /tenant portal using tenant operator account.
- Run a test launch (POST /games/launch) with demo amount.
- Verify wallet callbacks, session history, and dashboard metrics update.

## 7. Go Live Checklist
- [ ] Tenant confirms wallet endpoints reachable from platform.
- [ ] Monitoring alerts configured (wallet failures, RTP deviation). See monitoring-alerts.md for thresholds and routing.
- [ ] Admin retains runbook + signed-off test results.
