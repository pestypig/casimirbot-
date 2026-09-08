Program gate: S1 — common-interaction screening.
Workstream: Spectral-function energy and species conventions.
Capability or component: Spectator kinematics for subsequent carbon absorption convolution.
Current maturity: Exploratory conditional calculation.
Target maturity: Explicit energy bookkeeping and evidence requirements.
Required frozen inputs: Archived carbon table and canonical apparatus, unchanged.
Required evidence: Spectral-function definition, species normalization, spectator conservation.
Stop/fail criteria: No direct proton-to-neutron substitution or on-shell trace with an arbitrary energy replacement.
Explicit non-goals: No reconstructed neutron spectrum, current prescription, detector fit or exclusion.
Downstream gate unlocked: Conditional spectator kinematics available; neutron response and current remain open.

# Removal-energy convention and updated carbon lead

The previous intake made progress by locating a public table and independently recovering its normalization. The newer primary paper now identifies the physical meaning of that normalization and offers a more detailed response lead.

[Ankowski, Benhar and Sakuda, arXiv:2407.18226v1](https://arxiv.org/html/2407.18226v1) defines the proton spectral-function integral as Z. Its missing energy subtracts both outgoing-proton and residual-nucleus kinetic energies. The update resolves proton valence structure below 21.5 MeV while retaining the earlier LDA response above that matching energy. It targets nuclear de-excitation applications; the paper notes that inclusive electron observables are less sensitive to this refinement. The fitted discrete strengths do not exhaust the valence strength because fragmented contributions remain. This is a proton response, not a directly measured neutron table.

Consequently the archived integral near six is consistent with six protons. The earlier generic phrase “six-nucleon normalization” must be read with that species qualification. A neutron application needs an isospin approximation plus appropriate separation energies and residual states; it is not authenticated merely because carbon-12 has equal proton and neutron counts. No new numerical table was acquired in this turn, and no claim is made that one is unavailable elsewhere.

## Explicit spectator bookkeeping

Assume E denotes intrinsic separation plus residual excitation, MA is the initial nuclear mass, and M the struck-nucleon mass. Then define the residual invariant mass MR=MA-M+E. For spectator momentum -p, exact nuclear rest-frame bookkeeping gives

`ER = sqrt(MR^2+p^2)`

`TR = ER-MR = p^2/(ER+MR)`

`pN0 = MA-ER = M-E-TR`.

The struck subsystem after absorbing stationary dark matter has Q0=m+pN0 and invariant s=Q0^2-p^2. A massless neutrino plus on-shell nucleon requires Q0>0 and s>M^2. This condition is kinematic and supplies no matrix element. If a supplied spectral variable already includes spectator recoil, subtracting TR again would be wrong; its convention must be settled before applying this construction.

For comparison with the previous diagnostic, use m=247 MeV and M=939 MeV, and the normalized legacy proton weights. The weighted residual recoil is 2.32886 MeV; its maximum across the table is 30.4333 MeV. The kinematically open weight changes from 0.955391 without recoil to 0.952902 with recoil. These are conditional midpoint-grid support fractions, not cross-section ratios. The small change in total support does not imply a small effect on detector-threshold acceptance or nuclear final states. The 939 MeV value is inherited bookkeeping, not an exact neutron-mass or separation-energy fit.

## Required next model choice

Conservation fixes the spectator energy but does not uniquely fix an off-shell nucleon current. The next convolution must specify its on-shell projection or consistent nuclear current, together with the flux/normalization convention, rather than inserting pN0 into the archived free spin trace. It must retain spectral correlations between momentum and energy and account for possible additional spectator emission. A normalized emitted-neutron spectrum must then be folded through transport, capture and selection before comparing with KamLAND. Gamma and multiple-neutron channels cannot be assumed rejected without that calculation.

This narrows the path to a prediction model: a legacy response can support an explicitly conditional comparison, while the newer response provides a lead for improving final-state structure. Neither establishes a detectable local signal or a shared gravitational cause.

The [script](casimir-dp-absorption-removal-convention-2026-09-07.py) and [JSON](casimir-dp-absorption-removal-convention-2026-09-07.json) pass four checks: spectator energy conservation, the removal-energy identity, nonnegative recoil and nonincreasing kinematic support. `npm run validate:physics:root-leaf` passes. No certificate or physical-validation claim applies.
