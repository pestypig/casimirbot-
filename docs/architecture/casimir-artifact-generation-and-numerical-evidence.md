# Casimir artifact generation and independent numerical evidence

Status: contract layer, pinned Lanyon snapshot admission, audited formal-source
catalog, and the governed independent numerical
`plan`/`start`/`read_result` execution rail are implemented. A release-pinned
Casimir harness, Lanyon-kernel adapter, analytic reference lane, and bounded
frozen-case numerical certificate are also implemented. Live artifact
generation and broader numerical, empirical, or physical validation remain
downstream work.

## Seven-stage reasoning order

Casimir uses one semantic authority path:

1. Bind source provenance and immutable source bytes.
2. Normalize and admit meaning into
   `casimir_spec_scientific_claim_ir/v1`.
3. Bind the claim to `theory_master_problem/v1` and
   `theory_derivation_program/v1`.
4. Ask a provider-neutral producer for hash-addressed sibling artifacts.
5. Replay the selected formal proposition with the Casimir-owned pinned Lean
   backend.
6. Compare two distinct numerical implementation lineages under a frozen
   case, policy, environment, and replay requirement.
7. Re-enter the formal, numerical, and empirical evidence as bounded,
   non-terminal observations for synthesis and benchmark scoring.

No stage may substitute a second semantic IR or inherit authority from a later
stage.

## Provider-neutral artifact generation

The contract pair in
`shared/contracts/casimir-artifact-generation.v1.ts` separates a generation
request from a producer receipt.

The request binds:

- the canonical Casimir Spec semantic and artifact hashes;
- claim identity and proposition hash;
- the source packet, Master Problem, and derivation program;
- an adapter contract hash and explicit producer allowlist; and
- the exact artifact identities, roles, and media types requested.

The receipt binds:

- the request and canonical semantic identities, including exact nested Casimir
  Spec, Master Problem, and derivation-program summaries;
- producer and adapter revision;
- an immutable upstream Git commit and source-tree hash;
- run transcript and environment hashes; and
- every generated artifact's role, media type, safe logical path, byte hash,
  size, and source-packet derivation.

A successful receipt establishes only that the declared artifact bytes were
produced and observed. It does not trust those bytes, check a theorem, validate
generated code, validate a numerical implementation, validate a theory, or
answer the user.

## Lanyon / AdvectionDiffusion admission

The upstream repository was inspected at commit
`3d19be11e101121d8187230977f5a5aeba0daefe`. At that snapshot it is a static
example corpus containing nine Racket specification, Lean proof, and C
implementation triplets, plus media. It does not expose a versioned package
manifest or stable callable service API.

Therefore the first Lanyon integration must be an adapter over immutable
artifacts, not a privileged solver integration. The adapter must:

1. pin an upstream commit and independently hash the selected source tree;
2. bind the chosen Racket, Lean, and C files to one generation request;
3. emit a producer receipt without asserting any scientific authority;
4. submit Lean source separately to `theory-formal-verifier`;
5. treat C source as untrusted until a governed build and numerical request
   bind its exact bytes; and
6. never convert the upstream README's correctness claims into Casimir
   certificate fields.

The provider identifier `lanyon` is data in an allowlist, not a schema branch.
Other producers must satisfy the same contract.

That pinned admission path is now available to developer agents as
`theory-artifact-producer.admit_lanyon_snapshot`. It verifies the exact local
snapshot against the pinned commit, selected-source manifest, and request
bindings, then returns evidence-only artifact references. It does not clone,
generate, compile, execute Lean, execute C, perform numerical validation, or
produce a terminal answer.

The local checkout root is a server-owned trust boundary configured only
through `CASIMIR_LANYON_SOURCE_ROOT`. It is absent from the model-visible route
and workstation schemas, and the gateway does not consult caller-supplied
`source_root` or `sourceRoot` values. Server ownership does not waive snapshot
checks: the adapter still rejects path aliases, symlinks, missing files, and
hash, size, or selected-tree drift.

## GeneralRelativisticMaxwell reference audit

