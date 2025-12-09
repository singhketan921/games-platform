# Dashboard Apps

This Next.js workspace hosts two surfaces:

- **Admin Portal** under `/admin`, used by the platform team to manage tenants, games, RTP settings, wallet adapters, and reports. These pages call the privileged admin APIs using the `ADMIN_API_KEY/SECRET` pair.
- **Tenant Portal** under `/tenant`, used by casino operators to monitor their own sessions, wallet callbacks, and revenue summaries. Every request that leaves the tenant portal is signed with the tenant's API key and secret via HMAC.

The entire project is server-rendered (App Router) and only relies on the backend HTTP APIs described in the SRS.

## Prerequisites

- Node.js 20+
- A running backend/API server (defaults to `http://localhost:4000`)
- Environment variables (place them in `dashboard/.env.local`):
  - `NEXT_PUBLIC_TENANT_API_URL` – base URL for both admin and tenant API calls.
  - `ADMIN_API_KEY` / `ADMIN_API_SECRET` – HMAC pair with admin privileges.

Create at least one tenant user in the database before testing the portal. Use the **Admin Portal → Tenants → Tenant Users** panel to invite accounts, or the helper script:

```bash
node scripts/createTenantUser.js <tenantId> <email> <password> [role]
# example: node scripts/createTenantUser.js tenant_cmi1... ops@tenant.com changeme OPERATOR
```

Each tenant user automatically reuses the tenant's HMAC key pair—no more manual copy/paste during login.

## Running Locally

```bash
cd dashboard
npm install
npm run dev
```

Visit `http://localhost:3000/admin` for the admin experience or `http://localhost:3000/tenant` for the tenant portal (you will be redirected to the login page).

## Tenant Login Flow

1. Browse to `/tenant/login` and enter the tenant ID (from the admin portal), plus your tenant user email and password.
2. The dashboard calls `POST /tenant/auth/login`, which validates the tenant user and returns the tenant's HMAC key pair.
3. On success, the portal stores `tenant-key`, `tenant-secret`, and a few identity cookies (`tenant-id`, `tenant-user-id`, `tenant-user-role`) so every subsequent request is signed automatically.
4. Clicking Logout wipes all of those cookies.

If the credentials are invalid or the backend is unreachable, the form displays the API's error message.

### Tenant Roles

- `OPERATOR` – Full control: can launch games and trigger wallet debits/credits.
- `ANALYST` – Read-only access for dashboards and reports; attempts to launch games will be blocked server-side.
- `READ_ONLY` – Minimal view access; cannot mutate anything.

The backend enforces these roles on sensitive endpoints (game launches, wallet debits/credits). The tenant portal surfaces a badge showing the signed-in role and disables any operator-only UI when necessary.

## Testing Notes

- All tenant portal pages derive data from the tenant-specific endpoints, so every tester should log in with tenant IDs tied to their sandbox tenant.
- Admin pages continue to use `ADMIN_API_KEY/SECRET`, so their coverage is unaffected by tenant logins.
- When rotating tenant credentials, log out and sign back in so the cookies contain the newest HMAC values.
