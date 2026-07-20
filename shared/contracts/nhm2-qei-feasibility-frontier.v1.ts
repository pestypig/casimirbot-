export const NHM2_QEI_FEASIBILITY_FRONTIER_CONTRACT_VERSION =
  "nhm2_qei_feasibility_frontier/v1";

export const NHM2_QEI_FEASIBILITY_FRONTIER_VERDICTS = [
  "frontier_not_evaluable",
  "candidate_found",
  "no_candidate_within_declared_domain",
] as const;

export const NHM2_QEI_FEASIBILITY_FORBIDDEN_AUTHORITIES = [
  "duty_scaled_metric_t00",
  "policy_limit_as_qei_authority",
  "bound_floor_as_qei_authority",
  "direct_metric_t00_scaling",
  "historical_or_unbound_qei_dossier",
] as const;

export type Nhm2QeiFeasibilityFrontierVerdict =
  (typeof NHM2_QEI_FEASIBILITY_FRONTIER_VERDICTS)[number];

export type Nhm2QeiFeasibilityArtifactBindingV1 = {
  artifactRef: string;
  sha256: string;
  runId: string;
  epochId: string;
};

export type Nhm2QeiFeasibilityImmutableBindingV1 = {
  artifactRef: string;
  sha256: string;
};

export type Nhm2QeiFeasibilityProvenanceV1 = {
  run: {
    runId: string;
    commitSha: string;
    epochId: string;
    startedAt: string;
    completedAt: string;
  };
  runManifest: Nhm2QeiFeasibilityArtifactBindingV1;
  runtimeReceipt: Nhm2QeiFeasibilityArtifactBindingV1;
  qftState: Nhm2QeiFeasibilityArtifactBindingV1 & {
    stateClass: "hadamard";
    renormalizationScheme: string;
    operatorMapping: string;
  };
  continuousObserver: Nhm2QeiFeasibilityArtifactBindingV1;
  worldlineSet: Nhm2QeiFeasibilityArtifactBindingV1;
  samplingFamilySet: Nhm2QeiFeasibilityArtifactBindingV1;
  theoremSet: Nhm2QeiFeasibilityImmutableBindingV1;
  historicalOrUnboundDossierUsed: boolean;
};

export type Nhm2QeiFeasibilitySearchDomainV1 = {
  candidateIds: string[];
  worldlineIds: string[];
  samplingFamilyIds: string[];
  tauSeconds: number[];
  finiteDomainDeclared: true;
  cartesianCoverageRequired: true;
};

export type Nhm2QeiFeasibilityTheoremV1 = {
  theoremId: string;
  samplingFamilyId: string;
  fieldType: string;
  lowerBoundForm: "minus_K_over_tau_four_minus_safety_sigma";
  K_Jm3_s4: number;
  safetySigma_Jm3: number;
  tauMinSeconds: number;
  tauMaxSeconds: number;
  stationaryTimelikeWorldlinesSupported: boolean;
  normalizedSamplingRequired: true;
  supported: boolean;
  provenanceRef: string;
  provenanceSha256: string;
};

export type Nhm2QeiFeasibilityEvaluationInputV1 = {
  evaluationId: string;
  worldlineId: string;
  samplingFamilyId: string;
  theoremId: string;
  tauSeconds: number;
  samplingNormalized: boolean;
  lhs_Jm3: number;
  boundComputed_Jm3: number;
  boundPolicy_Jm3: number;
  marginRawComputed: number;
  marginPolicy: number;
  applicabilityStatus: "PASS" | "FAIL" | "NOT_APPLICABLE" | "UNKNOWN";
  tauConsistency: {
    tauVsDuty: "pass" | "fail" | "missing";
    tauVsLightCrossing: "pass" | "fail" | "missing";
    tauVsModulation: "pass" | "fail" | "missing";
  };
  metricSemanticBinding: {
    rhoSource: string;
    metricT00Ref: string;
    metricT00Si_Jm3: number;
    metricDerived: boolean;
    metricContractOk: boolean;
    sameEpoch: boolean;
    quantitySemanticType: string;
    worldlineClass: string;
    dutyAppliedToMetricT00: boolean;
  };
  policyEvidence: {
    boundFloorApplied: boolean;
    policyOrFloorUsedAsIndependentAdmissionAuthority: boolean;
  };
  evidenceOrigin: "run_bound_evaluation" | "historical_dossier" | "unbound";
  rawEvaluationEvidence: Nhm2QeiFeasibilityArtifactBindingV1;
  quadratureEvidence: Nhm2QeiFeasibilityArtifactBindingV1;
  binding: {
    runId: string;
    epochId: string;
    profileSha256: string;
    fullTensorSha256: string;
    qftStateSha256: string;
    continuousObserverSha256: string;
    worldlineSetSha256: string;
    samplingFamilySetSha256: string;
    theoremSetSha256: string;
  };
};

export type Nhm2QeiFeasibilityEvaluationResultV1 = Omit<
  Nhm2QeiFeasibilityEvaluationInputV1,
  "boundComputed_Jm3" | "marginRawComputed" | "marginPolicy"
> & {
  boundComputedAuditInput: {
    boundComputed_Jm3: number | null;
    matchesTheorem: boolean;
  };
  boundComputed_Jm3: number | null;
  marginAuditInput: {
    marginRawComputed: number | null;
    marginPolicy: number | null;
    rawComputedMatches: boolean;
    policyMatches: boolean;
  };
  marginRawComputed: number | null;
  marginPolicy: number | null;
  sensitivity: {
    rawMarginGapToStrictLimit: number | null;
    theoremCrossoverTauSeconds: number | null;
    currentTauToCrossoverRatio: number | null;
    logRawMarginLogTauSensitivity: number | null;
    crossoverWithinTheoremSupport: boolean | null;
  };
  cartesianKey: string;
  evaluationStatus: "complete" | "not_evaluable";
  pass: boolean;
  blockers: string[];
  };

export type Nhm2QeiFeasibilityCandidateInputV1 = {
  candidateId: string;
  profile: Nhm2QeiFeasibilityArtifactBindingV1 & {
    profileId: string;
  };
  fullTensor: Nhm2QeiFeasibilityArtifactBindingV1 & {
    tensorBasis: "same_chart_full_tensor";
  };
  metricConstruction: {
    kind: "recomputed_full_tensor";
    dutyScaledMetricT00: boolean;
    directT00ScalingApplied: boolean;
  };
  readiness: {
    fullTensorReady: boolean;
    covariantConservationReady: boolean;
    continuousObserverReady: boolean;
  };
  evaluations: Nhm2QeiFeasibilityEvaluationInputV1[];
};

