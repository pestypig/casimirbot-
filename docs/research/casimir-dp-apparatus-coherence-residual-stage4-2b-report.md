# Casimir-DP apparatus-coherence residual Stage-4.2B report

**Campaign:** `casimir-dp-apparatus-coherence-residual-stage4-2b-v1`  
**Generated:** 2026-07-26T12:35:23.358Z  
**Evidence class:** `synthetic_fixture`  
**Claim ceiling:** `apparatus_coupled_residual_and_dp_scaling_sensitivity_forecast_only`  
**Promotion allowed:** `false`  
**Observable bridge edges added:** `0`

## Standing

The Stage-4.2B campaign gate is `pass`, and the
content/integrity gate is `pass`. This is a synthetic
software, covariance, falsifier, and apparatus-power forecast. It is not a
measurement of ordinary decoherence, objective collapse, DP dynamics,
Casimir-modified collapse, quantum foam, or manifold dynamics.

### What the runtime establishes

- Runtimes A-E execute in one frozen observable/covariance space, and Runtime F fails closed on the physical signature matrix rather than substituting an orthogonal proxy.
- Composition-aware object and branch-density transport reaches a named E_G/hbar DP forecast without treating cross-scale identities as mechanism evidence.
- Response-corrected thermometry, ordinary decoherence, sensor self-noise separation, full covariance, conditional-DP-boundary logic, and no-retuning rules are fail closed.
- All 19 recovery, contamination, leakage, retuning, covariance, coverage, and power fixtures execute with their preregistered outcomes.
- The coupled physical signature forecast is not identifiable: rank 7, maximum absolute whitened cosine 0.9999771044199663, worst pair signature-intercept/signature-thermal, and normalized Gram condition number 179103.91134865975.

### What remains unmeasured

- Authentic object, branch, material-response, spectral, sensor, nuisance, and confirmatory coherence artifacts.
- Measured ordinary-decoherence closure and a replicated held-out residual.
- Measured mass-separation-time DP scaling and an independently powered applicable companion.
- Any Casimir-to-collapse transfer kernel, objective-collapse identification, quantum-foam dynamics, or manifold dynamics.

### Active blockers

- measured_evidence_not_ready
- ordinary_decoherence_closure_not_ready
- branch_provenance_design_assumption_only
- frozen_named_dp_region_power_not_estimable_until_identifiable
- signature_identifiability_blocked
- numeric_control_response_and_covariance_forecasts_not_registered
- collapse_identification_blocked
- manifold_dynamics_blocked
- physical_viability_not_evaluated

## Frozen apparatus verdict

- Verdict: `signature_not_identifiable`
- Planned paired windows: `1600`
- Required paired windows: `not_estimable_until_identifiable`
- Achieved DP power: `not_estimable_until_identifiable`
- Signature rank: `7`
- Maximum absolute whitened cosine: `0.9999771044199663`
- Worst signature pair: `signature-intercept` / `signature-thermal` (`0.9999771044199663`)
- Normalized Gram condition number: `179103.91134865975`
- Missing control forecast: The 30 frozen OAT/sham/detuned control rows define axis and level identities but do not yet provide source-backed numeric response vectors plus a block-bound control covariance; they cannot be used to claim nuisance identifiability.
- Powered preregistered regions: `none`
- Regions a future measured null could exclude: `none`
- Power-coverage method: `deterministic_stratified_standard_normal_quantile_grid`
- Deterministic strata: `200000`
- Empirical two-sided coverage: `0.95`
- Coverage receipt: `e913ac89d45bcbff566a88214ddd74b8c5faa5e12b21a8350aeec0f63b8f5fdb`

The explicit result is a current-apparatus signature-identifiability no-go.
Power and required-window claims are withheld until the frozen nuisance
signatures are identifiable. This is a design finding, not an exclusion of DP.

## Frozen DP region and boundary rule

