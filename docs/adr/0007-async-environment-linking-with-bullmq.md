# 0007. Link new environments inline; use a BullMQ worker for background jobs

- **Status:** Accepted (revised 2026-10-08)
- **Date:** 2026-10-07

## Context

Every flag needs an `environment_flag_states` row in every environment of its project. Creating a
flag inserts a row per existing environment in the same transaction. Creating an environment must
do the reverse: insert a row per existing flag.

The original implementation took that fan-out off the request path with a BullMQ job. The audit
found this was not atomic with the environment insert (a Redis outage after the insert left an
environment that was never linked), opened a window in which toggles returned 404, never populated
the Redis cache, and was a lot of machinery for a single set-based `INSERT ... SELECT`.

## Decision

- `createEnvironment` inserts the environment and its state rows in **one PostgreSQL
  transaction**, then writes the environment's flag values to Redis (best effort; the periodic
  rebuild repairs a miss). The API does not enqueue anything.
- `PATCH /flags/:flagId/environments/:environmentId` **upserts** the state row, so an environment
  with no row yet can still be toggled.
- BullMQ remains for background work, in a separate worker process
  (`services/management/src/worker`, concurrency 5, the `management-worker` container). Its job is
  `reconcile-flag-cache`: on start-up and then every `CACHE_RECONCILE_INTERVAL_MS` (default 5
  minutes) it rebuilds all `flag:*` keys from PostgreSQL and deletes keys that match no
  (flag, environment) pair ([0015](0015-cache-reconciliation-and-redis-durability.md)).
- Jobs default to `attempts: 5` with exponential backoff, `removeOnComplete`, and `removeOnFail: 50`.
  The legacy `link-new-environment` handler is kept so jobs queued by older versions complete.
- The queue lives in the same Redis instance as the flag cache
  ([0003](0003-postgres-source-of-truth-redis-read-cache.md)).

## Alternatives considered

- **Keep linking in a queue job (the original design):** takes work off the request, but see
  Context. Would need an outbox to be reliable.
- **Create state rows lazily on first toggle only:** the upsert makes this work, but eager rows keep
  listing queries simple.
- **A cron or in-process timer instead of BullMQ for reconciliation:** fewer dependencies, but
  BullMQ already exists, gives retries and a single scheduler across replicas.

## Consequences

**Positive**

- No half-created environments and no "not linked yet" window.
- A flushed or diverged Redis heals itself within one reconcile interval.
- The worker's job is idempotent and safe to retry.

**Negative / risks**

- Creating an environment in a project with very many flags does more work inside the request. At
  this scale it is one set-based statement.
- The rebuild reads PostgreSQL and then writes Redis without a lock, so a toggle that lands between
  the two can be overwritten with the older value until the next reconcile.
- The worker is a separate deployable that now exists only for reconciliation. It serves no HTTP, so
  its Compose service disables the image's HTTP healthcheck. Nothing alerts on failed jobs yet.

## History

- 2026-10-08: linking moved from a queue job to the creating transaction; worker repurposed for
  cache reconciliation; retry policy added.
