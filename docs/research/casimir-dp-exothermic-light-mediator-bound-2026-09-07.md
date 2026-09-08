# Exothermic single-light-mediator envelope

Exploratory conditional bound. The previous goal turn made progress by optimizing the isotope response over constant proton/neutron ratios. This packet extends that screen to any nonnegative mass of a single common mediator. No frozen apparatus or scattering kinematics are changed.

## Why the light limit is finite

Multiply the earlier coherent vector amplitude by a common propagator 1/(q^2+mV^2), with q the spatial momentum in the nonrelativistic recoil approximation. The use of such light-mediator propagators with exothermic scattering is discussed in [Geng, Huang and Lee](https://arxiv.org/abs/1705.06546); their operators and experimental exclusions are not imported here.

An exothermic energy release d>0 imposes qmin=mu(sqrt(vmax^2+2d/mu)-vmax), equivalently 2d/(sqrt(vmax^2+2d/mu)+vmax). Both expressions are independently checked. The carbon minimum is 172.64, 154.39, 111.45 and 81.96 MeV for dark masses 10, 15, 40 and 100 GeV. These are nuclear recoils with substantial momentum, not an arbitrarily soft scattering channel.

## Bound valid for every constant charge ratio

Every isotope/event weight is nonnegative, including its squared interfering proton/neutron amplitude. For C denoting carbon events and X the archived raw xenon window integral, positivity gives

(C_m/X_m)/(C_contact/X_contact) <= [(qXe_max^2+mV^2)/(qC_min^2+mV^2)]^2.

For any mV>=0 this is at most max(1,(qXe_max/qC_min)^4). The largest xenon momentum over contributing isotopes in the specified window is 261.38 MeV. Multiply this envelope by the previous generalized-eigenvalue charge-ratio bound. Taking separate maxima can overestimate the jointly attainable value, which is appropriate for this permissive ceiling. An arbitrary common coupling normalization cancels; no divergent zero-mass reference cross section is assigned.

| Dark mass (GeV) | Additional mediator envelope | Combined charge/mediator envelope | Local D ceiling at reference raw Xe |
|---|---|---|---|
| 10 | 5.255 | 1000.77 | 1.346e-21 |
| 15 | 8.216 | 1543.58 | 1.453e-21 |
| 40 | 30.257 | 5514.15 | 1.920e-21 |
| 100 | 103.433 | 18523.19 | 2.302e-21 |

Thus neither a light mediator nor its combination with arbitrary constant isospin tuning can reproduce the frozen D=0.0295115 forecast at the selected raw xenon normalization in these four benchmarks. Even the permissive ceiling is more than 19 orders lower. This is a conditional model-class comparison, not an experimental exclusion or proof that the local forecast is a measured effect. A different raw xenon normalization scales these ceilings proportionally.

## Scope and next lead

Assumptions: one spacelike propagator common to proton and neutron amplitudes; constant charges; same halo and exothermic gaps; positive independent-isotope response with the archived Xe Helm form factor; independent carbon elastic-nucleus F=1 bound. The result uses the nonrelativistic propagator approximation and does not cover all nuclear final states or correlated solid dynamics. It does not cover multiple mediator interference, momentum-dependent charge ratios, derivative operators, a separate elastic transition, or a different population. Very light vectors can also open real-vector dark decays; allowing their masses in this algebraic envelope does not establish survival. Such restrictions cannot enlarge the bounded response ratio within the stated class.

Next prioritize whether a single microscopic completion supplies a distinct low-momentum elastic channel correlated with the xenon-producing inelastic channel. Its coupling must be derived, not assigned independently to fit the apparatus. This is a more substantive escape from the demonstrated exothermic recoil floor than continuing to vary the same propagator mass.

## Reproduction

Run `python docs/research/casimir-dp-exothermic-light-mediator-bound-2026-09-07.py`. It authenticates the archived common-rate script and mixed-target JSON, checks the two endpoint formulas, and scans mediator masses against the analytic envelope. The inequality follows from positivity; the finite scan alone is not its proof. `npm run validate:physics:root-leaf` checks documentation separately. No runtime, GR or certificate changes; no model admission.