```json
{
  "model_id": "M_dp_regularized_synthetic_v1",
  "generator": "nonrelativistic_markovian_mass_density_dp",
  "mass_kg": 3.8877e-18,
  "radius_m": 7.5e-8,
  "branch_separation_m": 2e-8,
  "hold_time_s": 0.1,
  "r0_m": 1e-7,
  "parameter_manifest_sha256": "4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6",
  "state_preparation_evidence_class": "design_assumption",
  "xenon_parameter_map_status": "contextual_not_admitted",
  "xenon_bound_truncates_region": false,
  "conditional_boundary_identity": {
    "analytic_model_scope": "registered_nonrelativistic_markovian_mass_density_dp_only",
    "complete_joint_system_equivalence_required": true,
    "numerical_recovery_gate": "pass",
    "experimental_equivalence_gate": "not_ready",
    "boundary_null_claim_allowed": false
  }
}
```

The conditional boundary null is enforced only for the registered
nonrelativistic Markovian mass-density DP generator when complete joint-system
equivalence is demonstrated. The campaign baseline uses design-assumption
state preparation, so the experimental equivalence gate and boundary-null
claim remain not ready. The XENONnT bound is contextual and does not truncate
the parameter region.

## Authority integrity

| Role | Path | Expected SHA-256 | Actual SHA-256 | Gate |
|---|---|---|---|---|
| stage4_2b_authority_manifest | `configs/research/casimir-dp-stage4-2b-authorities.v1.json` | `dd3e423c02fdb16481c91c7ff3ee8583aa740efc71e5a04902ce32cf10754d35` | `dd3e423c02fdb16481c91c7ff3ee8583aa740efc71e5a04902ce32cf10754d35` | pass |
| stage3_config | `configs/research/casimir-dp-evidence-map-stage3.v1.json` | `231cb26e9c9bb523e2dda40a6178d8a484ec099f1868a74b995d8153337d29c2` | `231cb26e9c9bb523e2dda40a6178d8a484ec099f1868a74b995d8153337d29c2` | pass |
| stage3_authority_manifest | `configs/research/casimir-dp-stage3-authorities.v1.json` | `6f5a0a903a161bf98cd82e69b48a03288a7a436f737c07b83366efba1dbbcf13` | `6f5a0a903a161bf98cd82e69b48a03288a7a436f737c07b83366efba1dbbcf13` | pass |
| stage3_immutable_report_json | `artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-report.json` | `feb799bcf93f1497673d58eac1a98a773ac1e1b0767082104af7b7d6c8e3508b` | `feb799bcf93f1497673d58eac1a98a773ac1e1b0767082104af7b7d6c8e3508b` | pass |
| stage3_immutable_report_markdown | `artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-report.md` | `41aae6d542a19b6564f88ae7c8e7f2531abf90b08a7d02c11b043e5c691cc23a` | `41aae6d542a19b6564f88ae7c8e7f2531abf90b08a7d02c11b043e5c691cc23a` | pass |
| stage3_campaign_receipt | `artifacts/research/casimir-dp-evidence-map-stage3/casimir-dp-evidence-map-stage3-v1-20260725T134544Z/evidence-map-stage3-receipt.json` | `5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346` | `5bcd2400bfeaa57a85c4b726224ac25dc8ab4c56bd59dad1b6e54f7f11ff0346` | pass |
| stage3_downstream_verification_receipt | `docs/research/casimir-dp-evidence-map-stage3-verification-receipt.json` | `2cf09b5c5f6d0a584a0c3fd56d8e53834b78f938814ac2ff5500651349930082` | `2cf09b5c5f6d0a584a0c3fd56d8e53834b78f938814ac2ff5500651349930082` | pass |
| stage4_config | `configs/research/casimir-dp-polarization-congruence-stage4.v1.json` | `ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7` | `ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7` | pass |
| stage4_authority_manifest | `configs/research/casimir-dp-stage4-authorities.v1.json` | `3f26ef115533ef78756fad70f3880f8ea1d1ace43cbc9a0e66d6d0b5e9c2918d` | `3f26ef115533ef78756fad70f3880f8ea1d1ace43cbc9a0e66d6d0b5e9c2918d` | pass |
| stage4_immutable_report_json | `artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-report.json` | `2c56cd9b61928ee750cf0714435674cc923b4c81f02e325b8ee9e9e5a9816d0b` | `2c56cd9b61928ee750cf0714435674cc923b4c81f02e325b8ee9e9e5a9816d0b` | pass |
| stage4_immutable_report_markdown | `artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-report.md` | `1221cf1e6b6c247c3253240c44ed78446318b2cdb2966610a63d08c7ec4f00a8` | `1221cf1e6b6c247c3253240c44ed78446318b2cdb2966610a63d08c7ec4f00a8` | pass |
| stage4_campaign_receipt | `artifacts/research/casimir-dp-polarization-congruence-stage4/casimir-dp-polarization-congruence-stage4-v1-20260725T165932120Z/polarization-congruence-stage4-receipt.json` | `185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a` | `185a09ceb61b4f158afe16022783c8b184c1035f456cb341b5c90920b69b774a` | pass |
| stage4_downstream_verification_receipt | `docs/research/casimir-dp-polarization-congruence-stage4-verification-receipt.json` | `721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440` | `721b9f6aeab4b181ccc5ac21b4bc81c984d3b1fb72cdf76e55abedba11e38440` | pass |
| stage4_1_config | `configs/research/casimir-dp-qed-scale-hierarchy-stage4-1.v1.json` | `e2625c86a5366258677c58cbe78e73b8fcc1893ecd417b48765d74488f953478` | `e2625c86a5366258677c58cbe78e73b8fcc1893ecd417b48765d74488f953478` | pass |
| stage4_1_authority_manifest | `configs/research/casimir-dp-stage4-1-authorities.v1.json` | `cd681b977d47de6715322249c1026ecf5e963ac81735d6c29aa5100942824f4f` | `cd681b977d47de6715322249c1026ecf5e963ac81735d6c29aa5100942824f4f` | pass |
| stage4_1_immutable_report_json | `artifacts/research/casimir-dp-qed-scale-hierarchy-stage4-1/casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z/qed-scale-hierarchy-stage4-1-report.json` | `8f06bf394e64d40d24530e9e93b5d61edece3752318ece2095f27d61f55042c5` | `8f06bf394e64d40d24530e9e93b5d61edece3752318ece2095f27d61f55042c5` | pass |
| stage4_1_immutable_report_markdown | `artifacts/research/casimir-dp-qed-scale-hierarchy-stage4-1/casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z/qed-scale-hierarchy-stage4-1-report.md` | `6ae9530701fc35aa544b438709e789929b45eaf53ae950ec93ed976bb9703ba6` | `6ae9530701fc35aa544b438709e789929b45eaf53ae950ec93ed976bb9703ba6` | pass |
| stage4_1_campaign_receipt | `artifacts/research/casimir-dp-qed-scale-hierarchy-stage4-1/casimir-dp-qed-scale-hierarchy-stage4-1-v1-20260725T183020238Z/qed-scale-hierarchy-stage4-1-receipt.json` | `d835b56a87ed6f6d78edfb8e627bceecb931575348232ca0fd77795f5ffe24af` | `d835b56a87ed6f6d78edfb8e627bceecb931575348232ca0fd77795f5ffe24af` | pass |
| stage4_1_downstream_verification_receipt | `docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-verification-receipt.json` | `a7f60aa9b12b7c1c143a7a1681048a61275495aaed33e1dfa6caa11e9e44b8db` | `a7f60aa9b12b7c1c143a7a1681048a61275495aaed33e1dfa6caa11e9e44b8db` | pass |
| stage4_2a_config | `configs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a.v1.json` | `1459d48bbd1630e372b7b936b4931b48713afcb7c64e5df527e50f04edd087b2` | `1459d48bbd1630e372b7b936b4931b48713afcb7c64e5df527e50f04edd087b2` | pass |
| stage4_2a_authority_manifest | `configs/research/casimir-dp-stage4-2a-authorities.v1.json` | `1e4dde8f5a162b5368376b7ccaf07e19e725e6edb24b447aa6b1292732ce3b5f` | `1e4dde8f5a162b5368376b7ccaf07e19e725e6edb24b447aa6b1292732ce3b5f` | pass |
| stage4_2a_immutable_report_json | `artifacts/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a/casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1-20260725T211750900Z/electron-mass-higgs-anchor-stage4-2a-report.json` | `a53a2f1cdc7e4b2d1c9957aaa0a73316d77037371002b7ced4a2978a630fe35d` | `a53a2f1cdc7e4b2d1c9957aaa0a73316d77037371002b7ced4a2978a630fe35d` | pass |
| stage4_2a_immutable_report_markdown | `artifacts/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a/casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1-20260725T211750900Z/electron-mass-higgs-anchor-stage4-2a-report.md` | `d7dbf59d6e284ef60ccae58f0f01076b453de1a81fcb2b6863bf44d969f7357a` | `d7dbf59d6e284ef60ccae58f0f01076b453de1a81fcb2b6863bf44d969f7357a` | pass |
| stage4_2a_campaign_receipt | `artifacts/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a/casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1-20260725T211750900Z/electron-mass-higgs-anchor-stage4-2a-receipt.json` | `592a6245993411801672c6fa6ffa4cea4484e4fcf9164ad03f586a55333b17c3` | `592a6245993411801672c6fa6ffa4cea4484e4fcf9164ad03f586a55333b17c3` | pass |
| stage4_2a_downstream_verification_receipt | `docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-verification-receipt.json` | `debd651e7e500ee9b7011e7fa1c7a16ddcdcf56a6957ca0d2d91b28fe756b66a` | `debd651e7e500ee9b7011e7fa1c7a16ddcdcf56a6957ca0d2d91b28fe756b66a` | pass |
| proposal_closure_config_at_stage4_2b_freeze | `configs/research/casimir-dp-proposal-closure.v1.json` | `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba` | `7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba` | pass |
| proposal_closure_report_at_stage4_2b_freeze | `docs/research/casimir-dp-proposal-closure-report.md` | `5385a47b09877dbecd0fca2f508b1533b3a1a0aacd366d3231d361c746c159b1` | `5385a47b09877dbecd0fca2f508b1533b3a1a0aacd366d3231d361c746c159b1` | pass |
| data_readiness_config_at_stage4_2b_freeze | `configs/research/casimir-dp-data-readiness.v1.json` | `a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475` | `a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475` | pass |
| data_readiness_report_at_stage4_2b_freeze | `docs/research/casimir-dp-data-readiness-report.md` | `3939b2b773c5227046c964325abd54ca21bb164b0f0cf0c6aca84dfbc0235b90` | `3939b2b773c5227046c964325abd54ca21bb164b0f0cf0c6aca84dfbc0235b90` | pass |

