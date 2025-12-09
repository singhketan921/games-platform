## Platform Documentation

This directory will eventually contain the full API specification, integration guides, and operational playbooks required by the SRS. To complete the remaining documentation work we will produce:

1. **OpenAPI Specification** - api/openapi.yaml
   - Admin APIs (tenants, games, wallet config, reports, users)
   - Tenant APIs (HMAC session, wallet history, game launch)
   - OAuth/token flow and shared error schema
2. **Postman Collection** - api/postman_collection.json
   - Example requests with sample headers/HMAC signing instructions
   - Environment variables for admin vs tenant keys
3. **Integration Guide** - integration-guide.md
   - Wallet callbacks, session lifecycle, error catalogue, test checklist
4. **Onboarding Runbook** - onboarding.md
   - Steps for creating tenants, provisioning tenant users, rotating keys, configuring wallets
5. **Monitoring & Alerting Plan** - monitoring-alerts.md
   - Metrics emitted, alert thresholds (wallet failures, RTP deviation), dashboard/notification wiring
6. **Prometheus Integration Guide** - prometheus-config.md
   - Scrape configuration snippets for Prometheus, Grafana dashboard + alert bootstrap instructions

7. **Deployment Guide** - deployment.md
   - Helm install instructions, configuration knobs, Prometheus ServiceMonitor usage
8. **Tenant Portal Guide** - tenant-portal.md
   - Login, navigation, wallet actions, CSV exports, security notes

Helper assets live alongside these docs. For example, `scripts/prometheus-sample.yml` mirrors the scrape snippet from the Prometheus guide so you can drop it into your infrastructure repository without copy/paste errors.

Update these documents as new features land so integrators always have a reliable source of truth.
