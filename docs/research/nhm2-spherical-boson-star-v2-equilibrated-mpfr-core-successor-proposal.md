# NHM2 Spherical Boson-Star v2 Equilibrated-MPFR Core Successor Proposal

Status: **VERSIONED_PROPOSAL authorized for one additive N=64 implementation
and first-result attempt by the persisted user goal; no other grid or retry is
authorized**.

Program gate: **G1-R2 — frozen-core numerical-policy review**

Workstream: frozen N=64 initializer-core failure disposition

Capability or component: a fresh, versioned N=64 core Newton policy

Current maturity: the predecessor is an authenticated diagnostic failure at
`armijo_schedule_exhausted_without_retry`

Target maturity: an independently reviewed successor policy that can be
implemented and executed only after separate explicit authorization

Required frozen inputs:

- candidate identity
  `nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1`;
- branch-selection semantic
  `221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa`
  / 41,280 canonical bytes;
- initializer/evaluator semantic
  `2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5`
  / 24,711 canonical bytes;
- predecessor failure receipt
  `cb9c36432486b4138ad01b8c8beebaca4eecb480fdd54a9a5f57a5030c4ed0cb`;
- predecessor state SHA-256
  `601af0c0de01be4bb5a2abc0dc743cae57397a50c9406720856ae396c7325e50`;
- predecessor residual SHA-256
  `13418bbf6f97925754b7dd999b1e70e2d2495d2efb4993f61ee98cf4be62dc17`.

Required evidence: exact successor source/runtime identities, frozen semantic
policy, primary execution trace, source-disjoint comparison, cleanup and
chronology evidence, and every stop/failure result described below

Stop/fail criteria: any semantic drift, hidden retry or retune, failure to meet
the unchanged raw gates, source-disjoint disagreement, incomplete cleanup, or
unavailable authenticated evidence

Explicit non-goals: changing the candidate, initializer, grid, equations,
tolerances, maximum updates, Armijo constant/schedule, projection rules, branch
continuation, candidate admission, either 68-file lane, any Theory Graph lamp,
or any physical/propulsion/transport authority

Downstream gate unlocked: the authorized fresh N=64 successor attempt; a
successful N=64 diagnostic still does not itself unlock G2 until its evidence
is authenticated and reviewed

## Immutable predecessor disposition

The predecessor remains failed permanently. This proposal is a new numerical
hypothesis and cannot reinterpret or overwrite that result.

The predecessor stopped after nine accepted updates and ten dense solves with:

- raw equation infinity norm `6.052214285290347e-11`;
- unchanged required raw equation threshold `2^-40`;
- last accepted scaled-step infinity norm `3.043268818520606e-17`;
- unchanged required scaled-step threshold `2^-42`;
- accepted alpha exponents `0,0,0,0,0,1,3,6,8`;
- 25 rejected trials in the final Armijo schedule.

## Diagnostic findings

All values in this section are exploratory observations of the immutable
predecessor. They do not constitute a successor execution.

### Residual localization

The failure is not a broad boundary or normalization inconsistency:

- amplitude residual: exactly zero;
- outer scalar and potential residuals: exactly zero;
- origin scalar derivative residual: `2.4000945856893283e-13`;
- origin potential derivative residual: `5.115920707898791e-13`;
- largest scalar interior residual: `6.052214285290347e-11`, row 1;
- largest potential interior residual: `4.361255800944264e-11`, row 66.

The dominant residual is concentrated in the first few interior collocation
rows, where the differentiation matrices have their largest cancellation and
scale disparity.

### Newton/Jacobian consistency

At the final accepted predecessor state:

- the binary64 Jacobian two-norm condition estimate is
  `1.373815107763967e14`;
- the refined linear-solve infinity defect for `J delta + F` is
  `9.926167350636332e-24`;
- the computed Newton merit slope is `-8.708546335789644e-21` versus the
  exact-Newton value `-8.708546335789252e-21`;
- a deterministic central directional-difference probe agrees with the analytic
  Jacobian at approximately `6.8e-13` relative L2 error at step `2^-12`.

