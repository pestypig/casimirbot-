export const NHM2_ALPHA07_HISTORICAL_RUNTIME_ID =
  "nhm2.shift_lapse.alpha_sweep" as const;
export const NHM2_ALPHA07_SOURCE_COMMIT =
  "3ffbd0e8cf0d89f7633659e84dfd836f7aeb905d" as const;
export const NHM2_ALPHA07_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1" as const;
export const NHM2_ALPHA07_PACKAGE_DIRECTORY =
  `artifacts/research/full-solve/profile-campaign-runs/${NHM2_ALPHA07_PROFILE_ID}` as const;
export const NHM2_ALPHA07_IMPORT_MANIFEST_NAME =
  "theory-runtime-output-manifest-alpha-0p7000-historical-import.v1.json" as const;
export const NHM2_ALPHA07_IMPORT_MANIFEST_PATH =
  `${NHM2_ALPHA07_PACKAGE_DIRECTORY}/${NHM2_ALPHA07_IMPORT_MANIFEST_NAME}` as const;
export const NHM2_ALPHA07_IMPORT_MANIFEST_GENERATED_AT =
  "2026-07-19T06:24:11.548Z" as const;
export const NHM2_ALPHA07_PROFILE_FRONTIER_PATH =
  "artifacts/research/full-solve/profile-search/nhm2-profile-campaign-frontier-latest.json" as const;

export const NHM2_ALPHA07_EXPECTED_PACKAGE_ARTIFACTS = [
  "nhm2-averaged-source-tensor-receipt.json",
  "nhm2-backreaction-residual-receipt.json",
  "nhm2-campaign-frontier-disposition.json",
  "nhm2-campaign-stability-evidence.json",
  "nhm2-candidate-campaign-grid.json",
  "nhm2-candidate-metric-profile-spec.json",
  "nhm2-candidate-tile-effective-full-tensor-source.json",
  "nhm2-dynamic-effective-geometry-evidence.json",
  "nhm2-dynamic-geometry-sample.brick.json",
  "nhm2-dynamic-geometry-samples.json",
  "nhm2-effective-geometry-reference.brick.json",
  "nhm2-effective-geometry-reference.json",
  "nhm2-frequency-convergence-evidence.json",
  "nhm2-lean-campaign-certificate.json",
  "nhm2-metric-momentum-remediation-targets.json",
  "nhm2-metric-required-full-regional-tensor.json",
  "nhm2-metric-required-momentum-demand-audit.json",
  "nhm2-momentum-frame-projection-evidence.json",
  "nhm2-momentum-frame-projection-receipt.json",
  "nhm2-observer-robust-energy-conditions.json",
  "nhm2-qei-bound-receipt.json",
  "nhm2-qei-pointwise-transition-source-samples.json",
  "nhm2-qei-worldline-dossier.json",
  "nhm2-qei-worldline-sample-plan.json",
  "nhm2-qei-worldline-sampling-receipt.json",
  "nhm2-reference-run.json",
  "nhm2-regional-full-tensor-residual.json",
  "nhm2-regional-source-closure-evidence.json",
  "nhm2-regional-source-transition-kernel.json",
  "nhm2-regional-support-function-atlas.json",
  "nhm2-source-component-authority-ledger.json",
  "nhm2-source-momentum-density-audit.json",
  "nhm2-source-off-diagonal-shear-audit.json",
  "nhm2-source-tile-counterpart-compatibility.json",
  "nhm2-switching-covariant-conservation-evidence.json",
  "nhm2-tile-counterpart-conservation.json",
  "nhm2-tile-effective-counterpart.json",
  "nhm2-tile-effective-full-tensor-counterpart.json",
  "nhm2-time-dependent-source-campaign.json",
] as const;

export const NHM2_ALPHA07_EXPECTED_CERTIFICATE_PIN_IDS = [
  "profileFrontier",
  "timeDependentSourceCampaign",
  "candidateMetricProfileSpec",
  "observerRobustEnergyConditions",
  "qeiWorldlineDossier",
  "regionalFullTensorResidual",
  "frequencyConvergenceEvidence",
  "dynamicEffectiveGeometryEvidence",
  "switchingCovariantConservationEvidence",
  "campaignStabilityEvidence",
] as const;
