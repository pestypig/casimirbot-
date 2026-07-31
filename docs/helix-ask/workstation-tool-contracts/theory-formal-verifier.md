# Theory Formal Verifier Workstation Tool Contract

Status: developer-only experimental evidence rail; the provider-neutral v2
sealed-execution lifecycle is implemented, while its production execution
catalog and external sandbox executor remain deliberately unconfigured.
Runtime-approval trust is now composed at server bootstrap and remains
fail-closed unless a trusted key registry and durable replay ledger are
configured.

## Purpose

The `theory-formal-verifier` family exposes pinned Lean replay to an agent
through the governed workstation gateway. It does not add a private model,
planner, retry, approval, or terminal-completion loop.

## Owner

Helix owns developer-account admission, sealed evidence identity, certificate
normalization, and claim boundaries. The selected agent runtime owns tool-call
choice, confirmation, polling, evidence re-entry, and later reasoning.

## Current production state

The source/theorem claim-scope catalog contains the pinned
`lanyonai/GeneralRelativisticMaxwell` audit. It binds six formal artifacts and
156 theorem declarations by exact artifact ID, Git-blob source hash, theorem
name, declaration/proposition source hashes, property class, claim ceiling,
and denied promotions. It does not contain an observed theorem-type digest,
semantic-to-Lean binding, import closure, graph binding, or pinned Lean
environment policy.

The companion generation-lineage audit binds the complete 32-entry pinned
repository tree and reports no published generator, invocation manifest, or
generation receipt. `inspect_artifact_family` therefore exposes
`formal_generator_lineage_unavailable` and marks the Racket/Lean/C lineage
incomplete for execution enrollment. A README statement that Lanyon generated
the files is not a registered generator artifact or receipt.

The v2 execution-catalog contract and immutable server-catalog factory,
owner-scoped job service, gateway lifecycle, and certificate evidence re-entry
are implemented. Scientific preparation
accepts only an opaque `execution_catalog_entry_id`; the trusted catalog entry
must seal the exact procedure observation, v2 request, source/import bundle,
external sandbox capability, resource ceilings, and opaque resolver reference.
Plan and start never accept a host runner, command, executable path, source
path, request body, policy body, or self-attestation from the caller.
The sealed object, executor capability, and returned certificate all use
closed schemas, and the bundle resolver must use the non-path
`casimir-formal-bundle:*` form.

Catalog construction clones and validates every sealed entry before admission,
rejects duplicate entry IDs or procedure/hash bindings, withholds every entry
when any catalog issue exists, and resolves only an exact developer profile,
entry ID, procedure ID, and procedure hash. Inspection exposes only redacted
identity and integrity hashes, never the source-bundle resolver reference or
source location. Resolution returns a fresh clone and rechecks the sealed-input
hash, so callers cannot mutate installed authority.

Each installed entry must additionally carry
`casimir_formal_execution_enrollment/v2`. The enrollment binds exact
specification, Lean, C, registered generator revision/invocation/receipt,
theorem, semantic binding, graph, environment, bundle, executor, procedure,
and request identities. Catalog construction requires a trusted enrollment
registration verifier; a missing verifier, rejected enrollment, omitted
generator, or any cross-lineage substitution withholds the entire catalog.
The enrollment is registration evidence only and does not execute or validate
any scientific claim.

The factory is available for trusted server composition, but the default
production generator registry, enrollment verifier, execution catalog, and
external executor resolver are empty. Consequently, the successful scientific
`prepare_request -> plan -> start` path remains intentionally unreachable in
the default deployment. It fails closed as
`formal_execution_catalog_unconfigured` or
`formal_external_sandbox_executor_unconfigured`; tests may inject bounded
catalog and executor fixtures, but those are not production registrations.

