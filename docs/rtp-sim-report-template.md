# RTP Simulation Report Template

Copy to `docs/rtp-sim-report-YYYYMMDD.md` for each run.

## Overview
| Field | Value |
| --- | --- |
| Date | |
| Tenant ID | |
| Game ID | |
| RTP profile | (HIGH / MEDIUM / LOW) |
| Script version | `scripts/rtp-sim.js` commit |
| Operator | |

## Parameters
```text
rounds=
bet=
currency=
playerPrefix=
variance=
tolerance=
batch=
dryRun=(true/false)
```

## Results
| Metric | Value |
| --- | --- |
| Total bets | |
| Total payouts | |
| Actual RTP | |
| Target RTP | |
| Delta (bps) | |
| Within tolerance? | (PASS/FAIL) |
| DB writes | (number or `dry run`) |

Paste the console output for reference:
```
<simulation console output>
```

## Observations
- 

## Next Steps
- (e.g., rerun with different profile, investigate deviations)

---

_Tag synthetic rounds by date when citing them in reconciliation dashboards._
