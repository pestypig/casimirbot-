import {
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_NUMERIC_CHECK_POLICIES,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS,
  type Nhm2ExperimentReadyTheoryClosureEvidenceId,
} from "./nhm2-experiment-ready-theory-closure.v1";

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION =
  "nhm2_experiment_ready_theory_candidate_manifest/v1" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID =
  "nhm2.experiment_ready_theory_candidate_manifest" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_PHASE =
  "pre_run_frozen" as const;

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_DIRECTORY_NAME =
  "formal-preseal" as const;
export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_FILENAME =
  "formal-run-spec.v1.json" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY_CONTRACT_VERSION =
  "nhm2_experiment_ready_theory_diagnostic_sufficiency_policy/v1" as const;

/**
 * Pre-run diagnostic sufficiency thresholds. The candidate-manifest raw hash
 * freezes these values before execution. Meeting them is necessary for a
 * theory-closure diagnostic; it is not evidence of physical viability.
 */
export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY =
  {
    contractVersion:
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY_CONTRACT_VERSION,
    policyId: "nhm2-experiment-ready-theory-diagnostic-sufficiency-v1",
    frozenInCandidateManifest: true,
    diagnosticOnly: true,
    physicalProofAuthority: false,
    continuousObserver: {
      minimumSpatialSamples: 64,
      minimumNullDirectionsPerSpatialSample: 128,
      minimumResolutionLevels: 3,
      minimumObservedConvergenceOrder: 1,
    },
    worldlineQei: {
      minimumSamplingFunctionFamilies: 2,
      minimumWorldlinesPerRegionAndFamily: 4,
      minimumSamplesPerWorldline: 64,
      minimumRefinementLevels: 3,
      minimumObservedConvergenceOrder: 1,
    },
    dynamics: {
      minimumEvolutionSamples: 16,
      minimumSwitchingPeriods: 3,
      minimumLightCrossingTimes: 3,
      minimumControlCycles: 3,
    },
  } as const;

export type Nhm2ExperimentReadyTheoryCandidateDiagnosticSufficiencyPolicyV1 =
  typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION =
  "nhm2_prediction_falsifier_freeze/v1" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION =
  "nhm2_experiment_ready_theory_candidate_numeric_policy_set/v1" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID =
  "nhm2.experiment_ready_theory_candidate_numeric_policy_set" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_ENTRY_SHA256_DOMAIN =
  "nhm2_experiment_ready_theory_candidate_numeric_policy_entry_sha256/v1" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NON_NUMERIC_CHECK_POLICY_SHA256_DOMAIN =
  "nhm2_experiment_ready_theory_candidate_non_numeric_check_policy_sha256/v1" as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES =
  [...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_IDS] as const;

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES =
  ["primary_numerical", "independent_numerical", "formal_kernel"] as const;

export type Nhm2ExperimentReadyTheoryCandidateEvidenceRole =
  Nhm2ExperimentReadyTheoryClosureEvidenceId;

export type Nhm2ExperimentReadyTheoryCandidateNumericCheckId =
  keyof typeof NHM2_EXPERIMENT_READY_THEORY_CLOSURE_NUMERIC_CHECK_POLICIES;

export type Nhm2ExperimentReadyTheoryCandidateComparator =
  (typeof NHM2_EXPERIMENT_READY_THEORY_CLOSURE_NUMERIC_CHECK_POLICIES)[Nhm2ExperimentReadyTheoryCandidateNumericCheckId];

export type Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole =
  (typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES)[number];

export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_NUMERIC_CHECK_IDS =
  Object.freeze(
    Object.keys(NHM2_EXPERIMENT_READY_THEORY_CLOSURE_NUMERIC_CHECK_POLICIES),
  ) as readonly Nhm2ExperimentReadyTheoryCandidateNumericCheckId[];

export type Nhm2ExperimentReadyTheoryCandidateAuthoritativeNumericPolicyV1 = {
  comparator: Nhm2ExperimentReadyTheoryCandidateComparator;
  threshold: number;
  unit: string;
};

/**
 * Frozen diagnostic acceptance policies. These values are manifest policy,
 * not evidence that a physical system satisfies the checks.
 */
export const NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES =
  {
    nondegenerate_metric_signal_above_numerical_floor: {
      comparator: "gt",
      threshold: 1e-12,
      unit: "J/m^3",
    },
    independent_metric_route_and_grid_convergence: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_L_inf",
    },
    uncertainty_aware_absolute_relative_residuals_pass: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_L_inf",
    },
    ward_identity_pass: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_L_inf",
    },
    rset_uncertainty_budget_bounded: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_fraction",
    },
    discrete_global_balance_pass: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_L_inf",
    },
    time_resolved_cycle_energy_ledger_closed: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_energy_closure",
    },
    residual_within_frozen_uncertainty_tolerance: {
      comparator: "lte",
      threshold: 1,
      unit: "sigma",
    },
    spatial_temporal_convergence_observed: {
      comparator: "gte",
      threshold: 1,
      unit: "observed_order",
    },
    every_admitted_spatial_sample_covered: {
      comparator: "gte",
      threshold: 1,
      unit: "coverage_fraction",
    },
    optimizer_convergence_and_globality_evidence: {
      comparator: "lte",
      threshold: 1e-6,
      unit: "relative_objective_delta",
    },
    four_velocity_normalization_verified: {
      comparator: "lte",
      threshold: 1e-10,
      unit: "absolute_norm_error",
    },
    sampling_function_normalized: {
      comparator: "lte",
      threshold: 1e-10,
      unit: "absolute_integral_error",
    },
    quadrature_and_interpolation_error_bounded: {
      comparator: "lte",
      threshold: 0.01,
      unit: "relative_error",
    },
    all_margins_pass_with_uncertainty: {
      comparator: "gte",
      threshold: 0,
      unit: "J/m^3",
    },
    positive_timestep_duration_and_multiple_samples: {
      comparator: "gt",
      threshold: 1,
      unit: "sample_count",
    },
    bssn_constraints_propagate_within_tolerance: {
      comparator: "lte",
      threshold: 0.1,
      unit: "normalized_constraint_L_inf",
    },
    resolution_boundary_and_frequency_convergence_observed: {
      comparator: "gte",
      threshold: 1,
      unit: "observed_order",
    },
    semiclassical_backreaction_residual_bounded: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_L_inf",
    },
    ray_blueshift_and_particle_accumulation_bounded: {
      comparator: "lte",
      threshold: 1,
      unit: "dimensionless_gain",
    },
    perturbation_growth_spectrum_bounded: {
      comparator: "lte",
      threshold: 0,
      unit: "1/s",
    },
    parameter_neighborhood_robustness_pass: {
      comparator: "gte",
      threshold: 0.95,
      unit: "coverage_fraction",
    },
    matsubara_frequency_and_mesh_convergence_observed: {
      comparator: "gte",
      threshold: 1,
      unit: "observed_order",
    },
    roughness_patch_temperature_uncertainty_bounded: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_fraction",
    },
    analytic_limits_and_independent_solver_crosscheck_pass: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_L_inf",
    },
    support_retention_overlap_lower95_gt_one: {
      comparator: "gt",
      threshold: 1,
      unit: "1",
    },
    pull_in_buckling_contact_stiction_margins_positive: {
      comparator: "gt",
      threshold: 0,
      unit: "minimum_normalized_margin",
    },
    stress_thermal_fatigue_modal_margins_positive: {
      comparator: "gt",
      threshold: 0,
      unit: "minimum_factor_of_safety_margin",
    },
    fabrication_tolerance_envelope_pass: {
      comparator: "gte",
      threshold: 0.95,
      unit: "coverage_fraction",
    },
    active_control_energy_noise_heat_timing_bounded: {
      comparator: "lte",
      threshold: 1,
      unit: "budget_fraction",
    },
    periodic_cycle_energy_balance_closed: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_energy_closure",
    },
    field_level_outputs_agree_within_frozen_tolerances: {
      comparator: "lte",
      threshold: 0.1,
      unit: "relative_L_inf",
    },
  } as const satisfies Record<
    Nhm2ExperimentReadyTheoryCandidateNumericCheckId,
    Nhm2ExperimentReadyTheoryCandidateAuthoritativeNumericPolicyV1
  >;

export type Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 = {
  artifactId: string;
  contractVersion: string;
  path: string;
  sha256: string;
};

