Program gate: G2C — replacement-candidate research and preregistration
Workstream: classical control-candidate selection
Capability or component: primary-source evidence matrix and deterministic decision
Current maturity: independently reproducible research selection; no candidate execution
Target maturity: immutable G2C closure and bounded G2D handoff
Required frozen inputs: closed G2B branch and frozen G2C selection protocol
Required evidence: primary sources, exact query log, option matrix, decision replay
Stop/fail criteria: missing hard minimum, tied maximum, or post-review rule change
Explicit non-goals: candidate solve, semiclassical acceptance, lane/lamp/physical authority
Downstream gate unlocked: G2D preregistration only

# G2C replacement-candidate selection result

## Decision

The frozen protocol selects exactly one family:

`SUB_BUCHDAHL_CONSTANT_DENSITY_FLUID_STAR_SCALAR_QFT_CONTROL`

This is a conservative static, spherical, constant-density perfect-fluid star,
matched to an asymptotically flat exterior and restricted to a regular,
horizonless branch strictly below the Buchdahl limit. A conformally coupled
massless scalar field in the static asymptotically-flat vacuum is the downstream
quantum-field control. G2C selects only this family. It does not select a mass,
radius, compactness, state normalization, renormalization constants, grid,
runtime, output root, or result.

The selection is a control-workflow decision, not evidence for a warp metric,
negative-energy apparatus, propulsion, transport, or physical viability.

## Frozen evidence scale replay

The selection protocol was frozen before these source results were scored:
[`nhm2-spherical-boson-star-v2-g2c-evidence-and-selection-protocol.md`](./nhm2-spherical-boson-star-v2-g2c-evidence-and-selection-protocol.md).
Scores use its exact `(Q,P,C,V,E,R,F)` ordering and `0/1/2` meanings.

| Candidate family | Q | P | C | V | E | R | F | Admission | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| sub-Buchdahl constant-density fluid star + scalar-QFT control | 2 | 2 | 2 | 2 | 2 | 2 | 2 | admitted | unique maximum |
| ground-state `ell=1` boson star | 1 | 1 | 2 | 2 | 2 | 2 | 2 | admitted | retained, not selected |
| spherical fundamental Proca star | 1 | 1 | 2 | 2 | 2 | 2 | 2 | admitted | retained, not selected |
| fundamental quadratic oscillaton | 0 | 0 | 2 | 2 | 2 | 1 | 1 | removed by `Q` and `P` minima | rejected |

The unique lexicographic maximum is `(2,2,2,2,2,2,2)`. The decision is
therefore `SELECT_ONE_FAMILY_FOR_G2D`, not either research `STOP`.

The no-network independent replay is
[`g2c_selection_independent_audit.py`](../../tools/nhm2-spherical-boson-star-v2-branch-proof/g2c_selection_independent_audit.py).
It parses this frozen table, reapplies the protocol hard minima and exact
lexicographic order, and must return the same unique winner.

## Evidence and score reasons

### Selected fluid-star control

- `Q=2 DIRECT`. Reyes and Tomaselli compute the renormalized stress tensor of
  conformal QFT on the same constant-density compact-star family. Melella and
  Reyes give an exact, fully backreacted conformally-flat interior. The latter
  explicitly states that the self-consistent exterior is not known; therefore
  G2C does **not** claim a complete joint solution. General covariant
  stress-fluctuation renormalization supplies a downstream method, but no
  same-family noise-kernel result is claimed here.
- `P=2 DIRECT`. The classical interior Schwarzschild geometry, pressure,
  density, matching condition, regularity boundary, Buchdahl inequality, and
  Minkowski limit are closed-form. G2D can require exact/interval evaluation of
  identities instead of another nonlinear eigenvalue solve.
- `C=2 DIRECT`. The static Einstein-perfect-fluid equations reduce to the exact
  TOV/constraint solution. Independent fully constrained relativistic-star
  implementations have demonstrated cross-code agreement.
