# Lanyon GeneralRelativisticMaxwell comparison audit

Audit date: 2026-07-29

Audited repository:
`https://github.com/lanyonai/GeneralRelativisticMaxwell`

Pinned commit:
`b13da44d9e93e9f3c8dbdab48590fc2e08a8bff3`

Selected source-tree SHA-256:
`0ff049323382600bac8ef7a24d97fe07c19adad27d66634e7fb136be7a7ecb7c`

## What the artifact family demonstrates

The repository demonstrates a useful Lanyon artifact pattern: one structured
Racket specification is accompanied by a Lean formalization and C
implementation for each standard or divergence-cleaning GR-Maxwell case in
one, two, and three dimensions. Across the six Lean modules there are 156
named algebraic and local-consistency theorems.

That is a strong artifact-generation pattern for CasimirBot because it gives
the semantic, formal, and executable lineages distinct files that can be
hashed, inspected, compared, replayed, and tested independently.

## Exact theorem-strength finding

The theorem names are broader than several exact propositions. The 12
directional declarations named `xHyperbolicity`, `yHyperbolicity`, or
`zHyperbolicity` have the logical shape of an existential witness for an
expression already typed as `Real`. Their bodies select the expression itself.
They do not construct eigenvectors or prove diagonalizability, completeness of
a characteristic basis, strong/symmetric hyperbolicity, PDE well-posedness, or
numerical stability.

The remaining named families establish narrower properties such as:

- a declared wave-speed algebraic bound;
- zero diffusive flux at zero gradient;
- zero waves or fluctuations for equal states;
- a wave-sum/state-jump identity;
- a conditional flux-jump/fluctuation identity;
- constant-state reconstruction;
- affine-stencil reconstruction identities; and
- reconstruction reversal symmetry.

These are valuable local checks. They must retain those exact claim ceilings.

## Missing closure layers

The audited repository does not include:

- a published generator artifact, generator revision, invocation manifest, or
  generation receipt that can reproduce and bind the Racket/Lean/C outputs;
- a pinned Lean version, Mathlib revision, dependency lock, or import closure;
- a CI workflow or replay transcript;
- an observed theorem-type digest from a pinned Lean environment;
- a Casimir Spec to Lean semantic-equivalence review;
- a proof that the C binary64 implementation refines the Lean `Real` model;
- simulation drivers (the C `main` functions are placeholders);
- frozen boundary, timestep, CFL, convergence, or empirical-validation cases;
  or
- authority to claim that a complete GR-Maxwell system was solved in nature.

Two local environment candidates have been investigated without promoting
either into the production catalog:

- Mathlib `v4.32.1` at
  `520045ab14e26149ee970e2e617ca04b09bde5d6` repeatedly failed while
  loading different cached `.olean.private` files, even after a successful
  cache download and Mathlib build. That candidate was rejected for
  environment/cache integrity; this is not a proof failure.
- Mathlib `v4.31.0` at
  `fabf563a7c95a166b8d7b6efca11c8b4dc9d911f`, using Lean `v4.31.0`,
  successfully replayed the exact audited
  `gr_hyperbolic_maxwell_1d.lean` bytes twice with empty output and exit code
  zero. The second replay took 174.108 seconds. A subsequent larger-module
  campaign exhausted the 16 GiB workstation and crashed the host. The campaign
  was stopped, all surviving Lean processes were confirmed absent, and only
  the generated temporary `.lake` cache was removed.

The viable candidate currently binds:

```text
Mathlib commit              fabf563a7c95a166b8d7b6efca11c8b4dc9d911f
Mathlib Git tree            1b8fcc589cb2eeb1258449f844eed7924edc9a04
lean-toolchain SHA-256      efac0b94923b2d8b6840cd35be9177ad0fc5ab2332f4f4311c98712cee92fdee
lake-manifest SHA-256       6f226b135055dccff3e733abfc465a026f8ded1e6e235408365b54193186665d
Lean kernel binary SHA-256  9b216deb50d37c32c829d1efaaa5bafd5560417d382df35a815489e31a31593f
```

This is useful runtime evidence but the environment is rejected for production
use on this workstation. The full import source/object closure,
filesystem/process isolation, enforceable memory ceiling, theorem-type
observation, and axiom audit are not registered. A concurrent Lake invocation
also exposed a transient private-object read failure while the main replay was
active. Production admission therefore requires exclusive replay in an
external worker/container with a hard memory cap, typed resource-exhaustion
failure, and durable output capture. A cached workstation directory is not a
stable trust root.

## CasimirBot adoption

CasimirBot records this family in
`casimir_formal_artifact_family_audit/v1`. The generated audit contains all 18
source artifacts and all 156 theorem declarations, with exact source ranges,
declaration/proposition digests, property classes, claim ceilings, denied
promotions, and replay blockers.

