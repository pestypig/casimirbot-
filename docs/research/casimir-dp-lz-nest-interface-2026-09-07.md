# LZ NR source interface mapping — 2026-09-07

Exploratory research only. The measurable-in-both objective remains active;
this packet supplies a detector-response prerequisite, not a qualified shared
parameter point, measured coherence residual, or dark-matter identification.

## Source and mapping

[LZ supplementary equation 5 and Table S5](https://arxiv.org/html/2609.02823v1)
link to NEST v2.4.5beta. The inspected tag resolves to commit
`19bc9bc063c62961d2f190beec2db16a9e279aa1`.
[GetYieldNR source](https://github.com/NESTCollaboration/nest/blob/19bc9bc063c62961d2f190beec2db16a9e279aa1/src/NEST.cpp)
has SHA256 `29ba21cbd1b37be5c30a232db906ed2e433833e11574beec865072b16f9c5173`.

Its 12-element parameter order is alpha, beta, gamma, delta, epsilon, zeta,
eta, theta, iota, p, f1, f2. To represent the paper's correction, the caller
must supply index 9 as p(E): 0.5 at or below 74.7 keV, otherwise
0.5 + 0.0230 ln[1 + 0.0289(E − 74.7)], using E numerically in keV.
The additional a, b, E0 table entries are inputs to this external mapping;
appending them to a constant-p vector does not apply the correction in
GetYieldNR. This is an inference from paper and source, not authentication
of the LZ analysis wrapper. No upstream source change is proposed.

## Reproducible conditional result

The companion Python script checks the previous parameter receipt hash,
constructs the vectors, and verifies continuity and below-break invariance.
It does not execute NEST. For identical remaining settings, the inspected
charge-yield expression gives

`Qy[p(E)] / Qy[0.5] = (E + 10.8)^(-(p(E) - 0.5))`.

| True recoil energy (keV) | Charge-yield ratio |
| --- | --- |
| 74.7 | 1.0000 |
| 100 | 0.9423 |
| 200 | 0.8283 |
| 248 | 0.7952 |
| 269.9 | 0.7823 |

At 248 keV this is a 20.48% reduction relative to constant p. It is not a
20.48% reduction in reconstructed energy or event acceptance. Photon yield,
quanta fluctuations, detector gains, corrections, and selection still matter.

## Next dependency

Extend transport below the current true-200-keV capability stopping rule
before folding any reconstructed high-energy response: lower true energies
can migrate upward. Authenticate applicable LZ detector and fluctuation
settings, parameter uncertainties, and selection response. An available
generic or WS2024 detector header alone does not establish their identity.
Do not substitute the event's quoted uncertainty for a Gaussian response
kernel. Then compare the full predicted spectrum, not one raw count, while
retaining the independently constrained local coherence and population budget.

Validation here is limited to the mapping checks. No accepted counts,
likelihood reconstruction, physical viability, or exclusion is claimed.
