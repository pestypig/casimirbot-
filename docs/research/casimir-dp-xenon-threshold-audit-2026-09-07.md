# Xenon atomic onset sensitivity and next detector comparison

Exploratory audit, 2026-09-07. No detector exclusion or allowed shared point.

The source's last all-zero energy row is 11.86811605 eV and its first nonzero row is 12.22719769 eV. Linear interpolation spreads the onset between them. Reusing the covered-integral script with a 12.1 eV cut changes the leading light-pair raw total from 1,770,614 to 1,724,257; cutting at the first nonzero node gives 1,703,745 (a 3.78% decrease). Thus the earlier large near-threshold count is not solely this onset interpolation artifact. This test does not validate the atomic-to-liquid approximation or all higher shell thresholds.

| Mediator masses | Raw 40–700 eV events at original 2.84 tonne-year exposure | Raw 186 eV–1 keV events |
|---|---:|---:|
| 1 keV, 1 GeV | 24644.1 | 78.7569 |
| 100 keV, 1 GeV | 277.393 | 21.3942 |
| 10 MeV, 1 GeV | 6.19846e-6 | 1.85269e-6 |

These two bands are unchanged by the onset cuts. Counts retain the frozen products and unattenuated mono-speed source, not an experiment-specific halo likelihood. The wrapper executes the existing integrator without overwriting its original receipt; this is a sensitivity calculation, not an independent solver. Source/hash checks and numerical refinement assertions remain active. The sibling JSON records all variants.

The [2026 XENONnT ionization-only paper](https://arxiv.org/abs/2601.11296) reports 7.83 tonne-year exposure and electronic-recoil sensitivity over 40–700 eV, with no significant excess. Its [public data repository](https://github.com/XENONnT/s2_only_data_release) is now the next response/likelihood intake target. The older [XENON1T public response release](https://github.com/XENON1T/s2only_data_release) offers a fallback. An energy sensitivity interval is not a unit-efficiency top-hat cut. Do not compare this table directly with observed S2 counts or rescale a published cross-section limit for a different mediator and velocity distribution.

Next: authenticate the newer release, inspect its response matrix and exposure conventions, apply the fixed incident spectrum with explicit transport assumptions, and calculate detector-bin predictions. A measurable shared model still requires captured population supply and a boundary-dependent coherence prediction. Research-only documentation and script; Casimir server verification does not apply.

    python docs/research/casimir-dp-xenon-threshold-audit-2026-09-07.py PATH_TO_PINNED_ATOMICIONISATION
