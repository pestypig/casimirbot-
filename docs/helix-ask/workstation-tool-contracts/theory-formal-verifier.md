# Theory Formal Verifier Workstation Tool Contract

Status: developer-only experimental evidence rail; production scientific trust
catalogs and runtime-approval bootstrap are deliberately unconfigured.

## Purpose

The `theory-formal-verifier` family exposes pinned Lean replay to an agent
through the governed workstation gateway. It does not add a private model,
planner, retry, approval, or terminal-completion loop.

## Owner

Helix owns developer-account admission, sealed evidence identity, certificate
normalization, and claim boundaries. The selected agent runtime owns tool-call
choice, confirmation, polling, evidence re-entry, and later reasoning.

## Current production state

The production theorem selection, observed theorem-type digest,
semantic-to-Lean binding, import closure, graph snapshot, and pinned Lean
environment-policy catalog are currently unconfigured. No production catalog
entry is inferred from Lanyon source, an environment variable, a caller's
theorem name, or self-hashed tool arguments.

Consequently, the successful
`prepare_request -> plan -> start` path is intentionally unreachable today.
`prepare_request` remains callable only so it can return a hash-bound blocked
receipt with exact typed repair requirements such as
`formal_theorem_selection_unregistered`,
`formal_theorem_type_digest_required`,
`semantic_to_lean_binding_required`, `formal_import_closure_required`, and
`formal_environment_policy_catalog_unconfigured`. It cannot issue a ready
prepared-request ID; therefore `plan` and `start` cannot be reached through the
production tool lifecycle. Tests may install bounded dependencies or fixtures
inside an isolated test process, but those are not production catalog entries.

A repository-owned, no-import Lean 4.31 runtime self-test is available only to
the test process. It pins the exact Lean binary and source bytes and checks the
kernel/replay plumbing. It is absent from the production scientific catalog,
has no semantic, theorem-type, graph, or badge binding, and is explicitly
ineligible for theory-experiment formal closure or certificate promotion.

## Inputs

`prepare_request` accepts exact references to current-turn authoritative
procedure, semantic-admission, and formal-artifact observations, plus optional
claim, theorem, and environment-policy selections. `plan` and `start` accept
only the opaque server-owned prepared-request ID; raw requests, policies, and
absolute source paths are not caller trust roots. `start` additionally accepts
the exact plan ID and a trusted-runtime confirmation receipt in the gateway
control envelope. The receipt is bound to the start capability, plan, account,
profile, session, turn, and canonical sealed-input hash. `read_result` accepts
the job ID.

## Capability order

```txt
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

### `theory-formal-verifier.prepare_request`

- developer-only, read-only evidence admission
- resolves exact current-turn authoritative artifacts
- requires governed theorem, statement-digest, semantic-binding,
  graph-snapshot, import-closure, and Lean-environment records
- returns a hash-bound `ready | blocked` receipt
- exposes no plan affordance while any requirement remains open
- does not execute Lean

### `theory-formal-verifier.plan`

- developer-only, read-only preflight
- requires a ready owner-scoped prepared-request ID
- validates the exact request and replay-policy hashes
- checks the configured pinned Lean executable hash
- checks theorem and import source identities
- returns a plan ID bound to the developer profile and sealed paths
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
- uses the existing direct-executable, no-shell Lean replay backend
- returns a non-terminal job receipt, not a certificate or answer

### `theory-formal-verifier.read_result`

- developer-only, read-only result lookup
- enforces developer-profile job ownership
- returns running status, a typed failure, or the hash-bound certificate
- always requires evidence re-entry and later model reasoning

## Observation

The four capabilities emit
`casimir.theory_formal_verifier.preparation_observation.v1`,
`casimir.theory_formal_verifier.plan_observation.v1`,
`casimir.theory_formal_verifier.start_observation.v1`, and
`casimir.theory_formal_verifier.result_observation.v1`. A completed result may
contain `casimir_formal_verification_certificate/v1`; raw process transcripts
are represented by hashes rather than copied into the gateway observation.
The certificate repeats exact nested Casimir Spec, Master Problem,
derivation-program, and graph-snapshot request identities. Receipt integrity
and replay success cannot be substituted across otherwise similar procedures
or claims.

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

The server must set:

```txt
CASIMIR_FORMAL_LEAN_EXECUTABLE=<absolute path to the pinned lean executable>
```

That executable setting alone does not install or satisfy the missing
theorem/semantic/import/environment catalog. It cannot make preparation ready.

The executable bytes must match
`casimir_formal_lean_replay_policy/v1.kernelBinarySha256`. The agent cannot
supply or replace the executable path.

Helix does not issue confirmation receipts or parse user confirmation text.
Until a trusted Codex runtime receipt verifier is injected, a supplied receipt
fails closed as `runtime_approval_receipt_issuer_unconfigured`.

The optional Codex-native approval-host seam keeps `start` hidden by default.
It may expose an exact start capability only for a trusted developer act turn,
an affirmative execution decision supplied by trusted runtime context, durable
atomic replay protection, and a ready same-turn plan observation. No production
host, signer/private key, public-key registry installation, or durable replay
ledger implementation is installed yet. The current receipt also does not bind
a digest of the exact human-facing confirmation display, so display-level audit
proof remains a production-bootstrap requirement even though execution identity
is already bound to capability, plan, account, profile, session, turn, and
sealed input.

## Negative Admission

The rail must not execute for a user or unsigned session, a contextual or
quoted mention, a future or negated request, a missing or blocked prepared
request, a mismatched plan ID, missing runtime confirmation, a substituted
request/policy/source/import, an unconfigured governed environment catalog, or
a configured receipt verifier without a durable replay ledger, or a job owned
by another developer profile.

## Tests

- formal request, policy, replay, and certificate contract tests
- formal verifier job-service confirmation and profile-isolation tests
- workstation account-policy manifest and public-call denial tests
- Helix Ask prompt-solving adversarial benchmark
- Helix Ask API parity matrix
- Casimir adapter verification because certificate semantics are in scope
