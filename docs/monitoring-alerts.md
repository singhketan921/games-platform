# Monitoring & Alerting Plan

This guide explains how to operationalize the observability requirements from the SRS. The goal is to surface wallet integration issues and RTP deviation before tenants notice player-impacting behaviour.

## Telemetry Sources
1. **Prometheus /metrics Endpoint**
   - Exposes counters wallet_callback_total, round_result_total, round_result_bet_amount, round_result_payout_amount, and round_result_discrepancy_amount.
   - Scrape /metrics every 30 seconds from Prometheus; label dimensions include tenantId, type, status, gameId, and rtpProfile for targeted alerting.
2. **API Metrics Endpoints**
   - GET /admin/wallet/logs/metrics?hours=<n> returns callback counts grouped by status and type. Use this for dashboards needing contextual samples or longer lookbacks.
   - GET /admin/reconciliation/rtp-summary?limit=25 aggregates RTP drift per tenant and tenant/game combo.
3. **Database Tables**
   - WalletCallbackLog captures each debit/credit/balance webhook attempt with latency, status code, and tenant/game metadata.
   - RoundResult stores the RTP context (bet, payout, discrepancy, target profile) for the RTP deviation checks.
4. **Infrastructure Metrics** (Prom/Grafana stack per SRS)
   - CPU/memory, response latency, and error-rate counters exported via application instrumentation.

## Dashboards
- Wallet Reliability: Plot callback volume, failure %, and p95 latency by tenant. Feed Grafana panels from /metrics (counters) or /admin/wallet/logs/metrics for drill-downs.
- RTP Deviation: Show deviation returned by /admin/reconciliation/rtp-summary or the derived counters from /metrics. Highlight absolute deviation for each tenant and tenant/game pair.
- Systems Health: Standard CPU/memory/error dashboards per microservice plus Postgres/Redis health.

## Alert Catalogue
| Alert | Source | Condition | Action |
| --- | --- | --- | --- |
| Wallet Failure Rate | wallet_callback_total{status!="SUCCESS"} vs total | Failures divided by total > 5% for 5 minutes OR >10 consecutive failures for one tenant | Notify on-call + tenant success channel. Pause affected tenant if wallet is confirmed offline. |
| Wallet Latency | wallet_callback_latency histogram (future) or /admin/wallet/logs/metrics latency samples | p95 latency > 3s for 10 minutes | Investigate wallet endpoint responsiveness; reroute traffic if timeout spikes. |
| RTP Deviation (tenant) | /admin/reconciliation/rtp-summary tenantSummaries or derived counters | abs(deviation) > 0.01 (>1%) for >20 rounds | Trigger RTP investigation runbook; confirm RTP engine inputs and wallet reconciliation. |
| RTP Deviation (tenant/game) | Same endpoint tenantGameSummaries | abs(deviation) > 0.015 for combos with totalBets >= 10000 | Alert game operations; double-check RTP configuration + RNG logs. |
| Round Discrepancy Spike | /admin/reconciliation/rounds?minDiscrepancy=... or round_result_discrepancy_amount counter | discrepancyTotal > 100000 (INR) in 1 hour | Escalate to wallet integrations crew. |

## Implementation Notes
1. Prometheus Exporter: The backend now exposes /metrics. Follow `docs/prometheus-config.md` for scrape configs (Prometheus Operator, ServiceMonitor, or static targets). If private networking blocks it, deploy a sidecar scraper or Pushgateway bridge.
2. Alert Routing: Configure Grafana Alerting (or PagerDuty) to send wallet alerts to the integrations rotation and RTP deviations to the game-ops rotation. Include tenantId/gameId and last-seen timestamps in payloads.
3. Data Freshness: Ensure the reconciliation ingestion job writes RoundResult rows in near real time (<1 minute delay) so deviation alerts remain useful. If ingestion lags, add a freshness alert when no rounds are recorded for 10 minutes while sessions run.
4. Runbook Links: Each alert should link back to docs/reconciliation-runbook.md or wallet troubleshooting docs so responders know the next diagnostic steps.

## Verification Checklist
- [ ] Wallet failure alert fires by forcing a mock wallet endpoint to HTTP 500 and observing Grafana notifications.
- [ ] RTP deviation alert fires by inserting synthetic RoundResult rows exceeding a 1% deviation.
- [ ] Alerts resolve automatically once metrics return to the healthy range.
- [ ] Notifications reach Slack #ops-wallets and PagerDuty according to severity.
