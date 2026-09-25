# IDM benchmark vs. supplied gamma-ray claims

Date: September 25, 2026. This source audit checks the LZ-motivated IDM point against the user-supplied indirect-signal candidates. It is not a gamma-ray likelihood or spectral fit.

## What the IDM LZ paper actually establishes

The profile best fit is `mH = 1080 GeV`, `mA - mH = 369 keV`, `mH± - mH = 8.17 GeV`, `lambdaL = -1.92e-4`, `lambda2 = 4.06`, and `OmegaH h² = 0.12014`. The paper uses micrOMEGAs 7.1.4 to calculate the relic density, present-day annihilation cross section and elastic rate, and applies combined dwarf-galaxy constraints from Fermi-LAT, HAWC, H.E.S.S., MAGIC and VERITAS. Its surviving parameter region is reported to receive little additional exclusion from those dwarf limits.

That is useful evidence that this *single-component IDM scan* was checked against an established indirect-search envelope. It does not provide a reusable channel-resolved photon spectrum or a numerical present-day cross section for the LZ profile point in the paper's text/tables. It also does not constitute a fit to the separate gamma-ray claims below.

## Comparison with the supplied signals

| Signal claim | Comparison with `mH = 1080 GeV` IDM point | Result |
|---|---|---|
| Cluster line at 43.2 GeV | A direct two-body `γγ` annihilation line would be at 1080 GeV; a `γZ` line is about 1078 GeV. A simple two-photon decay at rest would put each photon near 540 GeV. | The standard direct-line interpretations do not match the cluster line energy. A cascade or different parent would be a different model. |
| Milky Way continuum fit by 0.5–0.8 TeV `b b̄` | The IDM mass is 1.35–2.16 times this fitted mass range. The IDM paper's point has no published channel-resolved spectrum or numeric cross section in the main text/tables. | A broad continuum overlap cannot be assessed from mass alone; no common fit is established. |
| Galactic Center Excess source-count analysis | This is a diffuse-emission versus unresolved-source inference, not an IDM-specific photon spectrum. | It supplies a background/source-population test, not a matching IDM signal. |

For the illustrative `fH = 0.9` co-tracing mixture used by the existing overlay, annihilation intensity would scale as `fH² = 0.81` only if the heavy fraction is spatially constant. The actual prediction needs the heavy component's density-squared line-of-sight integral. The star-forming ultralight field cannot be assumed to inherit the IDM paper's photon spectrum or dwarf limits without a shared production and spatial model.

## Next gate

Keep the IDM benchmark as a conditional xenon-plus-dwarf-compatible comparator, not as an explanation of the supplied gamma signals. To test it against the continuum claim, recover or independently rebuild the benchmark's `micrOMEGAs` point and channel yields, then forward-fold those yields through the same Milky Way foreground/halo analysis used by the excess paper. Preserve the 43.2 GeV line as a separate hypothesis unless an explicit cascade or different parent is supplied. Do not borrow the high `b b̄` rate from the 0.5–0.8 TeV interpretation for the 1.08 TeV IDM point.

The current workspace contains neither the model card nor a `micrOMEGAs` executable, and the IDM paper does not release channel spectra in its text/tables. Therefore the exact same-parameter gamma comparison is unresolved. This is an input gap for this calculation, not evidence that the models conflict or agree.

## Reproduction and sources

Run `python docs/research/casimir-dp-idm-gamma-channel-crossaudit-2026-09-25.py` to regenerate the adjacent [JSON](casimir-dp-idm-gamma-channel-crossaudit-2026-09-25.json). The script pins local upstream packet hashes and checks the line kinematics, mass ratio and conditional `fH²` scaling.

Sources: [IDM/LZ benchmark and indirect-search treatment](https://arxiv.org/html/2609.06571); [cluster 43.2 GeV line analysis](https://arxiv.org/html/2407.11737); [Milky Way continuum analysis](https://arxiv.org/html/2507.07209); [user-supplied gamma-ray intake and caveats](casimir-dp-dark-matter-annihilation-paper-intake-2026-09-24.md).
