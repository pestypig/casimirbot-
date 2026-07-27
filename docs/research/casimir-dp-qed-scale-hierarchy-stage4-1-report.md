# Casimir-DP QED Scale-Hierarchy Stage-4.1 report

**Campaign:** `casimir-dp-qed-scale-hierarchy-stage4-1-v1`  
**Generated:** 2026-07-25T18:30:20.238Z  
**Evidence class:** `source_backed_calculation`  
**Claim ceiling:** `qed_scale_identity_calibration`  
**Promotion allowed:** `false`

## Outcome

Stage-4.1 is a source-backed constants and algebra calibration downstream of
the immutable Stage-4 campaign. Its campaign gate is
`pass`. It distinguishes ordinary and reduced Compton
wavelengths, cyclic and angular Compton frequencies, the low-energy
`alpha_fs` coupling, Bohr and classical-electron radii, the Rydberg and
Hartree scales, and the leading bare-proton/electron reduced-mass result.

It is not an independent measurement, precision spectroscopy result,
polarization model, Casimir material-response model, DP calculation, collapse
clock, or manifold solution.

The authoritative Stage-4 config, authority manifest, immutable reports, campaign receipt, and downstream verification receipt are hash-linked and reused without mutation.

## Immutable Stage-4 and CODATA authorities

| Role | Path | Expected SHA-256 | Actual SHA-256 | Tracked expected | Tracked actual | Gate |
|---|---|---|---|---|---|---|
| stage4_1_authority_manifest | `configs/research/casimir-dp-stage4-1-authorities.v1.json` | `cd681b977d47de6715322249c1026ecf5e963ac81735d6c29aa5100942824f4f` | `cd681b977d47de6715322249c1026ecf5e963ac81735d6c29aa5100942824f4f` | false | false | pass |
| stage4_config | `configs/research/casimir-dp-polarization-congruence-stage4.v1.json` | `ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7` | `ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7` | false | false | pass |
| stage4_input_authority_manifest | `configs/research/casimir-dp-stage4-authorities.v1.json` | `3f26ef115533ef78756fad70f3880f8ea1d1ace43cbc9a0e66d6d0b5e9c2918d` | `3f26ef115533ef78756fad70f3880f8ea1d1ace43cbc9a0e66d6d0b5e9c2918d` | false | false | pass |
| stage4_immutable_report_json | `artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-report.json` | `2c56cd9b61928ee750cf0714435674cc923b4c81f02e325b8ee9e9e5a9816d0b` | `2c56cd9b61928ee750cf0714435674cc923b4c81f02e325b8ee9e9e5a9816d0b` | false | false | pass |
| stage4_immutable_report_markdown | `artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-report.md` | `1221cf1e6b6c247c3253240c44ed78446318b2cdb2966610a63d08c7ec4f00a8` | `1221cf1e6b6c247c3253240c44ed78446318b2cdb2966610a63d08c7ec4f00a8` | false | false | pass |
| stage4_immutable_campaign_receipt | `artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-receipt.json` | `185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a` | `185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a` | false | false | pass |
| stage4_downstream_verification_receipt | `docs/research/casimir-dp-polarization-congruence-stage4-verification-receipt.json` | `721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440` | `721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440` | false | false | pass |
| codata_2022_constants_registry | `configs/constants/codata-2022.v1.json` | `5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61` | `5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61` | true | true | pass |

## Software source authorities

**Git HEAD:** `705759a201ee77313919de906c53dc8565de75bc`  
**Worktree state:** `dirty_uncommitted_source_hashes_authoritative`  
**Authority mode:** `content_hashes`

| Role | Path | Expected SHA-256 | Actual SHA-256 | Tracked expected | Tracked actual | Gate |
|---|---|---|---|---|---|---|
| qed_scale_hierarchy_runtime | `shared/casimir-dp-qed-scale-hierarchy-calibration.ts` | `f1f8e4e904faeba71883f17578fa4f3d6f2f1dfb961d4e00725c63cf4de25f02` | `f1f8e4e904faeba71883f17578fa4f3d6f2f1dfb961d4e00725c63cf4de25f02` | false | false | pass |
| stage4_1_contract | `shared/contracts/casimir-dp-qed-scale-hierarchy-stage4-1.v1.ts` | `8bdcf140697817ee36dd048a96cd6ad425d6a7113d946ef58e02b4c09b5fb8f4` | `8bdcf140697817ee36dd048a96cd6ad425d6a7113d946ef58e02b4c09b5fb8f4` | false | false | pass |
| stage4_1_runner | `scripts/research/run-casimir-dp-qed-scale-hierarchy-stage4-1.ts` | `781621c890ea2ea3a74078b4b8b407f16da9b7031f7969bc8c0e3c2f02debfdd` | `781621c890ea2ea3a74078b4b8b407f16da9b7031f7969bc8c0e3c2f02debfdd` | false | false | pass |

