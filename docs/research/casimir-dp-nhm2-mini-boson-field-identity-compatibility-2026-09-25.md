Program gate: G2H-E-S5-A4 remains the unrelated canonical NHM2 gate; this research note is a nonperturbing compatibility audit.
Workstream: bosonic dark-sector field-identity and source-to-star compatibility
Capability or component: compare the selected NHM2 matter system with the ultralight pNGB/misalignment branch
Current maturity: diagnostic field-identity match plus analytic mass-scale screen; no physical star solution or common dark-sector prediction
Target maturity: a charge-bearing cosmological initial-condition model that can be mapped to the selected star after its solver result exists
Required frozen inputs: G2H-E-S3-R2 mini-star candidate contract; finite-temperature real-field misalignment packet; exact pNGB action and Noether-current convention
Required evidence: contract-level field/potential/ansatz comparison, independently reproducible mass scaling, conserved-charge budget, and explicit experimental coupling predictions
Stop/fail criteria: do not call the selected definition a computed star; do not equate one-axis real misalignment with a charged complex condensate; do not infer a mass at shat_0=6/5 from the Kaup cap; stop the common-parameter claim unless one action predicts the astrophysical and laboratory channels
Explicit non-goals: no edits to NHM2 candidate/proof/SI/metric/lane/replay/graph surfaces; no candidate evaluation, GR solve, detector recast, or Casimir-DP prediction in this packet
Downstream gate unlocked: a separate two-component charged-misalignment abundance screen, parameterized until a solved star supplies Q/M

# NHM2 selected-field identity and ultralight source compatibility

Date: September 25, 2026. This packet audits the current repository contract and a scaling relation. It does not promote the selected candidate to a solved or physical star.

## What the simulation definition actually says

The frozen [G2H-E-S3-R2 contract](nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json) selects Einstein gravity plus one **free massive complex scalar**, represented by two real fields, with `V=mu_b^2*(phi_0r^2+phi_0i^2)/2` and `lambda=0`. Its stationary classical ansatz is `phi_0r=sigma(r) cos(omega t)`, `phi_0i=-sigma(r) sin(omega t)`. That is a rotating phase in field space and has the global U(1) symmetry needed for a conserved scalar charge. The selected dimensionless member is source coordinate `shat_0=6/5` on the nodeless branch. The selection-result packet explicitly says `candidate_evaluations=0`, implementation/execution/admission are false, and its current next NHM2 gate is elsewhere; this compatibility note does not change that roadmap or authorize any NHM2 work.

The local `radial_residual.py` is a pointwise diagnostic kernel, not the star solver (`branch_solver_implemented=False`). Its stress terms use the free quadratic mass term and harmonic frequency, consistent with the contract. The separate QFT control in NHM2 is a free real scalar quantized on the classical star geometry; it is not an additional component of the classical star source. This distinction matters when comparing a dark-sector candidate to the simulated object.

The `O(3)/O(2)` pNGB proposal can in principle supply a complex low-energy field with a residual U(1), if its exact potential preserves the rotations of the two light components. But the finite-temperature abundance calculation in the preceding packet evolves a single real axis with zero angular motion, hence zero U(1) Noether charge. It supplies neither the phase-rotating source ansatz nor a charged-star initial condition. The earlier real mediator toy `mu S x y` explicitly violates that U(1) for nonzero real `S`; its finite-time `Q/E` must not be treated as the selected star's conserved charge. A charge-preserving coupled mediator would need its own complete action and initial total-charge budget.

## Free-field mass scale

For the free complex field, the primary mini-boson-star limit is `M_Kaup=0.633 M_Pl^2/m`, with the unreduced Planck mass. The attached script uses `M_Pl=1.220890e19 GeV`, `m=1e-17 eV`, and `M_sun=1.115449e57 GeV`. It gives `M_Kaup=8.46e6 M_sun`; the illustrative `4.02e6 M_sun` target is `0.475` of that upper limit. Conversely, a boson mass `2.10e-17 eV` places the Kaup maximum at `4.02e6 M_sun`.

This is a scale compatibility result only. It does **not** show that the selected `shat_0=6/5` profile has that ADM mass: that requires the dimensionless mass at the exact source coordinate from a validated star solution, which the current contract has not produced. It also does not establish formation or stability of an astrophysical population. This free-field scaling is conceptually distinct from the attractive axion-like dilute-star `M_max` versus decay-constant estimate in the earlier pNGB mediator packet; do not use the latter to normalize the free NHM2 mini-star.

## Consequence for the joint prediction goal

The audit makes the ultralight branch more specific: the closest field-identity match to the selected simulation is a **charge-bearing free complex scalar**, not a single real misalignment condensate. The next useful calculation is a two-real-component homogeneous evolution in the exact U(1)-preserving pNGB potential, with initial angular velocity (or another explicit charge-generation mechanism) treated as a frozen parameter. It should evolve the same finite-temperature background, report both abundance and conserved charge density, and keep the inflationary isocurvature assumptions explicit. Until the NHM2 solution supplies a profile-dependent `Q/M`, report cosmological charge per energy parametrically rather than claiming that it seeds that member.

A separate observational bridge is still missing. An ultralight free complex scalar has no direct xenon-recoil or measurable Casimir-DP response specified by this field-identity match. Any portal that adds such a response must be included in the same action and checked against charge conservation, stellar stability, relic abundance, gamma spectra, xenon recoil rates, and interferometer decoherence. LZ's xenon energy deposit alone does not identify this ultralight field.

## Reproduction and primary sources

Run `python -B docs/research/casimir-dp-free-complex-star-kaup-scale-2026-09-25.py`; the adjacent JSON records the constants, outputs, formula, and limits. The free complex scalar field and the `0.633 M_Pl^2/m` Kaup limit are the standard mini-boson-star result [Kaup, *Klein-Gordon Geon*](https://doi.org/10.1103/PhysRev.172.1331). The specific selected family and dimensionless member coordinate are bound in the repository contract, which cites [Saffin & Xie, *Quantum fields in boson star spacetime*](https://arxiv.org/abs/2601.05129). The user-provided imaging paper studies one nonrotating boson-star model as an Sgr A* black-hole mimicker; its abstract does not establish a dark-matter particle or LZ interaction [Olivares et al.](https://arxiv.org/abs/1809.08682).