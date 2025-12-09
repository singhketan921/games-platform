# RTP Simulation Harness

Use this script to seed synthetic rounds for QA and to validate that RTP stays within the ±0.5% threshold defined in the SRS.

## Script
`npm run rtp:sim` (prints usage) or run `node scripts/rtp-sim.js` with flags described below.

### Required flags
- `--tenant <tenantId>` - tenant id to attach synthetic rounds to.
- `--game <gameId>` - game id for the assignments (needs to exist in Prisma).

### Optional flags
| Flag | Default | Description |
| --- | --- | --- |
| `--profile` | `MEDIUM` | Target RTP profile (`HIGH`=97 %, `MEDIUM`=95 %, `LOW`=90 %).
| `--rounds` | `5000` | Number of synthetic rounds to insert.
| `--bet` | `100` | Bet size per round (in the tenant currency).
| `--currency` | `INR` | Currency stored on `roundResult.currency`.
| `--playerPrefix` | `rtp-sim-player` | Prefix for generated player ids.
| `--variance` | `0.1` | Random noise multiplier around the target RTP (10 % by default).
| `--tolerance` | `0.005` | Allowed RTP deviation before reporting FAIL (0.5 %).
| `--batch` | `500` | Batch size for Prisma `createMany` writes.
| `--dry-run` | `false` | When provided, no DB writes occur (summary only).

### Example
```bash
node scripts/rtp-sim.js \
  --tenant tenant_demo \
  --game game_teenpatti \
  --profile HIGH \
  --rounds 10000 \
  --bet 150 \
  --currency USD
```

The script prints totals, actual RTP, deviation, and whether it stayed within the tolerance. Use `--dry-run` first to validate inputs before inserting data. Each row is tagged with `metadata.simulation = true`, so QA can filter synthetic rounds when reviewing dashboards. When logging evidence, copy `docs/rtp-sim-report-template.md` to `docs/rtp-sim-report-YYYYMMDD.md` and attach the console output + findings.
