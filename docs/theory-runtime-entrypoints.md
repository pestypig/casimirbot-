# Theory Runtime Entrypoints

This document describes how runtime entrypoints are registered, adapted, and converted into receipts for compound theory runs.

Runtime entrypoints describe ownership. They do not prove execution by themselves. A runtime is only considered executed or inspected when a `TheoryRuntimeReceiptV1` exists.

## Contract

Runtime entrypoints use `theory_runtime_entrypoint/v1`:

```text
TheoryRuntimeEntrypointV1
  artifactId: "theory_runtime_entrypoint"
  schemaVersion: "theory_runtime_entrypoint/v1"
```

The registry lives in:

```text
shared/theory/runtime-entrypoints.ts
```

Each entry is built with `buildTheoryRuntimeEntrypointV1(...)` and must validate with `isTheoryRuntimeEntrypointV1(...)`.

## Registering a Runtime

Add a runtime to `THEORY_RUNTIME_ENTRYPOINTS` with:

- `runtimeId`: stable ID such as `solar.pipeline`, `casimir.verify`, or `nhm2.shift_lapse.alpha_sweep`.
- `family`: one of the `TheoryRuntimeFamily` values from `TheoryRuntimeMathTraceV1`.
- `label`: UI-facing name.
- `description`: developer and tool-call explanation.
- `command`: fixed command string or `null` for read-only/reference entrypoints.
- `argsSchema`: typed shape or `null` when not yet exposed.
- `outputArtifactGlobs`: expected artifacts.
- `expectedReceiptKind`: normally `theory_runtime_receipt/v1`.
- `ownedBadgeIds`: badges this runtime can support.
- `sourceRefs`: repo modules, scripts, docs, configs, or runtime references.
- `timeoutPolicy`: `smallMs` and `fullMs`.
- `claimBoundary`: current tier, maximum tier, promotion setting, and promotion requirements.

Do not register arbitrary shell strings. Commands must be fixed and allowlisted.

## Runtime Families

Current runtime families are:

- `gr_tensor`
- `casimir_field`
- `qei_worldline`
- `solar_spectrum`
- `starsim_runtime`
- `tokamak_runtime`
- `warp_full_solve`
- `generic_runtime`

Choose the most specific family available. If a family does not fit, use `generic_runtime` and add source refs that make ownership explicit.

## Writing an Adapter

Runtime adapters should expose a small, typed interface:

```text
runtimeId
canRun(input)
buildCommand(input)
parseArtifacts(input)
toReceipt(input)
```

Adapters must:

- accept only allowlisted `runtimeId` values from `THEORY_RUNTIME_ENTRYPOINTS`.
- build fixed commands from registry metadata.
- avoid arbitrary user-provided shell.
- use timeout policy from the entrypoint.
- parse known artifacts into a `TheoryRuntimeReceiptV1`.
- fail closed on missing outputs, stale artifacts, parse failures, unsupported status, or unrecognized gates.
- keep claim promotion blocked unless a future certificate/integrity adapter explicitly proves otherwise.

Read-only adapters are valid. They inspect existing artifacts and return receipts without running commands.

## Allowlist and Timeout Policy

Small runtimes may be opt-in executable when explicitly requested by a user/tool action. Long runtimes use request manifests first.

The runtime executor must require:

- registered runtime ID.
- explicit execute request.
- fixed command from the registry.
- output directory inside the project root.
- timeout policy.
- request manifest for long jobs.

The executor must return `timeout`, `failed`, `blocked`, `stale`, `not_run`, or `completed` receipts. Timeouts and failures do not promote claims.

## Receipt Requirements

Runtime receipts use `theory_runtime_receipt/v1`:

```text
TheoryRuntimeReceiptV1
  artifactId: "theory_runtime_receipt"
  schemaVersion: "theory_runtime_receipt/v1"
```

A receipt must include:

- `receiptId`
- `runtimeId`
- `graphId`
- `badgeIds`
- `command`
- `args`
- `status`
- `outputs.artifacts`
- `outputs.scalars`
- `outputs.units`
- `outputs.gates`
- `outputs.missingSignals`
- `outputs.warnings`
- `provenance`
- `claimBoundary`

Receipt statuses are:

- `completed`
- `failed`
- `timeout`
- `blocked`
- `stale`
- `not_run`

Gate statuses are:

- `pass`
- `fail`
- `not_ready`
- `not_applicable`
- `unknown`

Missing or unknown gates should block stronger interpretation. A `completed` receipt still does not imply claim promotion unless its claim boundary says promotion is allowed and the required evidence chain exists.

## Long Runtime Jobs

Long runtimes should use `theory_runtime_run_request/v1` manifests under:

```text
artifacts/theory-runtime-requests/
```

The manifest represents request state, heartbeat, output globs, and claim boundary. It does not mean execution has occurred.

Long-job rows in the UI should show manifest status such as `created`, `queued`, `running`, `completed`, `failed`, `timeout`, or `cancelled`, and should stay responsive while a worker or explicit execution path updates the manifest.
