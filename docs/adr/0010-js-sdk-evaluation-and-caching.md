# 0010. JavaScript SDK: per-call evaluation with in-memory TTL cache

- **Status:** Accepted (retrospective)
- **Date:** 2026-10-07

## Context

Applications should not fail or slow down because the flag service is down, and should not make a
network call for every flag check. The evaluation API is request/response only: there is no
streaming or bulk endpoint.

## Decision

`sdk/js-sdk` (`flippr_sdk`, built with `tsup` to CJS, ESM and type declarations) exposes a
`FlipprClient` with one method, `getVariant<T>(flagKey, defaultValue): Promise<T>`:

- Looks in an in-memory `Map` first (TTL `cacheTTLSeconds`, default 300 s; max
  `cacheMaxSize` entries, default 1000; evict expired entries first, then the oldest inserted).
- On a miss, calls the evaluation API with `Authorization: <sdkKey>`.
- Returns `defaultValue` on any non-2xx response, network error, or `value: null`.
  Defaults are never cached.
- Requests `{baseUrl}/api/v1/evaluate/flags/{encodeURIComponent(flagKey)}` (`baseUrl` is the root of
  the evaluation service), with a per-request timeout (`timeoutMs`, default 2000) via
  `AbortSignal.timeout`.
- Concurrent calls for the same key share one in-flight request.
- Uses the global `fetch`, so it targets browsers and Node 18+, with no runtime dependencies.

## Alternatives considered

- **Fetch every flag at startup and poll or stream updates:** one request instead of many and
  near-instant updates, but needs a bulk endpoint and a server push channel.
- **No client cache:** always fresh, but adds a network round trip per check.

## Consequences

**Positive**

- Fail-safe by design (always returns something usable), zero dependencies, tiny.

**Negative / risks**

- A toggle takes up to `cacheTTLSeconds` (5 minutes by default) to reach a running client, so
  "instant" applies to the evaluation API, not to cached SDK clients.
- No stale-while-error behaviour and no retry. Failures are only `console.error`, with no hook for
  application telemetry.
- `T` is an unchecked cast of the response, and the package is named `flippr_sdk` while the README
  imports `flippr-sdk`.
- Browser use exposes the all-powerful SDK key ([0005](0005-sdk-key-as-environment-credential.md)) and
  needs CORS enabled on the evaluation API ([0009](0009-evaluation-service-in-go.md)).

## History

- 2026-10-08: fixed the request URL (it did not match the server), added timeout, in-flight de-duplication and unit tests.
