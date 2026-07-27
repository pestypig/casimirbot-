# theory-experiment-procedure.prepare

Maturity: `draft`

Architecture: [Theory Experiment Procedure](../../architecture/theory-experiment-procedure.md)

## Purpose

Prepare a developer-scoped scientific comparison or proposal as one bounded,
seven-stage procedure. The capability binds selected Theory Badge identities
and current-turn scientific evidence, derives dependency order separately from
scale checkpoints, and reports exact missing requirements and downstream
capability candidates. It does not run Lanyon, Lean, numerical code, or a shell.

## Owner

- Capability id: `theory-experiment-procedure.prepare`
- Panel: `workflow-demo-lab`
- Action id: `prepare_theory_experiment_procedure`
- Permission profile: `read`
- Account policy: `developer`
- Mode: read/observe

## Inputs

Required:

- `prompt`
- `operation`: `compare`, `predict`, `derive`, `explain`, `prove`, or `bound`
- `target`
- `selected_badge_ids`

Optional inputs include the target observable, comparison badges, scale range,
coordinate frame, initial/boundary conditions, formal system, requested
precision, maturity ceiling, current-turn evidence artifacts, and an explicit
Lanyon request/case.

Each requested evidence artifact must resolve uniquely to the executor-owned
current-turn artifact ledger. The ledger, rather than model-authored arguments,
supplies admission-turn and retained/readmission authority. Requested payload
bytes must canonically hash to the authoritative payload. Artifact and sidecar
identifiers must match. Semantic, artifact-generation, formal, and numerical
evidence additionally pass their native integrity validators. Generation must
have succeeded, and formal and numerical certificates must have passed, before
they can satisfy a closure requirement; a valid failure certificate remains an
observation for Codex but is not successful closure.

Closure-bearing evidence must also bind the exact procedure, candidate badges,
Casimir Spec semantic/artifact hashes, claim proposition and observables, and
the applicable graph snapshot, Master Problem, derivation program, verifier
request, or frozen numerical case. Master Problem and derivation artifact
digests are recomputed from their canonical procedure bodies rather than read
from model-authored arguments.

Repository, calculator, and theory-reflection evidence require registered
observation schemas. A generic object cannot be relabeled as empirical closure;
until a calibrated empirical-observation contract is registered, that evidence
kind remains an explicit typed requirement.

## Observation

The capability returns
`casimir.theory_experiment_procedure.observation.v1` containing:

- one hash-bound `theory_experiment_procedure/v1` artifact;
- exactly seven canonical scientific-method stages;
- selected and reflected badge identities;
- dependency-DAG execution order;
- scale-biome checkpoints explicitly marked as non-ordering;
- registered bridge and congruence requirements;
- bounded Lanyon eligibility for the pinned adapter cases;
- formal and independent numerical capability affordances;
- missing requirements and readiness state;
- an explicit incompleteness/open-world boundary.

The observation always keeps:

```txt
terminal_eligible=false
post_tool_model_step_required=true
assistant_answer=false
raw_content_included=false
```

## Authority Boundary

Preparation is not execution, proof, numerical validation, empirical
confirmation, or scientific truth. Scale proximity does not create dependency
order. Lanyon is an artifact producer rather than a solver or trust root. Lean
may certify only the declared formal proposition and environment. Independent
numerical closure and observable grounding remain separate.

Binding an evidence digest into a procedure does not make that evidence present
on a later turn. Closure evaluation requires the exact registered payload to
re-enter as current-turn evidence. A retained digest is projected only as a
non-satisfying `bound_procedure_reference`.

## Host Projection

The host may project the procedure id, stage readiness, selected badge ids,
missing requirements, and exact downstream capability ids. It must not launch
a shell, synthesize a tool result, or display the observation as a completed
scientific answer.

## Negative Admission

Fail closed for:

- unknown or unregistered badge identities;
- stale-turn evidence;
- evidence absent from the executor-owned current-turn ledger;
- missing or mismatched evidence identity/hash;
- caller-supplied kind/schema relabeling;
- invalid semantic IR or admission receipt;
- invalid generation, formal, or numerical certificate integrity;
- non-canonical stage count/order;
- dependency cycles or invalid bridge requirements;
- unsupported Lanyon case selection.

## Visible Trace

```txt
Tool request: theory-experiment-procedure.prepare
Tool observation: seven-stage bounded procedure and missing requirements
Model re-entry
Proposal, next tool request, or accurate typed limitation
```

## Tests

- prepares exactly seven stages from registered badges;
- separates dependency order from scale checkpoints;
- binds current-turn evidence and rejects stale or aliased artifacts;
- exposes Lanyon only when its exact case requirements are eligible;
- remains developer-only and non-terminal;
- does not claim formal, numerical, empirical, or physical validation.
