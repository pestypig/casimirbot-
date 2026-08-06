# Casimir-DP Stage-4.2N material-resolved ordinary-null report

**Run:** `casimir-dp-material-thermal-ordinary-null-stage4-2n-v1-20260806T120000000Z`  
**Evidence:** synthetic material/Green/FDT pipeline validation only  
**Claim ceiling:** material-resolved ordinary-null commissioning requirements only

## Leading-design binding

This runtime is bound to Stage-4.2M candidate `stage4_2m_candidate_002`: diamond sphere, radius 2.76302362398029e-7 m, mass 3.0925052683774525e-16 kg, branch separation 2.5e-7 m, hold 0.25 s, and gap 0.00001 m.

## Synthetic ordinary prediction

- Mean electromagnetic phase: 0.01999999999248688 rad.
- Phase standard uncertainty: 0.00006303538879220067 rad.
- Ramsey loss exponent: 0.00035777321050801464.
- Echo loss exponent: 0.0000013416495394050548.
- Four-cell ordinary-null ratio: `(0.9997986652864095, 0.019998639854637512)`.
- Four-cell ratio phase: 0.01999999999248688 rad; contraction exponent: 0.0000013416495394193404.

The four-cell statistic is `(C_active,separated C_reference,compact)/(C_active,compact C_reference,separated)`. It exposes a boundary-by-superposition interaction after compact-branch and reference-boundary controls. This fixture recovers the statistic; it does not yet supply measured cell means or measured covariance.

## Recovery and integrity gates

- Upstream Stage-4.2M receipt integrity: true.
- Fixture integrity: true.
- Optical CSV integrity: true.
- Maximum propagated imaginary-axis relative uncertainty: 0.0031500973504121083.
- Green reciprocity gate: pass.
- Two-sided FDT symmetry gate: pass.
- Zero-coupling recovery: pass.
- Infinite-distance recovery: pass.
- Planck-Stefan-Boltzmann relative error: 1.3770845459661169e-14.
- Calibration-intervention recovery: pass.
- Software pipeline: pass.

## Separate Diósi comparator

The frozen conservative and effective-Gaussian Diósi exponents are 0.004358516271770489 and 0.029511464722144533, respectively. They are reported beside the ordinary-null result and are not added to or multiplied by it. No Casimir-to-collapse transfer kernel is registered.

## Fail-closed empirical standing

Measured specimen spectra, as-built geometry, a full-Maxwell Green tensor, an independent solver check, measured calibration responses, and measured block covariance remain absent. Consequently measured evidence and ordinary-null authority are `not_ready`; residual attribution, collapse identification, and manifold dynamics are `blocked`; physical viability is `not_evaluated`; and neither a physical pilot nor confirmatory campaign is authorized by this synthetic run.
