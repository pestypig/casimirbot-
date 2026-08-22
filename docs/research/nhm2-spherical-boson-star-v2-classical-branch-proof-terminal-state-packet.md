# NHM2 Spherical Boson-Star v2 Classical Branch Proof and Terminal-State Packet

Status: **ACTIVE PLANNING/IMPLEMENTATION GATE; no branch execution authorized by
this packet alone**

Program gate: **G2 — classical branch proof and terminal state**

Workstream: frozen four-grid classical branch and proof closure

Capability or component: N=64/96/128/256 full solves, branch proofs, and the
terminal N=256 state receipt

Current maturity: the frozen N=64 core has authenticated numerical `GO`; no
integrated four-grid branch solver, proof receipt set, or terminal state exists

Target maturity: one authenticated, no-retune four-grid branch result with every
required proof and a content-addressed terminal N=256 state, or one exact first
`FAIL/BLOCKED` disposition

Required frozen inputs:

- v3 frozen-core result receipt self-hash
  `abcb60bb1a613d193196b4b3b6196dc75f465310fdd716bdfcd3ddefaf5ce359`;
- v3 result raw SHA-256
  `55ba4583a1b82da24102107278d3c81c384dbbdf2a5bc7bbeb783f071fe75738`
  / 17,142 bytes;
- projected N=64 comparison SHA-256
  `f766cef182304361e6cb80d9a184a47e56db44c06470ba3984fc60b64c0f6151`;
- [`shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts`](../../shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts);
- [`shared/contracts/nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi.v1.ts`](../../shared/contracts/nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi.v1.ts);
- the frozen candidate, grid, initializer, spectral, convergence, origin/tail,
  no-fold, positivity, and no-retune definitions referenced by those contracts.

Required evidence:

1. A separately preregistered integrated solver/runtime packet with exact source,
   dependency, executable, runtime, and input byte bindings.
2. Independent full solves at N=64, 96, 128, and 256 under the frozen amplitude
   continuation and first-failure rules; coarse-grid interpolation remains
   comparison-only and is never a fine-grid predictor.
3. Exact cross-grid convergence receipts for all three adjacent pairs.
4. Executed vacuum-continuation, no-fold/orientation, continuum-positivity,
   origin-remainder, and tail-remainder proofs under authenticated proof
   runtimes.
5. Residual re-evaluation/replay and exact no-retune chronology.
6. A content-addressed terminal N=256 state receipt binding every preceding
   result and retaining all downstream authority locks false.
7. Independent audit plus required math, WARP, and Casimir verification.

Stop/fail criteria:

- any frozen input, source, runtime, or receipt binding mismatch;
- first numerical or proof failure at any amplitude/grid;
- any use of a coarse-grid state as a fine-grid initializer;
- any tolerance, grid, candidate, continuation, proof, or failure-rule change
  after observing a result;
- missing proof issuer/runtime, non-total receipt, or inability to authenticate
  the terminal state;
- any downstream geometry/state, lane, lamp, or physical promotion.

Explicit non-goals:

- joint semiclassical geometry/state acceptance;
- SI-v2 or metric-demand execution;
- materialization or publication of either 68-file lane;
- replay/pair/lamp authority;
- physical viability, propulsion, transport, launch, or empirical claims.

Downstream gate unlocked: **G3 — accepted joint geometry and quantum state**, but
only after the complete authenticated G2 evidence set passes.

## Activation evidence

The G1A-R1 result is a bounded frozen-core numerical decision, not candidate
admission. Corrected primary and immutable replay-v2 each reached `GO` in seven
full Newton updates with alpha exponent zero at every accepted step. Their
internal MPFR state/residual hashes differ because their operation orders are
source-disjoint, while their preregistered 129-word projected binary64
comparison wires and SHA-256 are exactly identical.

The receipt is independently self-rehashed and records:

- decision `GO` with reason
  `corrected_primary_and_immutable_replay_v2_agree`;
- `sourceDisjointAgreement=true`;
- `runtimeDisjointIndependentReplay=false` with the shared MPFR/GMP-lineage
  blocker;
- retry and retune false;
- candidate, execution, output, replay, diagnostic-pass, Theory Graph,
  physical, propulsion, and transport authority false.

Post-result verification:

- v2+v3 focused implementation/receipt suites: 42/42 PASS;
- math-stage validation: 318 entries, PASS;
- required WARP battery: 18/18 files and 179/179 tests PASS;
- public adapter `repo-convergence`: PASS/GREEN, trace
  `adapter:2172522d-15b5-421d-8c36-ddc33a8f098c`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

The first public `--ci` transport attempt returned HTTP 500 before producing a
verdict or certificate. The explicit public `repo-convergence` request above
returned the auditable PASS certificate; no failed physics constraint was
suppressed or reclassified.

## Next authorized planning action

The required read-only dependency and implementability audit is recorded at
[`nhm2-spherical-boson-star-v2-g2-closure-audit.md`](./nhm2-spherical-boson-star-v2-g2-closure-audit.md).
It finds that execution is first blocked by the 44 null vacuum-proof choices and
the absent no-fold/continuum-positivity definitions, before the separate
integrated-solver and proof-runtime/issuer gaps.

The next authorized work is the audit's **G2-D exact proof-definition
successor**. This packet still does not authorize a branch run. Before any
execution, the successor sequence must freeze the complete mathematical,
solver, proof/runtime source, exact input construction, chronology, receipt,
and one-shot decision closure.

