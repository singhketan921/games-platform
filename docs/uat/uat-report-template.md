# UAT Sign-off Template

Copy this file to `docs/uat/<release>.md` for each release candidate.

## Release Overview
| Field | Value |
| --- | --- |
| Release / Tag | |
| Date | |
| Environment | (staging / pre-prod) |
| Participants | (admin, tenant operator, QA) |
| Build commits | API: , Dashboard: |

## Preconditions
- [ ] Deployment instructions completed (`docs/deployment.md`).
- [ ] Wallet adapter configured for UAT tenant.
- [ ] RTP global + tenant profiles reviewed.
- [ ] Monitoring dashboards accessible (Prometheus/Grafana).

## Test Scenarios
| Scenario | Steps | Result | Notes |
| --- | --- | --- | --- |
| Tenant onboarding | Create tenant, assign games, generate keys | PASS/FAIL | |
| Wallet integration | Configure wallet adapter, verify callbacks | PASS/FAIL | |
| Session launch | `/sessions/verify` -> launch Unity game -> settle round | PASS/FAIL | |
| RTP configuration | Adjust RTP profile per tenant/game, confirm in dashboard | PASS/FAIL | |
| Reporting | Review GGR + reconciliation dashboards, export CSV | PASS/FAIL | |
| Monitoring/alerts | Simulate wallet failure + RTP deviation alerts | PASS/FAIL | |
| Mobile/WebGL smoke | Launch free test app (Android/WebGL) | PASS/FAIL | |

Add more rows as needed for tenant-specific checks.

## Findings & Bugs
- 

## Sign-off
| Role | Name | Approval (Y/N) | Date |
| --- | --- | --- | --- |
| Platform Owner | | | |
| QA Lead | | | |
| Tenant Representative | | | |

Attach screenshots/logs supporting each scenario in the same folder.
