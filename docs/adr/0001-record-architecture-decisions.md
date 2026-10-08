# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Flippr spans four deployable parts (management API and worker, evaluation API, React UI) plus a
JavaScript SDK and two data stores. The reasoning behind its structure lives only in commit history
and in two short documents (`README.md`, `docs/architecture.md`). New contributors, and the authors
a few months from now, cannot tell which behaviours are deliberate trade-offs and which are accidents.

## Decision

We will record each architecturally significant decision as a short ADR in `docs/adr/`, using the
format in [template.md](template.md). A decision is architecturally significant if it affects the
service boundaries, data stores, data model, public API or SDK contract, security posture, or the
build and deployment path.

ADRs are living documents: when a decision changes or the code moves on, update the existing ADR in
place, revise its *Decision* and *Consequences* so they describe the code as it is, and record the
change in its *History* section. Add a new ADR only for a genuinely new decision.

The initial set (0002 to 0013) was written retrospectively from the code; see the note in
[README.md](README.md).

## Alternatives considered

- **Keep everything in `docs/architecture.md`:** a single document drifts silently. It already
  differs from the code (it describes Redis values as `"true"`/`"false"` and lists audit logs, which
  are not implemented).
- **Wiki or issue tracker:** separates the rationale from the code it explains.

## Consequences

**Positive**

- Rationale is versioned with the code and reviewable in pull requests.

**Negative / risks**

- Retrospective ADRs can misattribute intent. They are marked as such.
- Needs light discipline: a PR that changes one of these decisions should update its ADR.
- Because ADRs are edited in place, git history is the record of earlier wording.