The existing `inspect_artifact_family` observation also includes
`casimir.theory_formal_verifier.runtime_readiness.v2`. This redacted packet
reports whether the server has composed an execution-catalog resolver,
redacted catalog inspector, external-sandbox resolver, trusted receipt
verifier, durable replay ledger, and durable job-state store. The catalog
inspector must itself report
a nonempty, issue-free catalog; a resolver callback alone is insufficient. A
`configured` packet means only that all six composition seams and at least one
validated enrollment are present; it explicitly leaves exact catalog-entry and
executor resolution false until `prepare_request` and `plan` resolve their
exact hashes. It is non-terminal configuration evidence and cannot authorize
replay.
Source-enrollment and runtime-composition blocker codes are also projected
through the gateway's ordinary typed `missingRequirements` channel even when
inspection succeeds. This lets the agent propose or retrieve missing records
without misclassifying an evidence read as a failed tool call.

The trusted runtime-approval bootstrap now supplies the same Ed25519 verifier
and PostgreSQL replay ledger to the v2 formal verifier, independent numerical
verifier, and formal runtime canary. A server-composition registry merges
those shared approval dependencies with lane-specific catalog/executor
dependencies in either installation order. Recomposition is bootstrap-only
and never exposed through an agent route or tool argument. Prepared requests,
plans, jobs, and completed certificates are stored in a server-owned
PostgreSQL lifecycle store and therefore survive service recomposition and
restart. A persisted `running` job cannot be resumed inside a new process; its
first result read converts it to
`formal_job_interrupted_by_server_restart` instead of leaving a soft lock.

Production enrollment installation must use
`installCasimirFormalExecutionRegistryAtServerBootstrapV2`. This server-only
operation first removes the lane's prior catalog and executor authority while
preserving shared approval trust. It then constructs the immutable catalog,
requires trusted enrollment-registration verification, resolves every
distinct enrolled executor capability by exact ID and artifact hash, and
checks that the returned adapter exposes the expected execution interface.
The preflight never submits a job. Only a nonempty, issue-free catalog whose
entire executor set passes preflight is installed. An empty, invalid,
substituted, or throwing replacement therefore leaves the rail blocked instead
of retaining stale authority. The installer is not reachable from an HTTP
route, workstation capability, or caller-authored tool argument.

The legacy evidence-preparation route remains callable so it can return a
hash-bound blocked receipt with exact typed repair requirements such as
`formal_theorem_selection_unregistered`,
`formal_theorem_type_digest_required`,
`semantic_to_lean_binding_required`,
`semantic_to_lean_binding_unregistered`,
`formal_import_closure_required`, and
`formal_environment_policy_catalog_unconfigured`, and
`formal_sandbox_executor_catalog_unconfigured`. It cannot turn the audited
source declaration into replay authority.

`inspect_artifact_family` is separately callable to discover that governed
audit or inspect one exact theorem. Its successful observation means only that
Casimir recognizes the immutable source declaration and its reviewed claim
scope. It does not mean Lean replayed it.

The inspect capability is registered in the Ask explicit-capability contract,
route schema, provider normalization, and capability catalog. Its normalized
current-turn artifact can be supplied to `prepare_request` as
`formal_source_admission_artifact_ref`. Preparation re-resolves the exact
artifact ID, Git-blob source hash, theorem name, and audit hash against the
server catalog. It does not relabel a static audited repository as a new
artifact-generation run.

A repository-owned, no-import Lean 4.31 runtime self-test is available only to
the test process. It pins the exact Lean binary and source bytes and checks the
kernel/replay plumbing. It is absent from the production scientific catalog,
has no semantic, theorem-type, graph, or badge binding, and is explicitly
ineligible for theory-experiment formal closure or certificate promotion.

## Inputs

`inspect_artifact_family` accepts an optional registered formal artifact ID
and theorem name. With no selector it lists the bounded catalog. It never
accepts a repository path, source bytes, source hash, executable, import path,
or policy from the caller.

For v2 scientific execution, `prepare_request` accepts an opaque
`execution_catalog_entry_id` plus the current-turn authoritative procedure
observation. The trusted catalog entry—not the caller—supplies the exact
semantic, theorem, graph, Master Problem, derivation-program, source/import,
environment, and sandbox identities.

The legacy blocked-preparation route accepts exact references to current-turn
procedure, semantic-admission, and formal-artifact observations, plus optional
registered selectors. Those selectors are lookup hints, not trust roots.
`plan` and `start` accept only the opaque server-owned prepared-request ID; raw
requests, policies, commands, and absolute paths are not accepted. `start`
additionally accepts
the exact plan ID and a trusted-runtime confirmation receipt in the gateway
control envelope. The receipt is bound to the start capability, plan, account,
profile, session, turn, and canonical sealed-input hash. `read_result` accepts
the job ID.

