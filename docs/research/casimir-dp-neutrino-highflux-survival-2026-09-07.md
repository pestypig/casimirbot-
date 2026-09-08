# Separate high-energy atmospheric survival contribution

Exploratory snapshot, September 7, 2026. This packet computes a finite high-energy contribution under the existing conditional decay model. It does not provide a calibrated flux splice, accepted LZ event count, or exclusion.

Inputs are the hash-pinned [NuFlux intake](casimir-dp-neutrino-highflux-intake-2026-09-07.md), [flight integral](casimir-dp-neutrino-flux-survival-2026-09-07.md), and its inherited narrow-slice decay widths. Couplings, natural-xenon response, true recoil window 202–269.9 keV and 2.84 tonne-year exposure are unchanged. We use the NuFlux total atmospheric tables, without adding their conventional or prompt subsets again.

The overlap first shows why an arbitrary continuity normalization would be inappropriate. At 1, 2, 5 and 10 TeV, the ratio of NuFlux integrated outside its horizon gap to the archived all-sky DUNE flux is 0.9335, 1.0005, 1.1284 and 1.2883. These calculations have different angular and flavor coverage as well as different model inputs. Those ratios are diagnostics, not confidence limits or a measured correction to either source. No normalization has been retuned.

For each benchmark and hypothetical path, we integrate NuFlux separately from 10 TeV to 100 PeV. It retains its symmetric unattenuated hemispheres and omits abs(cos(theta)) < 0.0174524. The separately recorded downward contribution is half by construction under these assumptions; the upward half has not been propagated through Earth. The comparison below uses the mean conditional pion-slice width, not a marginalized full-width uncertainty.

| m_chi / m_phi (GeV), 10 cm path | Previous surviving contribution below 10 TeV | Separate high-energy contribution | High / previous |
|---|---:|---:|---:|
| 1 / 1 | 8.52231e-16 | 1.33969e-17 | 0.01572 |
| 1 / 10 | 2.44977e-15 | 1.76381e-17 | 0.00720 |
| 2 / 10 | 4.21105e-18 | 5.47245e-18 | 1.29955 |

The 2 GeV case confirms the earlier cutoff warning: its previously omitted contribution is comparable to and larger than the low-range value. Nevertheless both pieces remain extremely small at these fixed benchmark couplings and paths. This is not a statement that their sum is a fully qualified local prediction. The 10–100 TeV decade supplies more than 99.9% of the new contribution in all three cases. The JSON also records 1 mm and 1 cm paths and every decade through 100 PeV.

The calculation extends atmospheric energy coverage without restoring long-flight viability in the investigated prescription. It does not bound an astrophysical component, the omitted horizon belt, or energies above 100 PeV. Inelastic Earth interactions can redistribute energies as well as remove neutrinos, so the unattenuated result is not promoted to a rigorous propagated upper bound. The source-mass dispersive approximation, subtraction uncertainties and upstream matrix-solution questions remain inherited limitations.

Numerical checks cover positive finite contributions, joint energy/recoil quadrature refinement, interpolated versus directly evaluated angular flux, and decreasing survival with longer paths. All four pass. The primary spline reader's 13.3 ppm reference discrepancy remains unchanged; this packet does not claim to improve it. Parent definitions are loaded without rerunning archived outputs. Ordinary research-document validation applies.

Next useful mechanism test: vary the common coupling product consistently in both production and decay, rather than assume increased production can be obtained while holding the lifetime fixed. The resulting competition can identify the best possible prescribed-path surviving rate before investing in a detailed cascade model. Decaying events still require daughter transport and detector response; they cannot be discarded by the survival calculation alone. The frozen local coherence comparison remains separate and no measured residual is asserted.

Reproduce with the sibling Python script; detailed numerical results are in the sibling JSON.