export type Nhm2QeiFeasibilityCandidateResultV1 = Omit<
  Nhm2QeiFeasibilityCandidateInputV1,
  "evaluations"
> & {
  evaluations: Nhm2QeiFeasibilityEvaluationResultV1[];
  coverage: {
    expectedEvaluationCount: number;
    observedEvaluationCount: number;
    complete: boolean;
    missingCartesianKeys: string[];
    duplicateCartesianKeys: string[];
    extraCartesianKeys: string[];
  };
  worstCase: {
    evaluationId: string;
    cartesianKey: string;
    marginRawComputed: number | null;
    marginPolicy: number | null;
    worstMargin: number | null;
    pass: boolean;
  } | null;
  distanceToStrictBoundary: {
    worstMargin: number;
    strictMarginGap: number;
    pass: boolean;
  } | null;
  evaluationStatus: "complete" | "not_evaluable";
  allEvaluationsPass: boolean;
  status: "pass" | "fail" | "not_evaluable";
  blockers: string[];
};

export type Nhm2QeiFeasibilityFrontierV1 = {
  contractVersion: typeof NHM2_QEI_FEASIBILITY_FRONTIER_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  provenance: Nhm2QeiFeasibilityProvenanceV1;
  domain: Nhm2QeiFeasibilitySearchDomainV1;
  theorems: Nhm2QeiFeasibilityTheoremV1[];
  admissionPolicy: {
    strictMarginLimit: 1;
    rawComputedMarginRequired: true;
    policyMarginRequired: true;
    worstCaseOverCartesianDomainRequired: true;
    policyAndBoundFloorHaveNoIndependentAuthority: true;
    policyMayVetoButCannotPromote: true;
  };
  forbiddenAuthorities: Array<
    (typeof NHM2_QEI_FEASIBILITY_FORBIDDEN_AUTHORITIES)[number]
  >;
  candidates: Nhm2QeiFeasibilityCandidateResultV1[];
  evaluationStatus: "complete" | "not_evaluable";
  verdict: Nhm2QeiFeasibilityFrontierVerdict;
  summary: {
    candidateCount: number;
    passingCandidateIds: string[];
    selectedCandidateId: string | null;
    expectedEvaluationCountPerCandidate: number;
    cartesianCoverageComplete: boolean;
    provenanceBindingsComplete: boolean;
    frontierComplete: boolean;
    closestCandidateId: string | null;
    closestCandidateWorstMargin: number | null;
    closestStrictMarginGap: number | null;
    firstBlocker: string | null;
    blockers: string[];
  };
  claimBoundary: {
    diagnosticOnly: true;
    experimentReadyTheoryCandidateOnly: true;
    finiteDomainNoCandidateIsNotUniversalNoGo: true;
    filesystemVerificationRequired: true;
    cannotSatisfyWorldlineQeiClosure: true;
    sensitivityDoesNotAuthorizeParameterScaling: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    certifiedSpeedClaimAllowed: false;
  };
};

export type BuildNhm2QeiFeasibilityFrontierInputV1 = {
  generatedAt?: string | null;
  provenance: Nhm2QeiFeasibilityProvenanceV1;
  domain: Nhm2QeiFeasibilitySearchDomainV1;
  theorems: Nhm2QeiFeasibilityTheoremV1[];
  candidates: Nhm2QeiFeasibilityCandidateInputV1[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isConcreteArtifactRef = (value: unknown): value is string =>
  isText(value) &&
  !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) &&
  !/^[a-z]:[\\/]/i.test(value) &&
  !/^[\\/]/.test(value) &&
  !/(^|[\\/])\.\.($|[\\/])/.test(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isPositiveFinite = (value: unknown): value is number =>
  isFiniteNumber(value) && value > 0;

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);

const isCommitSha = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{40}$/i.test(value);

const unique = (values: string[]): string[] => Array.from(new Set(values));

const duplicates = (values: string[]): string[] => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return Array.from(repeated);
};

const finiteOrNull = (value: number): number | null =>
  Number.isFinite(value) ? value : null;

const approximatelyEqual = (
  left: number,
  right: number,
  relativeTolerance = 1e-9,
  absoluteTolerance = 1e-12,
): boolean => {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return (
    Math.abs(left - right) <=
    Math.max(
      absoluteTolerance,
      relativeTolerance * Math.max(Math.abs(left), Math.abs(right), 1),
    )
  );
};

const numberKey = (value: number): string =>
  Number.isFinite(value) ? value.toPrecision(17) : String(value);

const cartesianKey = (
  worldlineId: string,
  samplingFamilyId: string,
  tauSeconds: number,
): string => worldlineId + "|" + samplingFamilyId + "|" + numberKey(tauSeconds);

const expectedCartesianKeys = (
  domain: Nhm2QeiFeasibilitySearchDomainV1,
): string[] => {
  const keys: string[] = [];
  for (const worldlineId of domain.worldlineIds) {
    for (const samplingFamilyId of domain.samplingFamilyIds) {
      for (const tauSeconds of domain.tauSeconds) {
        keys.push(cartesianKey(worldlineId, samplingFamilyId, tauSeconds));
      }
    }
  }
  return keys;
};

const validateRunBoundArtifact = (
  label: string,
  binding: Nhm2QeiFeasibilityArtifactBindingV1 | null | undefined,
  runId: string,
  epochId: string,
): string[] => {
  const blockers: string[] = [];
  if (!isConcreteArtifactRef(binding?.artifactRef))
    blockers.push(label + "_artifact_ref_missing");
  if (!isSha256(binding?.sha256)) blockers.push(label + "_sha256_invalid");
  if (binding?.runId !== runId) blockers.push(label + "_run_id_mismatch");
  if (binding?.epochId !== epochId) blockers.push(label + "_epoch_id_mismatch");
  return blockers;
};