- `V=2 DIRECT`. The analytic branch tends to Minkowski as mass/density tends to
  zero. The strict sub-Buchdahl restriction also gives an analytic no-horizon
  and finite-central-pressure strategy before any result exists.
- `E=2 DIRECT`. The matched classical solution is regular and asymptotically
  flat on the selected sub-Buchdahl branch.
- `R=2 DIRECT`. Closed-form identities permit two source-disjoint evaluators,
  one arbitrary-precision interpreted stack and one independently written
  compiled interval stack, without sharing a nonlinear solver.
- `F=2 DIRECT`. G2D can fail on exact origin regularity, pressure positivity,
  surface matching, compactness, no-horizon, Einstein residual, interval-width,
  cross-grid, cross-runtime, or hash/chronology duties. The classical proof is
  workstation-scale; QFT mode sums remain a later, materially larger cost.

Primary sources:

1. P. P. Melella and I. A. Reyes, *Self-consistent solution to the
   semiclassical Einstein equations of a star*, arXiv:2501.09784 (2025),
   https://arxiv.org/abs/2501.09784.
2. I. A. Reyes and G. M. Tomaselli, *Quantum Field Theory on compact stars near
   the Buchdahl limit*, Phys. Rev. D 108, 065006 (2023),
   https://arxiv.org/abs/2301.00826.
3. J. Arrechea et al., *Semiclassical constant-density spheres in a regularized
   Polyakov approximation*, Phys. Rev. D 104, 084071 (2021),
   https://arxiv.org/abs/2105.11261.
4. J. Arrechea et al., *Ultracompact horizonless objects in order-reduced
   semiclassical gravity*, Phys. Rev. D 109, 104056 (2024),
   https://arxiv.org/abs/2310.12668.
5. L.-M. Lin and J. Novak, *Rotating star initial data for a constrained scheme
   in numerical relativity*, arXiv:gr-qc/0603048,
   https://arxiv.org/abs/gr-qc/0603048.
6. A. Perez and D. Sudarsky, *Renormalization of the Quantum Stress Tensor
   Fluctuations and the Limits of Semiclassical Gravity*, Phys. Rev. Lett. 137,
   051501 (2026), https://doi.org/10.1103/jvj4-hk16.

### `ell=1` boson-star alternative

The family is regular, asymptotically flat, dynamically evolved in independent
formulations, directly interpretable as a definite-particle semiclassical
state, and has a rigorous nonrelativistic existence/stability result. It scores
`Q=1`, because the direct `ell`-boson-star semiclassical construction uses
normal ordering, while the 2026 diffeomorphism-preserving Pauli-Villars RSET
calculation treats the closed `ell=0` mini-boson family and only establishes
method applicability to other compact objects. It scores `P=1`, because the
global theorem is nonrelativistic and the relativistic paper proves local
origin existence plus numerical continuation, not a global validated proof.

Primary sources:

1. M. Alcubierre et al., *ell-Boson stars*, Class. Quantum Grav. 35, 19LT01
   (2018), https://arxiv.org/abs/1805.11488.
2. M. Alcubierre et al., *Dynamical evolutions of ell-boson stars in spherical
   symmetry*, https://arxiv.org/abs/1906.08959.
3. V. Jaramillo et al., *Dynamical ell-boson stars: generic stability and
   evidence for non-spherical solutions*, https://arxiv.org/abs/2004.08459.
4. M. Alcubierre et al., *Boson stars and their relatives in semiclassical
   gravity*, Phys. Rev. D 107, 045017 (2023),
   https://arxiv.org/abs/2212.02530.
5. E. Chavez Nambo and O. Sarbach, *Existence of nonrelativistic ell- and
   multi-ell-boson stars and their radial stability*,
   https://arxiv.org/abs/2605.27529.
6. P. M. Saffin and Q.-X. Xie, *Quantum fields in boson star spacetime*, Phys.
   Rev. D 113, 125025 (2026), https://arxiv.org/abs/2601.05129.
7. G. Palloni et al., *Constraint-satisfying binary boson star initial data via
   XCFC*, https://arxiv.org/abs/2605.20888.

