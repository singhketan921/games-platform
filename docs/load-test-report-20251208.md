# Load Test Report - 2025-12-08

## Overview
| Field | Value |
| --- | --- |
| Date | 2025-12-08 |
| Environment | local API (PORT=4100) backed by docker-compose Postgres |
| API build / commit | current working tree |
| Tenant used | cmiii1xrl0000u8001obvgpsn (bluorng) |
| Tools | k6 v1.4.2 |
| Scenario | scripts/load/k6-wallet-flow.js |
| Operator | Codex |

## Configuration
```text
API_BASE_URL=http://localhost:4100
TENANT_API_KEY=044aae64a33a86bf29d811c3d7cf8043
TENANT_SECRET=548ac7141a53ceb18614f8c2c3c6b31e5286826046cc7883eb5235a93a369b67
TENANT_USER_ID=cmix7jsnm0001u8xwem0jhblg
VUS=15
DURATION=120s
BET_AMOUNT=25 (default)
PAYOUT_MULTIPLIER=0.92
SLEEP_SECONDS=0.05
PLAYER_PREFIX=k6-player
K6_SUMMARY_TREND_STATS=avg,min,med,p(90),p(95),p(99),max
Docker services: `docker compose up -d postgres` (postgres:15 -> localhost:5432).
Wallet adapter temporarily pointed to http://127.0.0.1:5050/* via mock server to avoid httpbin latency, then reverted.
```

## Metrics
| Metric | Value |
| --- | --- |
| Total requests | 41,487 |
| Errors (count / %) | 0 / 0% |
| p50 latency | 26.69 ms |
| p90 latency | 42.72 ms |
| p95 latency | 47.85 ms |
| p99 latency | 96.97 ms |
| Throughput (req/s) | 345.44 |
| Wallet debit success % | 100% |
| Wallet credit success % | 100% |

Paste the raw k6 summary output below for traceability:
```
  THRESHOLDS

    http_req_duration
    PASS 'p(95)<900' p(95)=47.85ms

    http_req_failed
    PASS 'rate<0.02' rate=0.00%


  TOTAL RESULTS

    checks_total.......: 41487   345.439679/s
    checks_succeeded...: 100.00% 41487 out of 41487
    checks_failed......: 0.00%   0 out of 41487

    PASS session issued
    PASS wallet debit ok
    PASS wallet credit ok

    HTTP
    http_req_duration..............: avg=26.54ms  min=2.67ms  med=26.69ms  p(90)=42.72ms  p(95)=47.85ms  p(99)=96.97ms  max=306.02ms
      { expected_response:true }...: avg=26.54ms  min=2.67ms  med=26.69ms  p(90)=42.72ms  p(95)=47.85ms  p(99)=96.97ms  max=306.02ms
    http_req_failed................: 0.00% 0 out of 41487
    http_reqs......................: 41487 345.439679/s

    EXECUTION
    iteration_duration.............: avg=130.23ms min=81.84ms med=127.46ms p(90)=152.08ms p(95)=181.02ms p(99)=241.51ms max=683.3ms
    iterations.....................: 13829 115.14656/s
    vus............................: 15    min=15         max=15
    vus_max........................: 15    min=15         max=15

    NETWORK
    data_received..................: 22 MB 180 kB/s
    data_sent......................: 19 MB 154 kB/s



running (2m00.1s), 0/15 VUs, 13829 complete and 0 interrupted iterations
default PASS [ 100% ] 15 VUs  2m0s
```

## Findings
- Running the API against a local Postgres container removes the network overhead that previously kept p95 at ~3.7s; latency dropped below 50ms even with 15 concurrent VUs and 41k signed requests.
- A lightweight mock wallet service on `127.0.0.1:5050` eliminates httpbin variability; wallet config is reset to the real endpoints after each run.
- The helper script `scripts/tmp/run-k6.ps1`/mock wallet files were only used during execution and have been removed; recreate them if another local run is needed.

## Follow-up Actions
1. Repeat the test against staging infra (no mock wallet, managed Postgres) to validate thresholds in a production-like environment; capture Grafana/Prometheus artifacts.
2. Automate the docker-postgres + mock-wallet bootstrap (or bake into npm scripts) so CI/nightly runs can spin up the harness reproducibly.
3. Evaluate lower sleep intervals / higher VUs (e.g., 25-50) to approach the 2k bet/sec SRS target now that latency headroom exists.

## Attachments
- Pending (local-only run; no Grafana screenshots for this attempt).
