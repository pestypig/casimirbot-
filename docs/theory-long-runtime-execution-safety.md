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
5. An output directory that resolves inside the project root and is bound to the fixed runtime through its allowlisted output environment variable.
6. A fixed command from the runtime registry.

For `nhm2.shift_lapse.alpha_sweep`, the executor binds the resolved directory through `NHM2_OUTPUT_DIR`. The directory is therefore an execution boundary, not merely a validated UI field. The successful artifact adapter may read only the files enumerated from that boundary.

## Status Model

The request manifest is the status surface:

```text
created -> running -> completed
created -> running -> timeout
created -> running -> failed
```

The heartbeat records the current stage and a short public-safe message. It is not a proof of physical validity.

## Receipt Model

Before execution, the executor hashes the requested output directory. After process completion it takes a second snapshot and writes a concrete `theory_runtime_output_manifest/v1` inside that run directory. Every output entry records its repo-relative path, SHA-256, byte size, modification time, and one of:

- `new`
- `changed`
- `preexisting`

The manifest also records the request/runtime identity, commit SHA, execution interval, output directory, and whether it is bound to that execution. The receipt stores the concrete manifest path and SHA-256 and preserves the actual command, arguments, safe runtime environment, exit status, stdout, stderr, timeout state, start/end times, and duration.

After process completion, only manifest-enumerated artifacts from the requested run directory are parsed by the Warp/NHM2 adapter. Missing outputs, a preexisting-only result, an unbound or mismatched manifest, missing source closure, missing certificate integrity, missing observer audit, stale artifacts, hash mismatch, or parse failures all fail closed in the resulting `theory_runtime_receipt/v1`.

Artifact names and textual mentions are discovery cues only. A source-closure, observer, or certificate gate can pass only from an explicit status-bearing field in the matching artifact. An explicit `review`, `fail`, `unknown`, or `not_ready` state must remain visible and cannot be converted to `pass` because the artifact exists.

Timeouts and failed process exits return timeout/failed receipts directly.

Historical/imported packages may use the same manifest contract with `boundToExecution: false` and `freshness: preexisting`. This makes their hashes inspectable without representing them as a fresh runtime result. Such a package must retain the `runtime_artifact_freshness_unbound` blocker.

## Claim Guardrails

Long runtime execution does not promote claims by itself. Receipts keep:

```text
promotionAllowed: false
```

NHM2/warp results remain diagnostic or reduced-order context unless a later certificate/integrity adapter proves the required gates and policy allows stronger language.

The UI presents independent lamps for aggregate lifecycle/section status, referenced artifact evidence, runtime provenance/freshness, and formal-certificate integrity. An aggregate `pass` or `completed` lamp never overrides an artifact `review`, unbound freshness, or an unknown/failed formal certificate.

## Non-Goals

- No execution for `warp.full_solve.campaign` in this phase.
- No arbitrary shell execution.
- No background worker queue yet.
- No validation, propulsion, ER=EPR, or physical-mechanism claim promotion.
- No tensor/runtime result is represented as a scalar calculator solve.
