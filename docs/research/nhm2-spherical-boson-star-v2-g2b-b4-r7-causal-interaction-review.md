# NHM2 spherical boson-star v2 G2B-B4-R7 causal-interaction review

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: no-solve scaling/boundary causal discriminator  
Current maturity: preregistered authority-neutral scientific review  
Target maturity: independently audited unique causal classification or explicit unresolved stop  
Required frozen inputs: exact B4-R4 terminal state, B4-R6 receipt, N=64 grid and radial residual/Jacobian/system definitions  
Required evidence: controlled first/middle/last excisions, raw/equilibrated factor cells, term- and sensitivity-normalized constraint localization, frozen classification and independent audit  
Stop/fail criteria: first binding, reconstruction, intervention, normalization, factor, persistence or audit mismatch  
Explicit non-goals: Newton/continuation/candidate solve, linear correction, trial state, retry, retune, threshold change, candidate/proof/lane/lamp/physical/propulsion/transport authority  
Downstream gate unlocked: preparation of at most one separately versioned proposal only after one exact causal classification

## Review finding before new evidence

The frozen N=64 square system solves `Et_t`, `Etheta_theta`, and Klein–Gordon
rows and records `Ex_x` only as an unused constraint. Therefore B4-R6's
equilibrated square-Jacobian improvement cannot, by itself, explain the raw
node-1 unused-constraint magnitude. Conversely, the node-1 magnitude cannot by
itself prove that the first collocation block causes the square matrix's poor
factor scaling.

This distinction is consistent with established spectral-method analysis:
Gauss–Lobatto differentiation operators can be severely ill-conditioned while
boundary conditions can still be imposed exactly in a well-conditioned basis.
The external literature motivates separating the two effects but supplies no
candidate evidence and is not an execution input:

- Wang, Samson, and Zhao, *A Well-Conditioned Collocation Method Using a
  Pseudospectral Integration Matrix*, DOI `10.1137/130922409`;
- Canuto, *Boundary Conditions in Chebyshev and Legendre Methods*, DOI
  `10.1137/0723052`;
- Sukhov, *A pseudo-spectral approach to constructing rotating boson star
  spacetimes*, arXiv `2404.03852`.

R7 freezes a two-part discriminator before computing any new diagnostic value:
controlled square-matrix excisions test whether the first interior block drives
conditioning, while two independent normalizations test whether the unused
constraint remains genuinely localized after accounting for local equation
scale and unknown-coordinate sensitivity.

## Authority boundary and sole output

R7 reconstructs the immutable B4-R4 endpoint and performs only matrix copying,
row/column deletion, diagonal multiplication, factor diagnostics and pointwise
residual/Jacobian evaluation. It may not compute a Newton direction, solve a
linear correction system, evaluate a trial state, change a state byte, or call
continuation.

The sole output root is:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
  g2b-b4-r7-causal-interaction-review-v1/