const validateProvenance = (
  provenance: Nhm2QeiFeasibilityProvenanceV1,
): string[] => {
  const blockers: string[] = [];
  const run = provenance?.run;
  if (!isText(run?.runId)) blockers.push("run_id_missing");
  if (!isCommitSha(run?.commitSha)) blockers.push("commit_sha_invalid");
  if (!isText(run?.epochId)) blockers.push("execution_epoch_id_missing");
  const startedAt = Date.parse(run?.startedAt ?? "");
  const completedAt = Date.parse(run?.completedAt ?? "");
  if (
    !Number.isFinite(startedAt) ||
    !Number.isFinite(completedAt) ||
    completedAt < startedAt
  ) {
    blockers.push("execution_interval_invalid");
  }
  const runId = run?.runId ?? "";
  const epochId = run?.epochId ?? "";
  blockers.push(
    ...validateRunBoundArtifact(
      "run_manifest",
      provenance.runManifest,
      runId,
      epochId,
    ),
    ...validateRunBoundArtifact(
      "runtime_receipt",
      provenance.runtimeReceipt,
      runId,
      epochId,
    ),
    ...validateRunBoundArtifact(
      "qft_state",
      provenance.qftState,
      runId,
      epochId,
    ),
    ...validateRunBoundArtifact(
      "continuous_observer",
      provenance.continuousObserver,
      runId,
      epochId,
    ),
    ...validateRunBoundArtifact(
      "worldline_set",
      provenance.worldlineSet,
      runId,
      epochId,
    ),
    ...validateRunBoundArtifact(
      "sampling_family_set",
      provenance.samplingFamilySet,
      runId,
      epochId,
    ),
  );
  if (provenance.qftState?.stateClass !== "hadamard")
    blockers.push("qft_state_not_hadamard");
  if (!isText(provenance.qftState?.renormalizationScheme))
    blockers.push("qft_renormalization_scheme_missing");
  if (!isText(provenance.qftState?.operatorMapping))
    blockers.push("qft_operator_mapping_missing");
  if (!isConcreteArtifactRef(provenance.theoremSet?.artifactRef))
    blockers.push("theorem_set_artifact_ref_missing");
  if (!isSha256(provenance.theoremSet?.sha256))
    blockers.push("theorem_set_sha256_invalid");
  if (provenance.historicalOrUnboundDossierUsed !== false) {
    blockers.push(
      provenance.historicalOrUnboundDossierUsed === true
        ? "historical_or_unbound_qei_dossier_forbidden"
        : "historical_or_unbound_qei_dossier_flag_invalid",
    );
  }
  return unique(blockers);
};

const validateDomain = (domain: Nhm2QeiFeasibilitySearchDomainV1): string[] => {
  const blockers: string[] = [];
  if (domain?.finiteDomainDeclared !== true)
    blockers.push("finite_search_domain_not_declared");
  if (domain?.cartesianCoverageRequired !== true)
    blockers.push("cartesian_coverage_not_required");
  const textAxes: Array<[string, string[]]> = [
    ["candidate", domain?.candidateIds ?? []],
    ["worldline", domain?.worldlineIds ?? []],
    ["sampling_family", domain?.samplingFamilyIds ?? []],
  ];
  for (const [label, values] of textAxes) {
    if (!Array.isArray(values) || values.length === 0)
      blockers.push(label + "_domain_empty");
    if (values.some((value) => !isText(value)))
      blockers.push(label + "_domain_value_invalid");
    if (duplicates(values).length > 0)
      blockers.push(label + "_domain_duplicates");
  }
  if (!Array.isArray(domain?.tauSeconds) || domain.tauSeconds.length === 0)
    blockers.push("tau_domain_empty");
  if ((domain?.tauSeconds ?? []).some((tau) => !isPositiveFinite(tau)))
    blockers.push("tau_domain_value_invalid");
  if (
    duplicates((domain?.tauSeconds ?? []).map((tau) => numberKey(tau))).length >
    0
  ) {
    blockers.push("tau_domain_duplicates");
  }
  const expectedCount =
    (domain?.worldlineIds?.length ?? 0) *
    (domain?.samplingFamilyIds?.length ?? 0) *
    (domain?.tauSeconds?.length ?? 0);
  if (!Number.isSafeInteger(expectedCount) || expectedCount <= 0)
    blockers.push("cartesian_domain_size_invalid");
  return unique(blockers);
};

const validateTheorems = (
  theorems: Nhm2QeiFeasibilityTheoremV1[],
  domain: Nhm2QeiFeasibilitySearchDomainV1,
): {
  blockers: string[];
  bySamplingFamily: Map<string, Nhm2QeiFeasibilityTheoremV1>;
} => {
  const blockers: string[] = [];
  const bySamplingFamily = new Map<string, Nhm2QeiFeasibilityTheoremV1>();
  for (const theorem of theorems ?? []) {
    const prefix = isText(theorem?.samplingFamilyId)
      ? "theorem:" + theorem.samplingFamilyId
      : "theorem:unknown";
    if (!isText(theorem?.theoremId))
      blockers.push(prefix + ":theorem_id_missing");
    if (!isText(theorem?.samplingFamilyId))
      blockers.push(prefix + ":sampling_family_id_missing");
    if (bySamplingFamily.has(theorem?.samplingFamilyId))
      blockers.push(prefix + ":duplicate_theorem_for_sampling_family");
    else if (isText(theorem?.samplingFamilyId))
      bySamplingFamily.set(theorem.samplingFamilyId, theorem);
    if (!isText(theorem?.fieldType))
      blockers.push(prefix + ":field_type_missing");
    if (
      theorem?.lowerBoundForm !== "minus_K_over_tau_four_minus_safety_sigma"
    ) {
      blockers.push(prefix + ":unsupported_lower_bound_form");
    }
    if (!isPositiveFinite(theorem?.K_Jm3_s4))
      blockers.push(prefix + ":theorem_K_nonpositive_or_invalid");
    if (
      !isFiniteNumber(theorem?.safetySigma_Jm3) ||
      theorem.safetySigma_Jm3 < 0
    ) {
      blockers.push(prefix + ":safety_sigma_invalid");
    }
    if (
      !isPositiveFinite(theorem?.tauMinSeconds) ||
      !isPositiveFinite(theorem?.tauMaxSeconds) ||
      theorem.tauMinSeconds > theorem.tauMaxSeconds
    ) {
      blockers.push(prefix + ":theorem_tau_support_invalid");
    }
    if (theorem?.stationaryTimelikeWorldlinesSupported !== true)
      blockers.push(prefix + ":stationary_timelike_support_missing");
    if (theorem?.normalizedSamplingRequired !== true)
      blockers.push(prefix + ":normalized_sampling_requirement_missing");
    if (theorem?.supported !== true)
      blockers.push(prefix + ":theorem_not_supported");
    if (!isConcreteArtifactRef(theorem?.provenanceRef))
      blockers.push(prefix + ":theorem_provenance_ref_missing");
    if (!isSha256(theorem?.provenanceSha256))
      blockers.push(prefix + ":theorem_provenance_sha256_invalid");
  }
  for (const familyId of domain?.samplingFamilyIds ?? []) {
    if (!bySamplingFamily.has(familyId))
      blockers.push("theorem:" + familyId + ":missing");
  }
  for (const familyId of bySamplingFamily.keys()) {
    if (!(domain?.samplingFamilyIds ?? []).includes(familyId))
      blockers.push("theorem:" + familyId + ":outside_declared_domain");
  }
  return { blockers: unique(blockers), bySamplingFamily };
};