export type Nhm2ExperimentReadyTheoryCandidateBindingsV1 = {
  candidate: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 & {
    candidateId: string;
  };
  profile: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 & {
    selectedProfileId: string;
  };
  chart: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 & {
    chartId: string;
  };
  atlas: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 & {
    atlasId: string;
  };
  units: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 & {
    unitsId: string;
  };
  normalization: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 & {
    normalizationId: string;
  };
};

export type Nhm2ExperimentReadyTheoryCandidateInvocationEnvironmentEntryV1 = {
  name: string;
  valueKind: "literal" | "candidate_manifest_raw_sha256";
  value: string | null;
};

export type Nhm2ExperimentReadyTheoryCandidateExpectedInvocationV1 = {
  entrypoint: string;
  command: string;
  args: string[];
  cwd: string;
  environment: Nhm2ExperimentReadyTheoryCandidateInvocationEnvironmentEntryV1[];
  outputDirectory: string;
};

export type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 = {
  planRole: Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole;
  requestId: string;
  runId: string;
  receiptId: string;
  runtimeId: string;
  sourceCommitSha: string;
  deterministicSeedPolicy: string;
  solver: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 & {
    solverId: string;
    solverVersion: string;
    implementationId: string;
  };
  environmentLock: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 & {
    environmentId: string;
  };
  expectedInvocation: Nhm2ExperimentReadyTheoryCandidateExpectedInvocationV1;
};

export const nhm2ExperimentReadyTheoryFormalRunSpecPath = (input: {
  outputDirectory: string;
  runId: string;
}): string => {
  const suffix = `/runs/${input.runId}`;
  if (!input.outputDirectory.endsWith(suffix)) {
    throw new Error(
      "Formal plan output directory does not have the frozen candidate run layout.",
    );
  }
  return `${input.outputDirectory.slice(0, -suffix.length)}/${NHM2_EXPERIMENT_READY_THEORY_FORMAL_PRESEAL_DIRECTORY_NAME}/${input.runId}/${NHM2_EXPERIMENT_READY_THEORY_FORMAL_RUN_SPEC_FILENAME}`;
};

export const NHM2_EXPERIMENT_READY_THEORY_FORMAL_NPM_SCRIPT =
  "warp:full-solve:nhm2:theory-candidate:formal" as const;

export const nhm2ExperimentReadyTheoryFormalInvocation = (input: {
  candidateManifestPath: string;
  outputDirectory: string;
  runId: string;
}) => {
  const formalRunSpecPath = nhm2ExperimentReadyTheoryFormalRunSpecPath({
    outputDirectory: input.outputDirectory,
    runId: input.runId,
  });
  const cliArgs = [
    "--candidate-manifest",
    input.candidateManifestPath,
    "--formal-run-spec",
    formalRunSpecPath,
  ] as const;
  return {
    formalRunSpecPath,
    cliArgs,
    entrypoint: `npm run ${NHM2_EXPERIMENT_READY_THEORY_FORMAL_NPM_SCRIPT} -- ${cliArgs.join(" ")}`,
    command: "npm" as const,
    args: [
      "run",
      "-s",
      NHM2_EXPERIMENT_READY_THEORY_FORMAL_NPM_SCRIPT,
      "--",
      ...cliArgs,
    ],
    cwd: "." as const,
  };
};

export type Nhm2ExperimentReadyTheoryCandidateExpectedEvidenceOutputV1 = {
  evidenceRole: Nhm2ExperimentReadyTheoryCandidateEvidenceRole;
  outputPath: string;
  contractVersion: string;
  requestId: string;
  runId: string;
  receiptId: string;
  runtimeId: string;
};

export type Nhm2ExperimentReadyTheoryCandidatePredictionFreezeCommitmentV1 = {
  contractVersion: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION;
  semanticSha256: string;
  frozenAt: string;
};

export type Nhm2ExperimentReadyTheoryCandidateNumericCheckPolicyV1 = {
  checkId: Nhm2ExperimentReadyTheoryCandidateNumericCheckId;
  evidenceRole: Nhm2ExperimentReadyTheoryCandidateEvidenceRole;
  comparator: Nhm2ExperimentReadyTheoryCandidateComparator;
  threshold: number;
  unit: string;
};

export type Nhm2ExperimentReadyTheoryCandidateNumericPolicySetSemanticPayloadV1 =
  {
    artifactId: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID;
    contractVersion: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION;
    policySetId: string;
    policies: Nhm2ExperimentReadyTheoryCandidateNumericCheckPolicyV1[];
  };

export type Nhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifactV1 =
  Nhm2ExperimentReadyTheoryCandidateNumericPolicySetSemanticPayloadV1 & {
    semanticSha256: string;
  };

export type Nhm2ExperimentReadyTheoryCandidateNumericPolicySetBindingV1 = {
  artifactId: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID;
  contractVersion: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION;
  policySetId: string;
  artifactPath: string;
  artifactRawSha256: string;
  semanticSha256: string;
};

export type Nhm2ExperimentReadyTheoryCandidateSupersessionV1 = {
  policyId: string;
  policyPath: string;
  policyContractVersion: string;
  policySha256: string;
  originalManifestImmutable: true;
  inPlaceMutationForbidden: true;
  supersedingManifestRequiresNewManifestId: true;
  supersedingManifestRequiresPredecessorSha256: true;
  predecessorManifestId: string | null;
  predecessorManifestSha256: string | null;
};

export type Nhm2ExperimentReadyTheoryCandidateManifestReadinessV1 = {
  status: "not_ready" | "pre_run_manifest_ready";
  preRunManifestReady: boolean;
  requiredExecutionPlanCount: number;
  suppliedExecutionPlanCount: number;
  requiredEvidenceRoleCount: number;
  suppliedEvidenceRoleCount: number;
  requiredNumericCheckCount: number;
  policySemanticDigestBound: boolean;
  predictionFreezeSemanticDigestBound: boolean;
  diagnosticSufficiencyPolicyFrozen: boolean;
  blockerCount: number;
  firstBlocker: string;
  blockers: string[];
};

export type Nhm2ExperimentReadyTheoryCandidateManifestV1 = {
  artifactId: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION;
  phase: typeof NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_PHASE;
  generatedAt: string;
  frozenAt: string;
  manifestId: string;
  laneId: "nhm2_shift_lapse";
  bindings: Nhm2ExperimentReadyTheoryCandidateBindingsV1;
  executionPlans: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1[];
  expectedEvidenceOutputs: Nhm2ExperimentReadyTheoryCandidateExpectedEvidenceOutputV1[];
  predictionFreezeCommitment: Nhm2ExperimentReadyTheoryCandidatePredictionFreezeCommitmentV1;
  numericCheckPolicySet: Nhm2ExperimentReadyTheoryCandidateNumericPolicySetBindingV1;
  diagnosticSufficiencyPreregistration: Nhm2ExperimentReadyTheoryCandidateDiagnosticSufficiencyPolicyV1;
  supersession: Nhm2ExperimentReadyTheoryCandidateSupersessionV1;
  readiness: Nhm2ExperimentReadyTheoryCandidateManifestReadinessV1;
  claimBoundary: {
    preRunManifestOnly: true;
    evaluatorMustVerifyFrozenAtBeforeExecutionStart: true;
    evaluatorMustResolveCandidateManifestRawShaBeforeSpawn: true;
    postRunTimingAndArtifactHashesForbiddenHere: true;
    detachedPolicyArtifactMustValidate: true;
    manifestReadinessCannotEstablishTheoryClosure: true;
    experimentReadyTheoryClosureClaimAllowed: false;
    physicalViabilityStatus: "blocked_pending_empirical_receipts";
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    empiricalReceiptsRequiredForPhysicalPromotion: true;
  };
};

export type BuildNhm2ExperimentReadyTheoryCandidateManifestInput = {
  generatedAt?: string | null;
  frozenAt: string;
  manifestId: string;
  bindings: Nhm2ExperimentReadyTheoryCandidateBindingsV1;
  executionPlans?: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1[] | null;
  expectedEvidenceOutputs?:
    Nhm2ExperimentReadyTheoryCandidateExpectedEvidenceOutputV1[] | null;
  predictionFreezeCommitment: Nhm2ExperimentReadyTheoryCandidatePredictionFreezeCommitmentV1;
  numericCheckPolicySet: Nhm2ExperimentReadyTheoryCandidateNumericPolicySetBindingV1;
  supersession: Nhm2ExperimentReadyTheoryCandidateSupersessionV1;
};

