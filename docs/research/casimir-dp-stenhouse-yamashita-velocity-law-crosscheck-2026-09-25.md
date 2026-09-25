# Stenhouse velocity-dependent dwarf-limit cross-check (2026-09-25)

## Question

Can the public analysis of the Fermi-LAT 20 GeV halo-like residual constrain the particle-physics branch already used in the CasimirBot LZ/Yukawa work, and does it support the planned bridge to a separate ultralight boson-star component?

## Result

The best public comparison is Stenhouse, Ghag and Deppisch, arXiv:2607.08552v1. Its pixel-level analysis reports a W+W- best-fit near 0.55 TeV and a present-halo rate near 1e-24 cm^3/s. For its velocity-dependent dwarf comparison it reports R = (halo required rate)/(dwarf upper limit) about 0.02 for pure p-wave and about 1e2 for the unsaturated Coulomb 1/v limit. It explains that pure p-wave weakens dwarf limits but misses the required halo rate by about seven orders if its coupling is fixed by single-species thermal freeze-out; unsaturated 1/v over-tightens the dwarf comparison. Saturated/resonant enhancement can provide the needed roughly 45-fold present-day boost while retaining the s-wave dwarf tension, and only an above-threshold finite-velocity resonance might remove that tension outright. These are model-dependent interpretations of a halo-like residual, not a dark-matter detection.

I reran the release's `velocity_dep/extract_boddy_limits.py` at pinned commit `e66f34c40a81d883cbcc81079d12b446e3697777`, using its published Hoof s-wave W+W- table, its packaged Boddy stacked-summary moments (`boddy_moments_0d5.csv`), and its Jeans halo moment file (`halo_moments.csv`). The released conversion gives p-wave and pure Sommerfeld halo-comparable rescaling factors of 104.0 and 0.07067. Log-log interpolation of its generated W+W- limit tables at 550 GeV gives:

| Limiting velocity law | Dwarf upper limit translated to halo frame at 550 GeV | Approx. R using 1e-24 cm^3/s |
|---|---:|---:|
| Pure p-wave | 2.54e-23 cm^3/s | 0.039 |
| Unsaturated Coulomb 1/v | 1.73e-26 cm^3/s | 58 |

The pure-law comparisons reproduce the published ordering and are within a factor of about two of the paper's rounded R values. That residual difference is expected here: this inexpensive rerun uses a packaged summary dwarf moment, whereas the paper describes stacked posterior moments and a source-specific Jeans velocity model. It is a cross-check of the released pure-law conversion, not a refit or independent likelihood analysis.

## Connection to our existing solve

Our leading particle benchmark has mX = 420 GeV, mMediator = 400 MeV, and a p-wave annihilation rate multiplied by the finite-range attractive Yukawa S1 factor. Its ratio mMediator/mX = 9.52e-4 places the characteristic saturation scale in the broad Galactic-halo velocity range, between dwarf and Milky-Way speeds in an order-of-magnitude sense. That is qualitatively the kind of finite saturation window the Stenhouse paper identifies as necessary. But their paper's illustrative light-mediator coupling is around alpha_chi = 1e-2, while our benchmark uses alpha_eff = 0.2; the particle mass, mediator, production history, spectra, and velocity averages differ. A scale comparison is not parameter compatibility.

The two pure limits cannot decide the benchmark. The p-wave endpoint lacks the mediator enhancement; the Coulomb endpoint removes finite-mass saturation and assumes the low-velocity 1/v asymptote. Our prior Yukawa calculations already show that the exact finite-range p-wave*S1 average is resonance-sensitive and differs from the Cassel Hulthen approximation. The operative observable must be computed as the same cross-section kernel averaged over the Milky-Way ROI distribution and each dwarf's velocity posterior, then folded through the relevant gamma-ray likelihoods. The Stenhouse excess does not by itself link the 420-GeV particle to LZ: its public comparison is an indirect gamma-ray analysis, and our existing LZ event normalization is not a detector-level likelihood.

The boson-star connection should remain a separate-component hypothesis for now. The ultralight coherent field already studied in the repository is many orders of magnitude lighter than this 420-GeV annihilator and its 400-MeV force mediator. No production or field-theory relation in the two papers identifies them as one field. The useful near-term question is whether a stellar ultralight component can coexist with a heavy annihilating component under one cosmological abundance and local-density budget, while the heavy component independently predicts xenon recoils and gamma spectra. This audit supplies no new stellar-profile or LZ-recoil result.

## Next calculation

Replace the pure p-wave and Coulomb endpoints with one finite-range model. For each mediator mass and coupling, calculate the converged kernel `v_rel^2 * S1(v_rel)` from the exact Yukawa radial solver and average it over (1) the Stenhouse NFW/Jeans Milky-Way ROI velocity model and (2) the Boddy dwarf posterior moments or distributions. Then compare the resulting halo rate, all dwarf limits, and thermal abundance at the same parameters. Prioritize the original 420-GeV / 400-MeV benchmark and a clearly declared scan around it; do not tune after seeing the result. Only after that pass should we rerun gamma spectral fits and bring the xenon response into a shared likelihood. Keep the ultralight boson-star population as a second component until a concrete portal and cosmological history are supplied.

## Reproduction record

Temporary public-code checkout: `Totani-Reanalysis`, branch `Public-Release`, commit `e66f34c40a81d883cbcc81079d12b446e3697777`.

Command (outputs were written only in the temporary clone):

```powershell
python Totani_reanalysis/velocity_dep/extract_boddy_limits.py `
  --mode boddy `
  --boddy-csv Totani_reanalysis/velocity_dep/boddy_moments_0d5.csv `
  --halo-csv Totani_reanalysis/velocity_dep/halo_moments.csv `
  --s-source hoof --channels WW --waves pwave sommerfeld `
  --out-dir Totani_reanalysis/velocity_dep/out_codex
```

Primary sources: [Stenhouse et al., arXiv:2607.08552v1](https://arxiv.org/html/2607.08552v1), [public analysis release](https://github.com/trinitystenhouse/Totani-Reanalysis/tree/Public-Release), [Yamashita et al., arXiv:2609.02868v2](https://arxiv.org/abs/2609.02868).