const expectedMargin = (lhs_Jm3: number, bound_Jm3: number): number => {
  if (!Number.isFinite(lhs_Jm3) || !Number.isFinite(bound_Jm3))
    return Number.NaN;
  if (lhs_Jm3 >= 0) return 0;
  if (!(bound_Jm3 < 0)) return Number.NaN;
  return Math.abs(lhs_Jm3) / Math.abs(bound_Jm3);
};

type EvaluationAssessment = {
  blockers: string[];
  notEvaluableBlockers: string[];
  boundComputed_Jm3: number | null;
  boundComputedAuditInput: Nhm2QeiFeasibilityEvaluationResultV1["boundComputedAuditInput"];
  marginRawComputed: number | null;
  marginPolicy: number | null;
  sensitivity: Nhm2QeiFeasibilityEvaluationResultV1["sensitivity"];
  marginAuditInput: Nhm2QeiFeasibilityEvaluationResultV1["marginAuditInput"];
};

const validateEvaluation = (
  evaluation: Nhm2QeiFeasibilityEvaluationInputV1,
  candidate: Nhm2QeiFeasibilityCandidateInputV1,
  input: BuildNhm2QeiFeasibilityFrontierInputV1,
  theoremByFamily: Map<string, Nhm2QeiFeasibilityTheoremV1>,
): EvaluationAssessment => {
  const blockers: string[] = [];
  const notEvaluableBlockers: string[] = [];
  const block = (code: string, notEvaluable = false): void => {
    blockers.push(code);
    if (notEvaluable) notEvaluableBlockers.push(code);
  };
  const run = input.provenance.run;
  if (!isText(evaluation?.evaluationId))
    block("evaluation_id_missing", true);
  if (!input.domain.worldlineIds.includes(evaluation?.worldlineId))
    block("worldline_outside_declared_domain", true);
  if (!input.domain.samplingFamilyIds.includes(evaluation?.samplingFamilyId))
    block("sampling_family_outside_declared_domain", true);
  if (
    !isPositiveFinite(evaluation?.tauSeconds) ||
    !input.domain.tauSeconds.includes(evaluation.tauSeconds)
  ) {
    block("tau_outside_declared_domain", true);
  }
  if (evaluation?.samplingNormalized !== true) {
    block(
      evaluation?.samplingNormalized === false
        ? "sampling_function_not_normalized"
        : "sampling_normalized_flag_invalid",
      true,
    );
  }
  const theorem = theoremByFamily.get(evaluation?.samplingFamilyId);
  let theoremBoundComputed = Number.NaN;
  if (theorem == null) {
    block("theorem_missing_for_sampling_family", true);
  } else {
    if (evaluation.theoremId !== theorem.theoremId)
      block("evaluation_theorem_id_mismatch", true);
    if (
      !isPositiveFinite(evaluation.tauSeconds) ||
      evaluation.tauSeconds < theorem.tauMinSeconds ||
      evaluation.tauSeconds > theorem.tauMaxSeconds
    ) {
      block("tau_outside_theorem_support", true);
    }
    const expectedBound =
      -theorem.K_Jm3_s4 / Math.pow(evaluation.tauSeconds, 4) -
      theorem.safetySigma_Jm3;
    theoremBoundComputed = expectedBound;
    if (
      !(evaluation.boundComputed_Jm3 < 0) ||
      !approximatelyEqual(evaluation.boundComputed_Jm3, expectedBound)
    ) {
      block("computed_bound_not_supported_by_theorem", true);
    }
  }
  if (!(evaluation?.boundPolicy_Jm3 < 0))
    block("policy_bound_nonnegative_or_invalid", true);
  if (!isFiniteNumber(evaluation?.lhs_Jm3))
    block("sampled_lhs_invalid", true);
  const boundComputed_Jm3 = finiteOrNull(theoremBoundComputed);
  const rawExpected = expectedMargin(
    evaluation?.lhs_Jm3,
    theoremBoundComputed,
  );
  const policyExpected = expectedMargin(
    evaluation?.lhs_Jm3,
    evaluation?.boundPolicy_Jm3,
  );
  const marginRawComputed = finiteOrNull(rawExpected);
  const marginPolicy = finiteOrNull(policyExpected);
  const theoremTerm =
    theorem != null &&
    isPositiveFinite(theorem.K_Jm3_s4) &&
    isPositiveFinite(evaluation?.tauSeconds)
      ? theorem.K_Jm3_s4 / Math.pow(evaluation.tauSeconds, 4)
      : Number.NaN;
  const rawMarginGapToStrictLimit =
    marginRawComputed == null ? null : marginRawComputed - 1;
  let theoremCrossoverTauSeconds: number | null = null;
  if (
    theorem != null &&
    isPositiveFinite(theorem.K_Jm3_s4) &&
    isFiniteNumber(theorem.safetySigma_Jm3) &&
    theorem.safetySigma_Jm3 >= 0 &&
    isFiniteNumber(evaluation?.lhs_Jm3) &&
    evaluation.lhs_Jm3 < 0 &&
    Math.abs(evaluation.lhs_Jm3) > theorem.safetySigma_Jm3
  ) {
    theoremCrossoverTauSeconds = finiteOrNull(
      Math.pow(
        theorem.K_Jm3_s4 /
          (Math.abs(evaluation.lhs_Jm3) - theorem.safetySigma_Jm3),
        0.25,
      ),
    );
  }
  const currentTauToCrossoverRatio =
    theoremCrossoverTauSeconds != null &&
    isPositiveFinite(evaluation?.tauSeconds)
      ? evaluation.tauSeconds / theoremCrossoverTauSeconds
      : null;
  const logRawMarginLogTauSensitivity =
    evaluation?.lhs_Jm3 >= 0
      ? 0
      : theorem != null &&
          Number.isFinite(theoremTerm) &&
          theoremTerm >= 0 &&
          isFiniteNumber(theorem.safetySigma_Jm3) &&
          theoremTerm + theorem.safetySigma_Jm3 > 0
        ? (4 * theoremTerm) /
          (theoremTerm + theorem.safetySigma_Jm3)
        : null;
  const crossoverWithinTheoremSupport =
    theoremCrossoverTauSeconds == null || theorem == null
      ? null
      : theoremCrossoverTauSeconds >= theorem.tauMinSeconds &&
        theoremCrossoverTauSeconds <= theorem.tauMaxSeconds;
  const submittedRaw = isFiniteNumber(evaluation?.marginRawComputed)
    ? evaluation.marginRawComputed
    : null;
  const submittedPolicy = isFiniteNumber(evaluation?.marginPolicy)
    ? evaluation.marginPolicy
    : null;
  const submittedBoundComputed = isFiniteNumber(evaluation?.boundComputed_Jm3)
    ? evaluation.boundComputed_Jm3
    : null;
  const boundComputedMatchesTheorem =
    submittedBoundComputed != null &&
    boundComputed_Jm3 != null &&
    approximatelyEqual(submittedBoundComputed, boundComputed_Jm3);
  if (submittedRaw == null) block("raw_computed_margin_input_invalid", true);
  else if (
    marginRawComputed != null &&
    !approximatelyEqual(submittedRaw, marginRawComputed)
  ) {
    block("raw_computed_margin_input_mismatch", true);
  }
  if (submittedPolicy == null) block("policy_margin_input_invalid", true);
  else if (
    marginPolicy != null &&
    !approximatelyEqual(submittedPolicy, marginPolicy)
  ) {
    block("policy_margin_input_mismatch", true);
  }
  if (marginRawComputed == null)
    block("raw_computed_margin_not_evaluable", true);
  else if (!(marginRawComputed < 1))
    block("raw_computed_margin_not_strict_lt_1");
  if (marginPolicy == null) block("policy_margin_not_evaluable", true);
  else if (!(marginPolicy < 1))
    block("policy_margin_not_strict_lt_1");
  if (evaluation?.applicabilityStatus !== "PASS") {
    const recognized =
      evaluation?.applicabilityStatus === "FAIL" ||
      evaluation?.applicabilityStatus === "NOT_APPLICABLE" ||
      evaluation?.applicabilityStatus === "UNKNOWN";
    block(
      recognized
        ? "qei_applicability_not_pass"
        : "qei_applicability_status_invalid",
      true,
    );
  }
  const tauConsistencyEntries: Array<
    [
      string,
      "pass" | "fail" | "missing" | null | undefined,
    ]
  > = [
    ["tau_vs_duty", evaluation?.tauConsistency?.tauVsDuty],
    [
      "tau_vs_light_crossing",
      evaluation?.tauConsistency?.tauVsLightCrossing,
    ],
    ["tau_vs_modulation", evaluation?.tauConsistency?.tauVsModulation],
  ];
  for (const [label, status] of tauConsistencyEntries) {
    if (status === "pass") continue;
    const recognized = status === "fail" || status === "missing";
    block(
      recognized ? label + "_not_pass" : label + "_status_invalid",
      true,
    );
  }
  const metric = evaluation?.metricSemanticBinding;
  if (metric?.metricDerived !== true) {
    block(
      metric?.metricDerived === false
        ? "metric_t00_not_metric_derived"
        : "metric_derived_flag_invalid",
      true,
    );
  }
  if (metric?.metricContractOk !== true) {
    block(
      metric?.metricContractOk === false
        ? "metric_t00_contract_not_ok"
        : "metric_contract_flag_invalid",
      true,
    );
  }
  if (metric?.sameEpoch !== true)
    block(
      metric?.sameEpoch === false
        ? "metric_qei_epoch_mismatch"
        : "metric_same_epoch_flag_invalid",
      true,
    );
  if (
    !isText(metric?.rhoSource) ||
    !isText(metric?.metricT00Ref) ||
    metric.rhoSource !== metric.metricT00Ref
  ) {
    block("metric_rho_source_semantic_mismatch", true);
  }
  if (!isFiniteNumber(metric?.metricT00Si_Jm3))
    block("metric_t00_si_invalid", true);
  if (
    metric?.quantitySemanticType !== "ren_expectation_timelike_energy_density"
  ) {
    block("qei_quantity_semantic_mismatch", true);
  }
  if (metric?.worldlineClass !== "timelike")
    block("qei_worldline_not_timelike", true);
  if (metric?.dutyAppliedToMetricT00 !== false) {
    block(
      metric?.dutyAppliedToMetricT00 === true
        ? "duty_scaled_metric_t00_forbidden"
        : "duty_scaled_metric_t00_flag_invalid",
      true,
    );
  }
  if (typeof evaluation?.policyEvidence?.boundFloorApplied !== "boolean") {
    block("bound_floor_applied_flag_invalid", true);
  }
  if (
    evaluation?.policyEvidence?.policyOrFloorUsedAsIndependentAdmissionAuthority !==
    false
  ) {
    block(
      evaluation?.policyEvidence
        ?.policyOrFloorUsedAsIndependentAdmissionAuthority === true
        ? "policy_or_floor_independent_admission_authority_forbidden"
        : "policy_or_floor_independent_admission_authority_flag_invalid",
      true,
    );
  }
  if (evaluation?.evidenceOrigin !== "run_bound_evaluation") {
    const recognized =
      evaluation?.evidenceOrigin === "historical_dossier" ||
      evaluation?.evidenceOrigin === "unbound";
    block(
      recognized
        ? "historical_or_unbound_evaluation_forbidden"
        : "evidence_origin_invalid",
      true,
    );
  }
  const rawEvidenceBlockers = validateRunBoundArtifact(
    "raw_evaluation_evidence",
    evaluation?.rawEvaluationEvidence,
    run.runId,
    run.epochId,
  );
  const quadratureEvidenceBlockers = validateRunBoundArtifact(
    "quadrature_evidence",
    evaluation?.quadratureEvidence,
    run.runId,
    run.epochId,
  );
  for (const evidenceBlocker of [
    ...rawEvidenceBlockers,
    ...quadratureEvidenceBlockers,
  ]) {
    block(evidenceBlocker, true);
  }
  const binding = evaluation?.binding;
  if (binding?.runId !== run.runId)
    block("evaluation_run_id_mismatch", true);
  if (binding?.epochId !== run.epochId)
    block("evaluation_epoch_id_mismatch", true);
  if (binding?.profileSha256 !== candidate.profile.sha256)
    block("evaluation_profile_hash_mismatch", true);
  if (binding?.fullTensorSha256 !== candidate.fullTensor.sha256)
    block("evaluation_full_tensor_hash_mismatch", true);
  if (binding?.qftStateSha256 !== input.provenance.qftState.sha256)
    block("evaluation_qft_state_hash_mismatch", true);
  if (
    binding?.continuousObserverSha256 !==
    input.provenance.continuousObserver.sha256
  ) {
    block("evaluation_continuous_observer_hash_mismatch", true);
  }
  if (binding?.worldlineSetSha256 !== input.provenance.worldlineSet.sha256)
    block("evaluation_worldline_set_hash_mismatch", true);
  if (
    binding?.samplingFamilySetSha256 !==
    input.provenance.samplingFamilySet.sha256
  ) {
    block("evaluation_sampling_family_set_hash_mismatch", true);
  }
  if (binding?.theoremSetSha256 !== input.provenance.theoremSet.sha256)
    block("evaluation_theorem_set_hash_mismatch", true);
  return {
    blockers: unique(blockers),
    notEvaluableBlockers: unique(notEvaluableBlockers),
    boundComputed_Jm3,
    boundComputedAuditInput: {
      boundComputed_Jm3: submittedBoundComputed,
      matchesTheorem: boundComputedMatchesTheorem,
    },
    marginRawComputed,
    marginPolicy,
    sensitivity: {
      rawMarginGapToStrictLimit,
      theoremCrossoverTauSeconds,
      currentTauToCrossoverRatio,
      logRawMarginLogTauSensitivity,
      crossoverWithinTheoremSupport,
    },
    marginAuditInput: {
      marginRawComputed: submittedRaw,
      marginPolicy: submittedPolicy,
      rawComputedMatches:
        submittedRaw != null &&
        marginRawComputed != null &&
        approximatelyEqual(submittedRaw, marginRawComputed),
      policyMatches:
        submittedPolicy != null &&
        marginPolicy != null &&
        approximatelyEqual(submittedPolicy, marginPolicy),
    },
  };
};