## Runtime and predecessor source snapshot

| Role | Path | SHA-256 | Gate |
|---|---|---|---|
| stage4_2b_runner | `scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts` | `59c8ba29ad83d60da821f4511af085df1f8d0325dbcb94adfad41cf13fdccc89` | pass |
| stage4_2b_runtime_source:shared/casimir-dp-apparatus-scale-transport-stage4-2b.ts | `shared/casimir-dp-apparatus-scale-transport-stage4-2b.ts` | `166a4fac95bf2007263e8c5c8b08b323d60964b5e4f1648ef8b8b3132d00b396` | pass |
| stage4_2b_runtime_source:shared/casimir-dp-apparatus-spectral-thermometry-stage4-2b.ts | `shared/casimir-dp-apparatus-spectral-thermometry-stage4-2b.ts` | `4d26c0e9d6c36ab50dc375e8a05ae5e193c190407d1ccac6fa1c1ef2344c08c1` | pass |
| stage4_2b_runtime_source:shared/casimir-dp-apparatus-response-covariance-stage4-2b.ts | `shared/casimir-dp-apparatus-response-covariance-stage4-2b.ts` | `f7d6063bb4ba91f43aaac35ed9947e22c1a828737162a63ab6a8b55d7fcdca64` | pass |
| stage4_2b_runtime_source:shared/casimir-dp-dp-scaling-forecast-stage4-2b.ts | `shared/casimir-dp-dp-scaling-forecast-stage4-2b.ts` | `6ea7ff9edfef22d119d2d8c4d695c9d8ad96c0bd8f0af47ef52d58ea7ad75feb` | pass |
| stage4_2b_runtime_source:shared/casimir-dp-apparatus-coherence-residual-stage4-2b.ts | `shared/casimir-dp-apparatus-coherence-residual-stage4-2b.ts` | `d42ae2cfb3210d8505b44ddd64e79f2dc0cce734098492f0b086969c44c29f19` | pass |
| stage4_2b_runtime_source:shared/casimir-dp-apparatus-identifiability-stage4-2b.ts | `shared/casimir-dp-apparatus-identifiability-stage4-2b.ts` | `d4a2cecd3238bae15de020568f2b1f659559d269470fd5c4015f495ab8fc0b12` | pass |
| stage4_2b_runtime_source:shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts | `shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts` | `def634e201fcb761d31d40112d89a776fd6c0f24b8300034058c8741a3ef6473` | pass |
| reused_predecessor_source:shared/casimir-optical-response.ts | `shared/casimir-optical-response.ts` | `b76203a076949e682b1f1a894d28e9fab4e84634d3808e746d7f52571bf2e4ef` | pass |
| reused_predecessor_source:shared/casimir-lifshitz.ts | `shared/casimir-lifshitz.ts` | `d24399ce948013b0ac6919a766f9f524109876b9549878a4f9ceaed6af958d59` | pass |
| reused_predecessor_source:shared/dp-collapse.ts | `shared/dp-collapse.ts` | `f7308be5c2c1a62f9e2e0b23987f6e31fc0f0a9fe64f392c0053fa292d04b7c4` | pass |
| reused_predecessor_source:shared/casimir-dp-inference.ts | `shared/casimir-dp-inference.ts` | `e6093bd12bf3d5c02b6c024a3e7632bfecfd88cf7b5ad0c357b9561b861b3a69` | pass |
| reused_predecessor_source:shared/casimir-dp-phase-coherence.ts | `shared/casimir-dp-phase-coherence.ts` | `7a1e76de4da64f1341cf062ef304a61afe3d8fe98013665f8ff5f34561effc0b` | pass |
| reused_predecessor_source:shared/casimir-dp-complex-coherence.ts | `shared/casimir-dp-complex-coherence.ts` | `500c8c3c23356940a1af7178dd12e20b0b073561be8d54f834b0c263d41faa22` | pass |
| reused_predecessor_source:shared/casimir-dp-data-readiness.ts | `shared/casimir-dp-data-readiness.ts` | `ccd040a9c1e09e2b4a2dae2e809d7a547e0af54b69dd85c441a4ba87559e9260` | pass |
| reused_predecessor_source:shared/casimir-dp-proposal-readiness.ts | `shared/casimir-dp-proposal-readiness.ts` | `ff6266f4c2d3e2c3668215000a4bc711313473297cc3c61016007bd9ed14cbd1` | pass |
| reused_predecessor_source:shared/contracts/casimir-dp-next-computations.v1.ts | `shared/contracts/casimir-dp-next-computations.v1.ts` | `85b9b029921fb64c455637651a704e3e555c4ba3397958b4a18a67b247e52735` | pass |
| reused_predecessor_source:scripts/research/run-casimir-dp-next-computations.ts | `scripts/research/run-casimir-dp-next-computations.ts` | `d0b716ea591f2045bdd7578681dffcf2439be0c287b3d9f2d5de11c182ed0fd9` | pass |
| reused_predecessor_source:shared/contracts/casimir-dp-proposal-closure.v1.ts | `shared/contracts/casimir-dp-proposal-closure.v1.ts` | `b348f0a894e886cd1ec276e39aa425a10fc74099f8821637c2d5b65ab3cef427` | pass |
| reused_predecessor_source:shared/casimir-dp-qed-green-noise.ts | `shared/casimir-dp-qed-green-noise.ts` | `7be6ef905f3d0ba564969dcb0341badf1eb9aa2ac23b390b958a9c07647497e5` | pass |
| reused_predecessor_source:shared/casimir-dp-radiative-thermal-closure.ts | `shared/casimir-dp-radiative-thermal-closure.ts` | `673a2e480cae16288ab13a19badde363231d75db2a2540d5bd28ac59eb6e7006` | pass |
| reused_predecessor_source:shared/casimir-dp-dp-companion.ts | `shared/casimir-dp-dp-companion.ts` | `6432f931dd465624291c4cd7c33eda6a780d4b9687f89f6e76a2794d8708b5ac` | pass |

