# Theory Claim Boundaries

This document defines the claim language and fail-closed rules for theory badges, compound theory runs, runtime receipts, and sweep artifacts.

Claim boundaries are not footnotes. They are part of the workbench data model and must remain visible in UI rows and Helix Ask tool artifacts.

## Meanings

### Concept

A concept-level row names a theory relation, runtime family, or reference path. It may help locate a question but does not prove execution.

### Exploratory

An exploratory row or receipt may show a prototype, local experiment, or early branch. It is not enough for validation, mechanism claims, or promotion.

### Diagnostic

A diagnostic row computes or displays a measurable helper:

- scalar margin
- residual
- ratio
- gate input
- proxy expression
- static/reference trace
- artifact presence check

Diagnostics can support reasoning about where a question lives and what is missing. They do not validate a theory or mechanism.

### Proxy

Proxy rows use simplified or reduced quantities to stand in for a larger system. A proxy may be useful as a scaffold, sanity check, or locator, but it remains model-dependent.

### Reduced Order

Reduced-order rows or runtime receipts are intentionally simplified model lanes. They may be more structured than a proxy, but they still do not become certified results without the required evidence chain.

### Certified

Certified means a future adapter has verified the required certificate, integrity, evidence, gate, and provenance fields for the scoped claim. Current NHM2/warp compound-run paths must not assume this tier.

## Fail-Closed Rules

The workbench must fail closed when:

- evidence artifacts are missing.
- evidence artifacts are stale.
- JSON or artifact parsing fails.
- expected gates are missing.
- gate state is `unknown` or `not_ready`.
- runtime output cannot be recognized.
- a runtime command times out.
- a long-job manifest exists but no receipt exists.
- a scalar row solves but runtime/gate rows remain unresolved.

Fail-closed states should appear as:

```text
blocked
failed
stale
not_run
not_ready
missing evidence
promotion not allowed
certificate required
```

Never silently hide a blocked row if it is relevant to the selected theory path.

## Forbidden Promotion Language

Unless an explicit scoped certificate/integrity adapter supports the exact claim, UI text, artifacts, commentary, docs, and Helix Ask answers must not say:

```text
validated propulsion
working warp drive
certified transport solution
closed-loop solved transport result
physical mechanism confirmed
```

The phrase `QEI passed` is also forbidden unless an explicit QEI gate receipt supports the exact scoped gate. A solved scalar QEI margin is not enough.

Existing forbidden-pattern tests should remain in place for theory badge graph contracts, calculator-loadout paths, compound theory runs, runtime receipts, and UI rendering.

## Scalar Success Is Not Runtime Success

The scalar calculator can solve:

```text
qei_margin = qei_bound - qei_sample
R_source = source_required - source_available
E = h*c/lambda
```

That success is local to the scalar row. It must not update a gate row to pass, mark a runtime row as executed, or permit claim promotion.

## Static Reference Traces Are Not Execution

Static/reference runtime traces can show mathematical notation for:

- GR tensor steps
- Casimir field references
- solar spectrum relations
- scalar cuts

They must include warnings such as:

```text
Static reference trace only; no backend runtime executed.
Scalar cuts may be sent to the scientific calculator.
```

Static traces are useful for transparency and education. They are not runtime receipts.

## Runtime Receipts

`TheoryRuntimeReceiptV1.claimBoundary` must be explicit:

```text
currentTier
maximumTier
promotionAllowed
promotionBlockedBy
```

For NHM2/warp receipts, `promotionAllowed` should remain false unless a future certified adapter proves required certificate and integrity fields. Missing source closure, missing observer audit, missing certificate, stale artifacts, parse failures, and timeouts all block promotion.

## UI Requirements

The Theory Run UI should show:

- row kind
- status
- solver
- warnings
- claim-boundary notes
- runtime receipt status
- gate status
- evidence refs
- missing signals

Boundary rows should stay visible even if they are skipped or blocked. The user should be able to see why a path cannot support a stronger claim.

## Helix Ask Requirements

Helix Ask should treat claim boundaries as tool evidence, not style guidance. A final answer should be grounded in:

- locator artifacts
- compound run rows
- calculator traces
- runtime math traces
- runtime receipts
- sweep artifacts
- evidence refs
- gate states
- claim-boundary notes

When the artifacts are missing or blocked, the answer should say that directly and avoid promotion language.