const candidateCoverage = (
  candidate: Nhm2QeiFeasibilityCandidateInputV1,
  expectedKeys: string[],
): Nhm2QeiFeasibilityCandidateResultV1["coverage"] => {
  const observedKeys = candidate.evaluations.map((evaluation) =>
    cartesianKey(
      evaluation.worldlineId,
      evaluation.samplingFamilyId,
      evaluation.tauSeconds,
    ),
  );
  const expected = new Set(expectedKeys);
  const observed = new Set(observedKeys);
  const missingCartesianKeys = expectedKeys.filter((key) => !observed.has(key));
  const duplicateCartesianKeys = duplicates(observedKeys);
  const extraCartesianKeys = Array.from(observed).filter(
    (key) => !expected.has(key),
  );
  return {
    expectedEvaluationCount: expectedKeys.length,
    observedEvaluationCount: candidate.evaluations.length,
    complete:
      missingCartesianKeys.length === 0 &&
      duplicateCartesianKeys.length === 0 &&
      extraCartesianKeys.length === 0 &&
      candidate.evaluations.length === expectedKeys.length,
    missingCartesianKeys,
    duplicateCartesianKeys,
    extraCartesianKeys,
  };
};

const buildCandidate = (
  candidate: Nhm2QeiFeasibilityCandidateInputV1,
  input: BuildNhm2QeiFeasibilityFrontierInputV1,
  theoremByFamily: Map<string, Nhm2QeiFeasibilityTheoremV1>,
  expectedKeys: string[],
  inheritedBlockers: string[],
): Nhm2QeiFeasibilityCandidateResultV1 => {
  const blockers = [...inheritedBlockers];
  const notEvaluableBlockers = [...inheritedBlockers];
  const run = input.provenance.run;
  if (!isText(candidate?.candidateId)) {
    blockers.push("candidate_id_missing");
    notEvaluableBlockers.push("candidate_id_missing");
  }
  if (!input.domain.candidateIds.includes(candidate?.candidateId)) {
    blockers.push("candidate_outside_declared_domain");
    notEvaluableBlockers.push("candidate_outside_declared_domain");
  }
  if (!isText(candidate?.profile?.profileId)) {
    blockers.push("candidate_profile_id_missing");
    notEvaluableBlockers.push("candidate_profile_id_missing");
  }
  const candidateBindingBlockers = [
    ...validateRunBoundArtifact(
      "candidate_profile",
      candidate.profile,
      run.runId,
      run.epochId,
    ),
    ...validateRunBoundArtifact(
      "candidate_full_tensor",
      candidate.fullTensor,
      run.runId,
      run.epochId,
    ),
  ];
  blockers.push(...candidateBindingBlockers);
  notEvaluableBlockers.push(...candidateBindingBlockers);
  if (candidate?.fullTensor?.tensorBasis !== "same_chart_full_tensor") {
    blockers.push("same_chart_full_tensor_binding_missing");
    notEvaluableBlockers.push("same_chart_full_tensor_binding_missing");
  }
  if (candidate?.metricConstruction?.kind !== "recomputed_full_tensor") {
    blockers.push("metric_tensor_not_recomputed");
    notEvaluableBlockers.push("metric_tensor_not_recomputed");
  }
  if (candidate?.metricConstruction?.dutyScaledMetricT00 !== false) {
    const code =
      candidate?.metricConstruction?.dutyScaledMetricT00 === true
        ? "duty_scaled_metric_t00_forbidden"
        : "duty_scaled_metric_t00_flag_invalid";
    blockers.push(code);
    notEvaluableBlockers.push(code);
  }
  if (candidate?.metricConstruction?.directT00ScalingApplied !== false) {
    const code =
      candidate?.metricConstruction?.directT00ScalingApplied === true
        ? "direct_metric_t00_scaling_forbidden"
        : "direct_metric_t00_scaling_flag_invalid";
    blockers.push(code);
    notEvaluableBlockers.push(code);
  }
  if (candidate?.readiness?.fullTensorReady !== true) {
    blockers.push("full_tensor_not_ready");
    notEvaluableBlockers.push("full_tensor_not_ready");
  }
  if (candidate?.readiness?.covariantConservationReady !== true) {
    blockers.push("covariant_conservation_not_ready");
    notEvaluableBlockers.push("covariant_conservation_not_ready");
  }
  if (candidate?.readiness?.continuousObserverReady !== true) {
    blockers.push("continuous_observer_not_ready");
    notEvaluableBlockers.push("continuous_observer_not_ready");
  }

  const coverage = candidateCoverage(candidate, expectedKeys);
  if (!coverage.complete) {
    blockers.push("cartesian_coverage_incomplete");
    notEvaluableBlockers.push("cartesian_coverage_incomplete");
  }
  if (coverage.duplicateCartesianKeys.length > 0) {
    blockers.push("cartesian_coverage_duplicate_rows");
    notEvaluableBlockers.push("cartesian_coverage_duplicate_rows");
  }
  if (duplicates(candidate.evaluations.map((row) => row.evaluationId)).length) {
    blockers.push("evaluation_ids_duplicate");
    notEvaluableBlockers.push("evaluation_ids_duplicate");
  }

  const evaluations: Nhm2QeiFeasibilityEvaluationResultV1[] =
    candidate.evaluations.map((evaluation) => {
      const assessment = validateEvaluation(
        evaluation,
        candidate,
        input,
        theoremByFamily,
      );
      for (const blocker of assessment.blockers) {
        blockers.push(evaluation.evaluationId + ":" + blocker);
      }
      for (const blocker of assessment.notEvaluableBlockers) {
        notEvaluableBlockers.push(evaluation.evaluationId + ":" + blocker);
      }
      const evaluationStatus =
        assessment.notEvaluableBlockers.length === 0
          ? "complete"
          : "not_evaluable";
      return {
        ...evaluation,
        boundComputedAuditInput: assessment.boundComputedAuditInput,
        boundComputed_Jm3: assessment.boundComputed_Jm3,
        marginAuditInput: assessment.marginAuditInput,
        marginRawComputed: assessment.marginRawComputed,
        marginPolicy: assessment.marginPolicy,
        sensitivity: assessment.sensitivity,
        cartesianKey: cartesianKey(
          evaluation.worldlineId,
          evaluation.samplingFamilyId,
          evaluation.tauSeconds,
        ),
        evaluationStatus,
        pass:
          evaluationStatus === "complete" &&
          assessment.blockers.length === 0,
        blockers: assessment.blockers,
      };
    });

  let worstEvaluation: Nhm2QeiFeasibilityEvaluationResultV1 | null = null;
  let worstScore = Number.NEGATIVE_INFINITY;
  for (const evaluation of evaluations) {
    const score =
      evaluation.marginRawComputed != null &&
      evaluation.marginPolicy != null
        ? Math.max(evaluation.marginRawComputed, evaluation.marginPolicy)
        : Number.POSITIVE_INFINITY;
    if (worstEvaluation == null || score > worstScore) {
      worstEvaluation = evaluation;
      worstScore = score;
    }
  }
  const worstCase =
    worstEvaluation == null
      ? null
      : {
          evaluationId: worstEvaluation.evaluationId,
          cartesianKey: worstEvaluation.cartesianKey,
          marginRawComputed: worstEvaluation.marginRawComputed,
          marginPolicy: worstEvaluation.marginPolicy,
          worstMargin:
            worstEvaluation.marginRawComputed != null &&
            worstEvaluation.marginPolicy != null
              ? Math.max(
                  worstEvaluation.marginRawComputed,
                  worstEvaluation.marginPolicy,
                )
              : null,
          pass: worstEvaluation.pass,
        };
  const finalBlockers = unique(blockers);
  const evaluationStatus =
    unique(notEvaluableBlockers).length === 0
      ? "complete"
      : "not_evaluable";
  const allEvaluationsPass =
    evaluationStatus === "complete" &&
    coverage.complete &&
    evaluations.length > 0 &&
    evaluations.every((evaluation) => evaluation.pass);
  const status =
    evaluationStatus === "not_evaluable"
      ? "not_evaluable"
      : finalBlockers.length === 0 && allEvaluationsPass
        ? "pass"
        : "fail";
  const distanceToStrictBoundary =
    evaluationStatus === "complete" && worstCase?.worstMargin != null
      ? {
          worstMargin: worstCase.worstMargin,
          strictMarginGap: worstCase.worstMargin - 1,
          pass: worstCase.worstMargin < 1,
        }
      : null;
  return {
    candidateId: candidate.candidateId,
    profile: candidate.profile,
    fullTensor: candidate.fullTensor,
    metricConstruction: candidate.metricConstruction,
    readiness: candidate.readiness,
    evaluations,
    coverage,
    worstCase,
    distanceToStrictBoundary,
    evaluationStatus,
    allEvaluationsPass,
    status,
    blockers: finalBlockers,
  };
};

