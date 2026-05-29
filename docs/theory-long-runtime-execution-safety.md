# Theory Long Runtime Execution Safety

Phase 16 adds a gated execution shell for long theory runtimes. It is intentionally narrower than the runtime registry.

## Scope

The only allowlisted long runtime in this phase is:

```text
nhm2.shift_lapse.alpha_sweep
```

The executor uses the fixed command from `THEORY_RUNTIME_ENTRYPOINTS`:

```text
npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
```

No arbitrary shell command or user-provided command string is accepted.

## Required Preconditions

Execution requires:

1. A valid `theory_runtime_run_request/v1` manifest.
2. A runtime ID in the long-runtime allowlist.
3. An explicit server/tool call with `execute: true`.
4. A timeout policy capped by the runtime entrypoint.
5. An output directory that resolves inside the project root.
6. A fixed command from the runtime registry.

## Status Model

The request manifest is the status surface:

```text
created -> running -> completed
created -> running -> timeout
created -> running -> failed
```

The heartbeat records the current stage and a short public-safe message. It is not a proof of physical validity.

## Receipt Model

After process completion, artifacts are parsed by the read-only Warp/NHM2 artifact adapter. Missing outputs, missing source closure, missing certificate integrity, missing observer audit, stale artifacts, or parse failures all fail closed in the resulting `theory_runtime_receipt/v1`.

Timeouts and failed process exits return timeout/failed receipts directly.

## Claim Guardrails

Long runtime execution does not promote claims by itself. Receipts keep:

```text
promotionAllowed: false
```

NHM2/warp results remain diagnostic or reduced-order context unless a later certificate/integrity adapter proves the required gates and policy allows stronger language.

## Non-Goals

- No execution for `warp.full_solve.campaign` in this phase.
- No arbitrary shell execution.
- No background worker queue yet.
- No validation, propulsion, ER=EPR, or physical-mechanism claim promotion.
- No tensor/runtime result is represented as a scalar calculator solve.