```

It must be absent before the one permitted admitted-Linux offline invocation
and may never be deleted, reused, or retried by this packet. Exactly one
canonical JSON receipt is written after all duties pass.

## Frozen matrix intervention cells

Reconstruct the direct-`w` 193 by 193 binary64 Jacobian exactly as B4-R6. The
ordered intervention cells are:

| Cell | Deleted interior node | Deleted row ordinals | Deleted column ordinals |
|---|---:|---|---|
| `FULL` | none | none | none |
| `DROP_FIRST` | 1 | `1,65,129` | `1,65,129` |
| `DROP_MIDDLE` | 32 | `32,96,160` | `32,96,160` |
| `DROP_LAST` | 62 | `62,126,190` | `62,126,190` |

Rows select the three solved interior equations at that collocation node;
columns select the three nodal unknowns there. Frequency column 192 and all
seven boundary rows remain present. Each excised cell is 190 by 190. Excision
is a read-only leverage diagnostic, not a new discretization and not a solve.

For each cell record the same deterministic partial-pivot LU factor diagnostics
as B4-R6 on:

1. the raw cell;
2. a fresh power-of-two row pass followed by a fresh power-of-two column pass,
   using `frexp` scale `2^-exponent` and scale 1 for an all-zero row/column.

`SCALING_MAIN_EFFECT` is true iff every cell's equilibrated U-diagonal spread is
at most `2^-10` times its raw spread and every equilibrated pivot growth is less
than `2^20`.

`FIRST_BLOCK_CONDITIONING_LEVERAGE` is true iff the raw `DROP_FIRST` U-diagonal
spread is at most `2^-10` times raw `FULL`, and both raw control-cell spreads
are at least four times raw `DROP_FIRST`. The middle and last cells prevent a
generic dimension-reduction effect from being mislabeled first-boundary
causality.

## Frozen unused-constraint normalizations

Reconstruct all 62 pointwise residual/Jacobian evaluations in ascending node
order from the exact state and grid. Let `c_i` be absolute `Ex_x` at interior
node `i`, and define the median of 62 values as the arithmetic average of sorted
ordinals 30 and 31.

Three node-1 localization ratios are fixed:

1. `RAW_RATIO = c_1 / median(c_i)`; this must reproduce B4-R6 bit-for-bit.
2. `TERM_NORMALIZED_RATIO = n_1 / median(n_i)`, where `n_i` is the frozen
   point-kernel value `abs(Ex_x)/(1+abs(Gx_x)+abs(Tx_x))`.
3. For an unknown-coordinate diagonal `D`,
   `d_i(D)=c_i/max_j(abs(g_ij*D_j))`, where `g_i` is the exact global analytic
   unused-constraint Jacobian row. Record
   `SENSITIVITY_RATIO(D)=d_1(D)/median(d_i(D))` for:
   - `D=I` as `SENSITIVITY_RAW_RATIO`;
   - `D=C_FULL`, the exact full-cell column scales produced after the frozen
     row equilibration pass, as `SENSITIVITY_EQUILIBRATED_RATIO`.

Every denominator must be finite and strictly positive. Record all four value
streams as little-endian binary64 SHA-256 hashes plus their first-node, median,
and ratio words. No norm or scale may be selected after observation.

`LOCALIZATION_ROBUST` is true iff all four ratios are at least `2^4`.

`SCALING_ABSORBS_LOCALIZATION` is true iff `RAW_RATIO>=2^4`,
`SENSITIVITY_RAW_RATIO>=2^4`, and
`SENSITIVITY_EQUILIBRATED_RATIO<2^4` while also being at most `2^-4` times
`SENSITIVITY_RAW_RATIO`.

`LOCAL_TERM_SCALE_ABSORBS_LOCALIZATION` is true iff `RAW_RATIO>=2^4`,
`TERM_NORMALIZED_RATIO<2^4`, and `TERM_NORMALIZED_RATIO` is at most `2^-10`
times `RAW_RATIO`.

## Frozen causal classification

The predicates above map to exactly one ordered terminal classification. The
first matching row wins; this precedence is frozen to make overlap explicit
rather than result-dependent.

| Precedence | Exact condition | Classification | Proposal authority |
|---:|---|---|---|
| 1 | first-block leverage and localization robust | `BOUNDARY_DISCRETIZATION_UPSTREAM` | one boundary/formulation proposal may be prepared |
| 2 | scaling main effect, no first-block leverage, and either scaling-absorption or local-term-absorption | `SCALING_UPSTREAM_OF_APPARENT_LOCALIZATION` | one equilibrated/scaled proposal may be prepared |
| 3 | scaling main effect, no first-block leverage, and localization robust | `INDEPENDENT_SCALING_AND_LOCALIZATION` | one combined orthogonal formulation proposal may be prepared |
| 4 | any other predicate combination | `CAUSAL_INTERACTION_UNRESOLVED_STOP` | none |

Exactly one classification is always emitted. Only classifications 1–3 unlock
preparation—not execution—of the named separately versioned proposal. The
proposal must freeze its mathematical formulation, boundary treatment,
preconditioner/equilibration, convergence tests, runtime, stop rules and sole
invocation before any candidate result. Classification 3 does not permit two
independently tuned attempts; it permits at most one jointly preregistered
orthogonal design.

## Binding, receipt and locks

The producer must bind byte size and SHA-256 for this packet, the immutable
B4-R4 state, B4-R6 raw receipt and self-hash, the grid, compactified system,
collocation state, residual and analytic Jacobian sources, its own source,
preexecution tests, checkpoint and admitted image. Preexecution must run on host
and admitted Linux without evaluating the endpoint.

The receipt self-hash domain is:

```text
nhm2-spherical-boson-star-v2/g2b-b4-r7-causal-interaction-review/v1\n
```

Every receipt states `candidateSolveInvoked=false`, `linearCorrectionSolved=false`,
`newtonInvoked=false`, `continuationInvoked=false`,
`armijoTrialEvaluated=false`, `stateUpdateComputedOrPersisted=false`,
`b4R4Retried=false`, `noRetune=true`, `candidateAdmission=false`,
`vacuumWorkUnlocked=false`, and all proof, execution, replay, lane, agreement,
lamp, Theory Graph, joint geometry/state, physical, propulsion and transport
authority false. `PASS` certifies only faithful execution of this causal review.
