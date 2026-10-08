# 0008. Management service: Express, raw SQL via pg-promise, Zod validation

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

The control plane is a conventional CRUD web API with a small relational schema and one operation
that needs a transaction across PostgreSQL and Redis
([0004](0004-synchronous-write-through-to-redis.md)).

## Decision

`services/management` is a TypeScript (strict) Node.js 22 service with:

- **Express 5** with `helmet`, `compression`, `cors` and `pino-http` request logging.
- **pg-promise** with hand-written parameterised SQL. No ORM and no query builder. Row types are
  hand-maintained interfaces in `src/db/models`.
- **Zod 4** schemas validate `params`, `query` and `body` through a `validate()` middleware
  that replaces the request fields with parsed values.
- **Feature folders** (`features/{flags,projects,health}`) each with `routes`, `controller`,
  `service`, `schema` and `types`. Controllers are thin, services own the SQL.
- A small error hierarchy (`ApplicationError` and subclasses) mapped to
  `{ error, status: 'ERROR' }` by one `errorHandler`. Successes use `{ data, status: 'OK' }`
  (plus `pagination` for lists), `limit` 1 to 100 (default 20) and `offset`.
- Config from environment variables via `dotenv`: default port 4000, `CORS_ORIGINS` list,
  `ADMIN_API_TOKEN` (required in production), Redis password.
- A `requireAdminToken` middleware guards `/projects` and `/flags` (not `/health`), using a
  constant-time comparison.
- JSON logs in production (`pino-pretty` only outside production). Shutdown closes the HTTP server,
  the database pool and Redis.
- Lists are ordered by name or creation time, not by random UUID. Validation assigns `req.query`
  through `Object.defineProperty`, because Express 5 makes it getter-only.
- API version prefix `/api/v1`.

## Alternatives considered

- **ORM (Prisma, Drizzle, TypeORM):** generated types and migrations, at the cost of abstraction
  over a schema this small.
- **Fastify, NestJS:** more structure or speed; Express was the lower-friction choice.

## Consequences

**Positive**

- Readable, explicit SQL and a consistent layering that is easy to extend. Parameterised queries
  throughout. Input is validated before it reaches services.

**Negative / risks**

- Row types are hand-written and can drift from `init.sql` (`FeatureFlag.off_value: string` while the
  column is JSONB, and the UI inherits the mismatch).
- Authentication is a single static admin token (see [0014](0014-management-api-authentication.md)).
  There is no per-user identity, rate limiting or request ID propagation to downstream calls.
- `ssl` is `{ rejectUnauthorized: false }` when `POSTGRES_SSL=true`, which encrypts but does not verify
  the server certificate.
- Mutations that touch both stores rely on the rebuild for the rare failed commit
  ([0004](0004-synchronous-write-through-to-redis.md)).

## History

- 2026-10-08: admin token, configurable CORS, production JSON logs, clean shutdown, stable list ordering, Express 5 query fix, name and length validation.