The upstream `lanyonai/GeneralRelativisticMaxwell` repository is separately
audited at commit `b13da44d9e93e9f3c8dbdab48590fc2e08a8bff3`. The audited
selection contains six Racket/Lean/C triplets and 156 Lean theorem
declarations. Canonical bytes come from Git blobs, not a platform-transformed
working tree. The 18 selected artifacts bind to source-tree digest
`0ff049323382600bac8ef7a24d97fe07c19adad27d66634e7fb136be7a7ecb7c`.
The companion generation-lineage audit also binds the complete,
non-truncated 32-entry recursive repository tree. Its generator-name scan is
empty: the pinned repository publishes outputs and screen captures, but no
generator artifact, generator revision, invocation manifest, prompt artifact,
or generation receipt. This is the typed
`formal_generator_lineage_unavailable` blocker; the repository README is not
an executable or hash-bound generation receipt.

`casimir_formal_artifact_family_audit/v1` binds every theorem to its exact
module, source range, declaration digest, proposition-source digest, narrow
property class, claim ceiling, denied promotions, and replay blockers. A
server catalog resolves a theorem only from the complete tuple:

```text
formal artifact id
+ exact formal-source SHA-256
+ exact theorem name
```

The developer agent reaches this catalog through
`theory-formal-verifier.inspect_artifact_family`. Ask normalizes the result as
current-turn evidence, and `prepare_request` accepts its exact artifact
reference through `formal_source_admission_artifact_ref`. The preparer
re-resolves the server catalog rather than trusting copied payload fields. This
is a provider-neutral source-admission route and remains distinct from a
producer receipt for artifacts actually generated during a run.

Names are not claim authority. In particular, all 12 declarations ending in
`Hyperbolicity` prove only the existence of a witness for an expression already
typed as `Real`; the audit classifies them as
`real_typed_expression_witness` with ceiling `definition_well_typed`. They do
not establish a complete real eigensystem, strong or symmetric
hyperbolicity, well-posedness, CFL stability, or a numerical solution.

The upstream C files use binary64 `double`, while the Lean sources use exact
`Real`; their `main` entrypoints are placeholders and contain no simulation
drivers. The repository also supplies no pinned Lean/Mathlib environment,
dependency lock, import-closure digest, or CI replay record. Consequently this
catalog grants source-admission authority only. It does not grant theorem
replay, semantic equivalence, implementation refinement, numerical,
empirical, or physical authority.

## Formal replay production boundary

The formal contracts, blocked legacy-preparation rail, provider-neutral v2
sealed-execution catalog, external-only job service, gateway lifecycle, and v2
certificate evidence re-entry are implemented. A server-governed
source/theorem claim-scope catalog covers the audited
GeneralRelativisticMaxwell family, but the production observed theorem-type
digest, semantic-to-Lean binding, import closure, graph binding, Lean
environment entry, sealed execution entry, and external executor remain
absent.

The successful scientific `prepare_request -> plan -> start` path therefore
remains unreachable in the default deployment. The legacy route reports its
independent missing bindings. The v2 route accepts only an opaque execution
catalog ID and fails closed as `formal_execution_catalog_unconfigured` or
`formal_external_sandbox_executor_unconfigured`. Caller-supplied theorem names,
imports, request/policy bodies, source paths, executable paths, commands,
resolver references, or hashes cannot fill that gap. An audited source
declaration or executable environment setting by itself is not a replayed
theorem and is not semantic equivalence.

Local qualification confirmed why the resource policy is part of the trust
boundary: the exact 1D GR-Maxwell module replayed twice, but a larger-module
campaign exhausted a 16 GiB workstation and crashed the host. That local
Mathlib environment is not production-admissible. No larger replay should run
on the workstation until an isolated external executor can enforce memory,
timeout, process, filesystem, and output ceilings and return resource
exhaustion as a typed observation instead of destabilizing the agent host.

The additive `casimir_formal_verification_request/v2` and certificate v2
contracts bind the Casimir semantic proposition and the observed Lean theorem
type as distinct identities. `casimir_semantic_to_lean_binding/v1` is the
review artifact joining those identities. It binds the exact source audit,
theorem declaration/proposition source, observed type, environment policy,
translation/assumption/units correspondence digests, review evidence, and
limitations. Only an integrity-valid `reviewed` artifact installed in the
server-owned binding catalog may satisfy preparation; the production catalog
currently contains no such artifact. This prevents source proximity, equal
names, or a caller-created hash from being treated as semantic equivalence.

