# 0002. Split into a control plane and a data plane

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

A feature-flag system has two very different workloads:

- **Management:** rare, human-driven writes (create projects, flags, variants, toggle state). It
  needs validation, relational integrity and a UI.
- **Evaluation:** frequent, machine-driven reads from application code on the hot path of other
  products. `docs/architecture.md` targets under 50 ms latency and high availability.

Coupling the two means a slow admin query or a bad deploy of the UI backend could degrade every
application that evaluates flags.

## Decision

We will run two independent services:

- **Management service** (`services/management`, Node.js): the control plane. Owns writes to
  PostgreSQL and pushes evaluated values to Redis. Also runs a background worker (see
  [0007](0007-async-environment-linking-with-bullmq.md)).
- **Evaluation service** (`services/evaluation`, Go): the data plane. Stateless, read-only,
  talks only to Redis and never to PostgreSQL.

The two communicate only through Redis (see [0003](0003-postgres-source-of-truth-redis-read-cache.md)).
The UI talks only to the management service. Applications talk only to the evaluation service.

## Alternatives considered

- **Single service:** simpler to run, but couples availability and scaling of the hot read path to
  the admin API.
- **Evaluation reads PostgreSQL directly:** fewer moving parts, but puts a relational join on the
  hot path and ties latency to database load.

## Consequences

**Positive**

- The evaluation path has no dependency on PostgreSQL, so a database outage does not stop flag
  reads. It scales independently and is small enough to be fast.
- Clear ownership: only the control plane writes.

**Negative / risks**

- Two codebases in two languages and two deployables to build, secure and operate.
- Redis becomes the sole integration point and a single point of failure for evaluation
  (mitigated by the rebuild in [0015](0015-cache-reconciliation-and-redis-durability.md)).
- The contract between planes (the Redis key and value format) is implicit and not versioned or
  tested across the two services (see [0005](0005-sdk-key-as-environment-credential.md)).
