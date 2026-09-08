# Common-halo photon-dipole prediction components

September 6, 2026. Exploratory S1 calculation. Same reference magnetic moment and incident population for both targets; no independent target normalization. No full response, detector fit, exclusion or experimental validation claim.

## Result

The single-speed photon benchmarks are now supplemented by a shared shifted, truncated Maxwellian halo. With mu_chi=10^-6 GeV^-1 and rho_chi=0.3 GeV/cm³, the central halo gives:

| DM mass (GeV) | Raw Xe 5.4–270 keV | Raw Xe 200–270 keV | D_density,grid ceiling | D_spin-bubble,grid ceiling |
|---|---|---|---|---|
| 100 | 322.91 | 0.0028293 | 2.971e-29 | 2.033e-26 |
| 200 | 173.77 | 0.0125685 | 1.486e-29 | 1.017e-26 |
| 1000 | 36.704 | 0.0075380 | 2.972e-30 | 2.033e-27 |

Xenon exposure remains 2.84 tonne-years with unit efficiency and the inherited approximate charge and nuclear-magnetic responses. Diamond retains the frozen mass and 0.25 s hold, with the existing finite-grid density and independent-electron spin approximations. Each D ceiling is 2 times its own predicted count, not an exact directional coherence result.

At 1 TeV, spin-bubble D per raw full-window Xe event is <=5.539e-29; per raw high-window event it is <=2.697e-25. Across the six selected halo scenarios, the latter ranges from 2.677e-25 to 2.702e-25. At 100 GeV, closer to the high-recoil threshold, it ranges from 6.086e-24 to 1.021e-23. These are scenario ranges, not statistical confidence intervals or exhaustive halo uncertainty bounds.

The full/high xenon count ratio is about 114,132 at 100 GeV, 13,826 at 200 GeV and 4,869 at 1 TeV. Therefore, assigning one expected high-window signal event would also assign many full-window events in this approximate response model. That is a concrete spectral consistency test, not permission to set the observed anomaly equal to one expected signal event. Actual acceptance, backgrounds and likelihood remain necessary.

The finite-grid spin/density ratio becomes about 684 at 1 TeV, rather than about 148 for the previous 776 km/s shell: the two components weight velocities differently. This neither rescues a comparator-sized local effect nor establishes that omitted channels are negligible.

## Shared velocity calculation

For normalized laboratory speed density f(v), define

`eta(u) = integral_u^vmax f(v)/v dv`,

`H(u) = integral_u^vmax v f(v) dv`.

Speeds in the calculation are dimensionless fractions of c. The central tuple (v0,vesc,ve) is (238,544,250.2) km/s. Separate scenarios vary v0 to 220, vesc to 528 or 560, or ve to 265.1 or 235.3 km/s. These reproduce the earlier L10 halo scenario choices. The escape/Earth-speed and density baseline also appears in [QCDark2's halo setup](https://arxiv.org/html/2603.12326v1). All scenarios use one distribution for both targets.

For diamond energy w and momentum q, u=w/q+q/(2m_chi). Replace the mono-speed density weight `(v²-u²+q²/(4m_chi²))/v` by

`H(u) - [u²-q²/(4m_chi²)] eta(u)`.

The independent spin-bubble weight 1/v becomes eta(u). The density component uses the authenticated composite ELF and the spin approximation uses the authenticated separate no-LFE Im(epsilon); they remain distinct approximations with the limitations in their original packets.

For xenon, the charge recoil term uses `H(u_N) - [E/(2m_N)+E/m_chi] eta(u_N)` and the nuclear magnetic term uses eta(u_N), with `u_N=q/(2 reduced_mass)`. The inherited natural isotopic mixture and nuclear moments are unchanged; G_M=Helm is still a phenomenological assumption. No detector-acceptance function is invented.

## Reproduction and evidence

Run `python docs/research/casimir-dp-photon-shared-halo-2026-09-06.py`. The companion JSON contains 18 mass/halo cases. Frozen dependencies and both material blobs are authenticated. The loader executes only earlier definitions, never earlier output-generating sections.

Five checks pass: velocity moments against direct integration (maximum sampled relative difference 4.72e-8); xenon at 248 keV against direct folding of the earlier speed-dependent kernels; the density kernel against direct speed integration; positive nested Xe windows; and positive material components. Halo normalization is also asserted. These checks verify folding and normalization, not nuclear/material accuracy. A NumPy scalar serialization issue was corrected during implementation before producing the final artifact.

The common halo is an advance toward a shared forward model, but does not close S1: orbital-current and interacting/low-energy response, missing material tails, propagation, detector likelihood, external constraints, event survival and the canonical boundary-controlled observable remain unresolved. The geometric support screen still distinguishes sphere-local from explicitly extended comparator-sized leads. A model predicting a small local signal remains a valid possible outcome.
