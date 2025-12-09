# Prometheus Integration Guide

Use this guide to wire the platform's `/metrics` endpoint into Prometheus and Grafana. The endpoint exposes counters via `prom-client` as described in `docs/monitoring-alerts.md`.

## 1. Network Access
- Ensure Prometheus can reach `https://<api-domain>/metrics` (or the internal service DNS).
- If your Prometheus server runs in Kubernetes with mTLS/ingress restrictions, expose a cluster-internal service that points to the Node.js deployment or use a sidecar/ServiceMonitor.

## 2. prometheus.yml Snippet
```yaml
scrape_configs:
  - job_name: games-platform-api
    scheme: https
    metrics_path: /metrics
    scrape_interval: 30s
    scrape_timeout: 10s
    static_configs:
      - targets:
          - api.example.com       # prod
          - staging.api.example.com
    relabel_configs:
      - source_labels: [__address__]
        target_label: env
        replacement: prod
        regex: api\.example\.com
      - source_labels: [__address__]
        target_label: env
        replacement: staging
        regex: staging\.api\.example\.com
```
If TLS is terminated upstream (e.g., behind an internal load balancer), set `scheme: http` and reference the private host instead. The same snippet ships in `scripts/prometheus-sample.yml` so you can copy it directly into your infra repo.

### ServiceMonitor Example (Prometheus Operator)
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: games-platform-api
spec:
  selector:
    matchLabels:
      app: games-platform
  namespaceSelector:
    matchNames: [platform]
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
      honorLabels: true
```
Expose port `http` on the service that fronts the Node.js backend.

## 3. Grafana Dashboard Seeds
Create a dashboard with panels:
- **Wallet Callbacks by Status**: `sum by (status) (rate(wallet_callback_total[5m]))`
- **Top Failing Tenants**: `sum by (tenantId) (increase(wallet_callback_total{status!="SUCCESS"}[1h]))`
- **RTP Drift**: compare `sum by (tenantId) (rate(round_result_discrepancy_amount[10m]))` to `sum by (tenantId) (rate(round_result_bet_amount[10m]))` for deviation

## 4. Alert Rule Skeletons
```yaml
apiVersion: 1
groups:
  - name: wallet-alerts
    rules:
      - alert: WalletFailureSpike
        expr: sum(rate(wallet_callback_total{status!="SUCCESS"}[5m]))
              / sum(rate(wallet_callback_total[5m])) > 0.05
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "Wallet failure rate above 5%"
          description: "tenantId={{ $labels.tenantId }}"
      - alert: TenantRtpDeviation
        expr: abs(sum(rate(round_result_discrepancy_amount[30m]))
                 / sum(rate(round_result_bet_amount[30m]))) > 0.01
        for: 10m
        labels:
          severity: medium
```
Tune the lookback windows (`[5m]`, `[30m]`) based on traffic patterns; couple each alert to the runbooks referenced in `monitoring-alerts.md`.

## 5. Verification Steps
1. Deploy the scrape config and confirm Prometheus shows the new `games-platform-api` target as **UP**.
2. Trigger a synthetic wallet failure (point the debit URL to a 500 mock) and observe `wallet_callback_total{status="FAILED"}` increasing.
3. Confirm Grafana panels update within 1–2 minutes and the alert rules fire/resolve as expected.
4. Document the dashboards and alert IDs in the ops wiki for future audits.
