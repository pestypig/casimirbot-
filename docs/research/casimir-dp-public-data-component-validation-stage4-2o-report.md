# Casimir-DP Stage-4.2O public-data component-validation report

**Run:** `casimir-dp-public-data-component-validation-stage4-2o-v1-20260807T120000000Z`  
**Evidence:** external public component measurements only  
**Claim ceiling:** separate public-dataset recovery only

## Result

The component replay is `pass`. This means the repository recovered four bounded analysis capabilities from four independent public records. It does **not** mean that a public dataset instantiates the proposed Casimir-Diósi experiment.

## Separate component replays

- **Matter-wave complex fringe:** 95 sodium-cluster scans; alternating train/holdout mean Mahalanobis squared 0.011430578008874124; gate `pass`.
- **Measured boundary response:** 108 paired superconducting-drum traces; RMS up/down spectral-centroid shift 7357.609597574939 Hz; gate `pass`.
- **Multichannel covariance:** 421912 active LISA Pathfinder rows across 16 channels; train/holdout shrunk condition numbers 3.323331385049667 and 3.338170805547195; relative covariance drift 0.1479192071827712; held-out/train residual-RMSE ratio 0.9884987563593132; gate `pass`.
- **External Diósi bound:** Gran Sasso figure-source workbooks authenticated (4000 and 140 bins); data/simulation Pearson coefficient 0.9716288126764561; gate `pass`. The registered 100 nm comparator remains `not_adjudicated`.

## Why these results cannot be fused

Each dataset comes from a different apparatus, source population, transfer function, noise process, and scientific observable. Stage-4.2O therefore creates no shared likelihood, no cross-apparatus covariance, and no transported residual. The sodium coefficient demonstrates complex fringe reconstruction; it is not the proposed sphere coherence. The drum traces demonstrate a measured nonlinear boundary response; they are not the proposed cavity's ordinary-null calibration. LISA Pathfinder demonstrates held-out classical covariance handling; it is not a quantum measurement. Gran Sasso constrains a model variant; it is not a positive collapse observation.

## Leading design and empirical standing

The Stage-4.2N leading design is unchanged: diamond sphere, radius 2.76302362398029e-7 m, mass 3.0925052683774525e-16 kg, separation 2.5e-7 m, hold 0.25 s, gap 0.00001 m, temperature 4 K, and pressure 1e-15 Pa.

Measured evidence and joint-protocol validation remain `not_ready`; collapse identification and manifold dynamics remain `blocked`; physical viability remains `not_evaluated`. No physical pilot or confirmatory campaign is authorized by these replays.

## Provenance and graph policy

- Upstream receipt integrity: true.
- Compact fixture integrity: true.
- Public-source provenance gate: `pass`.
- Cross-apparatus isolation gate: `pass`.
- Observable bridge edges added: 0.
- Theory Badge promotable: false.
