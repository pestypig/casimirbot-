# Scientific Evidence Closure

## Purpose

The `scientific-evidence-closure` family exposes a generic retained sidecar for
an enrolled scientific claim. The sidecar binds a source claim, a Theory Badge
orientation, semantic specifications, a formal proposition, parameter policy,
numerical implementation lineages, comparison policy, and claim ceiling.

Enrollment is document-independent. A paper, dataset, derivation, or other
scientific source becomes traversable only after it supplies the same
machine-readable conformance manifest. Casimir-DP and
`advection_diffusion_full_1d` are enrollment candidates, not framework
special cases.

## Owner

- Capability ids:
  - `scientific-evidence-closure.inspect_enrollment`
  - `scientific-evidence-closure.prepare`
  - `scientific-evidence-closure.evaluate`
- Panel: `workflow-demo-lab`
- Permission profile: `read`
- Account policy: `developer`
- Mode: read/observe

Helix owns enrollment identity, provenance, policy, evidence normalization,
closure axes, and terminal eligibility. Codex owns model reasoning, ordinary
tool execution, approval, retries, and completion.

## Inputs

`inspect_enrollment` requires `manifest_id`.

`prepare` requires `manifest_id`, `orientation_id`, `source_claim_id`,
`intervention_parameter_id`, and `intervention_value`. Every identifier and
value must match the server-registered enrollment.

`evaluate` requires `manifest_id`, `plan_id`,
`execution_plan_artifact_ref`, and `closure_input_artifact_ref`. Both
references must resolve uniquely to authoritative current-turn observations.
Caller-authored payloads and embedded aliases do not provide evidence
authority.

## Capabilities

### `scientific-evidence-closure.inspect_enrollment`

This read-only capability returns the exact server-registered manifest and
retained sidecar. It performs no Lanyon, Lean, numerical, shell, or model
execution. Its observation schema is:

`casimir.scientific_evidence_enrollment.observation.v1`

The observation is current-turn evidence but is nonterminal. Codex may use it
to explain the available orientation and propose a confirmation-gated runtime
plan.

### `scientific-evidence-closure.prepare`

This read-only capability turns the scientist's exact enrolled selection into
an immutable execution-plan artifact. The request must name the registered
manifest, Theory Badge orientation, source claim, mutable parameter, and
permitted non-baseline value. The resulting observation schema is:

`casimir.scientific_evidence_execution_plan.observation.v1`

The artifact hash binds the selected badges, graph, source claim and source
hash, baseline and intervention values, frozen-input digest, exact Lanyon
snapshot, Lean proposition/type binding, numerical cases and lineages,
comparison axes, and claim ceiling. Preparation performs no Lanyon, Lean,
numerical, shell, or model execution; grants no confirmation; and is
nonterminal. It is a proposed procedure that Codex may execute only through the
ordinary confirmation-gated runtime lifecycle.

Future closure prerequisites are reported as
`downstream_closure_requirements`, and optional future operations as
`operator_next_affordances` with `executes_automatically=false`. They are not
current-turn `missing_requirements` or automatic continuation commands. A
plan-only user request is complete after the plan observation re-enters and
Codex explains it.

### `scientific-evidence-closure.evaluate`

This read-only capability accepts a current-turn Codex-runtime observation
bundle and the current-turn execution-plan artifact by immutable artifact
reference. It validates the bundle against the exact enrolled manifest and
plan digest, confirmation receipt, graph snapshot, semantic bindings, formal
result, numerical lineages, and comparison policy. Its observation schema is:

`casimir.scientific_evidence_closure.observation.v1`

Evaluation does not execute Lean or a numerical solver. Codex owns execution,
approval, retry, and tool-result re-entry. Helix validates evidence identity,
provenance, closure axes, and terminal eligibility.

## Observation

All three capabilities emit structured observations. Their artifacts are
immutable and hash-bound:

- `casimir.scientific_evidence_enrollment.observation.v1`
- `casimir.scientific_evidence_execution_plan.observation.v1`
- `casimir.scientific_evidence_closure.observation.v1`

Every observation retains:

```txt
terminal_eligible=false
post_tool_model_step_required=true
assistant_answer=false
raw_content_included=false
```

## Closure axes

A satisfied packet requires exact evidence for all six canonical axes:

1. source;
2. semantic binding;
3. Theory Badge graph orientation;
4. pinned formal replay;
5. independent numerical comparison;
6. baseline-versus-intervention comparison.

Missing, stale, mismatched, failed, or non-independent evidence yields a typed
blocked or failed packet. A receipt from another turn, plan, enrollment, case,
policy, or artifact hash cannot satisfy closure.

