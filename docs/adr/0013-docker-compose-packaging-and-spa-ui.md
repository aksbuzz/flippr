# 0013. Docker Compose packaging and a static React SPA served by nginx

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

The project should run locally with one command and have a simple, portable build story for each
service. The README documents `docker-compose up --build`.

## Decision

- Configuration comes from a root `.env` (see `.env.example`). `ADMIN_API_TOKEN` is required.
  Postgres and Redis are published on `127.0.0.1` only, Redis requires a password and runs with AOF and
  `noeviction`, and the worker's HTTP healthcheck is disabled.
- The management image builds with `tsconfig.build.json` (`rootDir: src`) so the output is
  `dist/index.js`, uses `npm ci`, and runs as the non-root `node` user.
- **Docker Compose** orchestrates six services: `postgres` (17), `redis` (7), `management-api`,
  `management-worker` (same image, different command), `evaluation-api` and `ui`. Postgres and
  Redis have health checks and named volumes, and the app services wait on them.
- Each service has a multi-stage Dockerfile and a `HEALTHCHECK`.
- The **UI** is a React 19 SPA (Vite, Tailwind 4, TanStack Query, React Router 7, Headless UI,
  Axios) built to static files and served by **nginx** with SPA fallback and gzip. It calls the
  management API at the relative path `/api/v1`, which nginx proxies to `management-api:4000`
  (override with `VITE_API_URL`), so no CORS is involved. nginx also sets security headers and
  caches only `/assets/` long-term.

## Alternatives considered

- **Server-rendered UI served from the management service:** removes the CORS and API-URL problem
  at the cost of coupling the UI to the Node service.
- **nginx reverse proxy for `/api/`:** same-origin API calls with no CORS and a configurable
  backend, and the usual way to ship an SPA with its API.

## Consequences

**Positive**

- One command to run everything. Services are isolated and can later be deployed independently.

**Negative / risks**

- The CSP in the UI's nginx config uses `connect-src 'self'`, so building the UI with `VITE_API_URL`
  pointing at another origin requires loosening it.
- The evaluation API port 8080 is published on all interfaces, as intended for a data plane; put TLS
  and rate limiting in front of it for real deployments.
- Defaults for Postgres and Redis passwords exist for local convenience and must be overridden
  anywhere else.
- Base images are pinned to a major or minor tag, not a digest.

## History

- 2026-10-08: fixed the management build, worker healthcheck, exposed ports and secrets; added nginx `/api` proxy, headers and caching; pinned images.