The first bounded G2-D derivation is recorded in
[`nhm2-spherical-boson-star-v2-g2-d-desingularized-operator-proposal.md`](./nhm2-spherical-boson-star-v2-g2-d-desingularized-operator-proposal.md).
It derives the exact λ-continuous solved operator, unused-constraint replay row,
and tangent-observable conversions from the frozen BVP. It is deliberately
unsealed and unlocks no execution. Its next explicit blocker is the unique
packed Banach-space/core-tail formulation.

Checkpoint verification for that proposal:

- 2,000 independent MP100 substitution probes against the frozen BVP rows:
  PASS, maximum normalized disagreement approximately `1.12e-92`;
- math-stage validation: 318 entries, PASS;
- required WARP battery: 18/18 files and 179/179 tests, PASS;
- public adapter `repo-convergence`: PASS/GREEN, trace
  `adapter:105c0118-c071-4ab0-94c9-32ff58803c53`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

These checks validate the recorded derivation and repository gate integrity;
they are not a vacuum proof, branch execution, or candidate result.

The follow-on packing proposal is
[`nhm2-spherical-boson-star-v2-g2-d-core-tail-packing-proposal.md`](./nhm2-spherical-boson-star-v2-g2-d-core-tail-packing-proposal.md).
It fixes three core correction functions plus five parameter-function blocks,
core/tail maps, a derived flat-factor transseries tail synthesis, exact joins,
parameter-polynomial chronology, `chi=17/16` norm, unit component weights, and
canonical 25,509-record finite Newton codec. It also derives the mandatory
uniform overlap gate `k>=1` and the exact Bianchi propagation identity. The
physical differential count is square at seven conditions for three
second-order fields plus the frequency eigenvalue; the domain decomposition is
equivalently five shooting coordinates and five independent joins. Its three
core rows now use one fixed regular Green realization with exact
power-series inverse multipliers; 2,000 independent Decimal(80) row
substitutions and exact rational multiplier checks through mode 63 passed. It
also replaces the invalid single-flat-quotient assumption with the
amplitude-normalized sector variable `zeta=d^2*B^2` and fixes the universal
endpoint-regular tail-sector operator. Exact rational checks of that operator
and its first 19 asymptotic
sector diagonals passed. Because `(lambda,nu,m,c)` recursively determine the
decaying tail, those sectors are derived proof data rather than Newton
unknowns. It remains unsealed pending the tail convergence majorant and core
finite/infinite Fredholm audit; no run is authorized.

Checkpoint verification for the current packing proposal:

- exact rational core Green multiplier checks through mode 63: PASS;
- exact shifted-Chebyshev forward formula and inverse recurrence through mode
  64: PASS;
- 2,000 independent Decimal(80) substitutions of the rearranged core rows
  against the desingularized solved rows: PASS, maximum absolute disagreement
  `3.15e-78`;
- exact rational universal tail-sector operator checks: PASS;
- exact rational universal tail-sector identities through spatial mode 63 and
  asymptotic sector 64: PASS;
- authority-neutral boundary-recurrence battery: 13/13, PASS, including
  `C_0=1`, the `2*k^2*n` scalar diagonals, and `A_9/B_9` before `C_8`;
- math-stage validation: 318 entries, PASS;
- required WARP battery: 18/18 files and 179/179 tests, PASS;
- public adapter `repo-convergence`: PASS/GREEN, trace
  `adapter:44cda212-c8e3-4be4-a400-11e61b649b5c`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

These checks reject algebraic and repository-gate drift. They do not establish
tail convergence, a vacuum tube, a branch state, or any execution, lamp, or
physical authority.

The core finite/infinite successor is
[`nhm2-spherical-boson-star-v2-g2-d-core-finite-infinite-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-core-finite-infinite-audit.md).
It factors the fixed Green operators through an exact Hardy operator, proves
conservative `2^21/n^2` and `2^22/n^2` weighted omitted-mode envelopes for
`n>=256`, partitions spatial, parameter, and overlap tails without implicit
zeros, fixes the eight-family square residual ordering, and requires an
injective finite-plus-identity proof preconditioner before any radii
calculation. It is authority-neutral and authorizes no branch or proof
execution.

The subsequent exact tail-analyticity audit is
[`nhm2-spherical-boson-star-v2-g2-d-tail-analyticity-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-analyticity-audit.md).
It finds that the proposed same-space infinite Taylor sectors cannot support a
valid radii proof: `eta^4*K''` is unbounded in the declared weighted Taylor
norm, and the frozen scalar recurrence has irregular-singular factorial
large-order growth. The physical Schwarzschild/flat factors, finite
`C_0,...,C_8` jet, five joins, and core audit survive. G2-D is now blocked at the
smallest honest repair,
`tailWeightedVolterraRemainderRepresentationAndDirectedJoinDefinition`, which
must prove a weighted functional remainder and directed joins before any proof
implementation or branch execution.

The replacement architecture is now recorded in
[`nhm2-spherical-boson-star-v2-g2-d-tail-volterra-remainder-proposal.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-volterra-remainder-proposal.md).
It keeps the frozen finite jet and physical flat factors, replaces the divergent
radial series with exact scalar and metric half-line Volterra kernels, fixes a
weighted radial graph norm and function-valued parameter algebra, and maps the
same certified ball to all six join outputs. The proposal now also fixes closed
metric/scalar kernel constants, one canonical internal tail contraction, and
implicit first/second join derivatives. It keeps the internal tail radius
separate from the full proof's frozen 73-radius scan. A pre-implementation
audit then identified one smaller honest prerequisite: the normalized
nonlinear source-envelope calculus and exact assembler input manifest are not
yet frozen. The proposal now names the nine missing rules explicitly. Directed
assembler implementation follows only after that calculus is independently
audited; the proposal is unsealed and authorizes no execution.

The first unsealed calculus preregistration is
[`nhm2-spherical-boson-star-v2-g2-d-tail-source-envelope-calculus.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-source-envelope-calculus.md).
It freezes the projected parameter/cap models, analytic remainders, radial
cover, factored source DAG, structural `z^10` quotient, graph-ball injection,
overflow accounting, and canonical manifest. Its primary self-audit found and
repaired an initially ungraded endpoint residual, an incorrect flat-moment
maximizer, a numeric-zero cancellation overclaim, and the frozen recurrence
chronology before any source implementation. Independent audit remains absent.

