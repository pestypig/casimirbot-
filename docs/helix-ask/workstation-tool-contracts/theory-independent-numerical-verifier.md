# Independent Numerical Verifier Tool Contract

## Purpose

Expose Casimir's pinned independent numerical replay backend to developer
agents through a server-prepared, confirmation-gated `prepare_request`,
`plan`, `start`, and `read_result` lifecycle.

## Owner

Helix Ask owns request admission, evidence identity, provenance, authority
boundaries, and terminal eligibility. The shared Codex runtime owns approval,
tool execution, retries, and observation re-entry.

## Inputs

`prepare_request` accepts an opaque `catalog_entry_id` plus the exact
`procedure_id` and `procedure_sha256`. The procedure strings are selectors, not
authority: before catalog resolution, the service requires a structurally
valid, canonically rehashed `theory_experiment_procedure/v1` payload inside a
same-turn authoritative procedure observation. Missing, stale, ambiguous,
substituted, or copied-only procedure identities fail closed.

A trusted server-installed catalog then resolves the entry and exact procedure
binding to:

- an integrity-valid
  `casimir_independent_numerical_verification_request/v1`;
- an integrity-valid
  `casimir_independent_numerical_replay_policy/v1`;
- integrity-valid artifact-generation requests and receipts for both lanes;
- receipt-against-generation-request consistency for both lanes;
- source and build-manifest presence in each cited producer receipt;
- exact primary and independent source paths;
- exact primary and independent build-manifest paths; and
- exact primary and independent executable paths;
- an immutable Lanyon enrollment binding the upstream commit, selected source
  tree, persistent bundle artifacts, platform, architecture, procedure, and
  complete sealed input; and
- an exact sandbox-executor capability identity and attestation.

Those policy and path fields are not workstation-tool inputs and cannot be
authored by the model or user. The server clones and hashes the resolved
packet, stores it under a random owner-bound `prepared_request_id`, and returns
only bounded identities. When no trusted catalog resolver is installed,
preparation fails closed as `numerical_execution_catalog_unconfigured`.

Harness, implementation, manifest, and executable paths come only from the
admitted catalog packet. A caller-provided path or bare process runner is not
sandbox authority. `plan` accepts only the `prepared_request_id`, retrieves the
exact stored packet, and requires resolution of the exact attested sandbox
capability. `start` accepts only the exact `plan_id`; it retrieves and
revalidates the stored prepared packet and sandbox capability before consuming
a trusted-runtime confirmation receipt bound to the start capability, plan,
account, profile, session, turn, and canonical sealed-input hash.
`read_result` requires `job_id`.

## Observation

`prepare_request` returns an owner-bound prepared-request receipt or typed
blocker. `plan` returns a hash-bound preflight plan or typed blockers. `start`
returns a developer-scoped job receipt. `read_result` returns running state,
failure evidence, or a bounded independent numerical certificate.
The certificate repeats the exact nested Casimir Spec identity and complete
frozen-case request summary, including case, input, mesh, initial-condition,
boundary-condition, and observable identities.

The observation schemas are:

- `casimir.theory_independent_numerical_verifier.prepared_request_observation.v1`
- `casimir.theory_independent_numerical_verifier.plan_observation.v1`
- `casimir.theory_independent_numerical_verifier.start_observation.v1`
- `casimir.theory_independent_numerical_verifier.result_observation.v1`

## Host Projection

The host may show plan, job, blocker, replay, tolerance, convergence, and
certificate status. Raw executable or harness content is not projected.

## Visible Trace

All four capabilities emit gateway admission, lifecycle, observation, and
follow-up traces. Every result requires a post-tool model step.

## Authority

A passing certificate establishes only that two declared, distinct
implementation lineages completed the frozen comparison under the pinned
policy. In the first Lanyon enrollment, the second lane is an analytic
reference and is explicitly not a second numerical solver. The comparison does
not validate generated code, either implementation generally, semantic intent,
theory, empirical claims, physical mechanisms, or a final answer. It is never
terminal or promotion authority.

Procedure closure additionally requires exact current-turn certificate payload
re-entry and a lineage match to the procedure, claim, candidate badges, frozen
case, and declared observables. A retained digest or a passing certificate from
another candidate or case cannot satisfy the axis.

Every capability and observation preserves:

```text
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Account

All capabilities are developer-only. User and no-session accounts fail closed
before file inspection or execution.

## Configuration

The server must install a trusted numerical execution catalog resolver, an
exact capability-bound sandbox-executor resolver, a trusted receipt verifier,
and a shared atomic replay ledger. Harness, source, build, and executable bytes
must all match the catalog enrollment and replay policy.

Trusted bootstrap code installs those dependencies through
`installCasimirIndependentNumericalVerifierDependenciesForServerV1`. This is a
server-module composition point, not a route, prompt, or tool argument.

The default catalog is empty. No production Lanyon bundle, enrollment entry,
attested sandbox executor, signer, or approval host is installed. A
PostgreSQL-backed replay-ledger implementation exists, but cross-process
single-use authority requires all workers to share that PostgreSQL database;
the local pg-mem snapshot provides only single-process restart recovery.

The numerical request's Casimir Spec identity, semantic and artifact hashes,
claim ID, and proposition hash must exactly match both artifact-generation
requests. Receipt IDs and hashes embedded in each numerical implementation
binding must exactly match the corresponding supplied receipt body.

The checked-in Advection-Diffusion fixture uses:

- `scripts/research/build-casimir-advection-diffusion-fixture.ts` to verify the
  pinned local Lanyon snapshot, reproduce both native executables, and create a
  deterministic source-snapshot commit without changing the working branch;
- `scripts/research/run-casimir-advection-diffusion-numerical-certificate.ts`
  to build and revalidate both generation chains before replay; and
- `docs/research/casimir-advection-diffusion-numerical-certificate.v1.json` as
  the portable bounded certificate record.

## Negative Admission

- Contextual, quoted, negated, historical, future, or screen-visible tool words
  do not admit execution.
- `prepare_request` requires exact same-turn authoritative procedure evidence
  before it consults the catalog. It never accepts caller-authored policy,
  source, build, sandbox, or executable authority; raw or forged prepared ids
  fail closed.
- `plan` never executes the harness.
- `start` rejects arbitrary legacy confirmation strings and fails without the
  exact plan plus an integrity-valid, unexpired, single-use receipt verified by
  an injected trusted Codex runtime verifier and atomically consumed by the
  durable replay ledger.
- Arbitrary commands, arguments, network permission, relative paths, symlinks,
  path aliases, source substitution, build-manifest substitution, executable
  substitution, self-comparison, incomplete replay, tolerance drift, and
  observable drift fail closed.
- A receipt, process observation, or harness output is not an assistant answer.

Helix does not issue confirmation receipts or parse user confirmation text.
Until a trusted Codex runtime receipt verifier is injected, a supplied receipt
fails closed as `runtime_approval_receipt_issuer_unconfigured`.

## Tests

- replay-policy contract tests;
- outer-observed executor tests;
- developer-scoped job lifecycle tests;
- gateway account and confirmation-policy tests;
- capability lifecycle and lexical-suppression tests; and
- Casimir certificate integrity verification.
