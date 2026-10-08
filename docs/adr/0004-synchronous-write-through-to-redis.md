# 0004. Push pre-evaluated values to Redis synchronously on state change

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

The evaluation service only reads Redis ([0003](0003-postgres-source-of-truth-redis-read-cache.md)),
so every change that affects a served value must reach Redis, and a toggle in the UI should take
effect without a deploy.

## Decision

On `PATCH /api/v1/flags/:flagId/environments/:environmentId`
(`services/management/src/features/flags/flags.service.ts`, `updateFlagState`), inside one
PostgreSQL transaction the management service will:

1. Check the flag, environment and serving variant belong together, then upsert
   `environment_flag_states` (this takes a row lock for the rest of the transaction).
2. Compute the final value: the serving variant's value if enabled, otherwise the flag's
   `off_value`.
3. `SET flag:{sdk_key}:{flag_key}` in Redis to the JSON-encoded final value, using the shared
   helper in `features/flags/flag-cache.ts`.
4. Commit.

If any step throws, the transaction rolls back and the client gets an error. The row lock from
step 1 serialises concurrent toggles of the same flag and environment, so Redis writes for one
(flag, environment) are applied in commit order.

The same helper seeds Redis when a flag or an environment is created, so a new flag serves its
`off_value` immediately, and it powers the periodic full rebuild.

The evaluation service therefore never computes anything: it returns whatever is in Redis.

## Alternatives considered

- **Transactional outbox plus a relay that updates Redis:** stronger delivery guarantee, more
  moving parts. This is the likely upgrade path if consistency matters more.
- **Evaluation service subscribes to Postgres `LISTEN/NOTIFY` or Redis pub/sub:** couples the data
  plane to the control plane's events.
- **Write Redis after commit:** avoids caching a value for a rolled-back change, but a crash
  between commit and the Redis write leaves the cache stale with no error surfaced.

## Consequences

**Positive**

- Simple, and a toggle is visible to evaluation as soon as the request returns.
- A Redis failure fails the request instead of silently diverging.

**Negative / risks**

- It is a dual write, not an atomic one. Redis is written before COMMIT, so if the commit fails
  after the `SET`, Redis holds a value PostgreSQL does not. The periodic rebuild
  ([0015](0015-cache-reconciliation-and-redis-durability.md)) repairs it. We keep the write inside
  the transaction on purpose: writing after the commit lets two concurrent toggles reach Redis out of
  commit order, which is the more likely failure.
- The Redis `SET` runs while the row lock is held, so Redis latency extends lock time.
- Flag and environment creation write to Redis after their own commit, best effort. A failure is
  logged and repaired by the next rebuild, so for up to one reconcile interval such a flag can still
  evaluate to `null`.
- Operations that change a served value but are not a toggle (editing `off_value`, deleting a flag,
  variant or environment) do not exist yet. They must use the same helper.

## History

- 2026-10-08: shared cache helper; creation paths seed Redis; periodic rebuild added; write deliberately kept inside the transaction.
