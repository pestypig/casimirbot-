# Casimir artifact generation and independent numerical evidence

Status: contract layer, pinned Lanyon snapshot admission, and the governed
independent numerical `plan`/`start`/`read_result` execution rail are
implemented. A release-pinned Casimir harness, Lanyon-kernel adapter, analytic
reference lane, and bounded frozen-case numerical certificate are also
implemented. Live artifact generation and broader numerical, empirical, or
physical validation remain downstream work.

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

## Formal replay production boundary

The formal contracts and blocked-preparation rail are implemented, but the
production theorem/type-digest, semantic-to-Lean binding, import-closure,
graph-snapshot, and Lean environment-policy catalog is intentionally empty.
The successful `prepare_request -> plan -> start` path therefore remains
unreachable. `prepare_request` can only report typed missing requirements; it
cannot emit a ready prepared-request ID until a reviewed server-owned catalog
is installed. Caller-supplied theorem names, imports, source paths, executable
paths, or hashes cannot fill that gap. An executable environment setting by
itself is not a catalog.

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
backend is implemented, but it provides cross-process single-use authority only
when all workers share PostgreSQL; the local pg-mem snapshot is single-process
restart recovery.

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
