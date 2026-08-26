Program gate: G2F — fresh classical-control candidate selection
Workstream: authenticated classical control branch
Capability or component: primary-source evidence ranking and deterministic selection
Current maturity: selection complete; candidate remains unadmitted and unexecuted
Target maturity: one frozen family/member handoff to preregistration
Required frozen inputs: G2F protocol SHA-256 `785d984382f966a6e2811c645e412e29bcd6842f682dbcfb43e833c118d18272`
Required evidence: query/source matrix, score reasons, primary decision and independent replay
Stop/fail criteria: protocol drift, G2D reuse, failed hard minimum, exact tie or missing member rule
Explicit non-goals: candidate evaluation/execution, proof, G3, lanes, lamp or physical claims
Downstream gate unlocked: G2G Tolman-VII candidate preregistration only

# G2F fresh candidate selection result

Closure verification is preserved in
[`nhm2-spherical-boson-star-v2-g2f-closure-audit.md`](./nhm2-spherical-boson-star-v2-g2f-closure-audit.md).

## Decision

`SELECT_ONE`: `TOLMAN_VII_ISOTROPIC_FLUID_SCALAR_QFT_CONTROL`

New scientific identity:

```text
G2F_TOLMAN_VII_NATURAL_BETA_1_5_SCALAR_HADAMARD_V1
```

The member-selection rule is fixed without evaluating a candidate:

```text
mu = 1
beta = M/r_b = 1/5 exactly
density = rho_c * (1 - (r/r_b)^2), 0 <= r <= r_b
exterior = Schwarzschild from r_b through asymptotically flat infinity
SI scale = deliberately deferred to the later SI contract
```

This is a literature-ranked selection and preregistration handoff, not a
candidate admission, mathematical proof or positive scientific result.

## Outcome-blind protocol integrity

The candidate pool, exclusions, score axes, hard minima, rank, tie rule and stop
rule were written before the new G2F searches or score assignments. The frozen
protocol is
[`nhm2-spherical-boson-star-v2-g2f-selection-protocol.md`](./nhm2-spherical-boson-star-v2-g2f-selection-protocol.md),
and both its sidecar and the evidence matrix reproduce SHA-256
`785d984382f966a6e2811c645e412e29bcd6842f682dbcfb43e833c118d18272`.

The exact queries, source identifiers, positive evidence, negative searches,
uncertainty downgrades and row-level score reasons are preserved in
[`nhm2-spherical-boson-star-v2-g2f-evidence-matrix.json`](./nhm2-spherical-boson-star-v2-g2f-evidence-matrix.json).
Search absence is recorded only as `not found in the bounded queries`; it is not
treated as proof that no literature exists.

## Frozen score result

The frozen rank is

```text
(min(D,P,Q,B,V,R,F), total, Q, P, D, B, V, R, F)
```

| Candidate | N | D | P | Q | B | V | R | F | Eligible | Rank / disposition |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Tolman VII natural fluid | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 2 | yes | unique maximum `(1,15,1,2,2,2,2,2,2)` |
| Buchdahl gaseous fluid | 2 | 2 | 2 | 1 | 1 | 2 | 2 | 2 | yes | `(1,14,1,2,2,1,2,2,2)` |
| fundamental spherical Proca star | 2 | 2 | 1 | 1 | 2 | 2 | 2 | 1 | yes | `(1,13,1,1,2,2,2,2,1)` |
| ground-state ell=1 boson star | 2 | 2 | 1 | 1 | 2 | 2 | 1 | 1 | yes | `(1,12,1,1,2,2,2,1,1)` |
| quadratic real-scalar oscillaton | 2 | 0 | 0 | 1 | 2 | 1 | 0 | 1 | no | exact-periodic/finite-mass domain conflict |

Tolman VII wins because it uniquely combines a complete analytic
origin/interior/interface/exterior/infinity geometry, exact classical identities,
an independently checkable perturbative literature path, a causal/stable
subregion and bounded workstation feasibility. Its `Q=1` is intentionally not
inflated: the review found a credible general Hadamard/RSET/noise route but no
Tolman-VII-specific completed chain.

## Primary-source basis

The main positive evidence is:

- Raghoonundun and Hobill give the exact quadratic Tolman-VII density, full
  interior, regular-origin mass condition, zero-pressure Israel-Darmois
  Schwarzschild matching, and causal/stability analysis
  ([arXiv:1506.05813](https://arxiv.org/abs/1506.05813)).
- Neary, Ishak and Lake independently use the exact geometry for causal-region
  mode analysis ([arXiv:gr-qc/0104002](https://arxiv.org/abs/gr-qc/0104002)).
- Junker supplies the static-spacetime ground/KMS Hadamard-state route
  ([arXiv:hep-th/9507097](https://arxiv.org/abs/hep-th/9507097)).
- Décanini and Folacci give the general local Hadamard RSET framework
  ([arXiv:gr-qc/0512118](https://arxiv.org/abs/gr-qc/0512118)).
- Phillips and Hu derive the regularized scalar stress-noise kernel in general
  curved spacetime
  ([arXiv:gr-qc/0010019](https://arxiv.org/abs/gr-qc/0010019)).
- Perez and Sudarsky renormalize mean stress and the fluctuation tensor for
  suitable Hadamard states and define a semiclassicality test
  ([arXiv:2512.17789](https://arxiv.org/abs/2512.17789)).

The rejected families remain useful evidence-backed alternatives, but their
rejection is relative to this frozen control-selection objective. It is not a
claim that those families are false or physically impossible.

## Hard falsifiers carried downstream

G2G must stop rather than repair around any of these findings:

1. the density is not exactly `rho_c*(1-(r/r_b)^2)` with `mu=1`;
2. compactness is not exactly `1/5`;
3. regular-origin limits or `m(0)=0` fail;
4. `p(r_b)=0` or the Schwarzschild junction conditions fail;
5. the exterior is incomplete before asymptotically flat infinity;
6. `1-2m(r)/r` is nonpositive on the accepted domain;
7. positivity, monotonicity or exact sound-speed enclosure fails;
8. one globally defined Hadamard state cannot bind both renormalized mean stress
   and connected noise on the same accepted geometry; or
9. classical and quantum replays cannot be made source/runtime-disjoint.

## Deterministic decision evidence

The primary command

```text
python scripts/nhm2_g2f_select.py
```

passes `10/10` checks and returns the unique rank above. The independent command

```text
python scripts/nhm2_g2f_independent_replay.py
```

passes `9/9` checks. It does not import the primary selector and separately
exercises the final matrix, immutable G2D exclusion, hard-gate failure, unique
winner, exact-tie stop, missing-member stop, authority locks and input
immutability.

Repository-level math, WARP and Casimir evidence is recorded in the closure
audit. Those checks close the selection gate only and do not promote the
selected identity to a candidate or proof.

## Authority and execution boundary

Candidate evaluations and executions performed by G2F: `0`.

```text
candidate_execution_authorized = false
candidate_admitted = false
classical_proof_established = false
geometry_state_accepted = false
lane_execution_authorized = false
independent_replay_ready = false
diagnostic_lamp = false
physical_viability = false
propulsion_authority = false
transport_authority = false
```