A calculation-only Python reference now implements the directed interval,
projected degree-32 model, order-512 analytic primitives, and closed kernel
constants. Focused tests pass 9/9 and a full order-512 exponential containment
probe passes, but the single operation takes 96.19 seconds. The reference is
therefore not production-feasible for 1024 cells. A direct native MPFR
calculation base now covers the same six analytic primitives and four closed
kernel outputs, restores the ambient MPFR exponent/flag context, builds with
x64 MSVC `/W4 /WX`, and passes 14/14 focused native tests. The native source also
implements the complete seven-coordinate/28-Hessian-slot forward jet, the three
exact factored source expressions, and exact evaluation of the frozen 3,053-term
endpoint quotient table. Independent exact oracles enclose the source values,
their first and second derivatives, and the bridge quotient. The first
full-source probe exposed and then closed a caller-stack overflow by moving jet
storage to deep-copy-owned heap state. One native single-exp observation took
approximately 0.70 seconds. The native base traverses the complete fixed radial
cover for a value-source fixture but still lacks full derivative/parameter
assembly over it, the canonical manifest, authenticated runtime issuer, and an
independent full audit; it is not a proof assembler and authorizes no execution.

The endpoint pre-implementation audit is
[`nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-algebra-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-endpoint-algebra-audit.md).
It identified the exact definition gap between the physical recurrence, which
excludes `kappa=0`, and the descaled Volterra endpoint, which includes `s=0`.
The descaled endpoint-algebra successor and exact generator are now locally
frozen. They define `Q[s,m,k,k^-1]`, derive `C_0,...,C_8`, prove literal empty
raw orders zero through nine, and pin the order-ten quotient with semantic
SHA-256
`c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7`
/ 99,867 canonical bytes. The 10/10 focused exact suite passes, including a
deterministic 3,053-term C++ table projection. Native MPFR now consumes that
table, encloses the exact bridge quotient, and traverses all 255 regular cells
plus the endpoint cap and checks one composed physical parameter/source point
in its 14/14 calculation-only suite. Complete physical
parameter assembly over that cover remains absent. The next bounded task is
that assembly under the exact parameter/source chart frozen in
[`nhm2-spherical-boson-star-v2-g2-d-tail-parameter-source-chart-audit.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-parameter-source-chart-audit.md),
followed by a fresh independent exact-byte and mathematical audit before any
proof-manifest issuance.

The all-cover implementation has one prior causal input boundary. Vacuum ABI
v1 deliberately leaves its global ordered input-binding inventory and exact
binding count null, and the repository contains no authenticated per-cell
`parameterCenter` bytes. The additive tail-specific input successor
[`nhm2-spherical-boson-star-v2-tail-source-assembler-input.v1.ts`](../../shared/contracts/nhm2-spherical-boson-star-v2-tail-source-assembler-input.v1.ts)
now removes the local schema ambiguity. It derives `lambda` solely from the
cell ordinal and admits exactly the ordered `nu,m,c` models, each with 33
directed coefficients and one residual bound; all physical derived quantities
remain non-inputs. Its semantic seal is
`c90de09dacfb6ed7507dcc1a56f19b28a7bc4dcac4996c9da7066a47e178f9e7`
/ 10,136 canonical bytes, and its focused suite passes 8/8. It still has zero
input instances and grants no execution authority. Consequently, repeating the
current one-point fixture on all 255 regular cells would remain synthetic and
cannot be reported as the physical parameter cover. The next implementation
packet is the parameter-center producer and its 1,024-cell authenticated output
chronology; only then may the native all-cover assembler consume those bytes.

The exact finite-transform prerequisite is now frozen in
[`nhm2-spherical-boson-star-v2-g2-d-parameter-center-dct-i-definition.md`](./nhm2-spherical-boson-star-v2-g2-d-parameter-center-dct-i-definition.md).
It fixes the 33-node physical/mathematical chronology, an algebraic MPFR256
cosine construction, the literal DCT-I normalization and accumulation order,
and the separate provenance required for each weighted degree-32 residual. An
authority-neutral Python implementation and focused oracle now pass 12/12,
including high-precision cosine containment, constant and Chebyshev-basis
recovery, physical-order reversal, hostile public ingress, MPFR context
restoration, and false-authority locks. The public route remains blocked and
the calculation receipt cannot emit the sealed tail-input wire. No point-solve
observation, residual proof, parameter-center instance, producer runtime,
persistence receipt, or 1,024-cell output exists. The next causal component is
therefore the authenticated serial point-solve/residual producer rather than a
synthetic repetition of the transform fixture.

Checkpoint verification for the core audit, tail counter-audit, and Volterra
replacement:

- exact rational shifted-Chebyshev division and Hardy columns through mode 512:
  PASS;
- exact finite Hardy operator norm maximum: one at mode zero, PASS;
- symbolic `n>=33` omitted-mode slack identities and conservative Green
  envelopes `1,115,136<2^21`, `2,230,272<2^22`: PASS;
- four finite/spatial/parameter/overlap boundary classifications and the square
  25,509-record count: PASS;