The v2 request also binds an exact sandbox-executor capability and requires
external OS memory/process limits, wall timeout, output ceiling, plus
filesystem/network isolation. Direct host-workstation execution is false by
contract. The v2 certificate repeats the executor capability, sandbox policy
and attestation hashes, worker identity, memory/process/timeout/output
ceilings, peak memory/output, and OOM/timeout/output-limit results. A passing
certificate is invalid if it ran on the workstation, lacks any required
isolation, exceeded a ceiling, was OOM-killed, timed out, or exceeded its
output limit.

The corresponding
`casimir_formal_sandbox_executor_capability/v1` contract records the external
worker target, platform, architecture, policy and attestation hashes, every
required OS isolation control, and hard resource ceilings. The v2 sealed
execution entry additionally binds the exact procedure, request, source/import
bundle, non-path `casimir-formal-bundle:*` resolver reference, and capability.
The immutable catalog factory clones and validates entries at installation,
rejects duplicate entry IDs and duplicate procedure/hash bindings, withholds
the entire catalog on any issue, exposes only redacted identity/integrity
inspection, and returns a newly cloned exact developer-scoped match after
rehashing the stored sealed input. This is a server-composition boundary, not
a caller enrollment API or a trust signature.
The catalog accepts a nonempty entry only with an integrity-valid
`casimir_formal_execution_enrollment/v2` record and a trusted registration
verifier. That record binds the exact specification, Lean and C artifacts,
registered generator revision/invocation/receipt, theorem and observed type,
reviewed semantic binding, graph snapshot, environment, bundle, executor,
procedure, and request. The enrollment grants no execution or scientific
authority; it prevents any one of those lineages from being omitted when a
trusted server later installs an entry.
Preparation recomputes the procedure's Master Problem and derivation-program
hashes and requires one exact semantic claim/badge/graph-snapshot lineage.
Plan requires the matching
external executor resolver; start requires the exact plan plus a single-use
trusted confirmation and delegates only through that executor interface. The
v2 service contains no host process, shell, filesystem, or local Lean runner.
No generator registration, trusted enrollment verifier, production entry, or
executor resolver is installed, so a model- or caller-created capability
cannot unlock replay.
The shared runtime-approval bootstrap now composes its Ed25519 receipt verifier
and durable PostgreSQL replay ledger into the formal, independent numerical,
and runtime-canary rails. Formal and independent numerical prepared requests,
plans, jobs, and completed certificates additionally use lane-isolated
PostgreSQL lifecycle stores. A persisted running job becomes a typed
restart-interruption failure when a new process reads it; it is never projected
as indefinitely live. This removes production wiring and soft-lock
contradictions
without making any rail executable by itself: missing catalog and executor
registrations remain explicit blockers. Formal artifact-family inspection
reports the catalog resolver, redacted catalog inspector, catalog entry count,
external-executor resolver, receipt verifier, and durable ledger in a
non-terminal readiness packet. A configured-but-empty or invalid catalog stays
blocked, while exact entry and executor resolution occurs only in preparation
and plan.
The production registry bootstrap is transactional in the fail-closed
direction: it clears the prior formal catalog/executor composition before
validating a replacement, preflights each distinct executor ID/hash without
executing a job, and installs only when every enrollment, catalog binding, and
executor capability succeeds. A failed replacement cannot silently retain the
old execution authority.

A repository-owned, no-import Lean 4.31 runtime self-test is available only in
the test process. It pins the exact Lean executable and source bytes and checks
the kernel/replay plumbing. It is deliberately absent from the scientific
catalog and carries explicit false authority for semantic binding,
theorem-type identity, graph binding, theory-experiment closure, and
certificate promotion.

## Independent numerical certificate

The request/certificate pair in
`shared/contracts/casimir-independent-numerical-verification.v1.ts` requires:

- an exact nested Casimir Spec identity and frozen-case request summary in the
  certificate;
- two distinct lineage IDs;
- distinct implementation source hashes, build-manifest hashes, and producer
  receipts;
- frozen inputs, mesh, initial conditions, boundary conditions, and
  observables;
- a hash-bound comparison policy with exact per-observable tolerances;
- pinned primary and independent environments;
- two outer-observed, byte-identical replays per implementation; and
- refinement and convergence evidence.

A passing certificate may set only:

```text
frozenNumericalComparisonChecked = true
independentImplementationCompared = true
```

The following remain false:

```text
validatesSemanticIntent
validatesTheory
validatesGeneratedCode
validatesNumericalImplementation
validatesEmpiricalClaim
validatesPhysicalMechanism
formalPropositionChecked
assistantAnswer
terminalEligible
promotionAllowed
```

This distinction is deliberate. Passing a finite frozen comparison is useful
numerical evidence; it is not universal implementation correctness and is not
physical truth.

Developer agents access this lifecycle through:

```text
theory-independent-numerical-verifier.prepare_request
theory-independent-numerical-verifier.plan
theory-independent-numerical-verifier.start
theory-independent-numerical-verifier.read_result
```

The first step accepts an opaque entry id and exact procedure ID/hash selectors.
Those strings do not establish authority: an integrity-valid procedure payload
must first re-enter inside a same-turn authoritative procedure observation.
The exact procedure must then match a trusted server-owned enrollment. The
default deployment fails closed with
`numerical_execution_catalog_unconfigured`; request, policy, source, build,
sandbox, and executable paths cannot be supplied as caller authority.

The immutable enrollment binds the complete sealed input to the procedure,
Lanyon repository/commit/selected source tree, persistent bundle bytes,
platform/architecture, and an attested sandbox-executor capability. A
successful preparation stores an owner-bound sealed packet behind a random
prepared id. Plan retrieves that packet, rehashes the harness, both
implementation sources, both build manifests, and both executables, and
requires the exact sandbox capability. Start retrieves the exact stored plan,
revalidates the sandbox capability, and requires a signed runtime confirmation
receipt consumed through a shared atomic replay ledger.
The outer service derives replay identity, lineage independence, tolerance and
convergence outcomes, certificate status, and authority fields instead of
accepting those judgments from the harness.

The gateway observations now carry exact continuation affordances without
executing them: successful plan to confirmation-gated start, confirmed start
to result read, and running result to the next `poll_attempt`. Completed,
failed, blocked, and confirmation-needed observations expose no executable
start or poll shortcut. Approval credentials are never copied into an
affordance.

The first retained certificate is
`docs/research/casimir-advection-diffusion-numerical-certificate.v1.json`.
For the frozen periodic 1D case, the Lanyon-generated kernel plus
Casimir-authored finite-volume driver was compared with a separately authored
analytic solution evaluator at 32, 64, and 128 cells. The analytic lane is an
independent reference implementation, not a second numerical solver. Both
lanes replayed byte-identically twice. The finest L2 error was
`0.0006153141461445303`, the relative error was
`0.0006062751728316276`, and the observed order was
`0.7661416833841534`, satisfying the frozen `0.001` absolute/relative
tolerances and `0.7` minimum order.

This does not establish that upstream ships a complete runnable solver: the
pinned upstream C file has a no-op `main`, and the simulation driver is
Casimir-owned. It also does not establish general implementation correctness,
theory truth, empirical validation, or physical validation.

The production enrollment catalog remains empty, and no persistent release
bundle or attested sandbox executor is installed. The PostgreSQL replay-ledger
backend is implemented and composed into every confirmation-gated theory rail
when the trusted key registry is present, but it provides cross-process
single-use authority only when all workers share PostgreSQL; the local pg-mem
snapshot is single-process restart recovery.
The PostgreSQL job-state backend is composed independently of trusted-key
presence, so lifecycle evidence remains durable even while execution authority
is fail-closed.

The source adapter recognizes nine pinned upstream cases, but source
eligibility is not numerical-backend eligibility. The only registered Casimir
independent numerical backend is presently
`advection_diffusion_full_1d`. Procedures selecting the other eight source
cases report `numerical_fixture_unregistered` before numerical planning.

The read-only `theory-experiment-procedure.evaluate_closure` capability retains
valid failed numerical certificates as negative evidence while allowing only a
passed certificate that both binds the exact procedure lineage and re-enters as
an exact current-turn payload to satisfy numerical closure. A digest retained
inside the procedure is only a reference. Its resulting candidate preference
is candidate-scoped evidence-coverage ordering under a frozen policy, never a
truth probability.

## Benchmark boundary

These contracts may be developed before the benchmark is frozen because they
do not inspect, normalize, tune against, or score benchmark cases. Source
parser/normalizer development and any benchmark-driven adapter tuning remain
closed until the benchmark policy, case pack, custodian receipt, and external
timestamp commitment satisfy the freeze-readiness gate.