export const buildNhm2QeiFeasibilityFrontier = (
  input: BuildNhm2QeiFeasibilityFrontierInputV1,
): Nhm2QeiFeasibilityFrontierV1 => {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const generatedAtMs = Date.parse(generatedAt);
  const completedAtMs = Date.parse(input.provenance?.run?.completedAt ?? "");
  const generationBlockers: string[] = [];
  if (
    !Number.isFinite(generatedAtMs) ||
    new Date(generatedAtMs).toISOString() !== generatedAt
  ) {
    generationBlockers.push("generated_at_invalid");
  } else if (
    Number.isFinite(completedAtMs) &&
    generatedAtMs < completedAtMs
  ) {
    generationBlockers.push("generated_before_run_completed");
  }
  const provenanceBlockers = validateProvenance(input.provenance);
  const domainBlockers = validateDomain(input.domain);
  const theoremValidation = validateTheorems(input.theorems, input.domain);
  const candidateIds = input.candidates.map(
    (candidate) => candidate.candidateId,
  );
  const candidateSetBlockers: string[] = [];
  for (const candidateId of input.domain.candidateIds) {
    if (!candidateIds.includes(candidateId))
      candidateSetBlockers.push("candidate:" + candidateId + ":missing");
  }
  for (const candidateId of candidateIds) {
    if (!input.domain.candidateIds.includes(candidateId))
      candidateSetBlockers.push(
        "candidate:" + candidateId + ":outside_declared_domain",
      );
  }
  if (duplicates(candidateIds).length > 0)
    candidateSetBlockers.push("candidate_input_duplicates");
  const inheritedBlockers = unique([
    ...generationBlockers,
    ...provenanceBlockers,
    ...domainBlockers,
    ...theoremValidation.blockers,
    ...candidateSetBlockers,
  ]);
  const expectedKeys = expectedCartesianKeys(input.domain);
  const candidates = input.candidates.map((candidate) =>
    buildCandidate(
      candidate,
      input,
      theoremValidation.bySamplingFamily,
      expectedKeys,
      inheritedBlockers,
    ),
  );
  const passingCandidateIds = input.domain.candidateIds.filter(
    (candidateId) =>
      candidates.find((candidate) => candidate.candidateId === candidateId)
        ?.status === "pass",
  );
  const cartesianCoverageComplete =
    domainBlockers.length === 0 &&
    candidateSetBlockers.length === 0 &&
    candidates.length === input.domain.candidateIds.length &&
    candidates.every((candidate) => candidate.coverage.complete);
  const provenanceBindingsComplete =
    provenanceBlockers.length === 0 &&
    candidates.every(
      (candidate) =>
        !candidate.blockers.some(
          (blocker) =>
            blocker.includes("hash_mismatch") ||
            blocker.includes("run_id_mismatch") ||
            blocker.includes("epoch_id_mismatch") ||
            blocker.includes("sha256_invalid") ||
            blocker.includes("artifact_ref_missing"),
        ),
    );
  const evaluationStatus =
    cartesianCoverageComplete &&
    provenanceBindingsComplete &&
    theoremValidation.blockers.length === 0 &&
    inheritedBlockers.length === 0 &&
    candidates.every(
      (candidate) => candidate.evaluationStatus === "complete",
    )
      ? "complete"
      : "not_evaluable";
  const frontierComplete = evaluationStatus === "complete";
  const closestCandidate =
    evaluationStatus === "complete"
      ? candidates.reduce<Nhm2QeiFeasibilityCandidateResultV1 | null>(
          (closest, candidate) => {
            const margin = candidate.distanceToStrictBoundary?.worstMargin;
            if (margin == null) return closest;
            const closestMargin =
              closest?.distanceToStrictBoundary?.worstMargin ?? null;
            return closestMargin == null || margin < closestMargin
              ? candidate
              : closest;
          },
          null,
        )
      : null;
  const closestCandidateWorstMargin =
    closestCandidate?.distanceToStrictBoundary?.worstMargin ?? null;
  const verdict: Nhm2QeiFeasibilityFrontierVerdict =
    evaluationStatus === "not_evaluable"
      ? "frontier_not_evaluable"
      : passingCandidateIds.length > 0
        ? "candidate_found"
        : "no_candidate_within_declared_domain";
  const summaryBlockers = unique([
    ...inheritedBlockers,
    ...candidates.flatMap((candidate) =>
      candidate.blockers.map(
        (blocker) => "candidate:" + candidate.candidateId + ":" + blocker,
      ),
    ),
  ]);
  return {
    contractVersion: NHM2_QEI_FEASIBILITY_FRONTIER_CONTRACT_VERSION,
    generatedAt,
    laneId: "nhm2_shift_lapse",
    provenance: input.provenance,
    domain: input.domain,
    theorems: input.theorems,
    admissionPolicy: {
      strictMarginLimit: 1,
      rawComputedMarginRequired: true,
      policyMarginRequired: true,
      worstCaseOverCartesianDomainRequired: true,
      policyAndBoundFloorHaveNoIndependentAuthority: true,
      policyMayVetoButCannotPromote: true,
    },
    forbiddenAuthorities: [...NHM2_QEI_FEASIBILITY_FORBIDDEN_AUTHORITIES],
    candidates,
    evaluationStatus,
    verdict,
    summary: {
      candidateCount: input.domain.candidateIds.length,
      passingCandidateIds,
      selectedCandidateId: passingCandidateIds[0] ?? null,
      expectedEvaluationCountPerCandidate: expectedKeys.length,
      cartesianCoverageComplete,
      provenanceBindingsComplete,
      frontierComplete,
      closestCandidateId: closestCandidate?.candidateId ?? null,
      closestCandidateWorstMargin,
      closestStrictMarginGap:
        closestCandidateWorstMargin == null
          ? null
          : closestCandidateWorstMargin - 1,
      firstBlocker: summaryBlockers[0] ?? null,
      blockers: summaryBlockers,
    },
    claimBoundary: {
      diagnosticOnly: true,
      experimentReadyTheoryCandidateOnly: true,
      finiteDomainNoCandidateIsNotUniversalNoGo: true,
      filesystemVerificationRequired: true,
      cannotSatisfyWorldlineQeiClosure: true,
      sensitivityDoesNotAuthorizeParameterScaling: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      certifiedSpeedClaimAllowed: false,
    },
  };
};

