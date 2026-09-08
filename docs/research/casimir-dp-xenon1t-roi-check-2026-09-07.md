# Published XENON1T region comparison

Exploratory nominal comparison, 2026-09-07. No new confidence limit or globally allowed model.

The [released example notebook](https://github.com/XENON1T/s2only_data_release/blob/5a364bc8709f2561e5a013ddea6993a5a7c8e313/example_analysis.ipynb) recommends the fixed S2 region 165.3–271.7 PE for low-S2 signals. It quotes a 24.6–24.8 signal-event limit across reference models, with small variation from systematic effects. We select this prescribed region without optimizing on observed search events. Following the notebook, interpolate predicted counts divided by bin width across linear bin centers and integrate over the region.

| Mediator masses | Expected region events, E>=186 eV | E>=50 eV sensitivity only |
|---|---:|---:|
| 1 keV, 1 GeV | 0.455658 | 14.9148 |
| 100 keV, 1 GeV | 0.114505 | 0.538715 |
| 10 MeV, 1 GeV | 7.35339e-9 | 1.76072e-8 |

At the published energy cutoff, the leading candidate lies roughly 54 times below the quoted reference event limit. This is a fixed-spectrum rate comparison, not permission to multiply mediator couplings, local population or coherence by that factor: those changes would alter the nuclear normalization and may change transport. The quoted limit was not recomputed for our exact spectrum and nuisance parameters. The 50 eV variant remains an extension below the published energy cutoff, even though it also falls below the quoted reference count.

Under the covered atomic-response and assumed incident-flux conditions, this particular check offers no rejection. It does not establish compatibility with all electron searches, the full omitted atomic response, or the LZ nuclear data. The notebook explicitly cautions that its approximation is not guaranteed for very steep spectra. No observed-data optimization or background fit was performed here.

The sibling script hashes the input prediction, binning and notebook, integrates through each interpolation knot, and checks positivity and containment within the all-bin prediction. This completes the initial fixed-region screening of this older search. Next prioritize the physically supplied local population and canonical boundary contrast, or an authenticated lower-threshold electron response if it becomes available. Avoid treating continued detector refinement as a substitute for those central shared-model requirements.

    python docs/research/casimir-dp-xenon1t-roi-check-2026-09-07.py PATH_TO_XENON1T_RELEASE

Research-only script and documentation; no Casimir server verification applies.
