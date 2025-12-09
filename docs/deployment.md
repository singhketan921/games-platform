# Deployment Guide

This repository ships a lightweight Helm chart that deploys the Node.js API along with Prometheus scraping.

## Prerequisites
- Kubernetes cluster (1.25+)
- Helm 3
- Container image published to a registry accessible from the cluster
- Secrets for DATABASE_URL and other sensitive env vars

## Build container image
Use the provided multi-stage `Dockerfile` to package the API. Example:
```bash
docker build -t ghcr.io/acme/games-platform:v1.2.3 .
docker push ghcr.io/acme/games-platform:v1.2.3
```
The image installs production dependencies via `npm ci --omit=dev`, runs `prisma generate`, and starts the server with `node app.js`. Ensure `.env` is not baked into the image (it's ignored via `.dockerignore`); use environment variables/secrets instead.

## Helm install
```
helm upgrade --install games-platform ./deploy/helm/games-platform \
  --set image.repository=ghcr.io/acme/games-platform \
  --set image.tag=v1.2.3 \
  --set secretEnv[0].name=DATABASE_URL \
  --set secretEnv[0].secretName=games-platform-api \
  --set secretEnv[0].secretKey=database-url
```

### Environment overlays
For repeatable staging/production rollouts, use the sample values in `deploy/overlays`:

```
# Staging
helm upgrade --install games-platform ./deploy/helm/games-platform \
  -f deploy/overlays/values-staging.yaml

# Production
helm upgrade --install games-platform ./deploy/helm/games-platform \
  -f deploy/overlays/values-prod.yaml
```

Each file captures replica counts, ingress hosts, and secret references (e.g., `games-platform-staging` vs `games-platform-prod`). Customize the secret names to match your cluster (see `kubectl create secret generic ...`) and adjust image tags or resource requests per environment.

Key values:
- service.type: set to LoadBalancer or ClusterIP depending on ingress
- monitoring.enabled: when true, emits a ServiceMonitor pointing at /metrics
- env: static environment variables (non-secret)
- secretEnv: references to Kubernetes secrets for sensitive config

## Prometheus integration
If you run Prometheus Operator, leave monitoring.enabled=true and ensure the CRDs exist. Otherwise, disable it and scrape the Service manually.

## CI suggestion
Add a GitHub Actions workflow that lints the chart and runs helm template on pull requests before deploying.