## Calibration fixture

| Path | Expected SHA-256 | Actual SHA-256 | Gate |
|---|---|---|---|
| `configs/research/fixtures/casimir-dp-qed-scale-hierarchy.codata2022.v1.json` | `784e5d456940b55f07f81a7c421fc7ba323c9aefb34b65863f1c1a999803d392` | `784e5d456940b55f07f81a7c421fc7ba323c9aefb34b65863f1c1a999803d392` | pass |

## Stage-4.1 order of operations

| # | Stage | Gate |
|---:|---|---|
| 0 | `hash_link_immutable_stage4_authorities` | pass |
| 1 | `freeze_codata_units_symbols_species_mass_and_frequency_conventions` | pass |
| 2 | `validate_source_provenance_uncertainty_covariance_and_rounding` | pass |
| 3 | `compute_compton_energy_frequency_and_wavelength_closure` | pass |
| 4 | `compute_bohr_classical_radius_rydberg_and_hartree_closure` | pass |
| 5 | `compute_leading_hydrogenic_reduced_mass_closure` | pass |
| 6 | `validate_dimensionless_scale_hierarchy_and_reference_envelopes` | pass |
| 7 | `freeze_precision_correction_ledger_and_semantic_nonbridge` | pass |
| 8 | `populate_stage4_1_outcome_nonclaim_and_falsifier_ledger` | pass |
| 9 | `write_hash_backed_stage4_1_receipt_report_and_evidence_state` | pass |

## QED scale identities

\[
E_e=m_ec^2=h\nu_C=\hbar\omega_C,\qquad
\lambda_C=2\pi\bar\lambda_C
\]

\[
a_0=\frac{\bar\lambda_C}{\alpha_{fs}},\qquad
r_e=\alpha_{fs}\bar\lambda_C=\alpha_{fs}^2a_0
\]

\[
cR_\infty=\frac{\alpha_{fs}^2}{2}\nu_C,\qquad
E_h=2hcR_\infty
\]

Selected results:

- Electron rest energy: `8.187105787968e-14 J`
- Cyclic Compton frequency:
  `1.235589965489e+20 Hz`
- Angular Compton frequency:
  `7.763440716861e+20 rad s^-1`
- Ordinary Compton wavelength:
  `2.426310235380e-12 m`
- Reduced Compton wavelength:
  `3.861592674352e-13 m`
- Bohr radius: `5.291772105467e-11 m`
- Classical electron radius:
  `2.817940320447e-15 m`
- Rydberg frequency:
  `3.289841960214e+15 Hz`
- Hartree energy: `4.359744722159e-18 J`

Maximum algebraic relative residual:
`1.697367151440e-16`.
Maximum dimensionless-hierarchy relative residual:
`1.937272989296e-16`.

## CODATA tabulation and rounding consistency

| Quantity | Computed | Tabulated | Absolute difference | Conservative envelope | Significance | Gate |
|---|---:|---:|---:|---:|---|---|
| `electron_compton_wavelength_m` | 2.426310235380e-12 | 2.426310235380e-12 | 3.170589750264e-25 | 7.553939779262e-21 | not_computable_without_cross_covariance | pass |
| `electron_reduced_compton_wavelength_m` | 3.861592674352e-13 | 3.861592674400e-13 | 4.762447948128e-24 | 1.218479198362e-21 | not_computable_without_cross_covariance | pass |
| `bohr_radius_m` | 5.291772105467e-11 | 5.291772105440e-11 | 2.740165026053e-22 | 1.624619952227e-19 | not_computable_without_cross_covariance | pass |
| `classical_electron_radius_m` | 2.817940320447e-15 | 2.817940320500e-15 | 5.325994401600e-26 | 1.320470292092e-23 | not_computable_without_cross_covariance | pass |
| `rydberg_constant_m_inv` | 1.097373156804e+7 | 1.097373156816e+7 | 1.185052096844e-4 | 3.346953183488e-2 | not_computable_without_cross_covariance | pass |
| `rydberg_frequency_Hz` | 3.289841960214e+15 | 3.289841960250e+15 | 3.554550000000e+4 | 1.003342618826e+7 | not_computable_without_cross_covariance | pass |
| `rydberg_energy_J` | 2.179872361079e-18 | 2.179872361103e-18 | 2.355142691793e-29 | 6.650625998805e-27 | not_computable_without_cross_covariance | pass |
| `hartree_energy_J` | 4.359744722159e-18 | 4.359744722206e-18 | 4.710285383587e-29 | 1.329875199761e-26 | not_computable_without_cross_covariance | pass |

This is
`tabulation_and_rounding_consistency_not_independent_test`.
Reference significance is
`not_computable_without_cross_covariance` because derived
and tabulated CODATA quantities lack a supplied cross-covariance in this
fixture.

