# StarSim Fusion Benchmark Stage 2 Candidate

## 1. Claim boundary

`STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE` is benchmark support for the StarSim fusion prior lane. It can say a profile pack is ready for Stage 2 review, but it does not promote the lane automatically.

Every report remains `spacetimeCL: "proxy_only"` and `mayPromoteToCL4: false`.

## 2. Profile import versus benchmark support

Profile import validates a shell schema and computes profile-derived fusion quantities. Benchmark support compares a profile pack against closure, uncertainty, metadata, and reporting thresholds.

## 3. MESA metadata requirements

MESA imports should include profile hash, inlist hash, network metadata, and source reference. Missing metadata blocks Stage 2 readiness.

## 4. Luminosity closure checks

The benchmark compares integrated nuclear luminosity with surface luminosity using:

```text
luminosityClosureRelErr = abs(L_nuc - L_surface) / L_surface
```

## 5. Fusion-channel fraction benchmarks

Dominant channel is derived from integrated component epsilon contributions, not spectral type alone.

## 6. Fusion-zone radius benchmarks

Fusion-zone radii are derived from cumulative nuclear luminosity, including `r10`, `r50`, and `r90`.

## 7. Uncertainty propagation

The benchmark supports no uncertainty, interval uncertainty, and deterministic fixture Monte Carlo. Stage 2 readiness is blocked when uncertainty is absent.

## 8. hSpectralFit calibration boundary

`hSpectralFit` is calibration-only. Reports block new or varying Planck constant language.

## 9. Neutron-star compact-object benchmark branch

Neutron stars remain compact-object dense-matter context, not fusion objects.

## 10. Gaia/star-map population-prior boundary

Gaia-like data can provide population context. It cannot be used as direct quantum-spacetime evidence.

## 11. Why this still does not support direct ER=EPR

ER=EPR remains bounded to controlled holographic/toy-dual simulations. Stellar profile benchmarks are ordinary astrophysical priors.

## 12. Stage 2 candidate requirements

A Stage 2 candidate requires profile metadata, profile hashes, uncertainty propagation, closure checks, benchmark comparisons, citation-backed claim IDs, and safe-language reports. It still remains proxy-only for QST and does not promote ER=EPR, Needle Hull, or warp claims to CL0-CL4.

## 13. Stage 2 promotion blockers

Blockers include missing profile hashes, missing MESA metadata, missing uncertainty model, failed luminosity closure, hSpectralFit overclaims, direct ER=EPR overclaims, and QST congruence promotion attempts.
