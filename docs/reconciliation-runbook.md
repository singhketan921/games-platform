# Reconciliation Dashboard Runbook

This runbook explains how Ops can use `/admin/reports/reconciliation` to investigate round-level issues.

## Filters & Metrics
- **Tenant / Game**: narrow rounds to a specific tenant or game ID.
- **Status**: PENDING, RECONCILED, MISMATCH, ERROR.
- **Min Discrepancy**: filter to rounds above a monetary delta.
- **Date Range**: optional start/end dates.
- **Currency**: limit results to a specific ISO 4217 code (e.g., INR, USD) to reconcile multi-currency tenants independently.
- **Limit**: defaults to 100 rows (max 200 via API).
- Summary cards display counts per status and the total discrepancy value.

## Table Columns
- **Round**: roundResult id (first 8 chars).
- **Tenant/Game/Player**: identifiers.
- **Bet / Payout / Currency**: monetary columns always render with the currency captured on the round.
- **Discrepancy**: computed payout minus bet.
- **Status**: color coded badge (success = reconciled, warning = mismatch, error = failures).
- **Created**: timestamp.

## RTP Deviation Panels
- **Tenant Summary**: aggregates all rounds for a tenant and compares the bet-weighted target RTP vs actual recorded payouts. Results are segmented per currency to keep INR vs USD streams separate.
- **Tenant/Game Top Deviations**: lists the top combinations by absolute deviation (limited to 25 rows). Investigate any entry whose deviation badge shows warning/error colors (>50 bps difference) to confirm RTP engine + wallet flows are aligned; note the currency column to align with tenant wallet ledgers.
- Filters applied at the top of the page cascade into these panels, so narrow the time range or tenant to focus analysis.

## CSV Export
Use the "Export CSV" button (or hit `/admin/reconciliation/export.csv` with same query params) to download up to 1000 rows for offline review.

## Investigating Mismatches
1. Filter by tenant + status = `MISMATCH` or set `minDiscrepancy` to significant value.
2. Export CSV, share with tenant for wallet comparison.
3. Confirm wallet callbacks logged in `/admin/callbacks` and wallet adapter status in tenant detail.
4. Update round record status via SQL/maintenance script once resolved (UI update flow is pending).

## Synthetic RTP Data for QA
- Use `node scripts/rtp-sim.js --tenant <id> --game <id>` (see `docs/rtp-sim.md`) to seed deterministic rounds with known RTP targets.
- The script tags rows with `metadata.simulation = true`; filter by this flag when validating dashboards or alert thresholds.
- Record PASS/FAIL outputs inside `docs/rtp-sim-report-YYYYMMDD.md` whenever simulations are run for sign-off.

## Alerts & Follow-up
- Monitor the **Discrepancy Total** card daily; spikes indicate wallet communication issues.
- Combine with GGR dashboard to understand revenue impact.
- If a tenant reports missing payouts, search by `playerId` to inspect relevant rounds.
