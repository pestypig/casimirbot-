# Casimir-DP Stage-4.2M constrained apparatus-search report

**Run:** casimir-dp-apparatus-search-stage4-2m-v1-20260806T070000000Z
**Evidence:** synthetic bounded search only
**Claim ceiling:** configuration region for measured subsystem commissioning or explicit no-go

## Outcome

- Candidates evaluated: 200.
- Synthetic candidates passing every registered numerical gate: 3.
- Search result: bounded_configuration_region_found.
- Measured commissioning standing: candidate_region_for_measured_subsystem_commissioning_only.
- Physical pilot authorized: false.
- Confirmatory campaign authorized: false.

## Best synthetic candidate

- Material: diamond.
- Radius: 2.76302362398029e-7 m; mass: 3.0925052683774525e-16 kg.
- Separation: 2.5e-7 m; hold: 0.25 s.
- Gap: 0.00001 m; plate size: 0.00008 m.
- Temperature: 4 K; pressure: 1e-15 Pa.
- Conservative density-envelope DP exponent: 0.004358516271770489.
- Gaussian DP exponent: 0.029511464722144533.
- Echoed phase sigma: 1.1090590462729788e-8 rad.
- Gas/DP ratio: 0.007320189464457684.
- Required paired windows: 1028.
- Forecast power at 1600 windows: 0.9273857695533987.
- Synthetic companion SNR: 8.66831156417962.
- Mass ratio to 170 kDa benchmark: 1095500.1196262634.

## Eligible synthetic neighborhood

| Candidate | Material | Gap (m) | Pressure (Pa) | Conservative DP exponent | Echoed phase sigma (rad) | Gas/DP | Windows |
|---|---|---:|---:|---:|---:|---:|---:|
| stage4_2m_candidate_002 | diamond | 0.00001 | 1e-15 | 0.004358516271770489 | 1.1090590462729788e-8 | 0.007320189464457684 | 1028 |
| stage4_2m_candidate_003 | diamond | 0.000005 | 1e-15 | 0.004358516271770489 | 2.1443003260869268e-7 | 0.007320189464457684 | 1028 |
| stage4_2m_candidate_004 | diamond | 0.00001 | 3e-15 | 0.004358516271770489 | 1.1090590462729788e-8 | 0.02196056839337305 | 1028 |

## Interpretation

This result solves only the bounded synthetic search. The electromagnetic Jacobian is a transported Stage-4.2L surrogate, the gas rate is a scaled QLBE proxy, the density envelope uses the registered Stage-4.2L factor, and Stage-4.2C signature geometry is transported rather than remeasured. The selected diamond neighborhood therefore defines targets for subsystem commissioning; it is not an as-built apparatus solution.

Measured material spectra, as-built geometry, a full Maxwell Green tensor, measured covariance, measured gas scattering, integrated state preparation, a measured companion detector, and independent replication remain absent. Measured evidence is not_ready; residual attribution, collapse identification, and manifold dynamics remain blocked; physical viability remains not_evaluated; and no Casimir-to-collapse transfer kernel is registered.