## Capability order

```txt
theory-formal-verifier.inspect_artifact_family
-> exact source/proposition scope and replay blockers

theory-formal-verifier.prepare_request
-> typed repair requirements or ready server receipt
-> theory-formal-verifier.plan
-> runtime/user confirmation
-> theory-formal-verifier.start
-> theory-formal-verifier.read_result
-> observation re-entry
-> bounded model synthesis
-> route and terminal authority
```

### `theory-formal-verifier.inspect_artifact_family`

- developer-only, read-only server-catalog inspection
- reports the pinned repository/tree and registered formal artifact IDs
- optionally returns one exact audited theorem and its denied promotions
- reports redacted formal-runtime composition blockers without resolving an
  entry or executor
- emits no automatic execution affordance
- does not read arbitrary source, execute Lean, or validate semantic intent

### `theory-formal-verifier.prepare_request`

- developer-only, read-only evidence admission
- resolves exact current-turn authoritative artifacts
- selects v2 execution only through an opaque server-catalog entry
- requires governed theorem, statement-digest, semantic-binding,
  graph-snapshot, import-closure, and Lean-environment records
- binds the exact procedure, candidate badges, Casimir Spec, Master Problem,
  derivation program, source/import bundle, and external sandbox capability
- recomputes procedure-program hashes and requires one exact semantic
  claim/badge/graph-snapshot lineage before issuing a prepared ID
- returns a hash-bound `ready | blocked` receipt
- exposes no plan affordance while any requirement remains open
- does not execute Lean

### `theory-formal-verifier.plan`

- developer-only, read-only preflight
- requires a ready owner-scoped prepared-request ID
- validates the exact v2 request, sealed catalog entry, source/import bundle,
  and external sandbox capability hashes
- requires the exact registered external executor resolver
- returns a plan ID bound to the developer profile and sealed input
- does not execute Lean

### `theory-formal-verifier.start`

- developer-only observation action
- requires the exact prepared-request and plan IDs
- rejects legacy nonempty confirmation strings
- requires an integrity-valid, unexpired, single-use receipt authenticated by
  an injected trusted Codex runtime verifier
- requires a trusted atomic replay ledger whenever a receipt verifier is
  configured; process-local replay tracking is not accepted by this execution
  service
- starts one policy-bounded replay job
- delegates only to the registered external sandbox executor; the v2 service
  contains no host process, filesystem, shell, or local Lean runner
- returns a non-terminal job receipt, not a certificate or answer

### `theory-formal-verifier.read_result`

- developer-only, read-only result lookup
- enforces developer-profile job ownership
- returns running status, a typed failure, or the hash-bound certificate
- always requires evidence re-entry and later model reasoning

## Observation

The five capabilities emit
`casimir.theory_formal_verifier.artifact_family_audit_observation.v1`,
`casimir.theory_formal_verifier.preparation_observation.v1`,
`casimir.theory_formal_verifier.plan_observation.v1`,
`casimir.theory_formal_verifier.start_observation.v1`, and
`casimir.theory_formal_verifier.result_observation.v1`. A completed result may
contain the runtime-canary v1 certificate or the scientific
`casimir_formal_verification_certificate/v2`; raw process transcripts are
represented by hashes rather than copied into the gateway observation. The v2
certificate repeats the exact candidate badges, Casimir Spec, semantic
proposition, observed Lean type, semantic binding, Master Problem,
derivation-program, graph snapshot, source/import, environment, and executor
identities, including memory/process/timeout/output ceilings and their observed
outcomes. Receipt integrity and replay success cannot be substituted across
otherwise similar procedures or claims.

The v1 job service remains the non-scientific runtime-canary rail. Scientific
entries use the additive `casimir_formal_verification_request/v2` and
certificate v2 pair, which do not
conflate the semantic proposition digest with the independently observed Lean
theorem-type digest. The v2 service does not itself create a production catalog
entry or executor. The v2 pair additionally requires an
attested external sandbox capability with OS-enforced memory, process,
filesystem, and network isolation; direct workstation execution is forbidden.
Preparation resolves that selection through the server-owned sealed execution
catalog. A caller may provide only its opaque entry ID; it cannot provide a
capability hash, policy, path, request, source bundle, resolver reference, or
self-attestation that becomes authority.

