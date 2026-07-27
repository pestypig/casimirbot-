# Theory Experiment Procedure

Status: developer-first candidate

## Objective

The Theory Experiment Procedure turns one or more registered Theory Badge
selections and admitted scientific evidence into a bounded seven-stage
comparison/proposal procedure. It generalizes the pinned
AdvectionDiffusion/Lanyon example without making Lanyon a solver, trust root,
or private execution runtime.

```text
question and source provenance
→ semantic scientific definition
→ graph and scale localization
→ congruence and dependency procedure
→ artifact generation and formal closure
→ independent numerical and observational closure
→ evidence re-entry and bounded synthesis
```

## Ownership Boundary

Helix owns:

- source and tool admission;
- evidence, artifact, badge, graph, catalog, and snapshot identity;
- registered bridges, claim boundaries, and terminal eligibility;
- capability-to-observation matching and typed failures.

Codex owns:

- semantic choice of the next admissible step;
- retrieval, sandboxing, tool calls, confirmation, retries, and polling;
- observation re-entry, follow-up reasoning, and terminal candidate writing.

The procedure compiler and Demo Lab projection do not execute tools or recreate
an agent loop.

## Ordering and Scale

`theory_derivation_program/v1` supplies dependency-DAG order. Physical scale
biomes are checkpoints for validity domains, frames, observables, and bridge
requirements. Scale proximity alone cannot create an execution edge.

Missing registered bridges, out-of-graph probability mass, formal-system
limits, and noncomputable references remain typed uncertainty or blockers.

## Contracts and Tool Chain

The preparation capability is
`theory-experiment-procedure.prepare`. Its output is
`casimir.theory_experiment_procedure.observation.v1`, containing one
hash-bound `theory_experiment_procedure/v1`.

Preparation exposes an exact read-only continuation to
`theory-experiment-procedure.evaluate_closure`. That second capability consumes
an exact current-turn or explicitly readmitted procedure ID and SHA-256. Its
output is
`casimir.theory_experiment_execution_closure.observation.v1`, containing one
hash-bound `theory_experiment_execution_closure/v1`.

The closure evaluator:

- executes no downstream capability;
- retains valid passed, failed, and blocked evidence as different states;
- treats evidence digests retained in the procedure as
  `bound_procedure_reference` only, never as present-turn closure;
- allows only an exact current-turn payload re-entry with its registered
  source capability, recomputed content hash, and matching intrinsic
  scientific lineage to satisfy closure;
- projects all seven procedure stages and their open requirements;
- classifies candidates as comparable, incomparable, tied, uniquely preferred,
  or blocked under one frozen evidence-coverage policy;
- reports a claim ceiling for the post-tool model step; and
- never converts candidate order into a probability or theory-truth claim.

Preparation, plan, confirmed start, and running formal/numerical observations
expose exact non-terminal continuation affordances. The independent numerical
rail exposes only its server-issued `prepared_request_id` to plan and only its
`plan_id` to start; authority-bearing policy and executable paths are retrieved
from the server-owned catalog record rather than copied into model-visible
arguments. A confirmed start exposes only the developer-scoped job ID; each
running read increments `poll_attempt` so polling remains bounded and
replayable. Approval credentials are never model-visible affordance arguments.

The procedure reuses:

- `casimir_spec_scientific_claim_ir/v1`;
- `theory_master_problem/v1`;
- `theory_derivation_program/v1`;
- `theory-semantic-admitter.normalize`;
- `theory-artifact-producer.admit_lanyon_snapshot`;
- `theory-formal-verifier.*`;
- `theory-independent-numerical-verifier.*`.

The Lanyon affordance selects only an eligible pinned source candidate. Formal
replay certifies only the declared proposition and environment. Independent
numerical verification checks a separate implementation/harness boundary.
Observable or empirical grounding remains distinct from both.

## Evidence Admission and Re-entry

`evidence_artifacts` is a request for binding, not self-authenticating evidence.
Every non-empty request must match exactly one executor-owned
`helix.current_turn_artifact.v1` envelope from the active provider ledger.
Helix verifies:

- the envelope was admitted on the active turn;
- prior-turn evidence has an explicit current-turn retained/readmission
  identity;
- the requested artifact reference resolves without aliases or ambiguity;
- the requested payload is byte-for-byte equivalent under canonical hashing;
- both envelope and payload remain evidence-only and non-terminal;
- semantic, generation-receipt, formal-certificate, and
  numerical-certificate integrity validators pass;