### Proca-star alternative

Spherical Proca stars have regular classical solutions, a vacuum-connected
fundamental branch, and fully nonlinear constraint evolutions. General Proca
Hadamard-state and renormalized-stress constructions apply on smooth globally
hyperbolic backgrounds, but no primary source found in the review computes the
RSET or noise kernel on a Proca-star background. No same-family rigorous global
existence or computer-assisted proof was found. Hence `Q=1`, `P=1`.

Primary sources:

1. C. A. R. Herdeiro, A. M. Pombo and E. Radu, *Asymptotically flat scalar,
   Dirac and Proca stars*, https://arxiv.org/abs/1708.05674.
2. N. Sanchis-Gual et al., *Numerical evolutions of spherical Proca stars*,
   https://arxiv.org/abs/1702.04532.
3. M. Benini, C. Dappiaggi and A. Schenkel, *The Quantization of Proca Fields on
   Globally Hyperbolic Spacetimes: Hadamard States and Moller Operators*,
   https://doi.org/10.1007/s00023-023-01326-w.
4. A. Belokogne and A. Folacci, *Stueckelberg massive electromagnetism in curved
   spacetime: Hadamard renormalization of the stress-energy tensor and the
   Casimir effect*, https://arxiv.org/abs/1512.06326.

### Oscillaton rejection

Quadratic oscillatons have regular, asymptotically flat, dynamically tested
classical branches. Their metric is intrinsically time-periodic, however, and
2026 work directly finds spontaneous particle creation by oscillating compact
stars. No stationary Hadamard/RSET/noise construction on the same family and no
bounded global validated proof of the infinite Fourier tail were found. This
gives `Q=0` and `P=0`, so the hard minima remove the family before ranking.

Primary sources:

1. M. Alcubierre et al., *Numerical studies of Phi^2-Oscillatons*,
   https://arxiv.org/abs/gr-qc/0301105.
2. A. del Rio and P. Lopez-Oliver, *Spontaneous particle creation by
   oscillating compact stars*, Phys. Rev. D 113, 105018 (2026),
   https://arxiv.org/abs/2602.20253.

## Exact search-query log

The review used the following exact query strings before the cutoff. Empty or
irrelevant returns were retained here because absence cannot be hidden by
reporting only successful searches.

```text
site:arxiv.org semiclassical gravity renormalized stress tensor static star Hadamard state TOV
site:arxiv.org boson star semiclassical gravity renormalized stress tensor fluctuations 2025 2026
site:arxiv.org Proca star renormalized stress tensor quantum field Hadamard
site:arxiv.org computer assisted proof boson star TOV existence constraint satisfying convergence
semiclassical gravity renormalized stress tensor static star Hadamard state TOV
boson star semiclassical gravity renormalized stress tensor fluctuations 2026
Proca star quantum field renormalized stress tensor Hadamard
computer assisted proof boson star TOV existence constraint satisfying convergence
site:arxiv.org "Stellar Equilibrium in Semiclassical Gravity"
site:arxiv.org semiclassical relativistic stars renormalized stress energy TOV Boulware
site:arxiv.org rigorous existence TOV stars asymptotically flat theorem
site:arxiv.org validated numerics TOV equation computer assisted proof
site:arxiv.org self-interacting solitonic boson stars existence stability vacuum branch constraint evolution
site:arxiv.org Proca stars existence stability constraint evolution asymptotically flat
site:arxiv.org oscillatons existence stability convergence asymptotically flat
site:arxiv.org TOV stars existence theorem asymptotically flat constraint satisfying numerical evolution
site:arxiv.org "Solitonic boson stars" stability constraints
site:arxiv.org "self-interacting boson stars" numerical relativity stable branch
site:arxiv.org "Proca stars" spherical stability numerical evolution constraints
site:arxiv.org "semiclassical relativistic stars"
site:arxiv.org rigorous existence boson stars Einstein Klein Gordon theorem spherical
site:arxiv.org computer assisted proof boson star existence interval arithmetic
site:arxiv.org "ell-boson stars" stability evolution constraints
site:arxiv.org "multi-state boson stars" stability numerical relativity
"existence" "ell-boson stars"
"existence" "l-boson stars" theorem
site:arxiv.org "Semiclassical Einstein-Klein-Gordon" existence static
site:arxiv.org "multi-state boson stars" "constraints" evolution
site:arxiv.org renormalized stress tensor inside relativistic star Boulware exact mode sum
site:arxiv.org quantum stress tensor stellar spacetime static star vacuum polarization
site:arxiv.org stress tensor fluctuations static spherically symmetric star Hadamard
site:arxiv.org noise kernel boson star spacetime
site:arxiv.org TOV star constraint satisfying initial data convergence numerical relativity
site:arxiv.org neutron star initial data TOV Hamiltonian constraint convergence
site:arxiv.org TOV solution code convergence BSSN constraints
site:arxiv.org verified numerical TOV star interval arithmetic
"Existence of nonrelativistic ell- and multi-ell-boson stars"
site:arxiv.org Chavez Nambo multi ell boson stars existence
site:arxiv.org Jaramillo Sarbach existence Newtonian ell boson stars
site:arxiv.org Tolman VII exact solution regular causal stable star
site:arxiv.org Tolman VII quantum field renormalized stress tensor
site:arxiv.org smooth density TOV exact solution asymptotically flat star stability
site:arxiv.org Buchdahl star Hadamard state renormalized stress tensor smooth density
```

