Program gate: G2C — replacement-candidate research and preregistration
Workstream: classical control-candidate selection
Capability or component: evidence admission and deterministic selection protocol
Current maturity: frozen pre-review research protocol
Target maturity: one reproducible selection or typed research `STOP`
Required frozen inputs: closed G2B result and literature cutoff 2026-08-23
Required evidence: primary sources, exact queries, option matrix and audit
Stop/fail criteria: missing hard gate, unresolved rank tie or circular evidence
Explicit non-goals: candidate solve, numerical tuning, proof/lane/lamp authority
Downstream gate unlocked: G2C evidence review only

# G2C evidence and selection protocol

## Change classification

This packet changes research-selection semantics only. It changes no candidate,
equation, runtime, receipt, threshold, numerical policy, or authority lock.

## Literature boundary

The evidence cutoff is August 23, 2026. Only primary research articles,
publisher article records, arXiv author manuscripts, and official code/data
records may establish a scientific claim. Reviews may locate sources but cannot
score an axis. Repository history is evidence only for the closed G2B family.

Searches must cover all of these concepts, with query strings persisted in the
result packet:

1. regular asymptotically flat self-gravitating field or fluid stars;
2. vacuum/Minkowski-connected branches and no-horizon/no-fold control;
3. constraint-satisfying static spherical formulations and convergence;
4. rigorous or computer-assisted existence/error proofs;
5. Hadamard states, renormalized stress tensors, stress fluctuations or noise
   kernels on the same family or on a theorem-applicable static background;
6. independent implementations or public numerical methods.

At most four families may enter the option matrix. A family is admitted only if
one primary source directly establishes a regular classical solution and a
second independent primary source establishes either a constraint-satisfying
formulation or a rigorous existence/convergence result. The closed mini-boson-
star branch may appear only as a rejected baseline, never as a replacement.

## Evidence scale

Each of seven axes receives one immutable ordinal:

- `2 DIRECT`: primary evidence treats the same candidate family and property;
- `1 APPLICABLE`: a primary theorem or method applies after explicit hypotheses
  are checked, or evidence treats the same symmetry/background class;
- `0 ABSENT`: evidence is missing, contradictory, or requires an unproved
  extrapolation.

The axes are:

| ID | Axis | Hard minimum |
|---|---|---:|
| `Q` | Hadamard/RSET/noise compatibility | 1 |
| `P` | rigorous/validated proof tractability | 1 |
| `C` | constraint-satisfying stable formulation | 2 |
| `V` | explicit vacuum-connected, no-horizon branch strategy | 1 |
| `E` | classical existence and regularity | 2 |
| `R` | source/runtime-disjoint replay feasibility | 1 |
| `F` | explicit falsifiers and bounded cost model | 1 |

`Q=1` requires explicit satisfaction of the cited static/global-hyperbolicity or
Hadamard-method hypotheses; a generic statement that QFT works on curved
spacetime is insufficient. `P=1` requires a bounded formulation suitable for
validated residual/error enclosures, not merely ordinary numerical convergence.
`R=1` requires two plausibly independent implementation stacks. `F=1` requires
pre-result failure tests and an order-of-magnitude resource class.

## Deterministic decision

1. Remove every family below a hard minimum.
2. For each survivor form the vector `(Q,P,C,V,E,R,F)`.
3. Select the unique lexicographic maximum in that exact order.
4. If there is no survivor, emit `STOP_NO_ADMISSIBLE_FAMILY`.
5. If the maximum is tied, emit `STOP_UNRESOLVED_EVIDENCE_TIE`.

The order reflects the permanent program bottleneck: a classical solution that
cannot support the authenticated semiclassical state/output lane is not useful.
No score, ordering, family definition, or tie breaker may change after source
results are read.

## Selection output

A selection identifies only a family and its evidence-backed formulation class.
The G2D packet must separately freeze the exact model, parameters, equations,
coordinates, grid, continuation, thresholds, chronology, runtime, output root,
and falsifiers. G2C never authorizes that execution.