- generation status is `succeeded`, and formal/numerical certificate status is
  `passed`, before the artifact may satisfy a closure requirement;
- scientific-image and paper sidecars retain their complete provenance and
  internal identity.

A closure-bearing binding also records its exact scientific lineage:

- procedure and candidate badge scope;
- Casimir Spec ID plus semantic and artifact hashes;
- claim ID, proposition hash, and declared observable IDs;
- graph ID and snapshot hash where applicable;
- canonical Master Problem and derivation-program IDs and artifact digests;
- formal, artifact-generation, or numerical request digest; and
- the complete frozen numerical case identity and observable set where
  applicable.

The gateway recomputes the canonical Master Problem and derivation-program
artifact digests from the procedure bodies before accepting a formal or
artifact-generation lineage. A structurally valid but unrelated certificate,
receipt, graph snapshot, case, claim, or candidate scope fails closed.

A runtime-authored object, stale source-turn label, or copied hash cannot create
ledger membership. Repository, calculator, and theory-reflection observations
also require their registered observation schemas. No calibrated empirical
observation schema is registered yet, so `empirical_observation` remains a
typed missing requirement rather than a generic label the runtime can assign.

The execution-closure evaluator additionally recomputes the procedure hash,
requires an unambiguous authoritative procedure envelope, and recomputes its
own closure and frozen-ranking-policy hashes. A valid failed formal or
numerical certificate remains useful negative evidence, but it cannot satisfy
a closure axis or raise the claim ceiling. Evidence applies only to candidate
badges named by its lineage. Every compared candidate must have an admitted
derivation-backed path into the comparison context. A partially incomparable
candidate set blocks bounded synthesis, and the claim ceiling rises only when
all candidates are comparable and each required candidate-scoped evidence axis
is satisfied.

## Demo Lab Projection

The developer section of Workflow Demo Lab creates a unique procedure id and
pins it to the active Ask chat. It inserts an editable prompt and never
auto-submits.

The seven displayed stages advance only after the UI receives a valid
`casimir.theory_experiment_procedure.observation.v1` whose:

- procedure id matches the launched run;
- source chat matches the pinned chat;
- submitted turn and reply turn match;
- the canonical normalized artifact id and provider gateway reference match;
- target and ordered badge identities match;
- the procedure SHA-256 recomputes exactly;
- nested procedure passes the shared validator.

Assistant prose, stale chat replies, schema lookalikes, and artifact/procedure
ID aliases do not advance the projection. The projection is not answer
authority.

The projection also accepts the normalized execution-closure observation only
when it binds the currently projected procedure ID and SHA-256. It renders the
server-supplied candidate order, evidence states, ranking outcome, claim
ceiling, and open limitations without recalculating them in React. A closure
snapshot remains evidence-only and non-terminal even when it permits a bounded
Codex-authored synthesis.

## Live Validation Corpus

`npm run helix:ask:theory-experiment-live` runs a seven-case natural Ask
corpus against an already-running keyed server. Set `HELIX_ASK_BASE_URL` when
the launcher selects a non-default port. The corpus covers:

- Theory Badge Graph localization followed by procedure preparation;
- eligible pinned Lanyon preparation and same-thread evidence re-entry;
- explicit missing semantic, boundary, formal, numerical, and observable
  closure;
- unsupported Lanyon scope as a typed limitation;
- cross-scale, multi-badge congruence with open-world bridge handling;
- screen-visible and future/conditional non-admission.

The probe never starts a server. It requests a temporary developer session
only when the base URL is loopback, verifies the returned developer policy,
uses that cookie for the Ask turns, and signs out when the battery ends.
`npm run helix:ask:theory-experiment-live:dry` validates the corpus without
network calls.

`npm run helix:ask:realtime-theory-experiment` runs the corresponding
developer-only two-turn Realtime handoff journey against that same
operator-started keyed server. The first natural prompt prepares the
multi-badge, pinned-Lanyon procedure. The follow-up re-prepares current-turn
evidence and asks for the bounded missing semantic, bridge/boundary, formal,
independent numerical, and empirical requirements. The probe requires the
procedure capability to be both required by the handoff and successfully
executed by Ask on each turn; it also checks completed solver authority,
validated evidence-backed voice relay admission, and prior-turn continuity.
It does not claim browser audio playback from the API-only harness.

