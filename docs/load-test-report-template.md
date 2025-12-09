# Load Test Report Template

Copy this file to `docs/load-test-report-YYYYMMDD.md` before each execution.

## Overview
| Field | Value |
| --- | --- |
| Date | |
| Environment | (e.g., staging, pre-prod) |
| API build / commit | |
| Tenant used | |
| Tools | k6 v?.?.? |
| Scenario | scripts/load/k6-wallet-flow.js |
| Operator | |

## Configuration
```text
API_BASE_URL=
TENANT_API_KEY=
TENANT_SECRET=
TENANT_USER_ID=
VUS=
DURATION=
BET_AMOUNT=
PAYOUT_MULTIPLIER=
SLEEP_SECONDS=
```

## Metrics
| Metric | Value |
| --- | --- |
| Total requests | |
| Errors (count / %) | |
| p50 latency | |
| p90 latency | |
| p95 latency | |
| p99 latency | |
| Throughput (req/s) | |
| Wallet debit success % | |
| Wallet credit success % | |

Paste the raw k6 summary output below for traceability:
```
<k6 summary output>
```

## Findings
- 

## Follow-up Actions
- 

## Attachments
- Grafana dashboard screenshots / links
- Alert screenshots

---

_Note: store additional artifacts (CSV exports, logs) alongside the report or link to your observability stack._
