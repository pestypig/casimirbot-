# Tabulated radiative decay: unresolved normalization diagnostic

Status: exploratory diagnostic; no shared model admitted. Frozen apparatus and scattering benchmark unchanged.

The authors of [Dark Photon Decay Beyond the Euler–Heisenberg Limit](https://arxiv.org/abs/1705.00619) supply 89 numerical enhancement points in `anc/enhancement.txt` inside their [source archive](https://arxiv.org/src/1705.00619). The exact source bytes and provenance are preserved in the adjacent radiative-enhancement-source files. The companion Python script authenticates those bytes and the common-rate input.

A consistency check fails: at 0.160782396 MeV the tabulated enhancement is 1.041856242, whereas the published six-coefficient expansion gives 1.047998335, a 0.589534% relative difference. Several subsequent low-mass points show a similar fractional offset. This suggests a normalization issue worth investigating, but does not establish its origin. No rescaling has been applied. The failed join check is retained explicitly in the JSON; successful execution is not scientific validation.

Conditional diagnostic convolution uses the previously derived heavy-current spectral kernel, an unmodified PCHIP table interpolation, and the published series below the first table point. For 40 and 100 GeV dark masses the enhancement factors are respectively 7.43013 and 1.48437. Linear interpolation shifts these by 0.0872% and 0.0167%; these differences are not theory uncertainties. The corresponding electron-loop-only lifetimes, under the selected loop-size electron coupling, are 9.34e28 and 1.20e33 seconds. They remain unvalidated conditional numbers because the overlap discrepancy and additional decay channels are unresolved.

The immediate implication to test is that this particular three-photon channel may be too slow to deplete either pair-closed benchmark cosmologically. It does not prove excited-state survival: production, other channels, mediator matching, cosmological constraints, and a consistent present-day abundance are still required. It also does not increase the previously tiny local coherence-loss prediction or prevent cancellation in the four-cell observable.

Next: resolve the near-constant low-mass table/series offset using independent normalization or the authors’ numerical conventions; retain this packet unchanged as an evidence snapshot. Then include all permitted decay channels and abundance evolution before claiming a shared prediction model.

Reproduce with `python docs/research/casimir-dp-exothermic-tabulated-radiative-2026-09-07.py`. Checks cover source hashes, monotonic grid and no upper extrapolation; the low-mass consistency check is explicitly FAILED. No runtime, warp/GR, proof-maturity or certificate surfaces changed.
