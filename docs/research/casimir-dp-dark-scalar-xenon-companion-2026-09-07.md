# Scalar elastic xenon companion to the coherence pilot

Program gate: S1, exploratory common-kernel screening.
No experimental validation, fitted normalization, or model admission.

## Result

The scalar added to the symmetric dark-sector pilot must scatter elastically from xenon as well as the diamond sphere. This packet calculates that previously omitted companion using precisely the scalar masses and angles in the authenticated sphere JSON. It preserves the physical scalar vertex convention, splitting-derived Yukawa, frozen halo and 2.84 tonne-year exposure. The model therefore contains both vector-mediated exothermic recoils and scalar-mediated elastic recoils. Their distinct outgoing dark states make these channels incoherent in this leading calculation. No detector fit has yet combined them.

At scalar mass 1 eV:

| Dark mass | Mixing angle | Raw elastic Xe, 5.4–269.9 keV | Raw elastic Xe, 200–269.9 keV |
|---|---:|---:|---:|
| 40 GeV | 3e-10 reference | 1.37995e-12 | 0 |
| 100 GeV | 3e-10 reference | 2.37394e-13 | 2.77526e-20 |
| 40 GeV | 0.00188024 formal sphere target | 54.2057 | 0 |
| 100 GeV | 0.00542635 formal sphere target | 77.6653 | 9.07946e-6 |

About 99.64% and 98.69% of the formal-target raw elastic counts respectively lie below 30 keV within this window. The sphere-target angles remain invalid extrapolations of Born sphere scattering; calculating their nuclear companions does not repair that failure. The table is a consistency diagnostic, not a successful common prediction. At the reference angle both target signals are tiny. The 0.1, 10 and 1000 eV cases and five recoil bins are retained in JSON.

## Kernel and checks

With E in natural energy units, the leading scalar cross section is d sigma_A/dE = mA A² F_Helm(q)² |C(q)|² / (2 pi v²), q²=2mA E. Here C(q)=y (0.3 mN/vEW) sin(theta) cos(theta) [1/(q²+ms²)-1/(q²+mh²)]. The rate folds the same truncated shifted halo inverse-speed moment and isotope abundances used by the exothermic contact benchmark. y=splitting/(2w), w=500 GeV, mh=125 GeV, vEW=246.2 GeV. Total elastic density is conditionally 0.3 GeV/cm³; to leading order the two diagonal Yukawa magnitudes agree, so elastic flux is not multiplied by an assumed excited fraction.

An independent normalization check replaces C(q) with a constant and compares this isotope spectrum with the inherited contact-rate implementation at zero splitting. Maximum relative discrepancy is 9.09e-13. Every bin is nonnegative. This validates implementation consistency and unit conversion, not the material response or model completion. Leading nonrelativistic, isoscalar nucleon and Helm approximations remain explicit; spin-dependent, electron, binding and loop contributions are not included.

## Interpretation and next decision

This supplies a new falsifier: a proposed large local scalar effect cannot be considered independently of the lower-energy xenon spectrum. The existing exothermic reference yields roughly six raw events, so the additional scalar channel at formal target angles is not a negligible correction. Those raw reference numbers are not an LZ best fit. A full comparison requires a common parameter set, both spectral components, response migration, efficiencies, backgrounds and population survival.

The [LZ release paper](https://arxiv.org/abs/2609.02823) was rechecked this turn. Its linked [HEPData release](https://doi.org/10.17182/hepdata.182472.v1) could not be loaded by the browser tool. This is an access failure, not evidence that the release is absent. The [paper and supplement](https://arxiv.org/html/2609.02823v1) describe the statistical analysis. The chosen truth-energy endpoints must not be treated as hard acceptance boundaries; these integrals are neither accepted counts nor an upper bound on them. No confidence exclusion follows from their size alone.

Next priority: incorporate both channels into an authenticated detector response when available; meanwhile demand a valid scattering calculation and external constraints before seeking a larger local signal. The independent scalar mixing parameter also means the xenon exothermic normalization alone does not determine coherence. Homogeneous single-history loss still need not survive the apparatus four-cell subtraction.

## Reproduction

Run the companion Python file. It authenticates the common-rate script and sphere JSON before using their data. It writes the five-bin prediction and normalization checks to JSON.

- `py` SHA256: `28c796b429bf709b2621fe1ab4722e4ac6df384e1e08287b2a32070cc287a582`
- `json` SHA256: `ad108d4c81faadf114e786cb68c0babe833eeaf150550f5633734e9582e8f9ab`
