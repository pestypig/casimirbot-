# Static-response continuation sensitivity — 2026-09-07

Exploratory S1 sensitivity audit, not an authenticated silica response or
physical stopping bound. The two-mediator products remain fixed.

## Source distinction

[Barker et al., arXiv:2608.05282v1, equations 10–12 and Fig. 2 discussion](https://arxiv.org/html/2608.05282v1)
discuss a large-momentum static dielectric approximation proportional to q^-4.
Their nonrelativistic model is not extrapolated indefinitely: they instead
hold its value fixed beyond 200 keV as an illustrative conservative treatment
of an uncertain regime. The paper's DFT calculation is for silicon, not our
silica path or diamond experiment. Its plotted curve is not downloaded or
reproduced here, and its continuation is not a rigorous relativistic envelope.

## Conditional moment inequality

For a positive ground-state electronic response with known static dielectric,
the accessible first energy moment obeys both its full f-sum bound and
omega_max(q)^2 times the inverse-frequency sum. Relative to the electronic
f-sum integrand, the combined factor is

`min[1, omega_max(q)^2/omega_p^2 * (1 - 1/epsilon(q,0))]`,

where omega_max=q*v-q^2/(2*m_chi). This statement requires a supported static
response; it does not manufacture one from the inequality.

The script tests a trial epsilon-1=4*m_e^2*omega_p^2/q^4, with illustrative
omega_p=30 eV. It compares unchecked continuation with constant epsilon beyond
100 or 200 keV. The 100-keV variation is our sensitivity choice. None of the
trial curves represents validated low-q material data or a justified high-q
relativistic response. Electron count per gram uses the prior silica formula.
Only the electronic component is treated; this is not the earlier total-charge
sum including nuclei.

## Formal initial-speed envelopes at the chosen 7e9-g/cm2 path

| Mediator masses | Electronic f-sum only (keV) | Trial frozen above 200 keV (keV) | Unchecked q^-4 to endpoint (keV) |
| --- | --- | --- | --- |
| 1 keV / 1 GeV | 26.0859 | 24.2124 | 0.002022 |
| 100 keV / 1 GeV | 26.0266 | 24.2103 | 4.483e-6 |
| 10 MeV / 1 GeV | 26.0555 | 24.2814 | 5.826e-10 |

The dramatic suppression from indefinite q^-4 continuation is not an allowed
conclusion about real stopping. The frozen trial still leaves a loose envelope
for this 100-GeV projectile. Neither saturating the larger envelope nor adopting
the smaller one establishes captured supply. A 24-keV upper envelope is not a
prediction that 24 keV is actually lost.

Checks include positive factors bounded by one, quadrature refinement, and
recovery of the electronic share of the previous analytic f-sum envelope.
The normalization recovery exposed and corrected a missing electron inverse-mass
factor during implementation before these retained results were recorded.
No prior immutable packet is changed by that implementation correction.

## Consequence and next input

The sum-rule route precisely identifies the unresolved assumption rather than
closing electronic stopping: static or dynamic charge response must be supplied
with a controlled large-q treatment. The next useful calculation should use
actual electronic states or a justified relativistic response in the accessible
energy range, with finite-temperature applicability addressed. Do not infer
those data from the trial continuation or claim a stronger bound by extending
an approximation beyond its stated domain.

No material-specific capture rate, detector fit, local-density supply,
experimental exclusion, certified proof or measurable common signal is claimed.