type CandidateManifestCore = Omit<
  Nhm2ExperimentReadyTheoryCandidateManifestV1,
  "readiness" | "claimBoundary"
>;

const SHA256 = /^[a-f0-9]{64}$/i;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/i;
const ENVIRONMENT_NAME = /^[A-Z_][A-Z0-9_]*$/;

const REQUIRED_EXECUTOR_ENVIRONMENT_NAMES = [
  "NHM2_ATLAS_SHA256",
  "NHM2_CANDIDATE_ID",
  "NHM2_CANDIDATE_MANIFEST_SHA256",
  "NHM2_CHART_ID",
  "NHM2_NORMALIZATION_SHA256",
  "NHM2_OUTPUT_DIR",
  "NHM2_RUN_ID",
  "NHM2_SELECTED_PROFILE_ID",
  "NHM2_UNITS_SHA256",
  "THEORY_RUNTIME_ID",
  "THEORY_RUNTIME_RECEIPT_ID",
  "THEORY_RUNTIME_REQUEST_ID",
] as const;

const SHA256_ROUND_CONSTANTS = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotateRight = (value: number, bits: number): number =>
  (value >>> bits) | (value << (32 - bits));

/** Browser-safe SHA-256 for the detached canonical semantic payload. */
export const sha256Nhm2CanonicalText = (value: string): string => {
  const input = new TextEncoder().encode(value);
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const bitLength = input.length * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(
    paddedLength - 8,
    Math.floor(bitLength / 0x1_0000_0000),
    false,
  );
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const state = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false);
    }
    for (let index = 16; index < 64; index += 1) {
      const word15 = words[index - 15];
      const word2 = words[index - 2];
      const sigma0 =
        rotateRight(word15, 7) ^ rotateRight(word15, 18) ^ (word15 >>> 3);
      const sigma1 =
        rotateRight(word2, 17) ^ rotateRight(word2, 19) ^ (word2 >>> 10);
      words[index] =
        (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    let e = state[4];
    let f = state[5];
    let g = state[6];
    let h = state[7];
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temporary1 =
        (h + sum1 + choice + SHA256_ROUND_CONSTANTS[index] + words[index]) >>>
        0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }
    state[0] = (state[0] + a) >>> 0;
    state[1] = (state[1] + b) >>> 0;
    state[2] = (state[2] + c) >>> 0;
    state[3] = (state[3] + d) >>> 0;
    state[4] = (state[4] + e) >>> 0;
    state[5] = (state[5] + f) >>> 0;
    state[6] = (state[6] + g) >>> 0;
    state[7] = (state[7] + h) >>> 0;
  }
  return Array.from(state)
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("");
};

