# 0015. Cache reconciliation and Redis durability

- **Status:** Accepted (mostly implemented)
- **Date:** 2026-10-07

## Context

The evaluation service reads only Redis ([0002](0002-control-plane-data-plane-split.md),
[0003](0003-postgres-source-of-truth-redis-read-cache.md)) and every miss is returned as
`{"value": null}`, which the SDK turns into the caller's default
([0010](0010-js-sdk-evaluation-and-caching.md)). The cache is populated only by toggling a flag
([0004](0004-synchronous-write-through-to-redis.md)). This leaves several ways for flags to be
silently wrong:

1. **Never seeded.** A newly created flag, a newly created environment, and flags linked by the
   worker are absent from Redis until the first toggle. A freshly created flag whose `off_value`
   is `100` evaluates to `null`, not `100`.
2. **Redis data loss.** Compose runs Redis 7 with its default persistence (periodic RDB
   snapshots, no AOF; by default a single change is only snapshotted after up to an hour). A crash
   loses recent toggles, and a lost volume, `FLUSHALL`, or a failover to an empty replica loses
   everything. Nothing repopulates the cache, and every application silently falls back to its code
   defaults.
3. **Dual-write divergence.** Redis is written before the Postgres commit, so a failed commit
   leaves a value in Redis that Postgres does not have. There is no detection.
4. **Shared instance.** The BullMQ queue uses the same Redis. A cache eviction policy or flush
   would also affect jobs, and vice versa.

## Decision

Make PostgreSQL authoritative in practice, with an explicit rebuild path.

**Implemented**

1. One helper (`features/flags/flag-cache.ts`) computes and writes the served value, used by toggles,
   flag creation and environment creation, so new flags serve their `off_value` immediately.
2. `rebuildAll()` rewrites every `flag:*` key from PostgreSQL and deletes keys that match no
   (flag, environment) pair. The worker runs it on start-up and every
   `CACHE_RECONCILE_INTERVAL_MS` (default 5 minutes) as a BullMQ repeatable job
   ([0007](0007-async-environment-linking-with-bullmq.md)).
3. Compose runs Redis with `appendonly yes`, `noeviction` and a password.

**Decided differently:** the toggle still writes Redis inside the transaction, not after the commit
([0004](0004-synchronous-write-through-to-redis.md)).

**Not done**

- A separate Redis (or database number) for BullMQ.
- A distinct response for "unknown flag or key" and hit and miss metrics. Unknown keys still return
  `200 {"value": null}`. Changing this is SDK-visible and needs a version bump
  ([0010](0010-js-sdk-evaluation-and-caching.md)).

## Alternatives considered

- **Cache-aside in the evaluation service** (read Postgres on a miss): self-healing, but puts the
  database back on the data-plane path ([0002](0002-control-plane-data-plane-split.md)).
- **Accept the gaps and document them:** only reasonable if flags are always toggled once after
  creation, which the UI does not require.

## Consequences

- Removes silent wrong answers and makes Redis disposable, in line with how the architecture
  already describes it ("read only cache").
- Adds a periodic job and some load on Postgres proportional to the number of
  (flag, environment) pairs, which is small at this scale.
- Changing the null semantics of the evaluation API is an SDK-visible change and needs a version
  bump ([0010](0010-js-sdk-evaluation-and-caching.md)).

## History

- 2026-10-08: cache helper, periodic rebuild and Redis durability settings implemented.