## Leading reduced-mass hydrogenic scale

- `mu/m_e`: `9.994556794248e-1`
- Reduced-mass Rydberg:
  `1.096775834016e+7 m^-1`
- Leading `1->2` transition:
  `2.466038423660e+15 Hz`
- Declared transition standard uncertainty:
  `1.501482101801e+6 Hz`
- Uncertainty propagation:
  `conservative_l1_relative_uncertainty_bound`
- Maximum closure residual:
  `1.110827670982e-16`

The result is
`leading_nonrelativistic_reduced_mass_not_precision_hydrogen_spectroscopy`. Precision spectroscopy remains
`not_ready`; the correction ledger lists
every deliberately omitted contribution.

### Frozen precision-correction ledger

Applied at this maturity:

- `si_exact_constants`
- `codata_low_energy_constants`
- `leading_nonrelativistic_reduced_mass`

Omitted, and therefore unavailable for a precision-spectroscopy claim:

- `dirac_bound_state`
- `relativistic_recoil`
- `radiative_recoil`
- `electron_self_energy`
- `vacuum_polarization`
- `higher_order_radiative`
- `finite_nuclear_size`
- `nuclear_polarizability`
- `hyperfine_structure`
- `stark_shift`
- `zeeman_shift`
- `doppler_shift`
- `pressure_shift`
- `blackbody_shift`

The ledger is complete for the declared leading nonrelativistic
reduced-mass level, not for a measured transition. Cross-adjustment
significance remains
`not_computable_without_cross_covariance`.

## Stage-4 semantic non-bridge

- Upstream: `same_dimension_not_connected`
- Downstream: `same_dimension_not_connected`
- Stage-4 modified: `false`
- Observable bridge edges added:
  `0`
- Gate: `pass`

## Outcome-to-claim map

| Outcome | Establishes | Does not establish | Maximum claim |
|---|---|---|---|
| `algebraic_identity_closure_pass` | The implementation reproduces the declared Compton, Bohr, classical-radius, Rydberg, Hartree, and dimensionless scale identities. | An independent test of QED, an electron oscillator, a cavity resonance, or a collapse clock. | `qed_scale_identity_calibration` |
| `codata_tabulation_consistency_pass` | Recomputed values lie inside a conservative envelope constructed from the declared CODATA rounding and uncertainty metadata. | Statistical agreement between independent measurements; the tabulations share a correlated least-squares adjustment. | `correlated_reference_consistency` |
| `leading_reduced_mass_closure_pass` | The leading nonrelativistic bare-proton/electron reduced-mass scaling and level-difference bookkeeping close. | Precision hydrogen spectroscopy or any omitted relativistic, radiative, recoil, finite-size, hyperfine, or apparatus correction. | `leading_hydrogenic_scale_only` |
| `same_identity_family_not_collapse_bridge` | The Compton-to-Rydberg relation is admitted only inside its explicit Coulomb/Dirac-QED scale family. | A Casimir-to-atomic, atomic-to-DP, Compton-to-collapse, or manifold transfer kernel. | `same_identity_family_not_collapse_bridge` |

## Final gates

- `software_identity_calibration`: `pass`
- `source_authority_integrity`: `pass`
- `algebraic_identity_closure`: `pass`
- `codata_tabulation_consistency`: `pass`
- `covariance_semantics`: `pass`
- `leading_reduced_mass_closure`: `pass`
- `measured_evidence`: `not_ready`
- `apparatus_material_response`: `not_ready`
- `ordinary_physics_apparatus_closure`: `not_ready`
- `precision_spectroscopy`: `not_ready`
- `independent_empirical_validation`: `not_evaluated`
- `polarization_or_helicity_model`: `not_evaluated`
- `casimir_to_atomic_transfer`: `blocked`
- `atomic_to_dp_transfer`: `blocked`
- `compton_to_collapse_clock`: `blocked`
- `collapse_identification`: `blocked`
- `manifold_dynamics`: `blocked`
- `physical_viability`: `not_evaluated`
- `publication_claim`: `diagnostic_constants_calibration_only`

## Claim boundaries

- The Compton-to-Rydberg relation is admitted because an explicit Coulomb/Dirac-QED scale derivation supplies the dynamics; equal dimensions alone would not be enough.
- The fine-structure constant is an electromagnetic coupling, not a universal photon-emission probability.
- CODATA reference agreement is a correlated tabulation and rounding consistency check, not independent empirical validation.
- The leading reduced-mass hydrogenic result omits precision spectroscopy corrections listed in the correction ledger.
- The calibration contains no circular-polarization, material-response, Casimir, DP, collapse, resonance, transfer-kernel, or manifold model.
- Stage-4 remains immutable and its Compton/DP/cavity result remains same_dimension_not_connected.