The companion
`casimir_formal_artifact_generation_lineage_audit/v1` binds the complete,
non-truncated 32-entry recursive tree at the same commit. Its exact path scan
contains no generator, generate, prompt, or Lanyon-named artifact. It therefore
records `formal_generator_lineage_unavailable`, with null generator revision,
invocation-manifest, and generation-receipt identities. The README statement
that Lanyon generated the outputs is useful provenance context, but it is not
an inspectable generator or replay receipt and cannot satisfy execution
enrollment.

The server catalog resolves only the tuple of exact formal artifact ID, exact
formal-source SHA-256, and exact theorem name. Its output is evidence-only and
non-terminal. Formal preparation may use the audit to identify a proposition,
but still fails closed until the observed theorem type, semantic binding,
import closure, graph lineage, and pinned Lean environment are separately
registered.

`casimir_semantic_to_lean_binding/v1` and
`casimir_formal_verification_request/v2` keep the semantic proposition digest
separate from the observed Lean theorem-type digest. A reviewed binding also
requires a distinct review artifact and server registration. The production
binding catalog is intentionally empty, so a caller-supplied binding ID or
self-hash cannot remove this blocker.

## Execution-closure readiness

The provider-neutral v2 lifecycle is now implemented behind the developer-only
formal tool family:

```text
current-turn procedure
-> opaque sealed-execution catalog entry
-> external-only preflight
-> exact single-use runtime confirmation
-> external sandbox execution
-> v2 certificate validation
-> current-turn evidence re-entry
-> seven-stage closure evaluation
-> bounded Codex synthesis
```

Preparation recomputes the admitted procedure's Master Problem and
derivation-program hashes and requires one exact semantic
claim/specification/badge/graph-snapshot lineage. Closed schemas reject added
commands, executable paths, source paths, or self-attestations. The source
bundle is referenced only by a non-filesystem
`casimir-formal-bundle:*` identifier. A returned certificate must repeat the
exact theorem name/module/source, semantic and observed-type identities,
environment/import/axiom policy, candidate badges, graph and program lineage,
external executor attestation, and memory/process/timeout/output results.
Passing formal replay remains non-terminal evidence and does not gain
numerical, empirical, or physical authority.

The immutable server-catalog factory now validates cloned sealed entries,
rejects duplicate entry and procedure bindings, fails the entire catalog
closed on any issue, redacts resolver/source details from inspection, and
returns only a rehashed exact developer/procedure match as a fresh clone. This
closes the in-process catalog-authority seam without enrolling this audit.
Every nonempty catalog entry now also requires an integrity-valid
`casimir_formal_execution_enrollment/v2` record plus a trusted
server-composition verifier. That enrollment binds the procedure and request
to the exact specification, Lean source, C source, registered generator
revision/invocation/receipt, theorem, reviewed semantic binding, graph
snapshot, formal environment, source bundle, and external executor. Missing
generator lineage or a missing/rejecting enrollment verifier withholds the
entire entry. The enrollment itself remains non-executing and grants no formal,
numerical, empirical, scientific, or physical authority.

The default deployment still has no registered generator lineage, trusted
enrollment verifier, installed sealed execution entry, or external executor
resolver. The reviewed semantic-to-Lean binding, observed theorem type, full
import closure, graph snapshot, and environment record also remain production
requirements. Runtime-approval trust is now shared across the formal,
independent numerical, and runtime-canary rails at server bootstrap; an actual
approval host, trusted public-key registry, and shared durable PostgreSQL
deployment still must be configured. Local
2D/3D replay is explicitly disallowed by the 16 GiB crash result. Until those
external registrations are installed and the keyed
Ask/Realtime plus Casimir gates pass, the release claim remains “execution
closure implemented and fail-closed,” not “GR-Maxwell formally verified in
production.”

## Validation snapshot

The memory-bounded local validation on 2026-07-30 established:

- 70/70 aggregate source-audit, generation-lineage, enrollment,
  execution-catalog, runtime-readiness, shared approval-composition,
  replay-policy, formal-gateway, real Ed25519/PostgreSQL replay-integration,
  and execution-closure provider re-entry tests passed in one worker;
- the filtered Codex provider-normalization regression preserving the nested
  runtime-readiness packet passed;
- `npm run helix:ask:discipline:quick` passed;
- `npm run math:validate` accepted all 217 registered math-stage entries;
- `npm run validate:physics:root-leaf` passed; and
- the server build passed with the four already-known unrelated duplicate-key
  warnings.

The wider provider capability catalog is clean for this formal-tool addition.
Its remaining two failures concern the unrelated unclassified
`com.casimirbot.minecraft.container_contents.read` capability. A separate
DOI-routing expectation also remains unrelated. No keyed Ask/Realtime run,
production Lean replay, external numerical job, or server-backed Casimir
certificate was attempted after the workstation credential exposure and RAM
failure.

This preserves the intended division:

```text
Lanyon                 sibling artifact production
Lean                   proposition checking in a declared environment
Casimir Spec           semantic scientific identity
Theory Badge Graph     dependency, bridge, scale, and claim boundaries
numerical rail         floating-point and observable behavior
Codex                  tool orchestration and evidence-aware synthesis
Helix                  admission, provenance, and terminal eligibility
```

No one row substitutes for another.