This is evidence against an analytic-Jacobian or dense-solve implementation
defect. It is evidence for an ill-conditioned arithmetic boundary.

### Equilibration diagnostic

Using the same frozen final Jacobian without changing the equations:

- raw condition estimate: `1.373815107763967e14`;
- max-row-scaled estimate: `3.4647982172682014e3`;
- max-row-then-column-scaled estimate: `3.4382287561409094e3`.

The row-scale span is approximately `6.58006011279e12`. Deterministic
equilibration therefore removes about ten orders of numerical conditioning
penalty without changing the exact Newton step.

### Arithmetic-floor diagnostic

Reevaluating the exact same frozen binary64 state and exact same binary64
spectral-coefficient words with MPFR256 arithmetic gives:

- binary64 residual infinity norm: `6.052214285290347e-11`;
- MPFR256 same-input residual infinity norm: `3.4808400288918847e-10`;
- maximum per-row arithmetic discrepancy: `3.86038309253629e-10`.

The dominant potential row changes from `+3.7954306364440527e-11` in binary64
to `-3.4808400288918847e-10` under MPFR256 evaluation. The predecessor state is
therefore not a precision-independent zero of even the frozen discrete words.
Improving only the LU residual refinement cannot resolve an evaluation floor in
the residual, Jacobian, state update, merit, and Armijo comparison.

### Armijo and basin diagnosis

The raw residual infinity norm decreased from `0.6670082410961287` to
`6.052214285290347e-11` over the accepted chronology. The first five full
Newton steps were accepted, and the next four accepted exponents were
`1,3,6,8`. This is positive evidence that the initializer lies in a useful
local basin; it is not proof that a root exists.

At the failed tenth solve, trials at exponents 7 and 8 missed the Armijo bound
by only `4.5938013197421804e-24` and `1.441485875663155e-25` in merit. From
exponent 10 onward the represented residual norm and merit were effectively
stationary. Extending the same binary64 backtracking schedule is therefore not
a justified successor.

No current evidence establishes an absent solution basin. No alternate
initializer or parameter search is authorized by this proposal.

## Successor identity and exact semantic changes

Proposed numerical-policy identity:

`nhm2_spherical_boson_star_v2_frozen_core_newton/v2`

Only these numerical semantics change:

1. Every initial binary64 state word and spectral word is lifted exactly from
   its IEEE-754 binary64 bit pattern into MPFR256. No node or coefficient is
   regenerated.
2. State, residual, analytic Jacobian, row/column scales, dense solve,
   refinement, trial states, merit, Armijo right-hand side, convergence norms,
   and projection residual are evaluated at MPFR precision 256, round-to-nearest,
   with a frozen exponent range and forbidden-flag checks.
3. At the beginning of each Newton update, define the positive row scales
   `r_i = max_j(abs(J_ij))`. Reject an update if any `r_i` is zero or nonfinite.
4. Define `Jr_ij = J_ij / r_i` and `Fr_i = F_i / r_i`, then define positive
   column scales `c_j = max_i(abs(Jr_ij))`. Reject if any `c_j` is zero or
   nonfinite.
5. Solve `(Jr * diag(1/c)) y = -Fr` and recover
   `delta_j = y_j / c_j`. All trial evaluations in that update use the scales
   frozen at the update boundary. The unscaled equations remain authoritative.
6. Record both raw and equilibrated residual norms, condition diagnostics,
   MPFR ternaries/flags, and exact canonical MPFR state/residual encodings.

Everything else remains unchanged:

- N=64;
- candidate and initializer bytes;
- equations and analytic Jacobian formulas;
- maximum accepted updates;
- 25-trial alpha schedule `alpha=2^-k`;
- Armijo constant `2^-12` and no stationary exception;
- no retry and first failure terminal;
- raw equation infinity threshold `2^-40`;
- scaled-step infinity threshold `2^-42` for two consecutive accepted updates;
- projection definition and raw projection-residual threshold `2^-40`.

Equilibrated norms are diagnostic and solver-conditioning evidence only. They
cannot substitute for either unchanged raw convergence gate.

## Entry, success, and failure rules

