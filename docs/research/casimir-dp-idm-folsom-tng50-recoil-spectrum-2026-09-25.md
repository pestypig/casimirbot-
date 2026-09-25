# IDM recoil-spectrum halo fold across TNG50 Earth-frame distributions

Date: September 25, 2026. Candidate-neutral, isotope-resolved halo-fold calculation; not a dark-matter detection claim, absolute LZ spectrum, or detector likelihood.

## Why this is the next useful step

The IDM paper gives a concrete test kernel: endothermic `H + Xe -> A + Xe`, with `m_H = 1080 GeV` and `delta = 369 keV` at its profile best fit. Its differential rate is proportional to the local component density times `eta(v_min)`, multiplied by an isotope-dependent finite-momentum weak nuclear response. This cleanly separates the astrophysical question from the nuclear and detector-response questions.

I extended the previous single-energy Xe-131 calculation across recoil energy and all seven naturally occurring xenon isotopes, using the same 98 paired TNG50 density and Earth-frame speed distributions from the Folsom et al. supplement. For each isotope and recoil energy I calculate `v_min` from the IDM kinematics and fold `rho * eta(v_min)`. Comparing the same isotope-energy bin against the IDM paper's SHM benchmark cancels its unknown nuclear response exactly. The calculation therefore tests halo dependence without substituting a Helm form factor for the paper's WimPyDD weak response.

## Results

For Xe-131 at the candidate energy, `v_min = 786.01 km/s`. Across the 98 phase-space-scaled halos, the 16th/50th/84th percentiles of the differential-rate factor relative to the IDM paper's SHM point are `0.937 / 7.955 / 38.163`; 93 of 98 have support. The seven minimally scaled validation halos give `2.162 / 7.328 / 9.718` at those percentiles. These are ensemble summaries, not a posterior probability distribution for the Milky Way.

The factor varies with recoil energy. For the same Xe-131 comparison, the scaled-sample percentile triplets at 225, 248, 269.9, and 294 keV are respectively `2.248 / 25.696 / 147.018`, `0.937 / 7.955 / 38.163`, `0.773 / 5.268 / 23.668`, and `0.703 / 4.199 / 18.618`. The source SHM has no support for Xe-131 at 202 keV (`v_min = 801.79 km/s`), so a ratio there is undefined even though some TNG50 PDFs do have support. This matters: the halo alternatives can change the low-energy edge as well as the normalization around 248 keV.

The full unscaled sample gives Xe-131 triplets of `0 / 0 / 9.157`, `0 / 0 / 2.966`, `0 / 0 / 2.106`, and `0 / 0.001 / 1.790` at those same four energies. This remains a sensitivity construction, not an equally weighted Milky Way alternative: many unscaled simulated galaxies are not matched to the Milky Way's local circular speed.

The isotope-resolved output is important. At 248 keV, the scaled-sample Xe-128 median ratio is about 54, whereas Xe-136 is about 2.87. Those cannot be averaged into a natural-xenon spectrum without each isotope's weak response weights. I preserve all seven isotopes separately rather than pretending their response is common. Local IDM fraction `f_H` multiplies the `rho * eta` factors linearly; no value of `f_H` is inferred.

## Detector gate

LZ's 2026 extended-window release reports one NR-like candidate at `248 +/- 23 (stat) +/- 23 (sys) keV`, an extended search window to about 270 keV, 2.84 tonne-year exposure, and 2.6 sigma global / 3.4 sigma maximum local background-only tension. Its efficiency averages 96% from 14 to 250 keV, then drops below 50% above 269.9 keV. The collaboration's data release is indexed at [HEPData DOI 10.17182/hepdata.182472.v1](https://doi.org/10.17182/hepdata.182472.v1) (HEPData record `ins3199115`). The paper says its best-fit NEST response parameters and model spectra are in the release; I have not yet verified whether the particular detector-level PDFs and nuisance constraints required by the IDM likelihood are included.

The IDM paper says a complete reconstruction needs detector-level ingredients not currently public, while the LZ paper points to released response parameters and model spectra. I have not verified the HEPData file inventory yet; direct scripted requests currently return an anti-bot 403 page. The immediate next task is to inspect that record file by file and determine whether the IDM likelihood's signal-energy PDF, background PDF, nuisance constraints, and migration response can in fact be reconstructed. The efficiency curve alone is insufficient, especially near 250 keV where LZ reports limited NR calibration. Do not treat the published efficiency summary or the candidate's reconstructed energy as the full detector response.

## Limits and next falsification step

- Folsom et al.'s geocentric PDFs represent March 9, 2000, not an annual average; solar gravitational focusing is omitted in the source work.
- The 98 TNG50 systems form a simulation ensemble. The scaled/unscaled alternatives and seven-object near-unity subset are diagnostics, not posterior draws for the Milky Way.
- No absolute event rate is reported. The source IDM normalization is fixed by electroweak physics, but the finite-q weak isotope responses, component fraction, and full energy response still have to be used consistently to calculate counts.
- The calculation does not fit the LZ candidate and does not connect the heavy IDM component to the ultralight boson-star branch or the Casimir-DP observable.
- Falsification gate: recover the LZ release tables and metadata; establish exact weak response inputs for each isotope; then response-fold one common IDM parameter set and local fraction across the source SHM and TNG50 halo alternatives. If the available public inputs do not support the event/background likelihood, stop at a transparent spectrum comparison and document exactly which quantities remain unavailable.

## Reproduction

Download the CC-BY Zenodo v1 Folsom file and run:

```powershell
$input = Join-Path $env:TEMP 'folsom-data\folsomde-DM_velocity_distributions-3162e93\Folsom-2505-data.json'
python docs/research/casimir-dp-idm-folsom-tng50-recoil-spectrum-2026-09-25.py --data-json $input
```

The script verifies the frozen SHA-256 `9d3e18f95cb373634f57cadfd8d836a62dbf991d20cf0271a968e15dc1a0a9e0`, checks the 98-halo sample and seven minimally scaled controls, and writes the full per-isotope energy curves and selected halo-level rows to the adjacent JSON.

Sources: [IDM interpretation, arXiv:2609.06571](https://arxiv.org/abs/2609.06571); [LZ extended recoil-window result, arXiv:2609.02823](https://arxiv.org/abs/2609.02823); [LZ HEPData release](https://doi.org/10.17182/hepdata.182472.v1); [Folsom et al., arXiv:2505.07924](https://arxiv.org/abs/2505.07924); [Folsom Zenodo supplement v1](https://zenodo.org/records/15374887).
