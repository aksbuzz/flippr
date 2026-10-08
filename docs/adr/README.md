# Architecture Decision Records

This directory records the significant architecture decisions made in Flippr, using a lightweight
[MADR](https://adr.github.io/madr/)-style format. See [0001](0001-record-architecture-decisions.md)
for the process and [template.md](template.md) for the format.

> **Note on provenance:** ADRs 0002 to 0013 were written retrospectively on 2026-10-07 from the code,
> `README.md` and `docs/architecture.md`. The *Decision* sections describe what the code does today.
> The *Context* sections are inferred from the docs and may not match the authors' original reasoning;
> please correct them where they differ. ADRs 0014 and 0015 started as proposals and were accepted while fixing the audit findings;
> 0003 to 0013 were revised the same day to match the code after those fixes (see each *History*).

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-control-plane-data-plane-split.md) | Split into a control plane and a data plane | Accepted |
| [0003](0003-postgres-source-of-truth-redis-read-cache.md) | PostgreSQL as source of truth, Redis as read-only evaluation cache | Accepted |
| [0004](0004-synchronous-write-through-to-redis.md) | Push pre-evaluated values to Redis synchronously on state change | Accepted |
| [0005](0005-sdk-key-as-environment-credential.md) | SDK key is the environment credential and the Redis key namespace | Accepted |
| [0006](0006-flag-data-model.md) | Flag data model: typed JSON variants, off value, per-environment state | Accepted |
| [0007](0007-async-environment-linking-with-bullmq.md) | Link new environments inline; use a BullMQ worker for background jobs | Accepted (revised) |
| [0008](0008-management-service-stack.md) | Management service: Express, raw SQL via pg-promise, Zod validation | Accepted |
| [0009](0009-evaluation-service-in-go.md) | Evaluation service in Go using the standard library | Accepted |
| [0010](0010-js-sdk-evaluation-and-caching.md) | JavaScript SDK: per-call evaluation with in-memory TTL cache | Accepted |
| [0011](0011-schema-bootstrapped-by-init-sql.md) | Database schema bootstrapped by a single `init.sql` | Accepted |
| [0012](0012-integration-tests-with-testcontainers.md) | Integration tests against real Postgres and Redis with Testcontainers | Accepted |
| [0013](0013-docker-compose-packaging-and-spa-ui.md) | Docker Compose packaging and a static React SPA served by nginx | Accepted |
| [0014](0014-management-api-authentication.md) | Authentication and authorization for the management API | Accepted (interim token) |
| [0015](0015-cache-reconciliation-and-redis-durability.md) | Cache reconciliation and Redis durability | Accepted (mostly implemented) |

## Conventions

- File name: `NNNN-short-title.md`, numbers are never reused.
- Update an ADR in place when the decision or the code changes, and note it under *History*. Add a
  new ADR only for a new decision; use `Superseded by NNNN` only if a decision is replaced wholesale.
- Statuses: `Proposed`, `Accepted`, `Rejected`, `Deprecated`, `Superseded by NNNN`.
