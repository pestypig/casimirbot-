# Coupling-independent neutrino spectral screen

Exploratory calculation, September 7, 2026. This tests a substantive feature of the [shared neutrino benchmark](casimir-dp-neutrino-joint-2026-09-07.md) before adjusting any signal strength.

## Result

Across produced masses 0.7, 1, 1.5, 2 and 3 GeV and mediator masses 0.1, 1 and 10 GeV, the raw ratio

`R = N(5.4–202 keV) / N(202–296 keV)`

is **14.1620–224.335**. The common coupling factor cancels in this ratio under the declared weak-scattering model. Both windows use true recoil energies and the pinned DUNE flux through 10 TeV. These are 15 sampled points, not a continuous parameter-space exclusion.

The [source proposal](https://arxiv.org/html/2609.04185v1) sets its high-window expectation to one and gives two inconsistent low-window cuts: equation 10 implies fewer than 0.1713 events, while its Figure 2 caption implies fewer than 1.713. No sampled raw spectrum meets either surrogate. This comparison does not make either cut an authenticated detector likelihood. The flavor-inclusive final-state extension, nuclear prescription and quark inputs remain those of our explicit model.

Because the underlying low-energy background is large, predicting tens of low-window signal events does not itself establish exclusion. The source's stringent fractional-background choices must not be confused with an actual statistical bound. A detector response and background fit are still required to determine compatibility with LZ data.

## Why an artificial incident cutoff matters

At produced mass 2 GeV and mediator mass 1 GeV, changing only the upper incident integration limit gives:

| Incident cap | Raw low-window count | Raw high-window count | Low/high |
|---|---:|---:|---:|
| 5 GeV | 0 | 0 | Undefined |
| 10 GeV | 0.000498884 | 0.000916132 | 0.544554 |
| 20 GeV | 0.0132983 | 0.00169987 | 7.82308 |
| 100 GeV | 0.0273405 | 0.00175099 | 15.6143 |
| 10 TeV | 0.0274149 | 0.00175107 | 15.6561 |

The 10 GeV cap would make the ratio pass the looser caption surrogate, even though the full tabulated spectrum fails it. It removes neutrinos that can populate low recoils while the high-window count is already nearer saturation. The 5 GeV cap produces no events in either window; no zero-over-zero ratio is reported as a successful shape.

This is a diagnostic change, not a physical flux cutoff or a revised candidate. A decreasing flux cannot be replaced by zero at a convenient energy. The table does not establish which numerical cutoff the source implementation actually used; that implementation was not retrieved.

For perspective, reconciling even the smallest raw ratio with the looser surrogate by efficiencies alone would require the signal-weighted low/high acceptance ratio below about 0.121 (below 0.0121 for the stricter surrogate), assuming negligible migration and one accepted high-window event. These are requirements derived from the ratio, not measured acceptance values. Energy migration, outgoing-state rejection and backgrounds require explicit modeling instead of a uniform efficiency factor.

## Consequence for lead priority

The proposed isolated-event shape is not reproduced automatically by our physically extended atmospheric spectrum. Before investing in a local visibility calculation beyond the existing small upper estimate, prioritize detector-folded spectral compatibility and the outgoing state's survival. Do not tune the common coupling to one high event and then ignore the low tail. The lead remains a competing conditional model, not an admitted explanation of either experiment.

The [script](casimir-dp-neutrino-shape-screen-2026-09-07.py) authenticates parent definitions and records [the scan and cutoff diagnostic](casimir-dp-neutrino-shape-screen-2026-09-07.json). Four checks pass: full-spectrum ratio refinement, agreement of the full cap with the original kernel, positive full-flux windows and monotonic counts as the cap increases. Cutoff rows use increased recoil quadrature order; a complete cutoff convergence envelope is not claimed. Root/leaf validation passes. No gate promotion.