The Realtime probe requests its temporary developer session only when
`HELIX_ASK_REALTIME_DOC_LOCAL_DEVELOPER=1` and the configured base URL is
loopback, verifies developer policy, carries the session cookie through
Realtime and Ask requests, and signs out in a `finally` path. The package
command sets the explicit opt-in. Use
`npm run helix:ask:realtime-theory-experiment:dry` to inspect the selected
turns and assertions without network calls.

## Current External Limits

- Live Ask and Realtime evidence still require a user-started keyed server via
  the opaque `start-myapp-for-codex` launcher.
- Casimir adapter verification requires that keyed server and must report PASS
  plus certificate integrity before release completion.
- Lanyon eligibility is limited to the nine pinned 1D/2D/3D linear-advection,
  isotropic, and full advection-diffusion cases.
- Source admission and numerical-backend admission are separate. Only
  `advection_diffusion_full_1d` currently has a registered Casimir independent
  numerical fixture. The other eight pinned source cases fail early with
  `numerical_fixture_unregistered` instead of exposing an unusable numerical
  plan.
- Actual Lanyon snapshot admission additionally requires an exact local pinned
  checkout configured through `CASIMIR_LANYON_SOURCE_ROOT`; eligibility
  classification does not imply those bytes are installed. The source root is
  server-owned, absent from public tool schemas, and never selected from a
  caller-supplied `source_root` or `sourceRoot`.
- Formal and numerical start operations remain separately confirmation-gated;
  preparation cannot imply that either ran.
- The Codex-native approval-host seam, Ed25519 receipt verifier, and atomic
  replay-ledger interface are implemented. Start tools remain hidden unless
  trusted runtime context supplies affirmative execution intent, a ready
  same-turn plan, and durable replay protection. No production approval host,
  signer/private key, trusted-key installation, or host bootstrap is configured
  yet. The current receipt binds execution identity but not a digest of the
  exact human-facing confirmation display.
- The production theorem/type-digest, semantic-to-Lean binding, import-closure,
  graph-snapshot, and Lean environment-policy catalog is currently
  unconfigured. The successful formal `prepare_request -> plan -> start` path
  is intentionally unreachable until that server-owned catalog is installed;
  preparation currently returns typed blockers only.
- A repository-owned, no-import Lean 4.31 self-test now checks only the pinned
  kernel/replay runtime. It is test-process-only, absent from the scientific
  catalog, and cannot satisfy a semantic, theorem-type, graph, badge, formal
  closure, or certificate-promotion requirement.
- Immutable Lanyon numerical enrollment can bind an exact procedure, sealed
  request, replay policy, upstream commit/tree, persistent bundle, platform,
  architecture, and attested sandbox capability. The default catalog remains
  empty, and no production bundle, catalog entry, sandbox executor, or second
  numerical solver is installed. The analytic comparison lane is explicitly a
  reference, not an independent solver.
- Production construction of scientific sealed formal inputs and governed
  compilation of Lanyon/C artifacts remain release blockers. The current
  low-level verifier rails accept fully assembled admitted inputs but do not
  invent missing propositions, policies, manifests, executables, units, frames,
  observables, or boundary conditions.
- Verifier jobs are currently in-memory. A process restart must be treated as a
  typed lost-job limitation until durable job/certificate storage is added.
- A clean repository-wide `tsc` result is presently blocked by a large
  unrelated baseline error set; targeted tests and production builds are the
  attributable gates for this patch.
- The separate live-source/capability-lane terminal-writer failure remains the
  next known lifecycle issue and is not hidden by this procedure. The full
  discipline gate currently reports four failures in
  `helix.ask.turn.live-source-continuation-routing.test.ts`, all typed as
  `post_observation_model_decision_missing`. The early live-source route
  correctly records pipeline receipts or binding diagnoses as current-turn
  observations, but still attempts to promote those observations directly to
  terminal authority without Codex-owned evidence re-entry. The solver
  correctly fails closed. Repair must continue through a post-observation
  model decision and synthesized terminal answer; receipts and diagnoses must
  remain side evidence.

## Release Gates

Release requires:

1. contract/compiler and account-policy tests;
2. provider catalog and observation-normalization tests;
3. contextual/negated/future/historical/screen-visible non-admission tests;
4. prompt-solving, capability lifecycle, and Ask API parity matrices;
5. production client and server builds;
6. representative keyed Ask and Realtime multi-turn traces;
7. Casimir adapter PASS with certificate hash and integrity OK;
8. keyed server shutdown after live validation.