- exact rational frozen scalar recurrence at the admissible audit point through
  `C_100`: every `2*kappa^2*n` diagonal and reconstructed KG row PASS; canonical
  coefficient-wire SHA-256
  `8fd044dbf1b46518b60e399b76e319177ed9eeef2f63a1613ff65e3da3511621`
  / 51,561 bytes;
- symbolic metric half-line Green differential identity and scalar
  flat-factor substitution identity: PASS;
- exact symbolic factored `Delta_R_H/D` and `Delta_R_V1/D` identities: PASS;
- projected Chebyshev model multiplication theorem against 50 deterministic
  exact-rational finite-plus-tail fixtures: PASS;
- Python directed reference algebra: 9/9 focused tests, PASS;
- native x64 MPFR analytic/kernel/source-DAG/endpoint calculation base: 14/14 focused
  tests, PASS, including independent enclosure, exact symbolic source/jet
  comparison, frozen quotient-table consumption, fixed regular-cover traversal,
  stack-overflow repair, and MPFR context restoration;
- flat-moment stationary point and conservative weighted metric-product
  constant: PASS;
- math-stage validation: 318 entries, PASS;
- required WARP battery: 18/18 files and 179/179 tests, PASS;
- public adapter `repo-convergence`: PASS/GREEN, recorded checkpoint trace
  `adapter:1e6c15ea-3d65-46aa-9022-1d28b3471e75`, run `2423`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

These checks validate the algebraic correction and repository gate integrity.
They are not a tail proof, vacuum tube, branch execution, candidate admission,
lamp, or physical claim.

Latest exact DCT-I implementation checkpoint:

- authority-neutral parameter-center DCT-I focused suite: 12/12, PASS;
- math-stage validation: 318 entries, PASS;
- root-to-leaf manifest validation: PASS;
- required WARP battery: 18/18 files and 179/179 tests, PASS;
- public adapter `repo-convergence`: PASS/GREEN, trace
  `adapter:c1ff86c9-dbcc-4ff7-8ff3-e98af09a2ddf`, run `2426`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

This checkpoint validates the transform definition, implementation chronology,
and repository gates only. It does not authenticate any point solve or residual
bound and does not authorize the 1,024-cell producer.

Latest exact finite Green and lambda-zero origin checkpoints:

- exact shifted-Chebyshev `J_1/q` and `J_2/q` oracle: 10/10, PASS;
- exact lambda-zero origin representative/contraction oracle: 10/10, PASS;
- finite Green source SHA-256
  `d3f1241ec871603fca917e3a521a5122c822eeb101e32f2a087128b179ee9692`,
  10,349 bytes;
- lambda-zero origin source SHA-256
  `ca71d52240be921399f6fbb27201d2bd85807f1e56a0c3468c5863cc8057f894`,
  11,912 bytes.

The dependency audit places the lambda-zero product before the positive-lambda
point solver. The vacuum ABI still has null definitions for the limiting
ground state, simple kernel, bifurcation transversality, and first-tube
containment. The exact origin oracle closes only the rational origin recurrence,
finite defect, `Y/Z0/Z1`, frozen-radius evaluation, and propagation inequality.
It intentionally leaves radius selection unavailable until the directed
interval envelope base is implemented. No lambda-zero proof product, point
solve, vacuum tube, candidate execution, or authority follows from these tests.

The lambda-zero definition audit is recorded in
[`nhm2-spherical-boson-star-v2-g2-d-lambda-zero-closure-proposal.md`](./nhm2-spherical-boson-star-v2-g2-d-lambda-zero-closure-proposal.md).
It separates fixed-potential spectral simplicity from invertibility of the
normalized coupled Schrödinger–Poisson Jacobian and freezes neither by
implication. The proposal also specifies the adjoint transversality pairing and
the required first-tube embedding boundary. It is review material, not a
sealed successor or proof receipt.

Repository gate checkpoint after these proof-semantic additions:

- math-stage validation: 318 entries, PASS;
- root-to-leaf manifest validation: PASS;
- required WARP battery: 18/18 files and 179/179 tests, PASS;
- public adapter `repo-convergence`: PASS/GREEN, trace
  `adapter:5dab3e22-bb73-49ae-be7e-d73a051e4dd5`, run `2427`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

This adapter PASS certifies repository gate integrity only. It does not certify
the proposed lambda-zero semantics, produce a lambda-zero instance, or alter
any candidate, lamp, or physical authority.

The additive lambda-zero definition successor is now sealed at

```text
shared/contracts/
  nhm2-spherical-boson-star-v2-lambda-zero-proof-definition.v1.ts
```

with semantic SHA-256
`bb8dc226a11d3189357f75da67b8ea7b189c09b9b0091fc42aabac4da66f629f`,
plain canonical SHA-256
`39d71f698d1d8bbe0fa4fca6e3b1bd4d61f0f55a696555f771f00fdc0c06b23b`,
and 8,157 canonical bytes. Final raw source SHA-256 is
`ee617cf1c48d25536e1faf11f9cd2bd75fc25deb2b102fec547243c26e928de7`
/ 20,476 bytes; focused predecessor/successor aggregate is 41/41 PASS and
strict TypeScript/Prettier pass.

The receipt self-redteam repaired a pre-implementation ambiguity by freezing
separate exact unsigned and full root key tuples before the final seal. The
successor defines, but does not instantiate, the limiting ground-state product,
fixed-potential simple kernel, normalized coupled-Jacobian inverse,
transversality, tangent, and first-tube containment. All instance bindings
remain null and every authority lock remains false.

The first numerical component under that sealed successor is now implemented
as an authority-neutral exact-rational finite-prefix oracle:

