# Load Testing Harness

This repo now ships a k6 scenario that hammers the tenant APIs using the same HMAC headers as production traffic. Use it to validate the 10k concurrent players / 2k bets per second acceptance criteria from the SRS.

## Prerequisites
- [k6](https://k6.io/docs/getting-started/installation/) CLI installed locally or inside your CI runner.
- A running instance of the backend with a test tenant, wallet configuration, and active tenant user (role `OPERATOR`).

## Environment variables
Set these when running `k6 run`:

| Variable | Required | Description |
| --- | --- | --- |
| `API_BASE_URL` | No (default `http://localhost:3000`) | Base URL of the Express API. |
| `TENANT_API_KEY` | Yes | Tenant API key used for HMAC auth. |
| `TENANT_SECRET` | Yes | Tenant API secret paired with the API key. |
| `TENANT_USER_ID` | No (default `loadtest-operator`) | Tenant user id that has the `OPERATOR` role for wallet writes. |
| `PLAYER_PREFIX` | No | Prefix for synthetic playerIds (defaults to `loadtest-player`). |
| `SESSION_TTL` | No | TTL passed to `/sessions/verify` (seconds). |
| `BET_AMOUNT` | No | Amount passed to `/wallet/debit` (string). |
| `PAYOUT_MULTIPLIER` | No | Multiplier applied to `BET_AMOUNT` for `/wallet/credit` responses (default `0.92`). |
| `VUS` | No | Number of virtual users. |
| `DURATION` | No | Total test duration (`2m`, `10m`, etc.). |
| `SLEEP_SECONDS` | No | Delay between rounds inside each VU iteration. |

## Running the test
```bash
# Example: 50 users hammering a staging API for 5 minutes
k6 run \
  -e API_BASE_URL=https://staging.example.com \
  -e TENANT_API_KEY=tenant_xxx \
  -e TENANT_SECRET=supersecret \
  -e TENANT_USER_ID=usr_123 \
  -e VUS=50 \
  -e DURATION=5m \
  scripts/load/k6-wallet-flow.js
```
Or simply run `npm run load:test` (k6 must be installed and on your PATH) and supply the env vars inline, e.g.:
```bash
API_BASE_URL=https://staging.example.com \
TENANT_API_KEY=tenant_xxx \
TENANT_SECRET=supersecret \
TENANT_USER_ID=usr_123 \
VUS=50 \
DURATION=5m \
npm run load:test
```

### Local automation shortcut

To reproduce the “mock wallet + docker Postgres” setup that was used for the latest report, use the helper script:

```powershell
# From the repo root (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/run-loadtest-local.ps1 `
  -ApiPort 4100 `
  -Vus 15 `
  -Duration 120s `
  -SleepSeconds 0.05
```

The script performs these actions for you:

1. Brings up the docker-compose Postgres container (and stops it afterwards if you pass `-StopDockerWhenDone`).
2. Runs `npx prisma db push --skip-generate` against `postgresql://postgres:password@localhost:5432/games_platform`.
3. Seeds deterministic tenant/game/operator data with `node scripts/seed/loadtest.js --wallet-mode=mock`.
4. Starts the Node API (`node app.js`) on the requested port plus the mock wallet server from `scripts/mock-wallet-server.js`.
5. Runs `npm run load:test` with the appropriate env vars (k6 path is injected automatically if you have it under `tools/k6/`).
6. Tears down the helper processes and restores the wallet config to the default `https://httpbin.org/*` URLs.

If you only need the seed logic (for example to prep staging test data), you can call:

```bash
node scripts/seed/loadtest.js \
  --wallet-mode=httpbin \
  --tenant-api-key=<your_key> \
  --tenant-api-secret=<your_secret>
```

Every option also has an env-var override (see `scripts/seed/loadtest.js` for the full list).

k6 emits latency/throughput metrics and respects Prometheus/Grafana alerting if pointed at staging. When capturing official evidence, duplicate `docs/load-test-report-template.md` to `docs/load-test-report-YYYYMMDD.md` and paste the k6 summary along with screenshots/metrics.

---

For more scenarios (wallet failures, RTP skew), duplicate the script and tweak the request mix. Future CI work can hook this into a nightly job once a staging cluster is available.
