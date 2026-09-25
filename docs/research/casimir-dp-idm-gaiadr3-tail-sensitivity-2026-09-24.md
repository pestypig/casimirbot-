# IDM 248 keV point: Gaia escape-speed tail sensitivity

Date: September 24, 2026. This is a kinematic stress test of the published IDM profile point, not a local dark-matter velocity posterior, detector likelihood, or exclusion.

## Fixed benchmark and comparison

The IDM paper's profile point uses `m_H=1080 GeV`, `delta=369 keV`, a Xe-131 recoil of 248 keV, and Standard Halo Model inputs `v_esc=544 km/s`, `v_lab=254 km/s`. Two-body kinematics require `v_min=786.01 km/s` for that recoil. The assumed truncated-SHM lab-frame support is therefore 798 km/s, only 11.99 km/s above threshold.

Roche et al.'s Gaia DR3 analysis reports different escape-speed fits in its 8–9 kpc radial bin: `486 +10/-5 km/s` for a stretched-exponential power law (SEPL) and `539 +69/-34 km/s` for a two-component power law (2PL), both stated as 68% intervals. Holding the IDM paper's `v_0=238 km/s` and `v_lab=254 km/s` fixed, applying the truncated-SHM mapping `v_max,lab = v_esc + v_lab`, and evaluating the shifted-Maxwellian mean inverse speed `eta(v_min)` gives:

| Stellar escape-speed fit | Lab support at central estimate | Headroom over 786.01 km/s | Benchmark open? | Conditional Xe differential rate / source SHM |
|---|---:|---:|:---:|---:|
| Gaia DR3 SEPL, 486 km/s | 740 km/s | -46 km/s | No | 0 |
| Gaia DR3 SEPL, 68% range 481–496 km/s | 735–750 km/s | -51 to -36 km/s | No | 0 throughout |
| Gaia DR3 2PL, 539 km/s | 793 km/s | +7 km/s | Barely | 0.360 |
| Gaia DR3 2PL, 68% range 505–608 km/s | 759–862 km/s | -27 to +76 km/s | Model-dependent | 0 to 19.38 |
| IDM-paper SHM, 544 km/s | 798 km/s | +12 km/s | Yes | 1 |

For the IDM `d sigma/dE_R proportional to 1/v^2` recoil kernel, the differential rate at fixed recoil is proportional to `eta(v_min)`. The 2PL central escape speed therefore leaves only about 36% of the source paper's SHM differential rate; the SEPL cases have no support at that recoil. The broad upper end of the 2PL interval gives a much larger rate, showing that uncertainty in the fitted tail shape dominates this benchmark. At the 248 keV recoil energy, the SEPL central value permits at most a 331.2 keV endothermic splitting under this mapping, below the IDM benchmark's 369 keV. The 2PL central value permits 374.7 keV, leaving only 5.7 keV of splitting margin.

## Interpretation and limitation

This makes the published IDM interpretation highly sensitive to the assumed high-speed support and tail shape. Under a truncated SHM using the Gaia SEPL central estimate, the exact benchmark point is kinematically closed; under the 2PL central estimate it is open only narrowly and its conditional differential rate is about 36% of the paper's benchmark. This is a model-sensitivity result, not a claim that Gaia has excluded the IDM or directly measured the dark-matter tail.

The Gaia result is a fit to stellar speeds, not the local dark-matter phase-space distribution. SEPL and 2PL encode different tail models. The Gaia paper defines escape relative to `2 R_200c`, while a direct-detection SHM cutoff must use a consistent outer-boundary convention. Streams, substructure, and a non-Maxwellian dark-matter distribution can also change high-speed support. The next valid test is a common-convention Galactic mass/phase-space model that maps Gaia constraints into the IDM component's local distribution, then folds that distribution through the LZ recoil and response model. Open kinematics alone do not establish a sufficient event rate.

The [script](casimir-dp-idm-gaiadr3-tail-sensitivity-2026-09-24.py) reproduces `v_min`, support margins, maximum splitting at fixed recoil energy, and analytic shifted-Maxwellian `eta` ratios; the [JSON](casimir-dp-idm-gaiadr3-tail-sensitivity-2026-09-24.json) records every central and interval-endpoint case.

Sources: [IDM LZ interpretation](https://arxiv.org/html/2609.06571); [Roche et al., Gaia DR3 escape-speed profile, v2 (May 28, 2026)](https://arxiv.org/html/2402.00108).

Status: the high-speed-tail robustness of this benchmark is unverified and is now an explicit model gate. No LZ significance or halo exclusion is claimed.