```text
tools/nhm2-spherical-boson-star-v2-branch-proof/
  newtonian_lambda_zero_coupled_jacobian_exact.py
```

It applies the fixed-potential spectral operator and the full normalized
coupled Schrödinger–Poisson Jacobian to prefixes of at most 513 even radial
power-series coefficients. Its independent test checks the exact symmetric
directional derivative of the nonlinear residual, all 65 finite basis columns,
the normalization and spectral rows, maximum-size deterministic evaluation,
hostile ingress, resource limits, dependency pins, and false authority locks.
The source SHA-256 is
`3e96aba583ed5b560dd257f9c6cfdd5e1741b487417f9bdc8acc09e06d4d0eb0`
/ 9,924 bytes; the test SHA-256 is
`9641d5fbafb5139eae421cc11dde0dcea8a80edd0abdce893f998817dcaea7c2`
/ 11,888 bytes. The new focused suite is 10/10 PASS, and the exact Green,
lambda-zero origin, and coupled-Jacobian aggregate is 30/30 PASS.

This closes only the exact finite-prefix action formula. Analytic tail columns,
a directed MPFR replay, a strict global approximate-inverse bound, simple
kernel and transversality receipts, first-tube containment, proof execution,
candidate execution, and every authority surface remain absent or false.

Current-tree verification after this finite-prefix addition:

- math-stage validation: 318 entries, PASS;
- root-to-leaf manifest validation: PASS;
- required WARP battery: 18/18 files and 179/179 tests, PASS;
- public adapter `repo-convergence`: PASS/GREEN, trace
  `adapter:71f0a200-9e3c-4da8-97a5-a6d5bd16d209`, run `2428`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

This gate result verifies repository constraint-pack integrity at this
checkpoint. It does not convert the exact finite-prefix calculation into the
missing global inverse proof or authorize any proof/candidate execution.

The source-disjoint directed MPFR256 calculation companion is now implemented
at:

```text
tools/nhm2-spherical-boson-star-v2-branch-proof/
  newtonian_lambda_zero_coupled_jacobian_directed.py
```

Its public route is zero-argument and deterministically blocked before any
profile ingress. The marker-gated synthetic seam uses literal RNDD/RNDU
interval operations, fixed increasing-shell and increasing-convolution order,
MPFR256 with the frozen exponent range, forbidden-flag checks, deterministic
operation/output hashes, and caller-context restoration. It encloses the exact
rational oracle for the focused non-dyadic fixtures and every tested finite
basis column. The directed source SHA-256 is
`0da8d669b640a23dd5a30ac9252982c64145fe8f181054525f9154f0f770a37e`
/ 18,660 bytes; its test SHA-256 is
`dfb5c7d4554be516c373b1baaad9fc0b1e6d9ed3d7fe23bb78d305415df95edf`
/ 12,604 bytes. The directed suite is 10/10 PASS; the exact Green, exact
origin, exact coupled action, and directed coupled aggregate is 40/40 PASS.

This is still a synthetic calculation over caller-owned exact fixtures using
the workstation's gmpy2 2.3.1 / MPFR 4.2.2 lineage. It does not bind an
accepted global profile, authenticate a proof runtime, provide analytic tail
columns or a global inverse bound, qualify as a runtime-disjoint replay, or
promote any proof/candidate/diagnostic/physical authority.

Current-tree verification after the directed MPFR companion:

- math-stage validation: 318 entries, PASS;
- root-to-leaf manifest validation: PASS;
- required WARP battery: 18/18 files and 179/179 tests, PASS;
- public adapter `repo-convergence`: PASS/GREEN, trace
  `adapter:0faaa9b1-e172-4571-9051-3856be227516`, run `2429`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

The local adapter server was stopped after the run. No proof or candidate
process remains in flight.

Latest directed lambda-zero origin checkpoint:

- directed MPFR256 origin representative, defect, envelope-base, and frozen
  radius calculation: 10/10, PASS;
- directed origin source SHA-256
  `47984b86b8974eff3779c61fff5af8f1621ebfa6acbb219bf44f7d21daea5357`
  / 25,269 bytes;
- directed origin test SHA-256
  `2132ea51bad428f31b3990703f1dca22ae58cc083aab7760aa4712b216074ee5`
  / 11,209 bytes;
- exact Green, exact and directed origin, and exact and directed coupled
  Jacobian focused aggregate: 50/50, PASS.

The implementation pins the exact origin recurrence and directed-proof
operator bytes, uses fixed MPFR256 RNDD/RNDU arithmetic, continues the
lower-triangular recurrence through coefficient 34, checks the separately
required geometric envelope base over coefficients 17 through 34, checks the
fixed `M=256`, `q=2^-12` propagation inequality, and selects the lowest valid
one of the 61 frozen radii. The public entry remains deterministically blocked
before profile ingress; only a private marker-gated synthetic seam was run.

This closes the calculation implementation of the previously absent directed
origin envelope base for exact synthetic fixtures. It does not authenticate
the limiting ground-state values `nu0` and `Vc`, bind an accepted origin
stream, establish the exterior or global inverse product, prove the simple
kernel or transversality, contain the first vacuum tube, execute a candidate,
or promote any authority.

Read-only legacy seed-producer audit after this checkpoint:

- `core_level_orchestrator.py` authenticates its dependencies but its public
  production route fails before any candidate numeric read because the fixed
  native MPFR, binary64, and permutation arenas remain unavailable;
- its separate continuation-composition blocker requires one authenticated
  private module instance to own both the core continuation and downstream
  consumer;
- `output_arrays.py` is a twenty-array diagnostic materializer with the same
  fixed-arena blockers and no execution authority;