Entry requires exact predecessor input bindings, a sealed v2 semantic policy,
server-observed source/dependency/toolchain/executable/runtime closure, no output
presence, and no mutable caller-selected precision, scale, tolerance, line
search, initializer, or grid input.

The only numerical `GO` is:

1. two consecutive accepted updates each satisfy the unchanged raw equation and
   scaled-step thresholds;
2. the frozen projection is then performed exactly once;
3. the projected raw residual satisfies `2^-40`;
4. primary and source-disjoint implementations each independently satisfy the
   unchanged MPFR raw gates and agree on the exact comparison encoding below;
5. all lifecycle, persistence, chronology, and cleanup evidence validates.

Any other terminal result is `FAIL` or `BLOCKED` under its typed cause. The
implementation must persist the first result before any proposal for a further
version is considered.

### Exact source-disjoint comparison encoding

The comparison encoding is fixed before implementation or execution:

1. Projected state values are converted exactly once from MPFR256 to IEEE-754
   binary64 under round-to-nearest/ties-to-even.
2. Each of the 129 values is encoded as its lowercase 16-character big-endian
   IEEE-754 word hex, in state order `u[0..63],V[0..63],nu`.
3. The comparison wire is RFC8785-compatible canonical JSON with exact keys
   `comparisonVersion,nodeCount,projectedStateF64BeWordHex`, no trailing LF,
   where `comparisonVersion` is
   `nhm2_spherical_boson_star_v2_frozen_core_newton_comparison/v2` and
   `nodeCount` is 64.
4. The comparison SHA-256 is
   `SHA256("nhm2-spherical-boson-star-v2/frozen-core-newton-comparison/v2\n" ||
u64le(wire_utf8_length) || wire_utf8)`.
5. Exact equality of both canonical wires and both domain-separated hashes is
   required. This does not replace either implementation's independent MPFR raw
   convergence and projection-residual gates.

## Falsifiers

This proposal is falsified for the frozen candidate if any of the following
occurs:

- the initial exact lifted state or spectral bindings differ;
- a zero/nonfinite scale or forbidden MPFR flag is observed;
- primary and source-disjoint traces disagree;
- Armijo exhausts, maximum updates are reached, or either unchanged raw gate
  remains unmet;
- projection fails or its unchanged raw residual gate remains unmet;
- equilibration does not reduce the recorded condition estimate materially;
- a lifecycle, persistence, cleanup, or provenance gate fails.

Failure does not authorize a relaxed tolerance, alternate initializer, new grid,
stationary exception, trust-region method, origin basis, or parameter search.
Those would require another separately reviewed version.

## Runtime-disjoint predecessor replay value

A genuinely runtime-disjoint replay of the predecessor would improve evidence
about binary64 portability, compiler/runtime dependence, and the shared
MPFR/GMP-lineage blocker. It would not resolve the already observed
ill-conditioning or determine whether MPFR256 end-to-end arithmetic converges.
It is therefore useful before candidate admission and before any independent
agreement claim, but it is not the highest-value prerequisite to reviewing this
successor policy.

## Decision

The evidence supports `VERSIONED_PROPOSAL`, not `NO-GO`, because:

- the accepted chronology reduced the residual by more than ten orders;
- the analytic Jacobian and refined linear solve are consistent;
- the remaining error is localized rather than a broad equation mismatch;
- deterministic equilibration dramatically reduces the observed condition
  estimate;
- same-input MPFR256 reevaluation proves that binary64 arithmetic materially
  affects the stalled residual.

The persisted user goal supplies authorization for exactly the additive N=64
implementation and first-result attempt described here. It does not authorize
semantic changes, retries, other grids, or downstream work after a failure.

## Proposal-integration verification

These checks validate repository integration and guardrails, not successor
convergence:

- Prettier and diff checks: PASS;
- math-stage validation: PASS, 318 entries;
- required WARP suite: PASS, 18 files / 179 tests;
- Casimir adapter verification: PASS/GREEN, trace
  `adapter:aa4750e4-4a9e-4139-a0ac-78d689c72a97`, certificate
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

The Casimir certificate verifies its constraint-pack gate. It does not certify
the unimplemented successor or establish physical viability.
