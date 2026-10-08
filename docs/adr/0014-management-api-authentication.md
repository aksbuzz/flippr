# 0014. Authentication and authorization for the management API

- **Status:** Accepted (stage 1 implemented; stages 2 to 4 open)
- **Date:** 2026-10-07

## Context

The management API (`/api/v1/projects`, `/api/v1/flags`) and the UI have no authentication or
authorization. Anyone who can reach port 4000 can:

- list every environment and read its `sdk_key` (`GET /projects/:id/environments`),
- toggle any flag in any environment, including production, and
- create projects, environments, flags and variants.

Combined with Compose publishing Postgres and an unauthenticated Redis to the host
([0013](0013-docker-compose-packaging-and-spa-ui.md)), the system is only safe on a trusted
single-user machine. Anyone with an SDK key can also read every flag value for that environment
([0005](0005-sdk-key-as-environment-credential.md)). `init.sql` hints at a future `user_id` for
the audit log, so users were anticipated.

## Decision

Authentication is a prerequisite for any deployment beyond localhost. We are doing it in stages.

**Implemented (stage 1):** a static admin token. `ADMIN_API_TOKEN` is compared in constant time
against `Authorization: Bearer <token>` by one Express middleware on `/api/v1/projects` and
`/api/v1/flags` (not `/health`). In development an empty token disables auth with a warning;
`NODE_ENV=production` refuses to start without one, and Compose requires it. The UI keeps the token
in `localStorage` after a 401 prompt, sends it on every request, masks SDK keys, and has a Sign out
control. Compose publishes Postgres, Redis and the management API on loopback only, and Redis has a
password.

**Not yet done:**

2. **Real users:** OIDC login (or sessions or JWT), a `users` table and a minimal per-project role
   model (viewer, editor, admin), with production toggles restricted to editors and above.
3. **Audit trail:** implement the commented-out `audit_log` (who changed what, old and new value),
   written in the same transaction as the state change.
4. **SDK keys:** hash at rest, support rotation, and split server-side from client-side keys.

## Alternatives considered

- **Put the API behind a reverse proxy or API gateway that handles auth:** least code in this
  repo, but pushes the problem to every deployer and does not give per-user audit.
- **Do nothing and document "local use only":** acceptable only if that is the permanent scope.

## Consequences

- The largest security gap is closed for single-operator use, at low cost.
- A shared static token gives no per-user attribution, cannot be revoked per person, and sits in the
  browser's `localStorage` (readable by any script on the page, which the UI's CSP limits).
- Every route has a `401` test ([0012](0012-integration-tests-with-testcontainers.md)).
- **Open question for the project owner:** is Flippr meant to be multi-user and deployable, or a local
  or internal tool? That decides whether stages 2 to 4 are needed.

## History

- 2026-10-08: stage 1 (admin token, loopback-only data stores, Redis password) implemented.