- `primary_operand_publisher.py` is blocked before caller traversal because no
  server-owned publication-context issuer exists.

Those modules are useful implementation evidence for the historical seed
pipeline, but they do not produce the sealed lambda-zero ground-state product
or remove the next G2 proof blocker. No legacy producer, proof, candidate,
output, registry, or Casimir process was launched during this audit.

Preregistered lambda-zero global-root calculation checkpoint:

- attempt packet raw SHA-256
  `4c64d6111368e737318b5c1a4b05db767590e7a24f78f4242d8079b006a9b72b`
  / 6,172 bytes;
- producer source SHA-256
  `f370d563acfb7d1f1f967895f5789a5dfeba1760d418b34dd665abbef92132c6`
  / 23,629 bytes;
- focused test SHA-256
  `97194cc71c916aa45f19bf9d6ffd7d00c5e9001ffabe979269a05f9df3042e8d`
  / 10,026 bytes;
- isolated NumPy 2.3.2 / SciPy 1.16.1 static and synthetic suite: 11/11,
  PASS;
- existing exact/directed origin, coupled-Jacobian, and finite-Green aggregate:
  50/50, PASS in the separately disclosed user-site gmpy2 runtime;
- AST, UTF-8, no-tab, no-trailing-whitespace, and 88-column checks: PASS.

The producer freezes one SciPy collocation attempt on `[2^-12,32]`, a 513-point
initial Chebyshev–Lobatto mesh, a 16,385-node cap, exact-rational origin
recurrence through index 16, analytic ODE/boundary Jacobians, fixed finite-tail
rows, frozen tolerances and screens, exclusive output creation, complete
binary64 state words, and a length-delimited receipt self-hash. A mocked solver
failure test proves that the first failure is also exclusively persisted.

The one authorized command and previously absent output are frozen as:

```text
C:/Python313/python.exe -I -B \
  C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/\
casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/\
CasimirBot/tools/nhm2-spherical-boson-star-v2-branch-proof/\
newtonian_lambda_zero_global_root_primary.py \
  --execute-once \
  C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/\
casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/\
CasimirBot/artifacts/nhm2-spherical-boson-star-v2-g2/\
lambda-zero-global-root-primary-v1.json
```

This is an approximate-center calculation only. Its NumPy/SciPy transitive
native runtime is not claimed runtime-disjoint or proof-authenticated. Even a
passing receipt leaves ground-state acceptance, proof completion, candidate,
replay, lamp, physical, propulsion, and transport authority false. The result
may only enter the directed global-profile proof as a proposed center.

One-shot global-root calculation result:

- decision: `CALCULATION_CENTER_ONLY`;
- receipt self-hash
  `bc8269c95543a0507a1d261093e51ebb8f23199f8f406e22742fd191e4f39e9d`;
- raw receipt SHA-256
  `d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30`
  / 196,505 bytes;
- output:
  `artifacts/nhm2-spherical-boson-star-v2-g2/lambda-zero-global-root-primary-v1.json`;
- solver status 0, success true, 2,028 stored nodes;
- `Vc=-1.3417626706303016`, `nu=-0.692228684926542`;
- finite-radius `C_R=2.0622374579559954`,
  `kappa_R=1.176629665550331`, `sigma_R=0.7526648514266803`;
- maximum RMS residual `2.3262941156546646e-10`;
- independent uniform replay residual `3.0722375248063913e-10`;
- maximum boundary residual `3.944304526105059e-31`;
- every frozen ordered screen passed and every authority lock remained false.

An independent Node implementation recomputed the receipt's length-delimited
self-hash exactly, and an independent Python canonical round trip reproduced
all 196,505 bytes. The output path did not exist before execution and no second
attempt was made.

This result establishes only that the preregistered binary64 collocation
calculation found a plausible global center. The mass is still the finite-R
tail-row value, not an accepted full integral. The adaptive spline is not the
frozen core/tail proof representation. A new deterministic projection and the
complete directed origin/core/exterior/global-inverse proof must ingest these
exact receipt bytes and may reject them without retry or retune.

Current-tree repository verification after the one-shot center calculation:

- math report and math-stage validation: 318 entries, PASS;
- root-to-leaf manifest validation: PASS;
- required WARP battery: 18/18 files and 179/179 tests, PASS;
- public adapter `repo-convergence`: PASS/GREEN, trace
  `adapter:e5c066cc-dad0-43e4-b493-adc98cfd5c0e`, run `2430`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

The first CLI invocation correctly refused to certify without an explicit
adapter URL; the later explicit adapter request produced the verdict above.
The local adapter server was stopped and port 5050 was confirmed closed. This
repository certificate confirms constraint-pack integrity, not the existence
or acceptance of the calculated ground state.

Preregistered proof-center projection checkpoint:

- projection packet raw SHA-256
  `4d4bf6f13dccf10e39c146e085b1947d222d91d5785e99c101883c2e17ef6a86`
  / 4,011 bytes;
- projection source SHA-256
  `a859191d2989c3b1e03a96d1f7dd000a80e1425021da87e3ae3687cfff02f33b`
  / 15,771 bytes;
- focused test SHA-256
  `153a89a64b8fa0c1599b8bb63bfa268aaaa15bdced0553f19fb1c0758f1a006e`
  / 5,916 bytes;
- pre-execution DCT, recurrence, codec, binding, collision, hostile-ingress,
  and false-authority suite: 8/8, PASS.

The transform is fixed before consuming the real center: exact origin series
below `2^-12`, stored Hermite data through `x=32`, the already frozen
finite-row asymptotic extension above 32, 128 increasing compactified Lobatto
samples, one explicit DCT-I, and exact-positive-zero free tail corrections.
It performs no fit, filter, tail solve, tolerance change, or center update.

