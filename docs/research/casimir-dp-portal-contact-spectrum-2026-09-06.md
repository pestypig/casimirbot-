# Matched scalar portal: unavoidable heavy-contact xenon spectrum

Program gate: S1 — common interaction definitions and screens.
Workstream: Independent exploratory Casimir–DP / LZ comparison.
Capability or component: Heavy-contact xenon spectrum from the previously matched portal.
Current maturity: Exploratory, conditional tree-level nuclear prediction.
Target maturity: Reproducible spectrum and explicitly limited count screen.
Required frozen inputs: Authenticated Higgs-matched portal packet; inherited isotope and halo definitions; canonical local baseline unchanged.
Required evidence: Cross-section normalization, independent speed integral, finite-propagator check, count inversion.
Stop/fail criteria: No detector-fit claim from raw counts; no separate fitted local coupling; no whole-solid response inferred from nuclear response.
Explicit non-goals: No event identification, full portal exclusion, local residual claim, hardware admission or certification.
Downstream gate unlocked: Common-coupling local response calculation and differential experimental recast; S1 remains open.

## Result

The heavy scalar exchange that survives suppression of the light portal produces very few high-energy recoils at the illustrative matched parameters. At dark-matter mass 1 TeV it predicts 0.208 raw events in 5.4–269.9 keV and 0.000228 raw events in 200–270 keV. Scaling this component to one expected raw high-window event produces about 913 events in the wider window. The deliberately loose all-count screen does **not** reject that normalization. This is a calculable component of the shared model, not a completed explanation of either experiment.

The high window is **true nuclear recoil energy**; it is not a reconstructed selection around the reported event. LZ reports an unresolved high-energy nuclear-recoil-like event and analyzes multiple samples; this calculation uses its 2.84 tonne-year exposure and previously audited all-sample count union. The paper does not establish dark matter. [LZ primary study](https://arxiv.org/html/2609.02823v1).

## Frozen matching and normalization

The authenticated [Higgs-decay screen](casimir-dp-portal-higgs-decay-screen-2026-09-06.md) supplies the physical-Higgs-matched contact coefficient, at b = 100 GeV, yχ = −0.1 and mS = 1000 GeV:

`CχN = 1.8017705314359717e-10 GeV^-2`.

For `L = CχN (χbar χ)(Nbar N)`, take the explicit isoscalar one-body nuclear approximation `Cp = Cn`. With reduced mass μN, nonrelativistic spin averaging gives

`σN = μN² CχN² / π`,

`dσA/dE_keV = CχN² A² mA F_Helm(q)² / (2π v²) × 10^-6`.

The second expression is in GeV^-2 per keV when masses are in GeV and v is dimensionless. Convert with 0.3893793721e-27 cm²/GeV^-2. Integrate the inverse-speed halo moment η(vmin), where vmin = sqrt(2mA E)/(2μA), against natural xenon isotope fractions. Use density 0.3 GeV/cm³ and the six previously frozen shifted-halo scenarios. Scalar two-body nuclear currents, isospin differences and nuclear form-factor uncertainty are not included.

Reducing κ to the conditional invisible-Higgs ceiling leaves this tree-level heavy coefficient unchanged. The mass scan changes χ mass while retaining yχ and the scalar sector; it does not constitute a relic-density or collider-global fit. The light exchange, loop matching and any interference are outside this **heavy-component** spectrum.

## Numerical predictions

Central halo: (v0, vesc, vEarth) = (238, 544, 250.2) km/s. Counts precede acceptance and reconstruction.

| χ mass (GeV) | σN (cm²) | Raw 5.4–269.9 keV | Raw 200–270 keV | Wider/high ratio | Raw high at conditional count ceiling |
|---:|---:|---:|---:|---:|---:|
| 100 | 3.4821e-48 | 1.63862 | 0.0000675661 | 24,252.1 | 0.155621 |
| 200 | 3.5147e-48 | 0.951861 | 0.000360028 | 2,643.85 | 1.42751 |
| 1000 | 3.5411e-48 | 0.208237 | 0.000228043 | 913.146 | 4.13310 |

The [machine-readable results](casimir-dp-portal-contact-spectrum-2026-09-06.json) contain all 18 mass/halo combinations. These scenarios are sensitivity variations, not a statistical halo confidence region.

The inherited conditional screen uses N = 1831 across disjoint samples and the exact one-sided 90% Poisson upper mean U = 1887.0624687873465. If the selected-sample union accepts at least 50% of the raw wider-window signal, nonnegative backgrounds imply the conservative condition `0.5 F(C) <= U`. The nominal 50% floor is an assumption, **not** a profiled lower-confidence efficiency envelope. Accordingly `Cmax = |C| sqrt[U/(0.5 F)]`, and `Hmax = U H/(0.5 F)`. A 40% floor increases the rate ceilings by 25%.

At 1 TeV the screen gives Cmax = 2.42565e-8 GeV^-2. This is a single-component conditional bound: increasing C also changes the full portal and requires rechecking its other constraints. Since the high-window ceiling exceeds one for 200 GeV and 1 TeV, total counts alone cannot demonstrate overproduction at a one-expected-high-event normalization. Conversely a predicted mean below one is not, by itself, a statistical rejection of an observed event.

## Verification and next discriminant

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-contact-spectrum-2026-09-06.py`.

Five checks pass: free-nucleon integrated normalization; independent direct speed folding; positive energy-window counts; finite-heavy-propagator correction; and inversion of the conditional count ceiling. The maximum direct-fold relative error is 1.37e-9. For the two mixed heavy scalars, the exact off-diagonal propagator/contact amplitude ratio is `mh² mH² / [(mh²+q²)(mH²+q²)]`; its rate correction remains below 8.89e-6 over this window. That validates the contact approximation for this component, not the other model assumptions.

The next joint-model calculation must carry the same heavy coupling into the sphere's material response, distinguishing independent nuclear kicks from coherent low-momentum scattering and loss from the accepted ensemble. Light-mediated contributions need their own matched propagator and boundary-dependent background. An LZ exclusion stronger than this count screen needs differential response and background information; neither a shape impression nor the single anomalous event supplies that likelihood. No frozen DP parameter has been retuned, and no measured local excess is assumed.
