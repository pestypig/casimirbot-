# Silica missing-momentum stopping budget

Exploratory calculation, 2026-09-07. This packet narrows which omitted response could materially change the shared two-mediator capture lead. It is not a total stopping bound or a capture prediction.

The previous silica table ends at q = 37.2895 keV. Applying the nonrelativistic, zero-temperature electronic f-sum separately to missing momentum intervals gives the following initial-speed upper envelopes at the fixed diagnostic column 7e9 g/cm²:

| Mediator masses | Missing q=37.2895–100 keV | Missing q=37.2895–200 keV | All q below 200 keV |
|---|---:|---:|---:|
| 1 keV, 1 GeV | 12.6985 eV | 21.6257 eV | 61.8068 eV |
| 100 keV, 1 GeV | 1.19166 eV | 5.16079 eV | 5.21308 eV |
| 10 MeV, 1 GeV | 3.28274e-8 eV | 5.34726e-7 eV | 5.35373e-7 eV |

These allocate the entire positive-frequency oscillator-strength budget at each momentum to accessible energy, making them deliberately loose envelopes within the stated target model. They are not material-realized energy losses. The all-q column replaces, rather than adds to, the earlier table contribution; adding those would double count. The incoming kinetic energy remains approximately 335 keV. At fixed initial speed the missing moderate-momentum interval cannot supply comparable mean slowing under these assumptions. This does not bound rare capture histories or exclude other momentum channels.

## Reproducible construction

For y=q² in GeV², use

    dK/dX <= 2 pi ne_per_gram/(me v²)
              integral dy y [sum_i alpha_i/(y+m_i²)]²

with the GeV-to-cm conversion for cross section. The frozen common-parameter JSON hash is asserted by the sibling script. The electron count is 30 per nominal 60 u silica formula, including core electrons. Interference is retained before squaring. The [sum-rule paper](https://arxiv.org/html/2608.05282v1) supplies the electronic f-sum and its all-electron interpretation; the interval calculation here applies that identity to the existing stopping kernel.

Logarithmic quadrature refinements agree within the script's 1e-7 relative tolerance. Splitting the integral at the source-table momentum endpoint recovers the whole interval to the same tolerance. A positive analytic bound covers the numerically omitted near-zero momentum sliver. These checks test numerical integration, not target accuracy.

    python docs/research/casimir-dp-silica-remainder-budget-2026-09-07.py

The sibling JSON records both 100 and 200 keV ceilings. The free-electron recoil/rest-energy diagnostic q²/(2me²) equals 0.0191 and 0.0766 at those ceilings. These numbers indicate the scale at which nonrelativistic response requires examination; they are not rigorous relative error bars for the interacting target. No relativistic remainder theorem is assumed.

## Consequence for the work program

Do not spend the next iteration merely extending the same Mermin table a little beyond 37 keV. The discriminating unresolved contribution is the higher-momentum response, especially where a nonrelativistic f-sum is being extrapolated. Pursue a physically supported relativistic/core response or a controlled upper bound there. Preserve the distinction between an initial-speed moment, an evolving transport calculation, a captured local population, and a measurable boundary-dependent coherence contrast. None implies the next without additional evidence.

Research-only script and documentation; no GR, adapter, certificate, or physical viability authority changes. Casimir server verification is outside this patch's scope.