The sole output root is frozen as
`artifacts/nhm2-spherical-boson-star-v2-g2/lambda-zero-proof-center-v1`.
It must be absent before execution. A passing transform is only a proposed
directed-proof center and cannot establish a root or any authority.

One-shot proof-center projection result:

- decision: `PROPOSED_PROOF_CENTER_ONLY`;
- receipt self-hash
  `754db1dc77a39e4560607b393763d760ae8ebeb8fa4245143bb1280fc9745d14`;
- raw receipt SHA-256
  `08e0eb93a8f39f804bfa069c680bf85303ce4614aa16c3b2129c107d4527f330`
  / 1,841 bytes;
- output root:
  `artifacts/nhm2-spherical-boson-star-v2-g2/lambda-zero-proof-center-v1`;
- scalar payload SHA-256
  `a03f00ec97ccc41798f38092be05a77af248ae63097c83ff34ed17d39bfc0872`
  / 72 bytes;
- core `L2_u` coefficients SHA-256
  `1aa202f58afdb5e23a3e12e5f216ffcff08ad55343e8a8a2823497d826f8af69`
  / 1,024 bytes;
- core `L2_V` coefficients SHA-256
  `44543910df07444709f963b1711dcd66f165e97ce78602fc17eae49330f6eb83`
  / 1,024 bytes;
- tail `H` and `Q` coefficient payloads are each 256 exact-positive-zero bytes
  with SHA-256
  `5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1`;
- endpoint error `1.377539260651947e-14`;
- compactified node error `1.728373743169151e-14`;
- core/tail join error `1.207645095036014e-13`, below the preregistered
  `2^-28` screen;
- `noRetune=true`, tail corrections are positive zero, and every proof,
  ground-state, execution, replay, candidate, lamp, physical, propulsion, and
  transport authority lock remained false.

An independent Node implementation recomputed the receipt's
length-delimited self-hash over 1,758 unsigned canonical bytes exactly. A
separate filesystem rehash reproduced every ordered payload binding and the
raw source, proposal, and input-receipt bindings. The output root did not exist
before the sole execution and no retry or retune occurred.

This closes only deterministic projection into the frozen proof codec. It does
not authenticate the coefficient interpretation, establish an interval
enclosure, prove the core or exterior residual, establish a global inverse,
prove kernel simplicity or transversality, or accept the lambda-zero ground
state. The next bounded step is an independently implemented, resource-bounded
admission/reconstruction replay of these exact bytes before directed global
proof work consumes them.

Preregistered proof-center admission checkpoint:

- admission packet raw SHA-256
  `3cb018c09ccd121659bfec15eee577ee2966ee33070c320a520611bb1080f27f`
  / 3,983 bytes;
- independent admission source SHA-256
  `9e331b7870fe7d09d052488e8b5929154fe7808374ea2f4ea426caab6f7dafc8`
  / 21,630 bytes;
- focused test SHA-256
  `54c98d537e1ff96ae83ef24127633f34e4ef87edc76587e28f035bb8e053263d`
  / 7,523 bytes;
- fixed-byte, self-hash, inventory, codec, exact recurrence, independent
  Hermite, scalar-relation, reconstruction, hostile-f64, collision, static
  independence, and false-authority suite: 10/10, PASS;
- AST, UTF-8/LF, no-tab, no-trailing-whitespace, and 88-column checks: PASS.

The admission source imports neither the projection producer nor NumPy/SciPy.
Its direct scalar cubic-Hermite replay independently reproduced the primary
endpoint, node, and join diagnostic words exactly while retaining its own
screening authority. The sole persistent output remains absent before the
authorized command:

```text
C:/Python313/python.exe -I -B -W error \
  C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/\
casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/\
CasimirBot/tools/nhm2-spherical-boson-star-v2-branch-proof/\
newtonian_lambda_zero_proof_center_admission.py
```

The module is invoked through its zero-argument exported materializer from an
isolated Python command. The exact output is
`artifacts/nhm2-spherical-boson-star-v2-g2/lambda-zero-proof-center-admission-v1.json`.
It must be created exclusively once. A pass admits only these representation
bytes as a calculation input for directed proof; every proof, ground-state,
candidate, replay, lamp, physical, propulsion, and transport lock remains
false.

One-shot proof-center admission result:

- decision: `PROOF_CENTER_ADMITTED_AS_CALCULATION_INPUT_ONLY`;
- receipt self-hash
  `ff37f9eebebcaf49a5d3fd88d749c62071e33cc5f58b3af6f069700a88a530df`;
- raw receipt SHA-256
  `ff07124e88673fee04f9ca7e3e7c4b6545a1ee37fb70bda43a140e56bf582645`
  / 2,158 bytes;
- output:
  `artifacts/nhm2-spherical-boson-star-v2-g2/lambda-zero-proof-center-admission-v1.json`;
- independently replayed endpoint, node, and join diagnostics are respectively
  `3d0f04f922aacc80`, `3d1375b2b9627263`, and `3d40ff0000000000`;
- representation admission true, `noRetune=true`, primary diagnostics have no
  decision authority, and every authority lock remained false.

An independent Node implementation recomputed the length-delimited receipt
self-hash over 2,075 unsigned canonical bytes exactly. The receipt binds the
preregistered admission source
`9e331b7870fe7d09d052488e8b5929154fe7808374ea2f4ea426caab6f7dafc8`
/ 21,630 and the exact global-center, projection-receipt, and five-payload
bindings. The output was absent before execution and no retry or retune
occurred.

