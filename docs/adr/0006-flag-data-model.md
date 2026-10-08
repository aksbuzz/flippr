# 0006. Flag data model: typed JSON variants, off value, per-environment state

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

The README promises more than on/off toggles: string, number and JSON values for A/B tests,
phased rollouts and remote configuration, managed separately per environment.

## Decision

The schema in `init.sql` models:

- `projects` own `environments` and `feature_flags` (cascade delete).
- A flag has a `flag_type` enum (`boolean`, `number`, `string`, `json`), a unique `key` per
  project, and an `off_value JSONB` (default `false`) served when the flag is off.
- A flag has any number of `feature_flag_variants` (unique `key` per flag, `value JSONB`).
- `environment_flag_states` holds one row per (environment, flag): `is_enabled` and
  `serving_variant_id`. A CHECK constraint requires a variant whenever `is_enabled` is true.
- The served value is `variant.value` when enabled, otherwise `flag.off_value`
  ([0004](0004-synchronous-write-through-to-redis.md)).
- The HTTP API accepts `value` and `off_value` as JSON-encoded strings (for example `"\"hello\""`,
  `"123"`) validated with `JSON.parse`, and stores them as JSONB.
- Variants are immutable (create and delete only). A variant that any environment row references
  cannot be deleted. The delete is scoped to its flag and enforced by the foreign key.
- A flag can only serve its own variants: the service checks it and `environment_flag_states` has a
  composite foreign key `(feature_flag_id, serving_variant_id)` to `feature_flag_variants`.
- Uniqueness: project `name`; environment `(project_id, name)` and `sdk_key`; flag
  `(project_id, key)`; variant `(feature_flag_id, key)`. Violations return 409.
- `off_value` and variant values must match `flag_type` (boolean, number, string, or a JSON object or
  array for `json`). Names, keys and descriptions have length limits, and flag keys and environment
  names are restricted to safe characters, so bad input returns 400 instead of 500.
- A toggle on an environment with no state row yet upserts it.

## Alternatives considered

- **Boolean-only flags:** much simpler but does not meet the README's remote-configuration goal.
- **Per-type columns instead of JSONB:** stronger typing, awkward for the `json` type.
- **Rules, targeting and percentage rollouts:** out of scope so far. Evaluation has no user
  context and is purely per-environment.

## Consequences

**Positive**

- One uniform representation for every type, and constraints in the database where it counts.

**Negative / risks**

- Variants cannot be edited, and flags, environments and projects cannot be updated or deleted
  through the API.
- Requiring clients to double-encode JSON as strings is error-prone. A native JSON body field would
  be a cleaner API.
- Variants and `off_value` are checked against `flag_type` only in the application layer, not in SQL.
- Existing databases need `migrations/001_integrity_constraints.sql` to get the constraints above
  ([0011](0011-schema-bootstrapped-by-init-sql.md)).

## History

- 2026-10-08: ownership, uniqueness, type and length rules added; migration script for existing databases.
