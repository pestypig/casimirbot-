# Flux-weighted survival with prescribed flight paths

Exploratory snapshot, September 7, 2026. This is a conditional flight calculation, not an LZ event selection, exclusion, or all-energy bound.

The [joint production kernel](casimir-dp-neutrino-joint-2026-09-07.md) and [conditional dispersive slice](casimir-dp-neutrino-dispersive-basis-2026-09-07.md) now enter the same integral. The natural-xenon isotope mixture, 2.84 tonne-year normalization, scalar couplings, and incident flavor contract are unchanged. This packet uses the archived DUNE site-proxy flux through 10 TeV and the source-common-pion-mass width prescription. It does not change the canonical local apparatus.

At each true recoil T, incident energy E and isotope mass M, we integrate above the exact production threshold with

```text
E_chi = E - T
beta_gamma = sqrt((E-T)^2 - m_chi^2)/m_chi
P(L,E,T) = exp[-L Gamma_slice/(hbar c beta_gamma)]
N_surv(L) = exposure * sum_isotopes integral dT dE flux(E) dSigma/dT P.
```

The true-recoil interval is 202–269.9 keV. Widths are the means of the previously archived phase-sample partial widths, with extrema evaluated separately as sensitivity checks. Averaging widths before exponentiation is a specified reference prescription, not marginalizing a theoretical uncertainty distribution. Full hadronic uncertainty is still missing.

| m_chi / m_phi (GeV) | Raw production | Surviving fraction at 1 mm | At 1 cm | At 10 cm |
|---|---:|---:|---:|---:|
| 1 / 1 | 0.0496095 | 4.1544e-6 | 3.3911e-10 | 1.7179e-14 |
| 1 / 10 | 0.0550756 | 9.7884e-6 | 8.2315e-10 | 4.4480e-14 |
| 2 / 10 | 0.00103356 | 3.7546e-6 | 2.4315e-10 | 4.0743e-15 |

All path lengths are hypothetical distances through which chi must remain undecayed. No geometry or event-position distribution is asserted. These fractions are relative to raw production in the same energy-truncated calculation. They cannot multiply the entire LZ analysis without a geometry and response model.

For 10 cm the corresponding surviving counts are 8.52e-16, 2.45e-15 and 4.21e-18. The high-energy tail matters disproportionately: the final 5–10 TeV bin contributes approximately 11.2%, 6.1% and 89.7% of those respective surviving counts. In particular, the last benchmark is sensitive to the upper integration boundary. Contributions above 10 TeV are **not** bounded or extrapolated here. Earth propagation, site dependence, and the high-energy flavor contract must accompany an authenticated extension. Tiny values within the existing table do not certify a tiny all-energy total.

The low-energy-bin printed zeros are floating-point underflow of exponentially small positive survival, not exact kinematic exclusions. Energy-bin outputs preserve the separation between raw production and surviving contributions.

Consequences for the shared model:

- The fixed-10-GeV estimate did not hide a substantial survival fraction within the supplied flux range. Long flights remain improbable under the conditional decay prescription.
- It remains incorrect to equate a decay inside xenon with automatic event rejection. Neutrino plus pion daughters can deposit energy, escape, or alter the observed topology. Accepted isolated recoils require their transport, detector thresholds and reconstruction.
- This does not alter the previously computed local coherence contribution: that forecast traces over the scattered states. Outgoing-particle decay and local energy deposition would require separate apparatus-response accounting; no observed DP residual is introduced.

Next evidence is an authenticated high-energy flux extension, particularly for the 2 GeV benchmark, and a decay-cascade response that handles the pion final states. This packet remains conditional on the dispersive prescription; missing subtraction uncertainties and upstream solution checks are not replaced by numerical precision.

Five checks pass: recovery of the parent production rate at zero width, survival between zero and production, monotonicity with width, refined quadrature, and energy-bin partition agreement. Refining the representative 10 cm integral changes it by 3.95e-6 relatively. Run the sibling Python script to reproduce the JSON. Ordinary research-document validation applies; no certificate or model-admission promotion is claimed.
