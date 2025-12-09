# RTP Simulation Report – 2025-12-08

## Overview
| Field | Value |
| --- | --- |
| Date | 2025-12-08 |
| Tenant ID | tenant_demo |
| Game ID | teen_patti |
| RTP profile | HIGH |
| Script version | scripts/rtp-sim.js (npm run rtp:sim) |
| Operator | Codex (dry run) |

## Parameters
```text
rounds=2000
bet=150
currency=USD
playerPrefix=rtp-sim-player
variance=0.1
tolerance=0.005
batch=500
dryRun=true
```

## Results
| Metric | Value |
| --- | --- |
| Total bets | 300000.00 USD |
| Total payouts | 291031.07 USD |
| Actual RTP | 97.01 % |
| Target RTP | 97.00 % |
| Delta (bps) | 1.3 |
| Within tolerance? | PASS |
| DB writes | dry run |

```
RTP Simulation Summary
----------------------
Tenant/Game: tenant_demo / teen_patti
Profile: HIGH (target 97.00%)
Rounds simulated: 2000
Total bets: 300000.00 USD
Total payouts: 291031.07 USD
Actual RTP: 97.01% (delta 0.01%)
Tolerance: ±0.50% -> PASS
Database writes: skipped (dry run)
```

## Observations
- Dry run validates the harness can simulate thousands of rounds without touching the database.
- Actual RTP stayed within tolerance; ready to run against staging DB once approved.

## Next Steps
- Execute a non-dry-run simulation in staging after seeding demo tenants.
- Store the resulting report under `docs/rtp-sim-report-YYYYMMDD.md` with PASS/FAIL outcome.