const isJsonValue = (value: unknown): boolean => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (!isRecord(value)) return false;
  return Object.values(value).every(isJsonValue);
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
};

const candidateInputFromResult = (
  candidate: Nhm2QeiFeasibilityCandidateResultV1,
): Nhm2QeiFeasibilityCandidateInputV1 => ({
  candidateId: candidate.candidateId,
  profile: candidate.profile,
  fullTensor: candidate.fullTensor,
  metricConstruction: candidate.metricConstruction,
  readiness: candidate.readiness,
  evaluations: candidate.evaluations.map((evaluation) => ({
    evaluationId: evaluation.evaluationId,
    worldlineId: evaluation.worldlineId,
    samplingFamilyId: evaluation.samplingFamilyId,
    theoremId: evaluation.theoremId,
    tauSeconds: evaluation.tauSeconds,
    samplingNormalized: evaluation.samplingNormalized,
    lhs_Jm3: evaluation.lhs_Jm3,
    boundComputed_Jm3:
      evaluation.boundComputedAuditInput.boundComputed_Jm3 as number,
    boundPolicy_Jm3: evaluation.boundPolicy_Jm3,
    marginRawComputed:
      evaluation.marginAuditInput.marginRawComputed as number,
    marginPolicy: evaluation.marginAuditInput.marginPolicy as number,
    applicabilityStatus: evaluation.applicabilityStatus,
    tauConsistency: evaluation.tauConsistency,
    metricSemanticBinding: evaluation.metricSemanticBinding,
    policyEvidence: evaluation.policyEvidence,
    evidenceOrigin: evaluation.evidenceOrigin,
    rawEvaluationEvidence: evaluation.rawEvaluationEvidence,
    quadratureEvidence: evaluation.quadratureEvidence,
    binding: evaluation.binding,
  })),
});

export const isNhm2QeiFeasibilityFrontier = (
  value: unknown,
): value is Nhm2QeiFeasibilityFrontierV1 => {
  try {
    if (!isRecord(value) || !isJsonValue(value)) return false;
    if (
      value.contractVersion !==
      NHM2_QEI_FEASIBILITY_FRONTIER_CONTRACT_VERSION
    ) {
      return false;
    }
    if (!Array.isArray(value.candidates) || !Array.isArray(value.theorems))
      return false;
    const rebuilt = buildNhm2QeiFeasibilityFrontier({
      generatedAt: value.generatedAt as string,
      provenance: value.provenance as Nhm2QeiFeasibilityProvenanceV1,
      domain: value.domain as Nhm2QeiFeasibilitySearchDomainV1,
      theorems: value.theorems as Nhm2QeiFeasibilityTheoremV1[],
      candidates: (
        value.candidates as Nhm2QeiFeasibilityCandidateResultV1[]
      ).map(candidateInputFromResult),
    });
    return (
      JSON.stringify(canonicalize(value)) ===
      JSON.stringify(canonicalize(rebuilt))
    );
  } catch {
    return false;
  }
};
