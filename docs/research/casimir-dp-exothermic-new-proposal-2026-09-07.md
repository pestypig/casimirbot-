# New exothermic proposal: direct-channel screen

Date: 2026-09-07. Status: exploratory calculation, not an experimental validation or full-model exclusion.

The newly inspected [de Lima proposal, arXiv:2609.05204v1](https://arxiv.org/html/2609.05204v1) supplies a concrete off-diagonal dark-photon interaction and discusses excited-state production and survival. Its benchmark has dark matter mass 45 GeV, released splitting 1 MeV and mediator mass 1 GeV. Figure 1 uses the illustrative product P = f_H alpha_D epsilon^2 = 1.7e-17. That product is used here without claiming it is an independently fitted LZ normalization. The paper's energy-only likelihood surrogate is not the official detector-observable likelihood.

## Reproducible direct-channel result

The adjacent Python script verifies the frozen apparatus configuration SHA-256, uses its mass and hold time, and counts independent ideal carbon-12 nuclei. With the nuclear form factor replaced by one and the spacelike propagator bounded by its contact value, the population-weighted cross section times speed obeys, in natural units,

`f_H sigma(v) v <= 16 pi alpha_EM P Z_C^2 mu_C^2 / m_A^4 * sqrt(v^2 + 2 delta / mu_C)`.

The expression increases with speed. Using 798 km/s therefore bounds the normalized halo average for speeds supported below that value. Multiplication by rho/m, carbon count, hold time and unit conversions gives:

| Quantity | Result |
| --- | ---: |
| Zero-speed carbon recoil | 801.026 keV |
| Independent carbon events per hold, upper | 8.2493e-26 |
| Decoherence exponent D, upper using D <= 2 events | 1.6499e-25 |
| Ratio to frozen DP forecast exponent | 5.5906e-24 |

Direct recoil integration at three speeds agrees with the analytic cross section to maximum relative error 2.7e-15. The DP exponent is a theoretical comparator, not an observed residual or measured sensitivity.

## Decision and limits

Demote this direct channel for the user's measurable-in-both priority. A high recoil energy per collision does not compensate for an extremely small collision probability in the apparatus. This calculation is limited to independent carbon scattering: it neither proves a full material-response bound nor excludes elastic companion channels or every completion of the model.

No official LZ likelihood, population evolution, finite-electron-mass excited-state lifetime, or empirical apparatus sensitivity has been reproduced. In particular, a 1 MeV splitting is not a controlled small parameter relative to the electron mass for importing a low-energy three-photon decay expansion.

A successor lead must identify its additional local response quantitatively, with the same couplings and population used for xenon. Reproducing cosmology alone does not resolve the local signal deficit. Homogeneous coherence loss also need not survive the canonical boundary comparison.

Artifacts: `casimir-dp-exothermic-new-proposal-2026-09-07.py` and `.json`.
