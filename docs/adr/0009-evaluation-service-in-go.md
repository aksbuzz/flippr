# 0009. Evaluation service in Go using the standard library

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

The data plane is on the hot path of other applications and should have low, predictable latency,
a small memory footprint and a trivial deployment unit ([0002](0002-control-plane-data-plane-split.md)).
Its logic is one Redis `GET` and a JSON decode.

## Decision

`services/evaluation` is a Go 1.25 service using `net/http` (`ServeMux` with method and path
patterns), `go-redis/v9` and `log/slog` (JSON). It exposes:

- `GET /api/v1/evaluate/flags/{flagKey}` with the SDK key in `Authorization`
  ([0005](0005-sdk-key-as-environment-credential.md)).
- `GET /api/v1/health`, which pings Redis (503 on failure).

CORS is off by default; `CORS_ALLOWED_ORIGINS` (comma list or `*`) enables it, including `OPTIONS`
preflight, so browser SDK use is possible. Credentials are never allowed. The process shuts down
gracefully on SIGTERM/SIGINT (10 s), logs everything through `slog` including the response status,
and takes an optional `REDIS_PASSWORD`. Handler and CORS behaviour is covered by Go tests against an
in-memory Redis (`miniredis`).

Server timeouts are 5 s read, 10 s write and 15 s idle, and Redis calls have a 2 s context
timeout. Responses carry hardening headers (`nosniff`, `X-Frame-Options: DENY`, a restrictive CSP).
It is built into a static binary in a two-stage Docker image on a pinned Alpine tag, running as a
non-root user.

## Alternatives considered

- **Reuse the Node service:** one language and codebase, but heavier and shares failure modes with
  the control plane.
- **A Go web framework (chi, gin):** unnecessary for two routes now that the stdlib mux supports
  method patterns.

## Consequences

**Positive**

- Tiny, fast, easy to scale horizontally. No database dependency.

**Negative / risks**

- Two languages and toolchains.
- No metrics (latency, hit and miss rate) although latency and availability are the stated goals, and
  no rate limiting.
- Redis misses and an unknown SDK key are indistinguishable and both return 200
  (see [0005](0005-sdk-key-as-environment-credential.md), [0015](0015-cache-reconciliation-and-redis-durability.md)).

## History

- 2026-10-08: CORS, graceful shutdown, slog cleanup, Redis password, tests, non-root pinned image, `go mod tidy`.