## Nineteen executed falsification fixtures

| Case | Runtime | Mutation | Observed gate | Observed status |
|---|---|---|---|---|
| ordinary_closure_only | E | `baseline_ordinary_only` | pass | synthetic_recovery |
| isolated_thermal_injection | B | `increase_particle_spectral_temperature` | pass | synthetic_recovery |
| em_patch_injection | C | `registered_electromagnetic_injection` | pass | synthetic_recovery |
| vibration_and_correlated_tilt_injection | C | `registered_correlated_vibration_injection` | pass | synthetic_recovery |
| residual_gas_injection | C | `registered_non_gaussian_gas_contribution` | pass | synthetic_recovery |
| optical_readout_injection | C | `registered_readout_injection` | pass | synthetic_recovery |
| correlated_covariance_false_residual | E | `omit_cross_covariance` | blocked | false_residual_prevented |
| strict_frozen_dp_injection | E | `inject_exact_frozen_dp_signature` | pass | synthetic_recovery |
| generic_irreversible_non_dp_loss | F | `replace_dp_scaling_with_generic_loss` | blocked | signature_not_identifiable |
| boundary_only_residual | E | `inject_boundary_residual_with_zero_registered_dp_contrast` | pass | boundary_correlated_anomaly_only |
| joint_system_branch_mismatch | A | `change_registered_joint_branch_density` | blocked | conditional_boundary_identity_not_applicable |
| echo_recoverable_quasistatic_dephasing | C | `registered_echo_filter_recovery` | pass | synthetic_recovery |
| blind_label_leakage | E | `confirmatory_timestamp_before_freeze` | blocked | leakage_prevented |
| post_hoc_parameter_retuning_attempt | D | `unfreeze_r0_after_held_out` | blocked | retuning_prevented |
| signature_collinearity_failure | F | `duplicate_whitened_signature` | blocked | signature_not_identifiable |
| underpowered_null | F | `use_frozen_nominal_apparatus` | pass | apparatus_not_powered_for_dp |
| sensor_self_noise_false_decoherence | C | `omit_sensor_self_noise_subtraction` | blocked | sensor_noise_confound_prevented |
| singular_covariance_jitter_rescue_attempt | E | `singular_confirmatory_covariance` | blocked | not_identifiable |
| low_visibility_gaussian_coverage_failure | E | `visibility_below_validated_log_domain` | blocked | likelihood_not_covered |