The exact execution-plan artifact must re-enter the active turn before
evaluation. An embedded or inferred parameter choice is never sufficient, and
the confirmation receipt must bind the same plan digest.

## Authority and claim ceiling

Every closure packet is immutable evidence for bounded synthesis, not an
assistant answer. It always has `assistantAnswer=false`,
`terminalEligible=false`, and requires a post-tool model step.

`canonicalWithinEnrollment=true` means only that the exact enrolled synthetic
case satisfied every declared closure axis. It does not establish source truth,
semantic truth, theory truth, empirical truth, physical truth, or
implementation correctness. It cannot be promoted beyond:

`bounded synthetic comparison within the exact enrolled case`

Lean is limited to the enrolled proposition, such as dimensional consistency,
frozen-input invariants, gate conjunctions, or a narrowly bound mathematical
identity. It must not be described as proving the underlying scientific theory.

## Host Projection

The host may show enrolled identities, exact selected parameters, artifact
digests, closure-axis status, typed blockers, and bounded next affordances. It
must not project enrollment, a plan, a receipt, or a closure packet as an
assistant answer or silently launch an executor.

## Negative Admission

Fail closed for:

- an unknown manifest, orientation, source claim, or parameter;
- mutation of a frozen parameter;
- a value outside the registered permitted set or equal to the baseline;
- a stale, missing, ambiguous, aliased, or hash-mismatched plan artifact;
- a closure bundle from another turn, plan, case, policy, or enrollment;
- confirmation that does not bind the exact execution-plan digest;
- a promoted, identity-less, failed, or mismatched Lanyon receipt;
- formal evidence outside the pinned proposition/type/import closure;
- numerical evidence with non-independent lineages or mismatched cases;
- any attempt to promote bounded synthetic closure to empirical or physical
  truth.

Contextual, negated, historical, future/conditional, quoted, or
screen-visible planning language must not admit a plan. A mixed request may
prepare the read-only plan while still respecting an explicit prohibition on
execution.

## Visible Trace

```txt
Tool request: scientific-evidence-closure.inspect_enrollment or prepare
Tool observation: exact enrollment or immutable execution plan
Model re-entry and, only when requested, ordinary confirmation-gated execution
Current-turn runtime observations
Tool request: scientific-evidence-closure.evaluate
Tool observation: typed closure packet
Model re-entry
Bounded explanation of what the result establishes and does not establish
```

## Tests

- exact enrollment and immutable execution-plan integrity;
- frozen, non-permitted, baseline, stale, aliased, and tampered rejection;
- contextual, negated, future, historical, quoted, and mixed-intent admission;
- exact current-turn plan and closure-bundle re-entry;
- confirmation binding to the plan digest;
- formal proposition and independent numerical lineage congruence;
- nonterminal observations and post-tool model synthesis;
- bounded claim ceiling and explicit non-empirical limitations.

## First enrolled slice

The first slice is
`scientific-evidence:advection-diffusion-dxx:v1`. It binds the
`advection_diffusion_full_1d` source claim to a Theory Badge orientation, the
zero-gradient diffusive-flux proposition, a pinned Lean theorem binding, and
distinct primary and independent numerical lineages.

The local Lean and solver-pair replays are diagnostics. Production closure
remains blocked until their results arrive from enrolled sandbox executors with
trusted confirmation and current-turn observation receipts.

## Realtime evidence identity

When the completed Ask solver selects a scientific closure observation as
terminal support, Realtime receives only a bounded, integrity-verified identity
projection. The projection carries the selected observation ref, packet hash,
turn and plan binding, manifest and orientation IDs, closure status,
`canonicalWithinEnrollment`, and the exact claim boundary. It never carries raw
tool output and never becomes an assistant answer or terminal authority.

The projection is emitted only for a selected current-turn ledger artifact whose
closure packet passes shape, hash, and turn-binding validation. A malformed,
tampered, ambiguous, or wrong-turn selected closure suppresses speech with a
typed failure. An unselected or stale closure is not projected.

Realtime must preserve these speech limits:

- blocked or failed closure is never called canonical;
- satisfied closure may be called only “canonical within the exact enrollment”;
- source, semantic, theory, empirical, physical, and implementation-correctness
  authority remain false;
- the maximum claim remains “bounded synthetic comparison within the exact
  enrolled case.”

The formal and independent-numerical lifecycle now persists prepared requests,
plans, jobs, and completed certificates through a server-owned PostgreSQL
store. Restarted processes preserve completed evidence and fail interrupted
running jobs with typed repair codes rather than projecting them as live. This
closes durability and soft-lock recovery; it does not enroll a production
signer, confirmation host, formal sandbox, numerical sandbox, or execution
catalog.
