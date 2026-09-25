# Audit of the public H.E.S.S. IDM scan data

Date: September 25, 2026. This is a read-only inspection of the analysis repository linked by Justino, Siqueira & Viana. It does not execute its notebooks, rerun micrOMEGAs, produce a gamma likelihood, or establish an exclusion.

## What the tracked data can do

At pinned repository commit `bbf6c4a6a37b4baa1e200569bc228e311a99100b`, `data/CA_sig_continuous3` contains 809 scan rows with columns `Lambda345`, `MDM`, neutral and charged splittings, relic abundance, `SigmaV`, and branching fractions to `WW`, `ZZ`, `hh`, `tt`, and `AWW`. The nearest row in the explicit neighborhood `900 <= MDM <= 1250 GeV`, `0.5 <= d0 <= 1 GeV`, `6 <= d+ <= 10 GeV` is:

| Quantity | LZ profile | Nearest public scan row |
|---|---:|---:|
| `MDM` | 1080 GeV | 1178.9 GeV |
| Neutral gap | 0.000369 GeV | 0.50964 GeV |
| Charged gap | 8.17 GeV | 8.1815 GeV |
| Portal parameter | `lambda_L=-1.92e-4` | `Lambda345=0.01737` |
| Relic density | `Omega_H h^2=0.12014` | `Omega h^2=0.11839` |
| Source-table `SigmaV` | Not reported numerically for this point | `5.5471e-26` (source value) |

The nearby scan row's listed branching fractions are `BRWW=0.805056`, `BRZZ=0.119001`, `BRhh=0.000916`, `BRtt=0.000241`, and `BRAWW=0.074984`. This supports the source paper's diboson-dominated description for nearby high-mass points. The scan row's neutral gap is about **1,381 times** the LZ value; its mass differs by 98.9 GeV and its coupling value is positive and much larger than the LZ best-fit value. (`Lambda345` in the H.E.S.S. paper and `lambda_L` in the LZ paper denote the same coupling combination.) The row is also near a full-DM relic abundance, not the `Omega h^2=0.10782` underabundant target. It is useful as a nearby H.E.S.S. scan diagnostic, not as a substitute LZ point. The paper's baseline spectra and rates are tree-level; Sommerfeld effects are a separate comparison. `SigmaV` is preserved exactly as the source table's field; its value and branching fractions must not be transferred to the LZ point without checking definitions and recalculating at the exact parameters.

## Nearby H.E.S.S. sensitivity stress test

The closest available benchmark curve in neutral splitting is benchmark `13`, whose pinned metadata says `d0=0.5 GeV`, `d+=5 GeV`. The H.E.S.S. 546-hour sensitivity table is interpolated in log-limit versus log-mass to the nearby scan row's 1178.9 GeV. The result is `4.4543e-26` in the source table's `SigmaV` units. Dividing the neighboring scan row's `5.5471e-26` by this threshold gives **1.245**. If the local IDM density were 90% of the total and the row's rate and spectrum stayed fixed, the density-squared rescaling gives **1.009** times the same threshold.

This says the nearby model lands around the H.E.S.S. sensitivity under those assumptions; it does not exclude the LZ model. Algebraically, the proxy reaches the H.E.S.S. threshold at a heavy-component local fraction of at most `sqrt(1/1.2453)=0.8962` if the cross section and spectral shape are fixed. Under co-tracing that requires at least about 10.4% in the other component; the xenon rate for H would then scale to about 89.6% of the full-density prediction. At a 90% local H fraction, the proxy remains about 0.9% above the threshold.

This is a conditional two-channel normalization relation, not a joint fit. The curve uses `d+=5 GeV`, not the row's 8.1815 GeV; the LZ point has a far smaller neutral gap, different coupling value, and a required underabundant relic; and the exact row spectrum file is absent from the pinned tree. The H.E.S.S. profile, tree-level baseline, and rate definition also remain part of the comparison. We cannot tell from the public LZ inputs whether a 10.4% recoil-rate reduction remains compatible with its profile-likelihood region. The near-threshold result makes an exact-parameter calculation more important, not less.

## What prevents a likelihood recast from this repository alone

The H.E.S.S. notebook references generated `Spectrum*_all.dat` gamma-spectrum files for its benchmark scans. A recursive inventory of the pinned tracked repository contains none of those files, although it does contain the tabulated H.E.S.S. limit files. Without the benchmark spectra (or regenerated spectra) the supplied limit curves cannot provide the point-specific detector-folded likelihood needed here. The exact LZ neutral splitting is outside the H.E.S.S. scan, and the IDM best-fit point's current-day annihilation spectrum is not numerically tabulated in its LZ paper.

Consequently, the next valid step remains a model run at the exact LZ masses and splittings with the LZ paper's micrOMEGAs version, followed by regeneration of final-state spectra and an H.E.S.S. response fold. A nearby row, a mass-only limit, or a freeze-out rate must not be labeled as an exact-point gamma prediction. Retain Einasto and defensible cored profiles as an explicit astrophysical uncertainty.

## Reproduction

Run with Python 3 and network access:

```powershell
python -B docs/research/casimir-dp-idm-hess-public-data-audit-2026-09-25.py
```

The script uses only the standard library, fetches GitHub API objects pinned to the commit above, checks the blob SHA and 809-row count, extracts the nearest point, confirms the neutral-gap floor, and checks for the notebook's referenced spectrum files. Its adjacent JSON records the source commit, inputs, outputs, and limits.

Sources: [H.E.S.S. IDM analysis and linked repository](https://arxiv.org/html/2411.05909); [pinned public repository tree](https://github.com/RadicceJustino/IDM-indirect-detection/tree/bbf6c4a6a37b4baa1e200569bc228e311a99100b); [LZ IDM benchmark](https://arxiv.org/html/2609.06571).