Every row above was executed through its target A-F evaluator (including strict
schema rejection where omission itself is prohibited). Expected labels were
checked against observed gates and classifications; they were not copied into
the report as unevaluated expectations.

## Required order of operations

| # | Stage | Evidence receipt(s) | Gate |
|---:|---|---|---|
| 1 | `freeze_claim_policy_conventions_sources_and_upstream_authorities` | `config_contract`, `authority_integrity`, `source_registry` | pass |
| 2 | `freeze_dp_manifest_external_bounds_ordinary_registry_and_bridge_policy` | `dp_applicability_manifest`, `runtime_d_external_bound_mapping`, `runtime_e_bridge_registry` | pass |
| 3 | `validate_blind_generation_and_synthetic_custody_mode` | `synthetic_contract_only`, `automatic_unblinding_prohibited` | pass |
| 4 | `ingest_calibration_and_pilot_artifacts_only` | `runtime_b_pilot_partition`, `runtime_c_sensor_model`, `runtime_e_pilot_partition` | pass |
| 5 | `validate_object_mass_composition_density_geometry_and_hierarchy` | `runtime_a_object_ledger` | pass |
| 6 | `validate_complete_joint_system_branches_and_equivalence` | `runtime_a_boundary_equivalence`, `runtime_d_branch_density_ledger` | pass |
| 7 | `validate_material_response_kk_geometry_surfaces_and_solver_receipts` | `optical_response_recovery`, `lifshitz_recovery`, `runtime_b_field_response` | pass |
| 8 | `fit_response_corrected_spectral_thermometry_from_pilot` | `runtime_b_output` | pass |
| 9 | `fit_sensor_noise_and_cross_spectral_response_from_pilot` | `runtime_c_output` | pass |
| 10 | `predict_all_registered_ordinary_phase_and_decoherence_lanes` | `runtime_b_thermal_jump_vector`, `runtime_c_ordinary_prediction_vector` | pass |
| 11 | `compute_frozen_dp_density_functional_scaling_and_companion` | `runtime_d_named_dp_prediction`, `runtime_d_companion_forecast` | pass |
| 12 | `reconcile_dp_manifests_and_conditional_boundary_identity` | `runtime_d_numerical_reconciliation`, `runtime_a_conditional_boundary_identity` | pass |
| 13 | `construct_pilot_likelihood_residual_covariance_and_coverage` | `runtime_e_likelihood`, `runtime_e_covariance_factorization` | pass |
| 14 | `forecast_signature_identifiability_power_and_coverage` | `runtime_f_power_forecast`, `runtime_f_parameter_regions`, `receipt_bound_deterministic_power_coverage_diagnostic` | pass |
| 15 | `run_synthetic_recovery_and_fail_closed_fixtures` | `fixture:ordinary_closure_only`, `fixture:isolated_thermal_injection`, `fixture:em_patch_injection`, `fixture:vibration_and_correlated_tilt_injection`, `fixture:residual_gas_injection`, `fixture:optical_readout_injection`, `fixture:correlated_covariance_false_residual`, `fixture:strict_frozen_dp_injection`, `fixture:generic_irreversible_non_dp_loss`, `fixture:boundary_only_residual`, `fixture:joint_system_branch_mismatch`, `fixture:echo_recoverable_quasistatic_dephasing`, `fixture:blind_label_leakage`, `fixture:post_hoc_parameter_retuning_attempt`, `fixture:signature_collinearity_failure`, `fixture:underpowered_null`, `fixture:sensor_self_noise_false_decoherence`, `fixture:singular_covariance_jitter_rescue_attempt`, `fixture:low_visibility_gaussian_coverage_failure` | pass |
| 16 | `freeze_code_exclusions_covariance_predictions_cells_and_scoring` | `software_source_snapshot`, `runtime_e_freeze_contract`, `runtime_f_design_contract` | pass |
| 17 | `ingest_synthetic_held_out_artifacts_after_freeze` | `runtime_e_synthetic_held_out_partition` | pass |
| 18 | `estimate_held_out_complex_coherence_without_refitting` | `stage3_complex_coherence_reuse`, `runtime_e_frozen_model_scores` | pass |
| 19 | `retain_custodian_authority_and_prohibit_automatic_unblinding` | `synthetic_contract_only`, `unblinded_false` | pass |
| 20 | `score_blinded_synthetic_held_out_comparison` | `runtime_e_blinded_model_comparison` | pass |
| 21 | `populate_outcome_claim_nonclaim_and_blocker_ledger` | `outcome_to_claim_map`, `scientific_standing`, `apparatus_no_go` | pass |
| 22 | `write_content_addressed_report_receipt_and_downstream_evidence_state` | `immutable_report_json`, `immutable_report_markdown`, `immutable_trace_jsonl`, `campaign_receipt` | pass |

## Final evidence state

- `software_and_synthetic_diagnostics`: `pass`
- `measured_evidence`: `not_ready`
- `ordinary_decoherence_closure`: `not_ready`
- `collapse_identification`: `blocked`
- `manifold_dynamics`: `blocked`
- `physical_viability`: `not_evaluated`
- `publication_claim`: `apparatus_power_and_identifiability_forecast_only`

The immutable timestamped JSON/Markdown pair, trace, and campaign receipt are
the campaign authority. This maintained report is a readable projection only.