Unicode `ell` glyph variants were also issued for the three `ell` queries; they
returned the same arXiv records and do not alter the evidence set.

## Negative evidence and limitations

1. No reviewed option presently has a complete authenticated joint
   geometry/state, connected noise kernel, or two-lane replay.
2. The selected family has direct RSET evidence, not a completed same-family
   noise computation.
3. The 2025 exact semiclassical result covers the conformally-flat interior and
   explicitly leaves the self-consistent exterior unknown. It is evidence for
   tractability, not a G3 witness.
4. Constant density makes curvature finite but discontinuous at the classical
   surface. G2D must treat the surface as an exact domain interface and must not
   claim global spectral smoothness across it.
5. The 2026 linear-instability result for the semiclassical EKG system about
   Minkowski is relevant caution for later scalar backreaction. G2D is only a
   classical control proof and cannot erase that downstream stability question.

## Frozen G2D handoff

G2D may preregister one low-compactness member of the selected family. It must:

1. use exact rational dimensionless compactness and scale data fixed before
   evaluation;
2. use areal radius with separate interior, surface, and exterior domains;
3. bind the exact closed-form classical geometry, density, pressure, surface
   matching, and asymptotic normalization;
4. require exact symbolic identities plus independent interval evaluation;
5. set strict pre-result rails for central pressure, compactness, lapse,
   `1-2m(r)/r`, Einstein residuals, interface jumps, interval widths, and
   source/runtime-disjoint agreement;
6. use a new exclusive output root and immutable first-failure chronology;
7. execute nothing until a separately reviewed implementation/preexecution
   packet and explicit one-shot authority exist.

Every candidate, proof, SI, lane, replay, lamp, Theory Graph, physical,
propulsion, and transport authority remains false.

## Current-tree verification

Verification was run after the selection, handoff, and independent replay were
present in the working tree based on repository head
`718bb7d7697e3e0266e7e5821ba6116c64f80c90`:

- G2C independent selection replay: `1/1 PASS`;
- math report and validation: `318` entries, validation `OK`;
- required WARP battery: `18/18` files and `179/179` tests pass;
- Casimir repo-convergence adapter run `2450`: `PASS`, certificate `GREEN`,
  integrity `true`, certificate hash
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- trace export:
  `artifacts/training-trace-g2c-selection-2026-08-23.jsonl`.

These checks authenticate the gate semantics and repository constraints. They
do not convert the literature selection into a mathematical proof, candidate
admission, quantum-state acceptance, physical claim, or diagnostic lamp.