export const nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest = (
  runtimeId: string,
  requestId: string,
): string =>
  `runtime:${runtimeId}:request:${sha256Nhm2CanonicalText(`${runtimeId}\0${requestId}`)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value);

const isGitSha = (value: unknown): value is string =>
  typeof value === "string" && GIT_SHA.test(value);

const isContractVersion = (value: unknown): value is string =>
  typeof value === "string" && CONTRACT_VERSION.test(value);

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
};

const isAuthoritativeDiagnosticSufficiencyPolicy = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateDiagnosticSufficiencyPolicyV1 => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "contractVersion",
      "policyId",
      "frozenInCandidateManifest",
      "diagnosticOnly",
      "physicalProofAuthority",
      "continuousObserver",
      "worldlineQei",
      "dynamics",
    ]) ||
    value.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY_CONTRACT_VERSION ||
    value.policyId !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY.policyId ||
    value.frozenInCandidateManifest !== true ||
    value.diagnosticOnly !== true ||
    value.physicalProofAuthority !== false
  ) {
    return false;
  }
  const observer = isRecord(value.continuousObserver)
    ? value.continuousObserver
    : null;
  const qei = isRecord(value.worldlineQei) ? value.worldlineQei : null;
  const dynamics = isRecord(value.dynamics) ? value.dynamics : null;
  return (
    observer != null &&
    hasExactKeys(observer, [
      "minimumSpatialSamples",
      "minimumNullDirectionsPerSpatialSample",
      "minimumResolutionLevels",
      "minimumObservedConvergenceOrder",
    ]) &&
    observer.minimumSpatialSamples ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .continuousObserver.minimumSpatialSamples &&
    observer.minimumNullDirectionsPerSpatialSample ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .continuousObserver.minimumNullDirectionsPerSpatialSample &&
    observer.minimumResolutionLevels ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .continuousObserver.minimumResolutionLevels &&
    observer.minimumObservedConvergenceOrder ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .continuousObserver.minimumObservedConvergenceOrder &&
    qei != null &&
    hasExactKeys(qei, [
      "minimumSamplingFunctionFamilies",
      "minimumWorldlinesPerRegionAndFamily",
      "minimumSamplesPerWorldline",
      "minimumRefinementLevels",
      "minimumObservedConvergenceOrder",
    ]) &&
    qei.minimumSamplingFunctionFamilies ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .worldlineQei.minimumSamplingFunctionFamilies &&
    qei.minimumWorldlinesPerRegionAndFamily ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .worldlineQei.minimumWorldlinesPerRegionAndFamily &&
    qei.minimumSamplesPerWorldline ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .worldlineQei.minimumSamplesPerWorldline &&
    qei.minimumRefinementLevels ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .worldlineQei.minimumRefinementLevels &&
    qei.minimumObservedConvergenceOrder ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .worldlineQei.minimumObservedConvergenceOrder &&
    dynamics != null &&
    hasExactKeys(dynamics, [
      "minimumEvolutionSamples",
      "minimumSwitchingPeriods",
      "minimumLightCrossingTimes",
      "minimumControlCycles",
    ]) &&
    dynamics.minimumEvolutionSamples ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .dynamics.minimumEvolutionSamples &&
    dynamics.minimumSwitchingPeriods ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .dynamics.minimumSwitchingPeriods &&
    dynamics.minimumLightCrossingTimes ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .dynamics.minimumLightCrossingTimes &&
    dynamics.minimumControlCycles ===
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .dynamics.minimumControlCycles
  );
};

const isPinnedRelativePath = (value: unknown): value is string => {
  if (!isText(value)) return false;
  const path = value.trim();
  if (
    path.includes("\\") ||
    path.startsWith("/") ||
    /^[a-z]:/i.test(path) ||
    /^[a-z][a-z0-9+.-]*:/i.test(path) ||
    /[?#*{}\[\]]/.test(path)
  ) {
    return false;
  }
  const segments = path.split("/");
  return (
    segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    ) && !segments.some((segment) => segment.toLowerCase() === "latest")
  );
};

const isPinnedCwd = (value: unknown): value is string =>
  value === "." || isPinnedRelativePath(value);

const distinct = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

const sameStringSet = (
  values: readonly string[],
  expected: readonly string[],
): boolean =>
  values.length === expected.length &&
  distinct(values) &&
  expected.every((entry) => values.includes(entry));

const isEvidenceRole = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateEvidenceRole =>
  typeof value === "string" &&
  (
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES as readonly string[]
  ).includes(value);

const isNumericCheckId = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateNumericCheckId =>
  typeof value === "string" &&
  (
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_NUMERIC_CHECK_IDS as readonly string[]
  ).includes(value);

const isPlanRole = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole =>
  typeof value === "string" &&
  (
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES as readonly string[]
  ).includes(value);

const numericCheckRoleEntries = Object.entries(
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS,
).flatMap(([evidenceRole, checkIds]) =>
  (checkIds as readonly string[])
    .filter((checkId) => isNumericCheckId(checkId))
    .map(
      (checkId) =>
        [
          checkId,
          evidenceRole as Nhm2ExperimentReadyTheoryCandidateEvidenceRole,
        ] as const,
    ),
);

const NUMERIC_CHECK_ROLE = Object.freeze(
  Object.fromEntries(numericCheckRoleEntries),
) as Readonly<
  Record<
    Nhm2ExperimentReadyTheoryCandidateNumericCheckId,
    Nhm2ExperimentReadyTheoryCandidateEvidenceRole
  >
>;

const executionPlanRoleForEvidence = (
  evidenceRole: Nhm2ExperimentReadyTheoryCandidateEvidenceRole,
): Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole => {
  if (evidenceRole === "independent_numerical_replication") {
    return "independent_numerical";
  }
  if (evidenceRole === "formal_manifest_certificate") return "formal_kernel";
  return "primary_numerical";
};

const canonicalThreshold = (value: number): string =>
  Object.is(value, -0) ? "0" : value.toString();

/**
 * Hashes one exact detached numeric-policy entry. The NUL-separated domain and
 * ordered tuple freeze both the field order and the decimal threshold
 * encoding; object key enumeration is deliberately not part of this digest.
 */
export const computeNhm2ExperimentReadyTheoryCandidateNumericPolicyEntrySha256 =
  (policy: Nhm2ExperimentReadyTheoryCandidateNumericCheckPolicyV1): string =>
    sha256Nhm2CanonicalText(
      `${NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_ENTRY_SHA256_DOMAIN}\0${JSON.stringify(
        [
          policy.checkId,
          policy.evidenceRole,
          policy.comparator,
          canonicalThreshold(policy.threshold),
          policy.unit,
        ],
      )}`,
    );

/**
 * Non-numeric required checks have no threshold entry in the detached numeric
 * policy set. Their check-policy digest is instead the domain-separated tuple
 * (evidence role, evidence contract version, check id, required Boolean rule).
 * This gives every wrapper check a reproducible digest without inventing a
 * numeric tolerance for a qualitative contract check.
 */
export const computeNhm2ExperimentReadyTheoryCandidateNonNumericCheckPolicySha256 =
  (input: {
    evidenceRole: Nhm2ExperimentReadyTheoryCandidateEvidenceRole;
    checkId: string;
  }): string => {
    const requiredChecks = NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS[
      input.evidenceRole
    ] as readonly string[];
    if (
      !requiredChecks.includes(input.checkId) ||
      isNumericCheckId(input.checkId)
    ) {
      throw new Error(
        `Expected a non-numeric required check: ${input.evidenceRole}.${input.checkId}`,
      );
    }
    return sha256Nhm2CanonicalText(
      `${NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NON_NUMERIC_CHECK_POLICY_SHA256_DOMAIN}\0${JSON.stringify(
        [
          input.evidenceRole,
          NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
            input.evidenceRole
          ],
          input.checkId,
          "required_boolean_pass",
        ],
      )}`,
    );
  };

const canonicalSemanticPayload = (
  payload: Nhm2ExperimentReadyTheoryCandidateNumericPolicySetSemanticPayloadV1,
): string =>
  JSON.stringify([
    payload.artifactId,
    payload.contractVersion,
    payload.policySetId,
    payload.policies.map((policy) => [
      policy.checkId,
      policy.evidenceRole,
      policy.comparator,
      canonicalThreshold(policy.threshold),
      policy.unit,
    ]),
  ]);

export const toNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticPayload =
  (
    artifact: Nhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifactV1,
  ): Nhm2ExperimentReadyTheoryCandidateNumericPolicySetSemanticPayloadV1 => ({
    artifactId: artifact.artifactId,
    contractVersion: artifact.contractVersion,
    policySetId: artifact.policySetId,
    policies: artifact.policies.map((policy) => ({ ...policy })),
  });

export const computeNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticSha256 =
  (
    payload: Nhm2ExperimentReadyTheoryCandidateNumericPolicySetSemanticPayloadV1,
  ): string => sha256Nhm2CanonicalText(canonicalSemanticPayload(payload));

export const buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact = (
  policySetId: string,
): Nhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifactV1 => {
  const payload: Nhm2ExperimentReadyTheoryCandidateNumericPolicySetSemanticPayloadV1 =
    {
      artifactId:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
      contractVersion:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
      policySetId,
      policies:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_NUMERIC_CHECK_IDS.map(
          (checkId) => ({
            checkId,
            evidenceRole: NUMERIC_CHECK_ROLE[checkId],
            ...NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES[
              checkId
            ],
          }),
        ),
    };
  return {
    ...payload,
    semanticSha256:
      computeNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticSha256(
        payload,
      ),
  };
};

const isNumericPolicyShape = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateNumericCheckPolicyV1 =>
  isRecord(value) &&
  hasExactKeys(value, [
    "checkId",
    "evidenceRole",
    "comparator",
    "threshold",
    "unit",
  ]) &&
  isNumericCheckId(value.checkId) &&
  isEvidenceRole(value.evidenceRole) &&
  (value.comparator === "lt" ||
    value.comparator === "lte" ||
    value.comparator === "gt" ||
    value.comparator === "gte") &&
  isFiniteNumber(value.threshold) &&
  isText(value.unit);

const policyIsAuthoritative = (
  policy: Nhm2ExperimentReadyTheoryCandidateNumericCheckPolicyV1,
): boolean => {
  const authoritative =
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES[
      policy.checkId
    ];
  return (
    policy.evidenceRole === NUMERIC_CHECK_ROLE[policy.checkId] &&
    policy.comparator === authoritative.comparator &&
    policy.threshold === authoritative.threshold &&
    policy.unit === authoritative.unit
  );
};

export const isNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifactV1 => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "artifactId",
      "contractVersion",
      "policySetId",
      "policies",
      "semanticSha256",
    ]) ||
    value.artifactId !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION ||
    !isText(value.policySetId) ||
    !Array.isArray(value.policies) ||
    !value.policies.every(isNumericPolicyShape) ||
    !isSha256(value.semanticSha256)
  ) {
    return false;
  }
  const policies = value.policies;
  if (
    policies.length !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_NUMERIC_CHECK_IDS.length ||
    !policies.every(
      (policy, index) =>
        policy.checkId ===
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_NUMERIC_CHECK_IDS[
            index
          ] && policyIsAuthoritative(policy),
    )
  ) {
    return false;
  }
  const artifact =
    value as Nhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifactV1;
  return (
    artifact.semanticSha256 ===
    computeNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticSha256(
      toNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticPayload(
        artifact,
      ),
    )
  );
};

const pushIf = (
  blockers: string[],
  condition: boolean,
  blocker: string,
): void => {
  if (condition) blockers.push(blocker);
};

const bindingBlockers = (
  binding: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1,
  label: string,
): string[] => {
  const blockers: string[] = [];
  pushIf(blockers, !isText(binding.artifactId), `${label}_artifact_id_missing`);
  pushIf(
    blockers,
    !isContractVersion(binding.contractVersion),
    `${label}_contract_version_invalid`,
  );
  pushIf(
    blockers,
    !isPinnedRelativePath(binding.path),
    `${label}_path_not_pinned`,
  );
  pushIf(blockers, !isSha256(binding.sha256), `${label}_sha256_invalid`);
  return blockers;
};

const invocationBlockers = (
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  bindings: Nhm2ExperimentReadyTheoryCandidateBindingsV1,
): string[] => {
  const blockers: string[] = [];
  const invocation = plan.expectedInvocation;
  const label = `execution:${plan.planRole}`;
  pushIf(
    blockers,
    !isText(invocation.entrypoint),
    `${label}:entrypoint_missing`,
  );
  pushIf(blockers, !isText(invocation.command), `${label}:command_missing`);
  pushIf(
    blockers,
    invocation.args.length === 0 || !invocation.args.every(isText),
    `${label}:args_invalid`,
  );
  pushIf(blockers, !isPinnedCwd(invocation.cwd), `${label}:cwd_not_pinned`);
  pushIf(
    blockers,
    !isPinnedRelativePath(invocation.outputDirectory),
    `${label}:output_directory_not_pinned`,
  );
  const environmentNames = invocation.environment.map((entry) => entry.name);
  pushIf(
    blockers,
    !distinct(environmentNames) ||
      invocation.environment.some((entry) => {
        if (!ENVIRONMENT_NAME.test(entry.name)) return true;
        if (entry.valueKind === "literal") {
          return typeof entry.value !== "string";
        }
        return !(
          entry.valueKind === "candidate_manifest_raw_sha256" &&
          entry.name === "NHM2_CANDIDATE_MANIFEST_SHA256" &&
          entry.value === null
        );
      }),
    `${label}:environment_invalid`,
  );
  pushIf(
    blockers,
    environmentNames.some(
      (name) =>
        !(REQUIRED_EXECUTOR_ENVIRONMENT_NAMES as readonly string[]).includes(
          name,
        ),
    ),
    `${label}:environment_name_not_allowlisted`,
  );
  pushIf(
    blockers,
    environmentNames.some(
      (entry, index) => index > 0 && environmentNames[index - 1] > entry,
    ),
    `${label}:environment_not_canonical_order`,
  );
  const requiredLiteralBindings = [
    ["THEORY_RUNTIME_REQUEST_ID", plan.requestId],
    ["THEORY_RUNTIME_RECEIPT_ID", plan.receiptId],
    ["THEORY_RUNTIME_ID", plan.runtimeId],
    ["NHM2_OUTPUT_DIR", invocation.outputDirectory],
    ["NHM2_CANDIDATE_ID", bindings.candidate.candidateId],
    ["NHM2_SELECTED_PROFILE_ID", bindings.profile.selectedProfileId],
    ["NHM2_CHART_ID", bindings.chart.chartId],
    ["NHM2_RUN_ID", plan.runId],
    ["NHM2_ATLAS_SHA256", bindings.atlas.sha256],
    ["NHM2_UNITS_SHA256", bindings.units.sha256],
    ["NHM2_NORMALIZATION_SHA256", bindings.normalization.sha256],
  ] as const;
  for (const [environmentName, expectedValue] of requiredLiteralBindings) {
    const environmentEntry = invocation.environment.find(
      (entry) => entry.name === environmentName,
    );
    pushIf(
      blockers,
      !(
        (environmentEntry?.valueKind === "literal" &&
          environmentEntry.value === expectedValue) ||
        invocation.args.includes(expectedValue)
      ),
      `${label}:invocation_${environmentName.toLowerCase()}_unbound`,
    );
  }
  const manifestShaBinding = invocation.environment.find(
    (entry) => entry.name === "NHM2_CANDIDATE_MANIFEST_SHA256",
  );
  pushIf(
    blockers,
    !(
      manifestShaBinding?.valueKind === "candidate_manifest_raw_sha256" &&
      manifestShaBinding.value === null
    ),
    `${label}:candidate_manifest_raw_sha_resolver_unbound`,
  );
  return blockers;
};

const deriveReadiness = (
  core: CandidateManifestCore,
): Nhm2ExperimentReadyTheoryCandidateManifestReadinessV1 => {
  const blockers: string[] = [];
  pushIf(
    blockers,
    core.phase !== NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_PHASE,
    "phase_mismatch",
  );
  pushIf(blockers, !isIsoTimestamp(core.generatedAt), "generated_at_invalid");
  pushIf(blockers, !isIsoTimestamp(core.frozenAt), "frozen_at_invalid");
  if (isIsoTimestamp(core.generatedAt) && isIsoTimestamp(core.frozenAt)) {
    pushIf(
      blockers,
      Date.parse(core.generatedAt) > Date.parse(core.frozenAt),
      "manifest_generated_after_freeze",
    );
  }
  pushIf(blockers, !isText(core.manifestId), "manifest_id_missing");
  pushIf(blockers, core.laneId !== "nhm2_shift_lapse", "lane_id_mismatch");
  const diagnosticSufficiencyPolicyFrozen =
    isAuthoritativeDiagnosticSufficiencyPolicy(
      core.diagnosticSufficiencyPreregistration,
    );
  pushIf(
    blockers,
    !diagnosticSufficiencyPolicyFrozen,
    "diagnostic_sufficiency_preregistration_mismatch",
  );

  const predictionFreeze = core.predictionFreezeCommitment;
  pushIf(
    blockers,
    predictionFreeze.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION,
    "prediction_freeze_contract_version_mismatch",
  );
  pushIf(
    blockers,
    !isSha256(predictionFreeze.semanticSha256),
    "prediction_freeze_semantic_sha256_invalid",
  );
  pushIf(
    blockers,
    !isIsoTimestamp(predictionFreeze.frozenAt),
    "prediction_freeze_frozen_at_invalid",
  );
  if (
    isIsoTimestamp(predictionFreeze.frozenAt) &&
    isIsoTimestamp(core.frozenAt)
  ) {
    pushIf(
      blockers,
      Date.parse(predictionFreeze.frozenAt) > Date.parse(core.frozenAt),
      "prediction_freeze_postdates_candidate_manifest_freeze",
    );
  }

  const identityBindings = [
    ["candidate", core.bindings.candidate],
    ["profile", core.bindings.profile],
    ["chart", core.bindings.chart],
    ["atlas", core.bindings.atlas],
    ["units", core.bindings.units],
    ["normalization", core.bindings.normalization],
  ] as const;
  for (const [label, binding] of identityBindings) {
    blockers.push(...bindingBlockers(binding, label));
  }
  pushIf(
    blockers,
    !isText(core.bindings.candidate.candidateId),
    "candidate_id_missing",
  );
  pushIf(
    blockers,
    !isText(core.bindings.profile.selectedProfileId),
    "selected_profile_id_missing",
  );
  pushIf(blockers, !isText(core.bindings.chart.chartId), "chart_id_missing");
  pushIf(blockers, !isText(core.bindings.atlas.atlasId), "atlas_id_missing");
  pushIf(blockers, !isText(core.bindings.units.unitsId), "units_id_missing");
  pushIf(
    blockers,
    !isText(core.bindings.normalization.normalizationId),
    "normalization_id_missing",
  );
  pushIf(
    blockers,
    !distinct(identityBindings.map(([, binding]) => binding.path)),
    "identity_binding_paths_duplicated",
  );

  const planRoles = core.executionPlans.map((plan) => plan.planRole);
  pushIf(blockers, !distinct(planRoles), "execution_plan_roles_duplicated");
  for (const requiredRole of NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES) {
    pushIf(
      blockers,
      !planRoles.includes(requiredRole),
      `execution_plan_missing:${requiredRole}`,
    );
  }
  for (const key of ["requestId", "runId", "receiptId"] as const) {
    pushIf(
      blockers,
      !distinct(core.executionPlans.map((plan) => plan[key])),
      `execution_${key}_duplicated`,
    );
  }
  pushIf(
    blockers,
    !distinct(
      core.executionPlans.map(
        (plan) => plan.expectedInvocation.outputDirectory,
      ),
    ),
    "execution_output_directories_duplicated",
  );
  for (const plan of core.executionPlans) {
    const label = `execution:${plan.planRole}`;
    pushIf(blockers, !isPlanRole(plan.planRole), `${label}:plan_role_invalid`);
    pushIf(blockers, !isText(plan.requestId), `${label}:request_id_missing`);
    pushIf(blockers, !isText(plan.runId), `${label}:run_id_missing`);
    pushIf(blockers, !isText(plan.receiptId), `${label}:receipt_id_missing`);
    pushIf(blockers, !isText(plan.runtimeId), `${label}:runtime_id_missing`);
    pushIf(
      blockers,
      isText(plan.runtimeId) &&
        isText(plan.requestId) &&
        plan.receiptId !==
          nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
            plan.runtimeId,
            plan.requestId,
          ),
      `${label}:receipt_id_not_deterministic`,
    );
    pushIf(
      blockers,
      !isGitSha(plan.sourceCommitSha),
      `${label}:commit_invalid`,
    );
    pushIf(
      blockers,
      !isText(plan.deterministicSeedPolicy),
      `${label}:seed_policy_missing`,
    );
    blockers.push(...bindingBlockers(plan.solver, `${label}:solver`));
    blockers.push(
      ...bindingBlockers(plan.environmentLock, `${label}:environment_lock`),
    );
    pushIf(
      blockers,
      !isText(plan.solver.solverId),
      `${label}:solver_id_missing`,
    );
    pushIf(
      blockers,
      !isText(plan.solver.solverVersion),
      `${label}:solver_version_missing`,
    );
    pushIf(
      blockers,
      !isText(plan.solver.implementationId),
      `${label}:implementation_id_missing`,
    );
    pushIf(
      blockers,
      !isText(plan.environmentLock.environmentId),
      `${label}:environment_id_missing`,
    );
    blockers.push(...invocationBlockers(plan, core.bindings));
  }

  const outputRoles = core.expectedEvidenceOutputs.map(
    (output) => output.evidenceRole,
  );
  pushIf(blockers, !distinct(outputRoles), "evidence_output_roles_duplicated");
  for (const requiredRole of NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES) {
    pushIf(
      blockers,
      !outputRoles.includes(requiredRole),
      `evidence_output_missing:${requiredRole}`,
    );
  }
  pushIf(
    blockers,
    !distinct(core.expectedEvidenceOutputs.map((output) => output.outputPath)),
    "evidence_output_paths_duplicated",
  );
  for (const output of core.expectedEvidenceOutputs) {
    const label = `evidence_output:${output.evidenceRole}`;
    pushIf(
      blockers,
      !isEvidenceRole(output.evidenceRole),
      `${label}:role_invalid`,
    );
    pushIf(
      blockers,
      !isPinnedRelativePath(output.outputPath),
      `${label}:path_not_pinned`,
    );
    pushIf(
      blockers,
      output.contractVersion !==
        NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
          output.evidenceRole
        ],
      `${label}:contract_version_mismatch`,
    );
    const plan = core.executionPlans.find(
      (candidate) =>
        candidate.planRole ===
        executionPlanRoleForEvidence(output.evidenceRole),
    );
    pushIf(blockers, plan == null, `${label}:execution_plan_missing`);
    if (plan != null) {
      for (const key of [
        "requestId",
        "runId",
        "receiptId",
        "runtimeId",
      ] as const) {
        pushIf(blockers, output[key] !== plan[key], `${label}:${key}_mismatch`);
      }
      pushIf(
        blockers,
        !output.outputPath.startsWith(
          `${plan.expectedInvocation.outputDirectory}/`,
        ),
        `${label}:outside_output_directory`,
      );
    }
  }

  const policy = core.numericCheckPolicySet;
  pushIf(
    blockers,
    policy.artifactId !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
    "numeric_policy_artifact_id_mismatch",
  );
  pushIf(
    blockers,
    policy.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
    "numeric_policy_contract_version_mismatch",
  );
  pushIf(
    blockers,
    !isText(policy.policySetId),
    "numeric_policy_set_id_missing",
  );
  pushIf(
    blockers,
    !isPinnedRelativePath(policy.artifactPath),
    "numeric_policy_artifact_path_not_pinned",
  );
  pushIf(
    blockers,
    !isSha256(policy.artifactRawSha256),
    "numeric_policy_raw_sha256_invalid",
  );
  pushIf(
    blockers,
    !isSha256(policy.semanticSha256),
    "numeric_policy_semantic_sha256_invalid",
  );
  pushIf(
    blockers,
    policy.artifactRawSha256 === policy.semanticSha256,
    "numeric_policy_raw_and_semantic_sha256_not_split",
  );

  const supersession = core.supersession;
  pushIf(
    blockers,
    !isText(supersession.policyId),
    "supersession_policy_id_missing",
  );
  pushIf(
    blockers,
    !isPinnedRelativePath(supersession.policyPath),
    "supersession_policy_path_not_pinned",
  );
  pushIf(
    blockers,
    !isContractVersion(supersession.policyContractVersion),
    "supersession_policy_contract_version_invalid",
  );
  pushIf(
    blockers,
    !isSha256(supersession.policySha256),
    "supersession_policy_sha256_invalid",
  );
  pushIf(
    blockers,
    supersession.originalManifestImmutable !== true,
    "original_manifest_not_immutable",
  );
  pushIf(
    blockers,
    supersession.inPlaceMutationForbidden !== true,
    "in_place_mutation_not_forbidden",
  );
  pushIf(
    blockers,
    supersession.supersedingManifestRequiresNewManifestId !== true,
    "superseding_manifest_new_id_not_required",
  );
  pushIf(
    blockers,
    supersession.supersedingManifestRequiresPredecessorSha256 !== true,
    "superseding_manifest_predecessor_hash_not_required",
  );
  const hasPredecessorId = isText(supersession.predecessorManifestId);
  const hasPredecessorHash = isSha256(supersession.predecessorManifestSha256);
  pushIf(
    blockers,
    hasPredecessorId !== hasPredecessorHash,
    "supersession_predecessor_binding_incomplete",
  );
  pushIf(
    blockers,
    hasPredecessorId && supersession.predecessorManifestId === core.manifestId,
    "supersession_predecessor_id_reuses_manifest_id",
  );

  const uniqueBlockers = [...new Set(blockers)];
  const preRunManifestReady = uniqueBlockers.length === 0;
  return {
    status: preRunManifestReady ? "pre_run_manifest_ready" : "not_ready",
    preRunManifestReady,
    requiredExecutionPlanCount:
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES.length,
    suppliedExecutionPlanCount: core.executionPlans.length,
    requiredEvidenceRoleCount:
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES.length,
    suppliedEvidenceRoleCount: core.expectedEvidenceOutputs.length,
    requiredNumericCheckCount:
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_NUMERIC_CHECK_IDS.length,
    policySemanticDigestBound:
      isSha256(policy.semanticSha256) &&
      isSha256(policy.artifactRawSha256) &&
      policy.semanticSha256 !== policy.artifactRawSha256,
    predictionFreezeSemanticDigestBound:
      predictionFreeze.contractVersion ===
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION &&
      isSha256(predictionFreeze.semanticSha256) &&
      isIsoTimestamp(predictionFreeze.frozenAt) &&
      isIsoTimestamp(core.frozenAt) &&
      Date.parse(predictionFreeze.frozenAt) <= Date.parse(core.frozenAt),
    diagnosticSufficiencyPolicyFrozen,
    blockerCount: uniqueBlockers.length,
    firstBlocker: uniqueBlockers[0] ?? "none",
    blockers: uniqueBlockers,
  };
};

const cloneHashedBinding = (
  value: Nhm2ExperimentReadyTheoryCandidateHashedBindingV1,
): Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 => ({
  artifactId: value.artifactId,
  contractVersion: value.contractVersion,
  path: value.path,
  sha256: value.sha256,
});

const cloneExecutionPlan = (
  plan: Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
): Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 => ({
  planRole: plan.planRole,
  requestId: plan.requestId,
  runId: plan.runId,
  receiptId: plan.receiptId,
  runtimeId: plan.runtimeId,
  sourceCommitSha: plan.sourceCommitSha,
  deterministicSeedPolicy: plan.deterministicSeedPolicy,
  solver: {
    ...cloneHashedBinding(plan.solver),
    solverId: plan.solver.solverId,
    solverVersion: plan.solver.solverVersion,
    implementationId: plan.solver.implementationId,
  },
  environmentLock: {
    ...cloneHashedBinding(plan.environmentLock),
    environmentId: plan.environmentLock.environmentId,
  },
  expectedInvocation: {
    entrypoint: plan.expectedInvocation.entrypoint,
    command: plan.expectedInvocation.command,
    args: [...plan.expectedInvocation.args],
    cwd: plan.expectedInvocation.cwd,
    environment: plan.expectedInvocation.environment.map((entry) => ({
      name: entry.name,
      valueKind: entry.valueKind,
      value: entry.value,
    })),
    outputDirectory: plan.expectedInvocation.outputDirectory,
  },
});

export const buildNhm2ExperimentReadyTheoryCandidateManifest = (
  input: BuildNhm2ExperimentReadyTheoryCandidateManifestInput,
): Nhm2ExperimentReadyTheoryCandidateManifestV1 => {
  const core: CandidateManifestCore = {
    artifactId: NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
    contractVersion:
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
    phase: NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_PHASE,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    frozenAt: input.frozenAt,
    manifestId: input.manifestId,
    laneId: "nhm2_shift_lapse",
    bindings: {
      candidate: {
        ...cloneHashedBinding(input.bindings.candidate),
        candidateId: input.bindings.candidate.candidateId,
      },
      profile: {
        ...cloneHashedBinding(input.bindings.profile),
        selectedProfileId: input.bindings.profile.selectedProfileId,
      },
      chart: {
        ...cloneHashedBinding(input.bindings.chart),
        chartId: input.bindings.chart.chartId,
      },
      atlas: {
        ...cloneHashedBinding(input.bindings.atlas),
        atlasId: input.bindings.atlas.atlasId,
      },
      units: {
        ...cloneHashedBinding(input.bindings.units),
        unitsId: input.bindings.units.unitsId,
      },
      normalization: {
        ...cloneHashedBinding(input.bindings.normalization),
        normalizationId: input.bindings.normalization.normalizationId,
      },
    },
    executionPlans: (input.executionPlans ?? []).map(cloneExecutionPlan),
    expectedEvidenceOutputs: (input.expectedEvidenceOutputs ?? []).map(
      (output) => ({
        evidenceRole: output.evidenceRole,
        outputPath: output.outputPath,
        contractVersion: output.contractVersion,
        requestId: output.requestId,
        runId: output.runId,
        receiptId: output.receiptId,
        runtimeId: output.runtimeId,
      }),
    ),
    predictionFreezeCommitment: {
      contractVersion: input.predictionFreezeCommitment.contractVersion,
      semanticSha256: input.predictionFreezeCommitment.semanticSha256,
      frozenAt: input.predictionFreezeCommitment.frozenAt,
    },
    diagnosticSufficiencyPreregistration: {
      ...NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY,
      continuousObserver: {
        ...NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY.continuousObserver,
      },
      worldlineQei: {
        ...NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY.worldlineQei,
      },
      dynamics: {
        ...NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY.dynamics,
      },
    },
    numericCheckPolicySet: {
      artifactId:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
      contractVersion:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
      policySetId: input.numericCheckPolicySet.policySetId,
      artifactPath: input.numericCheckPolicySet.artifactPath,
      artifactRawSha256: input.numericCheckPolicySet.artifactRawSha256,
      semanticSha256: input.numericCheckPolicySet.semanticSha256,
    },
    supersession: {
      policyId: input.supersession.policyId,
      policyPath: input.supersession.policyPath,
      policyContractVersion: input.supersession.policyContractVersion,
      policySha256: input.supersession.policySha256,
      originalManifestImmutable: true,
      inPlaceMutationForbidden: true,
      supersedingManifestRequiresNewManifestId: true,
      supersedingManifestRequiresPredecessorSha256: true,
      predecessorManifestId: input.supersession.predecessorManifestId,
      predecessorManifestSha256: input.supersession.predecessorManifestSha256,
    },
  };

  return {
    ...core,
    readiness: deriveReadiness(core),
    claimBoundary: {
      preRunManifestOnly: true,
      evaluatorMustVerifyFrozenAtBeforeExecutionStart: true,
      evaluatorMustResolveCandidateManifestRawShaBeforeSpawn: true,
      postRunTimingAndArtifactHashesForbiddenHere: true,
      detachedPolicyArtifactMustValidate: true,
      manifestReadinessCannotEstablishTheoryClosure: true,
      experimentReadyTheoryClosureClaimAllowed: false,
      physicalViabilityStatus: "blocked_pending_empirical_receipts",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      empiricalReceiptsRequiredForPhysicalPromotion: true,
    },
  };
};

const HASHED_BINDING_KEYS = [
  "artifactId",
  "contractVersion",
  "path",
  "sha256",
] as const;

const isExtendedBindingShape = (
  value: unknown,
  idKey: string,
): value is Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 &
  Record<string, string> =>
  isRecord(value) &&
  hasExactKeys(value, [...HASHED_BINDING_KEYS, idKey]) &&
  isText(value.artifactId) &&
  isContractVersion(value.contractVersion) &&
  isPinnedRelativePath(value.path) &&
  isSha256(value.sha256) &&
  isText(value[idKey]);

const isInvocationEnvironmentEntryShape = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateInvocationEnvironmentEntryV1 =>
  isRecord(value) &&
  hasExactKeys(value, ["name", "valueKind", "value"]) &&
  typeof value.name === "string" &&
  ENVIRONMENT_NAME.test(value.name) &&
  ((value.valueKind === "literal" && typeof value.value === "string") ||
    (value.valueKind === "candidate_manifest_raw_sha256" &&
      value.name === "NHM2_CANDIDATE_MANIFEST_SHA256" &&
      value.value === null));

const isExpectedInvocationShape = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateExpectedInvocationV1 =>
  isRecord(value) &&
  hasExactKeys(value, [
    "entrypoint",
    "command",
    "args",
    "cwd",
    "environment",
    "outputDirectory",
  ]) &&
  isText(value.entrypoint) &&
  isText(value.command) &&
  Array.isArray(value.args) &&
  value.args.every(isText) &&
  isPinnedCwd(value.cwd) &&
  Array.isArray(value.environment) &&
  value.environment.every(isInvocationEnvironmentEntryShape) &&
  isPinnedRelativePath(value.outputDirectory);

const isExecutionPlanShape = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 =>
  isRecord(value) &&
  hasExactKeys(value, [
    "planRole",
    "requestId",
    "runId",
    "receiptId",
    "runtimeId",
    "sourceCommitSha",
    "deterministicSeedPolicy",
    "solver",
    "environmentLock",
    "expectedInvocation",
  ]) &&
  isPlanRole(value.planRole) &&
  isText(value.requestId) &&
  isText(value.runId) &&
  isText(value.receiptId) &&
  isText(value.runtimeId) &&
  isGitSha(value.sourceCommitSha) &&
  isText(value.deterministicSeedPolicy) &&
  isRecord(value.solver) &&
  hasExactKeys(value.solver, [
    ...HASHED_BINDING_KEYS,
    "solverId",
    "solverVersion",
    "implementationId",
  ]) &&
  isText(value.solver.artifactId) &&
  isContractVersion(value.solver.contractVersion) &&
  isPinnedRelativePath(value.solver.path) &&
  isSha256(value.solver.sha256) &&
  isText(value.solver.solverId) &&
  isText(value.solver.solverVersion) &&
  isText(value.solver.implementationId) &&
  isExtendedBindingShape(value.environmentLock, "environmentId") &&
  isExpectedInvocationShape(value.expectedInvocation);

const isExpectedEvidenceOutputShape = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateExpectedEvidenceOutputV1 =>
  isRecord(value) &&
  hasExactKeys(value, [
    "evidenceRole",
    "outputPath",
    "contractVersion",
    "requestId",
    "runId",
    "receiptId",
    "runtimeId",
  ]) &&
  isEvidenceRole(value.evidenceRole) &&
  isPinnedRelativePath(value.outputPath) &&
  value.contractVersion ===
    NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
      value.evidenceRole
    ] &&
  isText(value.requestId) &&
  isText(value.runId) &&
  isText(value.receiptId) &&
  isText(value.runtimeId);

const AUTHORITY_SHADOW_KEYS = new Set([
  "pass",
  "ready",
  "viable",
  "physicalViability",
  "transport",
  "propulsion",
  "routeEta",
  "certifiedSpeed",
  "physicalViabilityClaimAllowed",
  "transportClaimAllowed",
  "propulsionClaimAllowed",
  "routeEtaClaimAllowed",
  "speedAuthorityClaimAllowed",
]);

const containsAuthorityShadow = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsAuthorityShadow);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, entry]) =>
      AUTHORITY_SHADOW_KEYS.has(key) || containsAuthorityShadow(entry),
  );
};

const sameReadiness = (
  actual: Nhm2ExperimentReadyTheoryCandidateManifestReadinessV1,
  expected: Nhm2ExperimentReadyTheoryCandidateManifestReadinessV1,
): boolean =>
  actual.status === expected.status &&
  actual.preRunManifestReady === expected.preRunManifestReady &&
  actual.requiredExecutionPlanCount === expected.requiredExecutionPlanCount &&
  actual.suppliedExecutionPlanCount === expected.suppliedExecutionPlanCount &&
  actual.requiredEvidenceRoleCount === expected.requiredEvidenceRoleCount &&
  actual.suppliedEvidenceRoleCount === expected.suppliedEvidenceRoleCount &&
  actual.requiredNumericCheckCount === expected.requiredNumericCheckCount &&
  actual.policySemanticDigestBound === expected.policySemanticDigestBound &&
  actual.predictionFreezeSemanticDigestBound ===
    expected.predictionFreezeSemanticDigestBound &&
  actual.diagnosticSufficiencyPolicyFrozen ===
    expected.diagnosticSufficiencyPolicyFrozen &&
  actual.blockerCount === expected.blockerCount &&
  actual.firstBlocker === expected.firstBlocker &&
  actual.blockers.length === expected.blockers.length &&
  actual.blockers.every((entry, index) => entry === expected.blockers[index]);

export const isNhm2ExperimentReadyTheoryCandidateManifest = (
  value: unknown,
): value is Nhm2ExperimentReadyTheoryCandidateManifestV1 => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "artifactId",
      "contractVersion",
      "phase",
      "generatedAt",
      "frozenAt",
      "manifestId",
      "laneId",
      "bindings",
      "executionPlans",
      "expectedEvidenceOutputs",
      "predictionFreezeCommitment",
      "diagnosticSufficiencyPreregistration",
      "numericCheckPolicySet",
      "supersession",
      "readiness",
      "claimBoundary",
    ]) ||
    value.artifactId !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION ||
    value.phase !== NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_PHASE ||
    !isIsoTimestamp(value.generatedAt) ||
    !isIsoTimestamp(value.frozenAt) ||
    !isText(value.manifestId) ||
    value.laneId !== "nhm2_shift_lapse"
  ) {
    return false;
  }

  const bindings = isRecord(value.bindings) ? value.bindings : null;
  if (
    bindings == null ||
    !hasExactKeys(bindings, [
      "candidate",
      "profile",
      "chart",
      "atlas",
      "units",
      "normalization",
    ]) ||
    !isExtendedBindingShape(bindings.candidate, "candidateId") ||
    !isExtendedBindingShape(bindings.profile, "selectedProfileId") ||
    !isExtendedBindingShape(bindings.chart, "chartId") ||
    !isExtendedBindingShape(bindings.atlas, "atlasId") ||
    !isExtendedBindingShape(bindings.units, "unitsId") ||
    !isExtendedBindingShape(bindings.normalization, "normalizationId")
  ) {
    return false;
  }

  if (
    !Array.isArray(value.executionPlans) ||
    !value.executionPlans.every(isExecutionPlanShape) ||
    !sameStringSet(
      value.executionPlans.map((plan) => plan.planRole),
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES,
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(value.expectedEvidenceOutputs) ||
    !value.expectedEvidenceOutputs.every(isExpectedEvidenceOutputShape) ||
    !sameStringSet(
      value.expectedEvidenceOutputs.map((output) => output.evidenceRole),
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES,
    ) ||
    !distinct(value.expectedEvidenceOutputs.map((output) => output.outputPath))
  ) {
    return false;
  }

  const predictionFreezeCommitment = isRecord(value.predictionFreezeCommitment)
    ? value.predictionFreezeCommitment
    : null;
  if (
    predictionFreezeCommitment == null ||
    !hasExactKeys(predictionFreezeCommitment, [
      "contractVersion",
      "semanticSha256",
      "frozenAt",
    ]) ||
    predictionFreezeCommitment.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION ||
    !isSha256(predictionFreezeCommitment.semanticSha256) ||
    !isIsoTimestamp(predictionFreezeCommitment.frozenAt) ||
    Date.parse(predictionFreezeCommitment.frozenAt) > Date.parse(value.frozenAt)
  ) {
    return false;
  }

  if (
    !isAuthoritativeDiagnosticSufficiencyPolicy(
      value.diagnosticSufficiencyPreregistration,
    )
  ) {
    return false;
  }

  const policy = isRecord(value.numericCheckPolicySet)
    ? value.numericCheckPolicySet
    : null;
  if (
    policy == null ||
    !hasExactKeys(policy, [
      "artifactId",
      "contractVersion",
      "policySetId",
      "artifactPath",
      "artifactRawSha256",
      "semanticSha256",
    ]) ||
    policy.artifactId !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID ||
    policy.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION ||
    !isText(policy.policySetId) ||
    !isPinnedRelativePath(policy.artifactPath) ||
    !isSha256(policy.artifactRawSha256) ||
    !isSha256(policy.semanticSha256) ||
    policy.artifactRawSha256 === policy.semanticSha256
  ) {
    return false;
  }

  const supersession = isRecord(value.supersession) ? value.supersession : null;
  if (
    supersession == null ||
    !hasExactKeys(supersession, [
      "policyId",
      "policyPath",
      "policyContractVersion",
      "policySha256",
      "originalManifestImmutable",
      "inPlaceMutationForbidden",
      "supersedingManifestRequiresNewManifestId",
      "supersedingManifestRequiresPredecessorSha256",
      "predecessorManifestId",
      "predecessorManifestSha256",
    ]) ||
    !isText(supersession.policyId) ||
    !isPinnedRelativePath(supersession.policyPath) ||
    !isContractVersion(supersession.policyContractVersion) ||
    !isSha256(supersession.policySha256) ||
    supersession.originalManifestImmutable !== true ||
    supersession.inPlaceMutationForbidden !== true ||
    supersession.supersedingManifestRequiresNewManifestId !== true ||
    supersession.supersedingManifestRequiresPredecessorSha256 !== true ||
    !(
      supersession.predecessorManifestId === null ||
      isText(supersession.predecessorManifestId)
    ) ||
    !(
      supersession.predecessorManifestSha256 === null ||
      isSha256(supersession.predecessorManifestSha256)
    )
  ) {
    return false;
  }

  const readiness = isRecord(value.readiness) ? value.readiness : null;
  const claims = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  if (
    readiness == null ||
    !hasExactKeys(readiness, [
      "status",
      "preRunManifestReady",
      "requiredExecutionPlanCount",
      "suppliedExecutionPlanCount",
      "requiredEvidenceRoleCount",
      "suppliedEvidenceRoleCount",
      "requiredNumericCheckCount",
      "policySemanticDigestBound",
      "predictionFreezeSemanticDigestBound",
      "diagnosticSufficiencyPolicyFrozen",
      "blockerCount",
      "firstBlocker",
      "blockers",
    ]) ||
    (readiness.status !== "not_ready" &&
      readiness.status !== "pre_run_manifest_ready") ||
    typeof readiness.preRunManifestReady !== "boolean" ||
    !isFiniteNumber(readiness.requiredExecutionPlanCount) ||
    !isFiniteNumber(readiness.suppliedExecutionPlanCount) ||
    !isFiniteNumber(readiness.requiredEvidenceRoleCount) ||
    !isFiniteNumber(readiness.suppliedEvidenceRoleCount) ||
    !isFiniteNumber(readiness.requiredNumericCheckCount) ||
    typeof readiness.policySemanticDigestBound !== "boolean" ||
    typeof readiness.predictionFreezeSemanticDigestBound !== "boolean" ||
    typeof readiness.diagnosticSufficiencyPolicyFrozen !== "boolean" ||
    !isFiniteNumber(readiness.blockerCount) ||
    !isText(readiness.firstBlocker) ||
    !Array.isArray(readiness.blockers) ||
    !readiness.blockers.every((entry) => typeof entry === "string") ||
    claims == null ||
    !hasExactKeys(claims, [
      "preRunManifestOnly",
      "evaluatorMustVerifyFrozenAtBeforeExecutionStart",
      "evaluatorMustResolveCandidateManifestRawShaBeforeSpawn",
      "postRunTimingAndArtifactHashesForbiddenHere",
      "detachedPolicyArtifactMustValidate",
      "manifestReadinessCannotEstablishTheoryClosure",
      "experimentReadyTheoryClosureClaimAllowed",
      "physicalViabilityStatus",
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedAuthorityClaimAllowed",
      "empiricalReceiptsRequiredForPhysicalPromotion",
    ]) ||
    claims.preRunManifestOnly !== true ||
    claims.evaluatorMustVerifyFrozenAtBeforeExecutionStart !== true ||
    claims.evaluatorMustResolveCandidateManifestRawShaBeforeSpawn !== true ||
    claims.postRunTimingAndArtifactHashesForbiddenHere !== true ||
    claims.detachedPolicyArtifactMustValidate !== true ||
    claims.manifestReadinessCannotEstablishTheoryClosure !== true ||
    claims.experimentReadyTheoryClosureClaimAllowed !== false ||
    claims.physicalViabilityStatus !== "blocked_pending_empirical_receipts" ||
    claims.physicalViabilityClaimAllowed !== false ||
    claims.transportClaimAllowed !== false ||
    claims.propulsionClaimAllowed !== false ||
    claims.routeEtaClaimAllowed !== false ||
    claims.speedAuthorityClaimAllowed !== false ||
    claims.empiricalReceiptsRequiredForPhysicalPromotion !== true
  ) {
    return false;
  }

  const core = { ...value } as Record<string, unknown>;
  delete core.readiness;
  delete core.claimBoundary;
  if (containsAuthorityShadow(core)) return false;

  const expected = deriveReadiness(core as CandidateManifestCore);
  return (
    expected.preRunManifestReady &&
    sameReadiness(
      readiness as Nhm2ExperimentReadyTheoryCandidateManifestReadinessV1,
      expected,
    )
  );
};
