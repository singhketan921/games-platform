# Testing & Quality Assurance Strategy

This document captures the testing scope required to satisfy the SRS across unit, integration, load, and UAT phases. Treat it as the canonical checklist during each release.

## 1. Unit Tests
- **Scope**: currency helpers, HMAC middleware, auth service, wallet/session controllers, Prisma data mappers.
- **Tooling**: Jest (current suites live under `__tests__/`).
- **Targets**:
  - >=80% line coverage on critical modules (`src/controllers`, `src/services`).
  - Mock Prisma/bcrypt for deterministic runs.
  - Run on every PR via `.github/workflows/node-ci.yml`.

## 2. Integration API Tests
- **Scope**: spin up the Express app (or use supertest) and call public routes end-to-end.
- **Required scenarios**:
  1. Tenant lifecycle: create tenant -> rotate credentials -> verify `/tenant/me`.
  2. Wallet flow: debit/credit (with mock wallet adapter) + reconciliation reports.
  3. OAuth vs HMAC auth matrix (wallet/session endpoints).
  4. IP allowlist enforcement (positive/negative cases).
- **Next actions**: add Jest `@jest-environment node` suites that boot the app + seed a test DB, or wire a Newman collection using `docs/api/postman_collection.json`.

## 3. Load & Performance Tests
- **Objectives**: prove 10k concurrent players / 2k bets per second (per SRS section 7).
- **Approach**:
  - The initial harness lives at `scripts/load/k6-wallet-flow.js` (documented in `docs/load-testing.md`). Run it locally using `npm run load:test` (requires k6 CLI). It replays the tenant HMAC flow (`/sessions/verify` -> `/wallet/debit` -> `/wallet/credit`).
  - Expand with additional scenarios (`/game-engine/rounds`, wallet failure retries) by cloning the script and adjusting payloads.
  - Run against staging Kubernetes clusters with Prometheus dashboards watching CPU/memory/RTP deviation.
  - Capture success/failure rates and latency percentiles; copy `docs/load-test-report-template.md` to `docs/load-test-report-YYYYMMDD.md` before storing evidence.

## 4. RTP Simulation Harness
- **Goal**: validate the RTP engine stays within +/-0.5% of the configured profile.
- **Current tooling**:
  - `scripts/rtp-sim.js` (see `docs/rtp-sim.md`) inserts synthetic rounds for each RTP profile, prints actual vs target RTP, and tags rows with `metadata.simulation = true`. Run via `npm run rtp:sim` to view usage/options.
  - Run with `--dry-run` first, then capture outputs + PASS/FAIL summaries by copying `docs/rtp-sim-report-template.md` to `docs/rtp-sim-report-YYYYMMDD.md`.
- **Next actions**:
  - Integrate with CI (nightly) to guard against regressions.
  - Use generated rounds to exercise the reconciliation dashboard and alerting flows.

## 5. UAT Checklist
- **Environment**: staging cluster + tenant-specific credentials.
- **Steps**:
  1. Admin creates tenant, configures wallet adapter, assigns games.
  2. Tenant operator logs in to dashboard, launches a game via `/games/launch`, verifies wallet callbacks.
  3. Admin reviews GGR + reconciliation dashboards for the tenant.
  4. Monitoring alerts (wallet failure, RTP deviation) are triggered/cleared using synthetic events.
  5. Android/WebGL free-game build smoke test.
- Capture sign-off in `docs/uat/<release>.md` (copy `docs/uat/uat-report-template.md`).

## 6. Automation & Tooling
- CI: `.github/workflows/node-ci.yml` (unit tests), `.github/workflows/helm-ci.yml` (chart lint).
- Future work: add `k6-load-test.yml` workflow + nightly RTP sim job.
- Secrets: use GitHub Encrypted Secrets for DB URL / admin keys.

## 7. Status & Next Steps
- Unit coverage improving (currency/auth/middleware tests added).
- Integration suite now exercises wallet + history endpoints using supertest; expand to tenant/admin APIs next.
- Load harness bootstrap (`scripts/load/k6-wallet-flow.js`) ready; need staging run + report capture.
- RTP simulation script ready (`scripts/rtp-sim.js`); first dry-run captured in `docs/rtp-sim-report-20251208.md`. Next: run against staging DB + automate nightly runs.
- UAT checklist drafted above but requires conversion into issue template.

Track progress via `docs/status-matrix.md` (Testing row).