This removes the byte-admission and reconstruction blocker only. The center is
now eligible to be consumed, unchanged, by the directed global residual and
inverse enclosure. It is not an accepted ground state and does not close any
existence, kernel, transversality, tangent, vacuum-tube, branch, candidate, or
downstream authority gate.

Preregistered exact core-residual witness checkpoint:

- witness packet raw SHA-256
  `c7ae9a1e7421b39485c4982372d4b2bdc47f30bdffa04c8f725fe1428ae8a6e8`
  / 3,699 bytes;
- exact-rational witness source SHA-256
  `d6cad34823c943836f6fd77199be5bafceaa609ba8ada8f1cbdcf673392d92c6`
  / 17,073 bytes;
- focused test SHA-256
  `923630b56c577cabf601f5d88ec71904f0cd51ff5c8b9a224ba13cc897a870fd`
  / 7,226 bytes;
- exact codec, current dependency pins, receipt self-hash, Chebyshev derivative,
  chain-rule, arithmetic-budget, collision, false-authority, and real fixed-byte
  witness suite: 9/9, PASS;
- AST, UTF-8/LF, no-tab, no-trailing-whitespace, and 88-column checks: PASS.

The witness freezes `x=1/128`, `rho=1/129`, and `t=-127/129`. It decodes every
binary64 coefficient directly from its bits and decides the normalized
Schrödinger inequality using reduced integer fractions only. A separate SymPy
implementation based on symbolic Chebyshev polynomials, rather than the
witness derivative recurrence, reproduced the exact normalized-residual
fraction encoding with SHA-256
`0dedd3a913bd1e70c75b5b6fa74cbd7be2a358c518562f19f2dfd80fcd068706`.

The pre-materialization exact result is strict: normalized residual
approximately `1.2062499930716589e-8`, or approximately
`120.62499930716588` times the frozen `1e-10` rail. This observation cannot
change the point, threshold, center, formulas, or decision rule. The sole
authorized command is:

```text
C:/Python313/python.exe -I -B -W error \
  C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/\
casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/\
CasimirBot/tools/nhm2-spherical-boson-star-v2-branch-proof/\
newtonian_lambda_zero_core_residual_witness.py
```

The exact output
`artifacts/nhm2-spherical-boson-star-v2-g2/lambda-zero-core-residual-witness-v1.json`
must be absent before execution. A strict exact result terminates the frozen
G2 attempt at duty ordinal 1 without evaluating later duties or authorizing a
retry/retune. A non-strict result resumes the complete interval cover. Every
candidate, lamp, physical, propulsion, and transport lock remains false.

One-shot exact core-residual witness result:

- decision: `EXACT_CORE_DUTY_COUNTEREXAMPLE`;
- first failure:
  `core_normalized_schrodinger_point_counterexample`;
- first-failure duty ordinal: `1` (`core_normalized_schrodinger`);
- exact point: `x=1/128`, `rho=1/129`, `t=-127/129`;
- receipt self-hash
  `bde9c4ebfefade6354c8248295d5511cbc864dc23e79a7948ff976a91c2e188d`;
- raw receipt SHA-256
  `ad44b456c00c9644e73da27ebbe737f6fafbe99cac835e41519449c72479c691`
  / 6,922 bytes;
- output:
  `artifacts/nhm2-spherical-boson-star-v2-g2/lambda-zero-core-residual-witness-v1.json`;
- exact normalized-residual fraction encoding SHA-256
  `0dedd3a913bd1e70c75b5b6fa74cbd7be2a358c518562f19f2dfd80fcd068706`;
- approximate normalized residual `1.2062499930716589e-8`, approximately
  `120.62499930716588` times the exact `1/10^10` rail;
- strict exact margin positive;
- later duties evaluated: false;
- `noRetune=true`; every proof, ground-state, execution, replay, candidate,
  lamp, physical, propulsion, and transport authority lock remained false.

An independent Node implementation recomputed the receipt's length-delimited
self-hash over 6,839 unsigned canonical bytes exactly and reproduced the
normalized-residual fraction digest. The separate SymPy polynomial
implementation had already reproduced that exact fraction digest before the
exclusive write. The output was absent before execution and no retry, retune,
alternate point, alternate center, or later-duty evaluation occurred.

## Frozen G2 disposition

The admitted lambda-zero calculation center fails the first unresolved global
core duty under the frozen directed-proof threshold. Because the core modes are
not corrected by the exterior projected contraction and the policy makes the
first hard failure terminal, the current G2 attempt is `FAIL`. No N=64/96/128/
256 branch solve or terminal N=256 state is authorized from this center.

This result does not show that the continuum equations lack a ground state. It
shows that this binary64 collocation center and its frozen 128-mode proof
projection do not satisfy the preregistered `1e-10` core Schrödinger residual
rail. Any legitimate continuation toward a GO requires a separately versioned,
preregistered successor that improves the global-center/core representation or
changes a mathematical rail with independent justification. The failed center,
point, exact fraction, and receipt remain immutable and cannot be overwritten
or reclassified.

Final current-tree verification after the frozen G2 disposition:

- focused G2/proof aggregate: 78/78 PASS;
- WARP/GR battery: 18 files, 179/179 PASS;
- math registry validation: 318 entries, PASS;
- root-to-leaf audit: PASS;
- adapter run `2431`, trace
  `adapter:73af6480-5216-4c10-b1ae-df6269063ec4`;
- adapter verdict `PASS`, certificate status `GREEN`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

The adapter PASS certifies the repository constraint gate, not the failed
scientific residual. G2 remains `FAIL`; G2-R1 is the only active bounded
successor, and all candidate and downstream authority remains false.
