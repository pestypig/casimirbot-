# IDM 248 keV recoil folded through published TNG50 Earth-frame halos

Date: September 24, 2026. Candidate-neutral simulation-ensemble halo-integral calculation; not an LZ likelihood or evidence for the IDM interpretation.

## Data and reproducibility

Folsom et al. publish supplemental speed distributions and paired local dark-matter densities for 98 TNG50 Milky Way analogues. The supplement includes both phase-space-scaled and unscaled samples, and Earth-frame distributions for March 9, 2000. I used the frozen Zenodo v1 JSON (`Folsom-2505-data.json`) from record 15374887. The JSON SHA-256 is `9d3e18f95cb373634f57cadfd8d836a62dbf991d20cf0271a968e15dc1a0a9e0`. It is not copied into this repository; download v1 from the linked record, then run the attached script with `--data-json <path>`.

I validated all 98 geocentric PDFs by integrating the published `10^-3 s/km` speed density across its 0–975 km/s grid. Normalizations fall between 0.99935 and 0.99992. The script linearly interpolates each PDF at `v_min`, integrates `eta(v_min)=integral g(v)/v dv`, and pairs that value with the same halo's density. Its reference is the source IDM SHM point with `v0=238 km/s`, `v_esc=544 km/s`, `v_lab=254 km/s`, and `rho=0.30 GeV/cm^3`.

## Result at the extreme inelastic recoil

For `m_H=1080 GeV`, `delta=369 keV`, and a `248 keV` Xe-131 recoil, `v_min=786.01 km/s`. In the primary phase-space-scaled sample, the 16th/50th/84th percentiles of `eta/eta_SHM` are `0.542 / 4.482 / 18.788`. Pairing each halo's density with its speed distribution and comparing `rho*eta` to the IDM paper's `0.30 GeV/cm^3` SHM normalization gives `0.937 / 7.955 / 38.163`. About 95% of the scaled halos have nonzero support at this threshold.

The full unscaled sample is a useful sensitivity check: half of its halos have zero support at the benchmark; the 16th/50th/84th percentiles of `rho*eta` relative to the source SHM are `0 / 5.6e-6 / 2.966`. Those systems are not all Milky Way-matched in local circular speed, so this is not an equally weighted alternative Milky Way posterior. The paper validates its scaling against seven halos requiring only a small transformation. In that small subset, the 16th/50th/84th density-weighted ratios are `2.16 / 7.33 / 9.72` for scaled PDFs and `2.45 / 4.56 / 21.06` for unscaled PDFs. That check supports similar high-threshold support in minimally transformed systems, but seven objects do not give a precise tail uncertainty. The exact subset is included in the JSON output for inspection.

If the IDM makes up a local fraction `f_H`, multiply each `rho*eta` ratio by `f_H`. For example, `f_H=0.9` scales the primary sample's percentile summary to `0.843 / 7.159 / 34.347`; this is a sensitivity example, not a prediction that a 10% ultralight component traces the same local density fraction.

## What this does and does not establish

This replaces the previous analytic-tail extrapolation with published per-halo Earth-frame PDFs that extend above the recoil threshold. It shows that the source SHM rate is not a stable central proxy for this benchmark: the physically motivated scaled ensemble gives a larger median rate factor, and its seven-halo minimal-scaling check has similar high-threshold support. The broad unscaled ensemble often closes the channel, but it includes halos that do not match the Milky Way's local circular speed and should not be treated as a like-for-like prediction. The result remains simulation-based, not a posterior for our Galaxy.

This is only the `rho*eta` factor for a `1/v^2` recoil kernel. It does not reconstruct the IDM paper's detector likelihood, annual modulation, isotope/form-factor response, or LZ backgrounds. The Earth-frame PDF is for one date, and the source analysis neglects solar gravitational focusing. The TNG50 paper reports its own uncertainty treatment and a direct-detection application, but its published XENON1T fit covers a different (mostly low-energy, elastic) problem; it cannot substitute for an LZ likelihood for this 248 keV inelastic point.

The next gate is to fold the full recoil spectrum for the source interaction over the 98 halo PDFs and local-density pairs, then compare that ensemble to the original SHM spectrum using the LZ response/background likelihood if the required public inputs exist. Keep the local component fraction explicit. Only after this survives should it be combined with a distinct ultralight boson-star population and Casimir-DP prediction.

A separate dataset intake check found that the public DREAMS GitHub/Zenodo files named `Varied_100000_HISTS` and `Varied_100000_PARAMS` are byte-identical `(100000, 3)` float arrays, contrary to the accompanying documentation describing `(63, 100000)` histogram data. I therefore did not use those files for this fold; their release needs clarification before they can support a tail calculation.

The [Python implementation](casimir-dp-idm-folsom-tng50-earth-frame-fold-2026-09-24.py) records every halo-level `rho`, `eta`, and relative rate factor in the adjacent JSON result. Sources: [Folsom et al., arXiv:2505.07924](https://arxiv.org/abs/2505.07924), [supplemental data, Zenodo v1](https://zenodo.org/records/15374887), [DREAMS speed-distribution paper](https://arxiv.org/abs/2512.04157), [DREAMS data/code record](https://zenodo.org/records/18208706).
