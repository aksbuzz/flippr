# 0003. PostgreSQL as source of truth, Redis as read-only evaluation cache

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

Flag configuration is relational (projects, environments, flags, variants, per-environment state)
and needs integrity constraints. Evaluation needs a single key lookup with very low latency
([0002](0002-control-plane-data-plane-split.md)).

## Decision

- **PostgreSQL 17** is the system of record for all configuration.
- **Redis 7** holds a denormalised, pre-evaluated copy of each flag value per environment, for the
  evaluation service only. The evaluation service never writes to it.
- The management service is the only writer to both. Redis is treated as a cache, not a source of
  truth: PostgreSQL wins on any disagreement.

`docs/architecture.md` also lists audit logs as a PostgreSQL responsibility. They are not
implemented: the `audit_log` table in `init.sql` is commented out.

## Alternatives considered

- **PostgreSQL only, with a read replica or in-process cache in the evaluation service:** removes
  the dual-store consistency problem, but puts query latency and DB availability on the hot path.
- **Redis as the only store:** loses relational integrity and queryable history.

## Consequences

**Positive**

- Constant-time reads on the hot path; configuration integrity enforced by SQL constraints
  (unique keys, foreign keys, the `enabled_requires_variant` check).

**Negative / risks**

- Two stores must be kept consistent. Consistency relies on a synchronous write on every change
  ([0004](0004-synchronous-write-through-to-redis.md)) plus a periodic rebuild from PostgreSQL
  ([0015](0015-cache-reconciliation-and-redis-durability.md)).
- Redis also hosts the BullMQ queue ([0007](0007-async-environment-linking-with-bullmq.md)) on the
  same instance, so a cache flush or eviction policy change also affects job processing. Compose now
  runs it with `noeviction` and AOF to limit that risk.
- "Read-only cache" is only a convention. Nothing in Redis ACLs enforces it, although Redis now
  requires a password and is published on loopback only.

## History

- 2026-10-08: Redis password, AOF and `noeviction` added; rebuild from PostgreSQL implemented.
