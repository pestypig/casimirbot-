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
- restrict successful executable-runtime parsing to the requested output directory and its concrete output manifest.
- preserve command/process provenance instead of replacing it with a generic artifact-reader receipt.
- record SHA-256 and `new`, `changed`, or `preexisting` freshness for every output artifact.
- fail closed on missing outputs, stale artifacts, parse failures, unsupported status, or unrecognized gates.
- treat file/path/text presence as non-authoritative until an explicit status-bearing field supplies the relevant verdict.
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
- optional `outputs.artifactManifest` using `theory_runtime_output_manifest/v1`
- optional `outputs.artifactEvidence`, with the manifest path, SHA-256,
  freshness classification, explicit evidence status, and gates observed for each
  parsed artifact (byte size remains authoritative in `outputs.artifactManifest`)
- `provenance`
- optional `execution` process details
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
- `review`

Missing or unknown gates should block stronger interpretation. A `completed` receipt still does not imply claim promotion unless its claim boundary says promotion is allowed and the required evidence chain exists.

`review` is intentionally distinct from both `pass` and `fail`. For example, a full-loop source-closure section can aggregate as `pass` while the referenced source-closure artifact remains `review`; consumers must preserve both observations rather than collapsing them into one lamp.

## Output Manifest and Freshness

Executable long runtimes use `theory_runtime_output_manifest/v1`. The executor snapshots the requested output directory before and after the command, then emits per-file hashes and freshness classifications. A successful process is not a successful evidence receipt unless:

- the command was actually bound to the requested output directory;
- the manifest is concrete, hashed, and bound to the same runtime, commit, and execution interval;
- every parsed artifact is inside the output boundary and matches its manifest hash and size;
- at least one artifact is `new` or `changed`; and
- the required artifact verdicts are explicit and authoritative.

A historical package is allowed to carry an unbound manifest with all entries `preexisting`. This is useful committed provenance, but it is not a fresh runtime execution and must remain blocked by `runtime_artifact_freshness_unbound`.

## Long Runtime Jobs

Long runtimes should use `theory_runtime_run_request/v1` manifests under:

```text
artifacts/theory-runtime-requests/
```

The manifest represents request state, heartbeat, output globs, and claim boundary. It does not mean execution has occurred.

Long-job rows in the UI should show manifest status such as `created`, `queued`, `running`, `completed`, `failed`, `timeout`, or `cancelled`, and should stay responsive while a worker or explicit execution path updates the manifest.