## Host Projection

No panel mutation is required. A client may project plan, running, blocked,
failed, or certificate status from the structured observation, but that
projection is not answer authority.

## Visible Trace

The trace should show preflight, confirmation, replay start, result polling,
certificate observation, and post-tool model reasoning as separate events.

## Authority boundary

Every manifest, receipt, observation packet, and certificate keeps:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
promotion_allowed=false
```

A passing certificate means only that the selected declared formal artifact
replayed successfully under the admitted policy. It does not establish that
the formal theorem expresses the Casimir semantic claim unless a separately
governed semantic-to-Lean binding and observed theorem-type digest are present;
nor does it validate scientific theory, generated-code correctness, numerical
implementation, empirical truth, or physical mechanism.

Even an integrity-valid passing certificate satisfies a procedure closure axis
only after its exact payload re-enters on the active turn and its intrinsic
lineage matches the procedure and candidate scope. A certificate digest retained
by a prior procedure is not present-turn evidence.

The workstation account policy is the public boundary. Developer accounts
receive the capability family through their wildcard policy; user and unsigned
sessions do not receive it because the family is absent from the public
capability allowlist. The tool implementation repeats the developer check as
defense in depth.

## Configuration

The legacy non-scientific runtime canary may use:

```txt
CASIMIR_FORMAL_LEAN_EXECUTABLE=<absolute path to the pinned lean executable>
```

That executable setting is not used by the v2 scientific service. It does not
install or satisfy a sealed execution-catalog entry, theorem/semantic/import
bindings, environment policy, or external executor, and cannot make scientific
preparation ready.

The audited GR-Maxwell 1D source replayed twice in a local Lean/Mathlib
candidate, but a larger-module campaign exhausted and crashed a 16 GiB
workstation. That candidate is therefore not registered. Scientific replay
must use an isolated executor with enforceable resource ceilings; direct
workstation execution of the larger modules is an explicitly unsupported
bootstrap path.

For the v1 canary, executable bytes must match
`casimir_formal_lean_replay_policy/v1.kernelBinarySha256`. For v2, the external
worker identity, resource/isolation policy, source/import bundle, and returned
attestation must match the sealed catalog entry. The agent cannot supply or
replace either execution authority.

Helix does not issue confirmation receipts or parse user confirmation text.
Until a trusted Codex runtime receipt verifier is injected, a supplied receipt
fails closed as `runtime_approval_receipt_issuer_unconfigured`.

The optional Codex-native approval-host seam keeps `start` hidden by default.
It may expose an exact start capability only for a trusted developer act turn,
an affirmative execution decision supplied by trusted runtime context, durable
atomic replay protection, and a ready same-turn plan observation. No production
host, signer/private key, or public-key registry installation is invented by
the server. PostgreSQL implementations exist for replay protection and
job-state persistence, but production cross-process durability requires every
worker to share the same PostgreSQL database. The current receipt also does not
bind
a digest of the exact human-facing confirmation display, so display-level audit
proof remains a production-bootstrap requirement even though execution identity
is already bound to capability, plan, account, profile, session, turn, and
sealed input.

## Negative Admission

The rail must not execute for a user or unsigned session, a contextual or
quoted mention, a future or negated request, a missing or blocked prepared
request, a mismatched plan ID, missing runtime confirmation, a substituted
request/policy/source/import, an unconfigured governed environment catalog, or
an unconfigured or substituted external executor, any host-workstation runner,
a configured receipt verifier without a durable replay ledger, a missing
durable job-state store, or a job owned by another developer profile.

## Tests

- formal request, policy, replay, and certificate contract tests
- formal verifier job-service confirmation and profile-isolation tests
- workstation account-policy manifest and public-call denial tests
- Helix Ask prompt-solving adversarial benchmark
- Helix Ask API parity matrix
- Casimir adapter verification because certificate semantics are in scope
