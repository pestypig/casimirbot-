# NHM2 spherical-boson-star v2 G2B-B4-R8 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: continuum radial-constraint identity and norm definition  
Current maturity: independently cross-checked theoretical-definition `PASS`  
Target maturity: one separately versioned formulation proposal may be prepared, not executed  
Required frozen inputs: B4-R4 residual equations, frozen isotropic metric/sign conventions, B4-R7 terminal evidence  
Required evidence: exact Bianchi/Klein–Gordon identity, endpoint limits, dimensionless norms, fixed quadrature, independent symbolic and analytic checks  
Stop/fail criteria: any sign, endpoint, dimension, identity, quadrature, threshold-selection or proposal-uniqueness defect  
Explicit non-goals: candidate result, correction/Newton/continuation solve, retry, retune, proof/lane/replay/lamp/physical authority  
Downstream gate unlocked: preparation of at most one B4-R9 numerical formulation proposal; execution remains separately gated

## Verdict

The theoretical-definition review passes with decision:

```text
CONTINUUM_CONSTRAINT_DEFINITION_AUTHENTICATED
SINGLE_PROPOSAL_PREPARATION_SUPPORTED
CANDIDATE_EXECUTION_NOT_AUTHORIZED
```

No candidate state or B4-R4 numerical output was evaluated by R8. The result
resolves which unused radial-constraint quantity has continuum promotion
meaning; it does not claim that a later solve will converge.

## Frozen identity and norm

For `A=E^t_t`, `B=E^x_x`, `C=E^theta_theta` and scalar residual `K`, the exact
continuum identity is

```text
B' + F0'(B-A) + 2(F1'+1/x)(B-C) + 2 phi' K = 0.
```

With `W=x^2 exp(F0+2F1)`, `q=W B`, and
`S=F0'A+2(F1'+1/x)C-2 phi'K`, it becomes `q'=W S`. Regularity fixes `q(0)=0`;
the frozen asymptotic class fixes `q(1)=0` as a compactified limit.

The authenticated dimensionless report is the sup/L2 pair for both `q` and
the integrated propagation defect `delta`, plus both endpoint magnitudes.
Clenshaw–Curtis weights on the ascending Lobatto grid define L2 quadrature, and
the integral of the unique transformed-source interpolant defines every nodal
prefix used in `delta`. There is no endpoint-data-selected acceptance rail.

## Independent evidence

Five targeted tests pass. They include exact expansion of the frozen residual
formulas, a fresh four-coordinate Christoffel derivation, an independent scalar
stress-divergence derivation, exact regular analytic test fields at rational
radii, and positive unit-sum Clenshaw–Curtis/norm checks.

| Bound source | Bytes | SHA-256 |
|---|---:|---|
| R8 definition packet | 7,995 | `96b68fd6be27a80d8486fc05b19100bf3cc34f324aa11878e2a0cea7b73faf1c` |
| Authority-neutral norm implementation | 2,687 | `6831534c32d9d850e3fb867d55e0d75c276ee327911ff6b2edf71e44f9d70842` |
| Independent symbolic/analytic test source | 6,099 | `69d26a22e46df3566040e626961338ca82c07be64f4bce9f8c818cf036d2c629` |

Repository-wide verification is also green:

| Gate | Result |
|---|---|
| Math registry | 318 entries; validation `OK` |
| Required WARP suite | 18/18 files; 179/179 tests |
| Casimir adapter | run 2443; verdict `PASS`; certificate `GREEN` |
| Certificate | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`; integrity `true` |

## Proposal boundary

The evidence supports preparation of one proposal class only: keep the current
`A,C,K` continuum equation selection, apply the already demonstrated fixed
power-of-two row/column equilibration, and replace raw first-node `B`
localization with preregistered `q`/`delta` convergence monitors and analytic
endpoint limits. A proposal may not excise a node, change the continuum
equations, infer a threshold from B4-R4, or execute a candidate.

All B4-R4 through B4-R7 evidence remains immutable. Candidate admission,
vacuum work, proof execution, replay, lanes, pair agreement, lamp, Theory Graph,
joint geometry/state, physical, propulsion and transport authority remain
false.
