# Mediator consistency and excited-state survival screen

Exploratory snapshot, September 7, 2026. The prior common-rate calculation assumed a present excited population; this packet identifies the additional parameters required to justify it.

## Matching structure

A candidate baryonic vector completion has couplings gchi to the off-diagonal dark current and gB/3 to each quark vector current. At zero momentum, conserved vector charges give equal proton/neutron coupling gB. For a heavy mediator, Cb=gchi gB/MV² recovers the previous contact convention. Illustratively MV=100 GeV requires gchi gB about 3.1e-5 in the scanned family; this product does not determine the two couplings separately or establish collider viability.

Include photon mixing explicitly as an additional coupling epsilon e to the electromagnetic current. Then, in this sign convention, Cp=gchi(gB+epsilon e)/MV², Cn=Cb and Ce=-gchi epsilon e/MV². Changing Ce while retaining exactly equal proton/neutron amplitudes is inconsistent with this simple completion. A baryonic vector also needs a gauge-consistent anomaly-canceling completion and its threshold matching.

[Ilten et al.](https://arxiv.org/html/1801.04847v2) discuss baryonic vectors with lepton couplings from photon mixing and the special constraints of anomalous SM currents. Thus the word leptophobic does not specify the renormalized mixing parameter or guarantee vanishing electron coupling. No universal mixing floor is assigned here: UV counterterms, thresholds and low-energy hadronic matching must be supplied.

## Quantitative survival requirement

[Dent and Newstead, equation 5](https://arxiv.org/html/2609.04673v1) give an approximate heavy-vector electron-pair lifetime scale. Generalizing its electron coefficient relative to Cb, write r=|Ce/Cb| and retain the phase-space factor F explicitly:

`tau approximately tau0/(r² F)`, `tau0=4e9 s (sigma_b/1e-45 cm²)^(-1) (gap/2 MeV)^(-5)`.

The [script](casimir-dp-exothermic-mediator-survival-2026-09-07.py) authenticates the common-rate inputs and inverts this approximate relation for the diagnostic requirement tau>=4.35e17 s. Results are in [JSON](casimir-dp-exothermic-mediator-survival-2026-09-07.json).

| Dark mass | Gap | Electron pair | Required r sqrt(F), at most |
|---|---|---|---|
| 10 GeV | 3.281 MeV | Open | 2.78e-5 |
| 15 GeV | 2.270 MeV | Open | 6.99e-5 |
| 40 GeV | 1.006 MeV | Closed | Not constrained by this channel |
| 100 GeV | 0.551 MeV | Closed | Not constrained by this channel |

This is a requirement, not a predicted lifetime or experimental exclusion. It inherits the approximate published normalization, leaves F uncomputed, and neglects additional decay modes. A lifetime equal to the chosen age preserves only exp(-1) of an initially excited population without replenishment; it cannot justify the previous f*=1 assumption. Keeping an appreciable fraction may require a longer lifetime. Indirect bounds can be stronger. Below the pair threshold, radiative and other channels still require calculation.

At fixed observed-strength product sigma_b f*, decreasing f* requires increasing sigma_b and tightens the r sqrt(F) ceiling as sqrt(f*). Population depletion cannot be repaired by rescaling only the scattering strength without revisiting decay.

Next choose explicit anomaly-canceling matter and a renormalized mixing boundary, evaluate its electron and proton effects at the relevant timelike/spacelike momenta, and propagate survival into both target rates. No completed mediator, lifetime, allowed region or experimentally validated common model is claimed. Frozen apparatus unchanged; goal active.

Validation: pair thresholds and algebraic lifetime inversion checked; root-leaf documentation validation separate.
