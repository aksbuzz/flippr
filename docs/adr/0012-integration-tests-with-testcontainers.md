# 0012. Integration tests against real Postgres and Redis with Testcontainers

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

The management service's value is in its SQL and in the Postgres-plus-Redis interaction
([0004](0004-synchronous-write-through-to-redis.md)). Mocking either would test very little.

## Decision

Management tests use **Vitest** and **supertest** against the exported Express `app`, with
`@testcontainers/postgresql` (`postgres:17-alpine`) and `@testcontainers/redis` (`redis:7-alpine`)
started once in a Vitest `globalSetup`. The repo's `init.sql` is applied to the container
([0011](0011-schema-bootstrapped-by-init-sql.md)). Test files run serially
(`fileParallelism: false`) and clean all tables between suites. 66 tests cover health, projects, flags,
admin-token auth, variant ownership, uniqueness and validation, cache seeding on creation, and the
Redis rebuild.

Other layers: Go handler and CORS tests (`miniredis`), SDK unit tests (Vitest with a mocked
`fetch`), and `scripts/smoke.mjs`, an end-to-end check of a real `docker compose up --build` stack
(management, Postgres, Redis, evaluation, the built SDK and the UI's `/api` proxy). CI runs all of
them.

## Alternatives considered

- **Mock `pg-promise` and `ioredis`:** fast, but would not catch SQL, constraint or transaction bugs.
- **A shared dev database or Compose stack:** order-dependent and not hermetic.

## Consequences

**Positive**

- High-fidelity tests that exercise real constraints and the real cache write.

**Negative / risks**

- Require a running Docker daemon.
- Coverage gaps remain: the BullMQ worker's job handlers, the UI (no test runner at all) and the
  rare commit-failure path are untested. Migration scripts are only verified by hand.
- `.github/workflows/ci.yml` runs every suite and the smoke test, but automatic runs are disabled (manual `workflow_dispatch` only) and it has not yet run on GitHub.

## History

- 2026-10-08: suite grew from 43 to 66 tests (18 of the original 43 were failing because of an Express 5 bug); Go, SDK and smoke tests and CI added.
