# Games Platform Backend

Node.js + Express API powering the multi-tenant casino dashboard. Key stacks: Prisma/Postgres, HMAC-authenticated admin & tenant surfaces, Prometheus metrics, and a Next.js dashboard (/dashboard).

## Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL (local Docker or managed instance)
- .env file with DATABASE_URL, admin/tenant keys, etc.

## Install & Run
`
npm install
npx prisma migrate deploy
npm start
`
The API listens on PORT (default 4000). The Next.js dashboard lives in dashboard/; run it separately via 
pm install && npm run dev inside that folder (scripts defined there).

## Tests
`
npm test
`
Runs the Jest suite (unit + integration). For deterministic CI/local parity, run `npm run test:ci` (forces `jest --runInBand`). Node CI (`.github/workflows/node-ci.yml`) executes the CI variant with coverage on every push/PR.

## Helm Deployment
See deploy/helm/games-platform. Lint locally via helm lint deploy/helm/games-platform and install with:
`
helm upgrade --install games-platform ./deploy/helm/games-platform \
  --set image.repository=ghcr.io/YOUR/image \
  --set image.tag=v1.0.0
`
Prometheus scraping is enabled by default via a ServiceMonitor (configurable under 
alues.yaml > monitoring).

## Documentation
All operational docs live under docs/:
- docs/api  OpenAPI & Postman
- docs/integration-guide.md  tenant onboarding
- docs/monitoring-alerts.md  alerting plan
- docs/deployment.md  Helm usage
- docs/status-matrix.md  implementation tracker
- docs/tenant-portal.md - dashboard usage notes (now includes IP allowlist guidance)
- docs/testing-plan.md - QA strategy (unit/integration/load/UAT)

## Operational Notes
- OAuth 2.0 client credentials supported via /oauth/token for service-to-service Bearer tokens (see docs/integration-guide.md).
- Tenant HMAC requests can optionally be restricted to an IP allowlist. Configure entries via the admin API (`GET/POST /admin/tenants/{id}/ip-allowlist`, `DELETE /admin/tenants/{id}/ip-allowlist/{entryId}`) or the admin dashboard. When the list is non-empty, all other source IPs receive `TENANT_IP_DENIED`.
