# 0011. Database schema bootstrapped by a single `init.sql`

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

The project needed a schema quickly, with a zero-setup local experience, and uses hand-written SQL
rather than an ORM ([0008](0008-management-service-stack.md)).

## Decision

The whole schema lives in `init.sql` at the repo root. It is:

- mounted into the Postgres container at `/docker-entrypoint-initdb.d/init.sql` by
  `docker-compose.yml`, and
- applied with `psql` by the integration test setup ([0012](0012-integration-tests-with-testcontainers.md)).

All statements use `IF NOT EXISTS` where Postgres allows it, except `CREATE TYPE flag_type`.
Changes to existing databases are applied with idempotent scripts in `migrations/`. There is no
migration tool and no schema version table.

## Alternatives considered

- **A migration tool** (node-pg-migrate, Flyway, golang-migrate, Atlas, or an ORM's migrations):
  versioned, ordered, repeatable change history.

## Consequences

**Positive**

- One file to read, identical schema for dev, test and Compose.

**Negative / risks**

- The Postgres image runs init scripts only when the data volume is empty, so schema changes do not
  reach existing databases. We bridge this with hand-written, idempotent scripts in `migrations/`
  (`001_integrity_constraints.sql`, tested against a database built from the previous `init.sql`),
  but there is no tool, ordering or version table. Adopt one before the first real deployment.
- `CREATE TYPE flag_type` has no `IF NOT EXISTS`, so re-running `init.sql` against an initialised
  database fails.
- Tests apply `init.sql` only, so they cannot catch migration problems.
- `environments.project_id` has no standalone index (the composite unique `(project_id, name)`
  covers lookups by project). All timestamps are `TIMESTAMP` rather than `TIMESTAMPTZ`.

## History

- 2026-10-08: unique and composite constraints added to `init.sql`; first migration script.
