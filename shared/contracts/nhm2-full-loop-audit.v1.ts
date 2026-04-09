export const NHM2_FULL_LOOP_AUDIT_CONTRACT_VERSION = "nhm2_full_loop_audit/v1";
export const NHM2_FULL_LOOP_AUDIT_ID = "nhm2_full_loop";
export const NHM2_FULL_LOOP_AUDIT_LANE_ID = "nhm2_shift_lapse";

export const NHM2_FULL_LOOP_AUDIT_SECTION_ORDER = [
  "family_semantics",
  "claim_tier",
  "lapse_provenance",
  "strict_signal_readiness",
  "source_closure",
  "observer_audit",
  "gr_stability_safety",
  "mission_time_outputs",
  "shift_vs_lapse_decomposition",
  "uncertainty_perturbation_reproducibility",
  "certificate_policy_result",
] as const;

export const NHM2_FULL_LOOP_AUDIT_STATE_VALUES = [
  "pass",
  "fail",
  "review",
  "unavailable",
] as const;

export const NHM2_FULL_LOOP_AUDIT_CLAIM_TIERS = [
  "diagnostic",
  "reduced-order",
  "certified",
] as const;

export const NHM2_FULL_LOOP_AUDIT_REASON_CODES = [
  "strict_signal_missing",
  "status_non_admissible",
  "hard_constraint_failed",
  "insufficient_provenance",
  "lapse_profile_missing",
  "metric_contract_missing",
  "source_closure_missing",
  "source_closure_version_lag",
  "source_closure_residual_exceeded",
  "observer_audit_incomplete",
  "observer_blocking_violation",
  "qei_applicability_non_pass",
  "mission_output_missing",
  "mission_output_not_certified",
  "shift_lapse_decomposition_missing",
  "expansion_leakage_unbounded",
  "perturbation_suite_missing",
  "reproducibility_missing",
  "certificate_missing",
  "certificate_integrity_missing",
  "certificate_integrity_failed",
  "policy_review_required",
] as const;

export type Nhm2FullLoopAuditSectionId =
  (typeof NHM2_FULL_LOOP_AUDIT_SECTION_ORDER)[number];
export type Nhm2FullLoopAuditState =
  (typeof NHM2_FULL_LOOP_AUDIT_STATE_VALUES)[number];
export type Nhm2FullLoopAuditClaimTier =
  (typeof NHM2_FULL_LOOP_AUDIT_CLAIM_TIERS)[number];
export type Nhm2FullLoopAuditReasonCode =
  (typeof NHM2_FULL_LOOP_AUDIT_REASON_CODES)[number];
export type Nhm2StrictSignalId = "theta" | "ts" | "qi";

export const NHM2_FULL_LOOP_AUDIT_SECTION_TIER_MAP: Record<
  Nhm2FullLoopAuditSectionId,
  Nhm2FullLoopAuditClaimTier[]
> = {
  family_semantics: ["diagnostic", "reduced-order", "certified"],
  claim_tier: ["diagnostic", "reduced-order", "certified"],
  lapse_provenance: ["diagnostic", "reduced-order", "certified"],
  strict_signal_readiness: ["reduced-order", "certified"],
  source_closure: ["reduced-order", "certified"],
  observer_audit: ["reduced-order", "certified"],
  gr_stability_safety: ["reduced-order", "certified"],
  mission_time_outputs: ["diagnostic", "reduced-order", "certified"],
  shift_vs_lapse_decomposition: ["reduced-order", "certified"],
  uncertainty_perturbation_reproducibility: ["reduced-order", "certified"],
  certificate_policy_result: ["certified"],
};

export const NHM2_FULL_LOOP_AUDIT_TIER_SECTION_MAP: Record<
  Nhm2FullLoopAuditClaimTier,
  Nhm2FullLoopAuditSectionId[]
> = {
  diagnostic: [
    "family_semantics",
    "claim_tier",
    "lapse_provenance",
    "mission_time_outputs",
  ],
  "reduced-order": [
    "family_semantics",
    "claim_tier",
    "lapse_provenance",
    "strict_signal_readiness",
    "source_closure",
    "observer_audit",
    "gr_stability_safety",
    "mission_time_outputs",
    "shift_vs_lapse_decomposition",
    "uncertainty_perturbation_reproducibility",
  ],
  certified: [...NHM2_FULL_LOOP_AUDIT_SECTION_ORDER],
};

export type Nhm2FullLoopAuditArtifactRef = {
  artifactId: string;
  path: string;
  contractVersion: string | null;
  status: string | null;
};

type Nhm2FullLoopAuditSectionBase<Id extends Nhm2FullLoopAuditSectionId> = {
  sectionId: Id;
  state: Nhm2FullLoopAuditState;
  reasons: Nhm2FullLoopAuditReasonCode[];
  supportedClaimTiers: Nhm2FullLoopAuditClaimTier[];
  artifactRefs: Nhm2FullLoopAuditArtifactRef[];
};

type Nhm2FullLoopAuditSectionBaseInput<Id extends Nhm2FullLoopAuditSectionId> =
  Omit<Nhm2FullLoopAuditSectionBase<Id>, "supportedClaimTiers">;

export type Nhm2FamilySemanticsSection =
  Nhm2FullLoopAuditSectionBase<"family_semantics"> & {
    familyId: string;
    baseFamily: string;
    lapseExtension: boolean;
    selectedProfileId: string | null;
    semanticBoundaries: string[];
    nonClaims: string[];
  };

export type Nhm2ClaimTierSurfaceStage = {
  module: string;
  stage: Nhm2FullLoopAuditClaimTier;
};

export type Nhm2ClaimTierSection = Nhm2FullLoopAuditSectionBase<"claim_tier"> & {
  currentTier: Nhm2FullLoopAuditClaimTier;
  maximumClaimTier: Nhm2FullLoopAuditClaimTier;
  viabilityStatus: "ADMISSIBLE" | "MARGINAL" | "INADMISSIBLE" | "UNKNOWN";
  promotionReason: Nhm2FullLoopAuditReasonCode | null;
  surfaceStages: Nhm2ClaimTierSurfaceStage[];
};

export type Nhm2LapseProvenanceSection =
  Nhm2FullLoopAuditSectionBase<"lapse_provenance"> & {
    metricFamily: string | null;
    shiftLapseProfileId: string | null;
    shiftLapseProfileStage: string | null;
    familyAuthorityStatus: string | null;
    transportCertificationStatus: string | null;
    metricT00ContractStatus: string | null;
    chartContractStatus: string | null;
  };

export type Nhm2StrictSignalReadinessSection =
  Nhm2FullLoopAuditSectionBase<"strict_signal_readiness"> & {
    strictModeEnabled: boolean;
    thetaMetricDerived: boolean | null;
    tsMetricDerived: boolean | null;
    qiMetricDerived: boolean | null;
    qiApplicabilityStatus: string | null;
    missingSignals: Nhm2StrictSignalId[];
  };

export type Nhm2SourceClosureSection =
  Nhm2FullLoopAuditSectionBase<"source_closure"> & {
    metricTensorRef: string | null;
    tileEffectiveTensorRef: string | null;
    residualRms: number | null;
    residualMax: number | null;
    residualByRegion: {
      hull: number | null;
      wall: number | null;
      exteriorShell: number | null;
    };
    toleranceRef: string | null;
    assumptionsDrifted: boolean | null;
  };

export type Nhm2ObserverFamilyAudit = {
  state: Nhm2FullLoopAuditState;
  wecMinOverAllTimelike: number | null;
  necMinOverAllNull: number | null;
  decStatus: string | null;
  secStatus: string | null;
  observerWorstCaseLocation: string | null;
  typeIFraction: number | null;
  missedViolationFraction: number | null;
  maxRobustMinusEulerian: number | null;
};

export type Nhm2ObserverAuditSection =
  Nhm2FullLoopAuditSectionBase<"observer_audit"> & {
    metric: Nhm2ObserverFamilyAudit;
    tile: Nhm2ObserverFamilyAudit;
  };

export type Nhm2GrStabilitySafetySection =
  Nhm2FullLoopAuditSectionBase<"gr_stability_safety"> & {
    solverHealth: string | null;
    perturbationFamilies: string[];
    H_rms: number | null;
    M_rms: number | null;
    H_maxAbs: number | null;
    M_maxAbs: number | null;
    centerlineProperAcceleration_mps2: number | null;
    wallNormalSafetyMargin: number | null;
    blueshiftMax: number | null;
    stabilityWorstCase: string | null;
    safetyWorstCaseLocation: string | null;
  };

export type Nhm2MissionTimeOutputsSection =
  Nhm2FullLoopAuditSectionBase<"mission_time_outputs"> & {
    worldlineStatus: string | null;
    routeTimeStatus: string | null;
    missionTimeEstimatorStatus: string | null;
    missionTimeComparisonStatus: string | null;
    targetId: string | null;
    coordinateTimeEstimateSeconds: number | null;
    properTimeEstimateSeconds: number | null;
    properMinusCoordinateSeconds: number | null;
    comparatorId: string | null;
  };

export type Nhm2ShiftVsLapseDecompositionSection =
  Nhm2FullLoopAuditSectionBase<"shift_vs_lapse_decomposition"> & {
    shiftDrivenContribution: number | null;
    lapseDrivenContribution: number | null;
    expansionLeakageBound: number | null;
    thetaFlatnessStatus: string | null;
    divBetaFlatnessStatus: string | null;
    natarioBaselineComparisonRef: string | null;
  };

export type Nhm2UncertaintyPerturbationReproducibilitySection =
  Nhm2FullLoopAuditSectionBase<"uncertainty_perturbation_reproducibility"> & {
    precisionAgreementStatus: string | null;
    meshConvergenceOrder: number | null;
    boundaryConditionSensitivity: number | null;
    smoothingKernelSensitivity: number | null;
    coldStartReproductionStatus: string | null;
    independentReproductionStatus: string | null;
    artifactHashConsistencyStatus: string | null;
  };

export type Nhm2CertificatePolicyResultSection =
  Nhm2FullLoopAuditSectionBase<"certificate_policy_result"> & {
    viabilityStatus: "ADMISSIBLE" | "MARGINAL" | "INADMISSIBLE" | "UNKNOWN";
    hardConstraintPass: boolean | null;
    firstHardFailureId: string | null;
    certificateStatus: string | null;
    certificateHash: string | null;
    certificateIntegrity: "ok" | "fail" | "unavailable";
    promotionTier: Nhm2FullLoopAuditClaimTier | null;
    promotionReason: Nhm2FullLoopAuditReasonCode | null;
  };

export type Nhm2FullLoopAuditSections = {
  family_semantics: Nhm2FamilySemanticsSection;
  claim_tier: Nhm2ClaimTierSection;
  lapse_provenance: Nhm2LapseProvenanceSection;
  strict_signal_readiness: Nhm2StrictSignalReadinessSection;
  source_closure: Nhm2SourceClosureSection;
  observer_audit: Nhm2ObserverAuditSection;
  gr_stability_safety: Nhm2GrStabilitySafetySection;
  mission_time_outputs: Nhm2MissionTimeOutputsSection;
  shift_vs_lapse_decomposition: Nhm2ShiftVsLapseDecompositionSection;
  uncertainty_perturbation_reproducibility: Nhm2UncertaintyPerturbationReproducibilitySection;
  certificate_policy_result: Nhm2CertificatePolicyResultSection;
};

export type Nhm2FullLoopAuditSectionsInput = {
  family_semantics: Nhm2FullLoopAuditSectionBaseInput<"family_semantics"> &
    Omit<Nhm2FamilySemanticsSection, keyof Nhm2FullLoopAuditSectionBase<"family_semantics">>;
  claim_tier: Nhm2FullLoopAuditSectionBaseInput<"claim_tier"> &
    Omit<Nhm2ClaimTierSection, keyof Nhm2FullLoopAuditSectionBase<"claim_tier">>;
  lapse_provenance: Nhm2FullLoopAuditSectionBaseInput<"lapse_provenance"> &
    Omit<
      Nhm2LapseProvenanceSection,
      keyof Nhm2FullLoopAuditSectionBase<"lapse_provenance">
    >;
  strict_signal_readiness:
    Nhm2FullLoopAuditSectionBaseInput<"strict_signal_readiness"> &
      Omit<
        Nhm2StrictSignalReadinessSection,
        keyof Nhm2FullLoopAuditSectionBase<"strict_signal_readiness">
      >;
  source_closure: Nhm2FullLoopAuditSectionBaseInput<"source_closure"> &
    Omit<Nhm2SourceClosureSection, keyof Nhm2FullLoopAuditSectionBase<"source_closure">>;
  observer_audit: Nhm2FullLoopAuditSectionBaseInput<"observer_audit"> &
    Omit<Nhm2ObserverAuditSection, keyof Nhm2FullLoopAuditSectionBase<"observer_audit">>;
  gr_stability_safety:
    Nhm2FullLoopAuditSectionBaseInput<"gr_stability_safety"> &
      Omit<
        Nhm2GrStabilitySafetySection,
        keyof Nhm2FullLoopAuditSectionBase<"gr_stability_safety">
      >;
  mission_time_outputs:
    Nhm2FullLoopAuditSectionBaseInput<"mission_time_outputs"> &
      Omit<
        Nhm2MissionTimeOutputsSection,
        keyof Nhm2FullLoopAuditSectionBase<"mission_time_outputs">
      >;
  shift_vs_lapse_decomposition:
    Nhm2FullLoopAuditSectionBaseInput<"shift_vs_lapse_decomposition"> &
      Omit<
        Nhm2ShiftVsLapseDecompositionSection,
        keyof Nhm2FullLoopAuditSectionBase<"shift_vs_lapse_decomposition">
      >;
  uncertainty_perturbation_reproducibility:
    Nhm2FullLoopAuditSectionBaseInput<"uncertainty_perturbation_reproducibility"> &
      Omit<
        Nhm2UncertaintyPerturbationReproducibilitySection,
        keyof Nhm2FullLoopAuditSectionBase<"uncertainty_perturbation_reproducibility">
      >;
  certificate_policy_result:
    Nhm2FullLoopAuditSectionBaseInput<"certificate_policy_result"> &
      Omit<
        Nhm2CertificatePolicyResultSection,
        keyof Nhm2FullLoopAuditSectionBase<"certificate_policy_result">
      >;
};

export type Nhm2FullLoopTierReadiness = {
  tier: Nhm2FullLoopAuditClaimTier;
  state: Nhm2FullLoopAuditState;
  requiredSections: Nhm2FullLoopAuditSectionId[];
  satisfiedSections: Nhm2FullLoopAuditSectionId[];
  blockingReasons: Nhm2FullLoopAuditReasonCode[];
};

export type Nhm2FullLoopAuditContractV1 = {
  contractVersion: typeof NHM2_FULL_LOOP_AUDIT_CONTRACT_VERSION;
  auditId: typeof NHM2_FULL_LOOP_AUDIT_ID;
  laneId: typeof NHM2_FULL_LOOP_AUDIT_LANE_ID;
  generatedAt: string;
  sectionOrder: Nhm2FullLoopAuditSectionId[];
  sections: Nhm2FullLoopAuditSections;
  claimTierSectionMap: Record<
    Nhm2FullLoopAuditClaimTier,
    Nhm2FullLoopAuditSectionId[]
  >;
  claimTierReadiness: Record<
    Nhm2FullLoopAuditClaimTier,
    Nhm2FullLoopTierReadiness
  >;
  currentClaimTier: Nhm2FullLoopAuditClaimTier;
  maximumClaimTier: Nhm2FullLoopAuditClaimTier;
  highestPassingClaimTier: Nhm2FullLoopAuditClaimTier | null;
  overallState: Nhm2FullLoopAuditState;
  blockingReasons: Nhm2FullLoopAuditReasonCode[];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isAuditState = (value: unknown): value is Nhm2FullLoopAuditState =>
  NHM2_FULL_LOOP_AUDIT_STATE_VALUES.includes(
    value as Nhm2FullLoopAuditState,
  );

const isClaimTier = (value: unknown): value is Nhm2FullLoopAuditClaimTier =>
  NHM2_FULL_LOOP_AUDIT_CLAIM_TIERS.includes(
    value as Nhm2FullLoopAuditClaimTier,
  );

const isReasonCode = (value: unknown): value is Nhm2FullLoopAuditReasonCode =>
  NHM2_FULL_LOOP_AUDIT_REASON_CODES.includes(
    value as Nhm2FullLoopAuditReasonCode,
  );

const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || Number.isFinite(Number(value));

const isNullableBoolean = (value: unknown): value is boolean | null =>
  value === null || typeof value === "boolean";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isClaimTierArray = (
  value: unknown,
  expected?: Nhm2FullLoopAuditClaimTier[],
): value is Nhm2FullLoopAuditClaimTier[] =>
  Array.isArray(value) &&
  value.every((entry) => isClaimTier(entry)) &&
  (expected == null
    ? true
    : value.length === expected.length &&
      expected.every((entry, index) => value[index] === entry));

const isReasonCodeArray = (
  value: unknown,
): value is Nhm2FullLoopAuditReasonCode[] =>
  Array.isArray(value) && value.every((entry) => isReasonCode(entry));

const isSectionIdArray = (
  value: unknown,
  expected?: Nhm2FullLoopAuditSectionId[],
): value is Nhm2FullLoopAuditSectionId[] =>
  Array.isArray(value) &&
  value.every((entry) =>
    NHM2_FULL_LOOP_AUDIT_SECTION_ORDER.includes(
      entry as Nhm2FullLoopAuditSectionId,
    ),
  ) &&
  (expected == null
    ? true
    : value.length === expected.length &&
      expected.every((entry, index) => value[index] === entry));

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const orderReasonCodes = (
  reasonCodes: Nhm2FullLoopAuditReasonCode[],
): Nhm2FullLoopAuditReasonCode[] => {
  const ordered = unique(reasonCodes);
  ordered.sort(
    (lhs, rhs) =>
      NHM2_FULL_LOOP_AUDIT_REASON_CODES.indexOf(lhs) -
      NHM2_FULL_LOOP_AUDIT_REASON_CODES.indexOf(rhs),
  );
  return ordered;
};

const cloneArtifactRefs = (
  refs: Nhm2FullLoopAuditArtifactRef[],
): Nhm2FullLoopAuditArtifactRef[] =>
  refs.map((ref) => ({
    artifactId: ref.artifactId,
    path: ref.path,
    contractVersion: ref.contractVersion,
    status: ref.status,
  }));

const cloneObserverFamilyAudit = (
  audit: Nhm2ObserverFamilyAudit,
): Nhm2ObserverFamilyAudit => ({
  state: audit.state,
  wecMinOverAllTimelike: audit.wecMinOverAllTimelike,
  necMinOverAllNull: audit.necMinOverAllNull,
  decStatus: audit.decStatus,
  secStatus: audit.secStatus,
  observerWorstCaseLocation: audit.observerWorstCaseLocation,
  typeIFraction: audit.typeIFraction,
  missedViolationFraction: audit.missedViolationFraction,
  maxRobustMinusEulerian: audit.maxRobustMinusEulerian,
});

const computeTierListForSection = (
  sectionId: Nhm2FullLoopAuditSectionId,
): Nhm2FullLoopAuditClaimTier[] => [
  ...NHM2_FULL_LOOP_AUDIT_SECTION_TIER_MAP[sectionId],
];

const aggregateStates = (
  states: Nhm2FullLoopAuditState[],
): Nhm2FullLoopAuditState => {
  if (states.includes("fail")) return "fail";
  if (states.includes("unavailable")) return "unavailable";
  if (states.includes("review")) return "review";
  return "pass";
};

const computeTierReadiness = (
  tier: Nhm2FullLoopAuditClaimTier,
  sections: Nhm2FullLoopAuditSections,
): Nhm2FullLoopTierReadiness => {
  const requiredSections = [...NHM2_FULL_LOOP_AUDIT_TIER_SECTION_MAP[tier]];
  const sectionStates = requiredSections.map((sectionId) => sections[sectionId].state);
  const satisfiedSections = requiredSections.filter(
    (sectionId) => sections[sectionId].state === "pass",
  );
  const blockingReasons = orderReasonCodes(
    requiredSections.flatMap((sectionId) =>
      sections[sectionId].state === "pass" ? [] : sections[sectionId].reasons,
    ),
  );
  return {
    tier,
    state: aggregateStates(sectionStates),
    requiredSections,
    satisfiedSections,
    blockingReasons,
  };
};

const computeHighestPassingTier = (
  readiness: Record<Nhm2FullLoopAuditClaimTier, Nhm2FullLoopTierReadiness>,
): Nhm2FullLoopAuditClaimTier | null => {
  const reversedTiers = [...NHM2_FULL_LOOP_AUDIT_CLAIM_TIERS].reverse();
  return reversedTiers.find((tier) => readiness[tier].state === "pass") ?? null;
};

const computeBlockingReasons = (
  sections: Nhm2FullLoopAuditSections,
): Nhm2FullLoopAuditReasonCode[] =>
  orderReasonCodes(
    NHM2_FULL_LOOP_AUDIT_SECTION_ORDER.flatMap((sectionId) =>
      sections[sectionId].state === "pass" ? [] : sections[sectionId].reasons,
    ),
  );

const cloneSections = (
  sections: Nhm2FullLoopAuditSectionsInput,
): Nhm2FullLoopAuditSections => ({
  family_semantics: {
    ...sections.family_semantics,
    semanticBoundaries: [...sections.family_semantics.semanticBoundaries],
    nonClaims: [...sections.family_semantics.nonClaims],
    reasons: orderReasonCodes([...sections.family_semantics.reasons]),
    supportedClaimTiers: computeTierListForSection("family_semantics"),
    artifactRefs: cloneArtifactRefs(sections.family_semantics.artifactRefs),
  },
  claim_tier: {
    ...sections.claim_tier,
    reasons: orderReasonCodes([...sections.claim_tier.reasons]),
    surfaceStages: sections.claim_tier.surfaceStages.map((entry) => ({
      module: entry.module,
      stage: entry.stage,
    })),
    supportedClaimTiers: computeTierListForSection("claim_tier"),
    artifactRefs: cloneArtifactRefs(sections.claim_tier.artifactRefs),
  },
  lapse_provenance: {
    ...sections.lapse_provenance,
    reasons: orderReasonCodes([...sections.lapse_provenance.reasons]),
    supportedClaimTiers: computeTierListForSection("lapse_provenance"),
    artifactRefs: cloneArtifactRefs(sections.lapse_provenance.artifactRefs),
  },
  strict_signal_readiness: {
    ...sections.strict_signal_readiness,
    reasons: orderReasonCodes([...sections.strict_signal_readiness.reasons]),
    missingSignals: [...sections.strict_signal_readiness.missingSignals],
    supportedClaimTiers: computeTierListForSection("strict_signal_readiness"),
    artifactRefs: cloneArtifactRefs(sections.strict_signal_readiness.artifactRefs),
  },
  source_closure: {
    ...sections.source_closure,
    reasons: orderReasonCodes([...sections.source_closure.reasons]),
    residualByRegion: { ...sections.source_closure.residualByRegion },
    supportedClaimTiers: computeTierListForSection("source_closure"),
    artifactRefs: cloneArtifactRefs(sections.source_closure.artifactRefs),
  },
  observer_audit: {
    ...sections.observer_audit,
    reasons: orderReasonCodes([...sections.observer_audit.reasons]),
    metric: cloneObserverFamilyAudit(sections.observer_audit.metric),
    tile: cloneObserverFamilyAudit(sections.observer_audit.tile),
    supportedClaimTiers: computeTierListForSection("observer_audit"),
    artifactRefs: cloneArtifactRefs(sections.observer_audit.artifactRefs),
  },
  gr_stability_safety: {
    ...sections.gr_stability_safety,
    reasons: orderReasonCodes([...sections.gr_stability_safety.reasons]),
    perturbationFamilies: [...sections.gr_stability_safety.perturbationFamilies],
    supportedClaimTiers: computeTierListForSection("gr_stability_safety"),
    artifactRefs: cloneArtifactRefs(sections.gr_stability_safety.artifactRefs),
  },
  mission_time_outputs: {
    ...sections.mission_time_outputs,
    reasons: orderReasonCodes([...sections.mission_time_outputs.reasons]),
    supportedClaimTiers: computeTierListForSection("mission_time_outputs"),
    artifactRefs: cloneArtifactRefs(sections.mission_time_outputs.artifactRefs),
  },
  shift_vs_lapse_decomposition: {
    ...sections.shift_vs_lapse_decomposition,
    reasons: orderReasonCodes([...sections.shift_vs_lapse_decomposition.reasons]),
    supportedClaimTiers: computeTierListForSection("shift_vs_lapse_decomposition"),
    artifactRefs: cloneArtifactRefs(
      sections.shift_vs_lapse_decomposition.artifactRefs,
    ),
  },
  uncertainty_perturbation_reproducibility: {
    ...sections.uncertainty_perturbation_reproducibility,
    reasons: orderReasonCodes([
      ...sections.uncertainty_perturbation_reproducibility.reasons,
    ]),
    supportedClaimTiers: computeTierListForSection(
      "uncertainty_perturbation_reproducibility",
    ),
    artifactRefs: cloneArtifactRefs(
      sections.uncertainty_perturbation_reproducibility.artifactRefs,
    ),
  },
  certificate_policy_result: {
    ...sections.certificate_policy_result,
    reasons: orderReasonCodes([...sections.certificate_policy_result.reasons]),
    supportedClaimTiers: computeTierListForSection("certificate_policy_result"),
    artifactRefs: cloneArtifactRefs(
      sections.certificate_policy_result.artifactRefs,
    ),
  },
});

export const buildNhm2FullLoopAuditContract = (args: {
  generatedAt: string;
  sections: Nhm2FullLoopAuditSectionsInput;
}): Nhm2FullLoopAuditContractV1 | null => {
  if (asText(args.generatedAt) == null) return null;
  const sections = cloneSections(args.sections);
  const claimTierReadiness = {
    diagnostic: computeTierReadiness("diagnostic", sections),
    "reduced-order": computeTierReadiness("reduced-order", sections),
    certified: computeTierReadiness("certified", sections),
  };
  return {
    contractVersion: NHM2_FULL_LOOP_AUDIT_CONTRACT_VERSION,
    auditId: NHM2_FULL_LOOP_AUDIT_ID,
    laneId: NHM2_FULL_LOOP_AUDIT_LANE_ID,
    generatedAt: args.generatedAt,
    sectionOrder: [...NHM2_FULL_LOOP_AUDIT_SECTION_ORDER],
    sections,
    claimTierSectionMap: {
      diagnostic: [...NHM2_FULL_LOOP_AUDIT_TIER_SECTION_MAP.diagnostic],
      "reduced-order": [
        ...NHM2_FULL_LOOP_AUDIT_TIER_SECTION_MAP["reduced-order"],
      ],
      certified: [...NHM2_FULL_LOOP_AUDIT_TIER_SECTION_MAP.certified],
    },
    claimTierReadiness,
    currentClaimTier: sections.claim_tier.currentTier,
    maximumClaimTier: sections.claim_tier.maximumClaimTier,
    highestPassingClaimTier: computeHighestPassingTier(claimTierReadiness),
    overallState: aggregateStates(
      NHM2_FULL_LOOP_AUDIT_SECTION_ORDER.map(
        (sectionId) => sections[sectionId].state,
      ),
    ),
    blockingReasons: computeBlockingReasons(sections),
  };
};

const isArtifactRef = (
  value: unknown,
): value is Nhm2FullLoopAuditArtifactRef => {
  const record = asRecord(value);
  return (
    asText(record.artifactId) != null &&
    asText(record.path) != null &&
    (record.contractVersion === null || asText(record.contractVersion) != null) &&
    (record.status === null || asText(record.status) != null)
  );
};

const isObserverFamilyAudit = (
  value: unknown,
): value is Nhm2ObserverFamilyAudit => {
  const record = asRecord(value);
  return (
    isAuditState(record.state) &&
    isNullableFiniteNumber(record.wecMinOverAllTimelike) &&
    isNullableFiniteNumber(record.necMinOverAllNull) &&
    (record.decStatus === null || asText(record.decStatus) != null) &&
    (record.secStatus === null || asText(record.secStatus) != null) &&
    (record.observerWorstCaseLocation === null ||
      asText(record.observerWorstCaseLocation) != null) &&
    isNullableFiniteNumber(record.typeIFraction) &&
    isNullableFiniteNumber(record.missedViolationFraction) &&
    isNullableFiniteNumber(record.maxRobustMinusEulerian)
  );
};

const hasValidSectionBase = (
  value: unknown,
  sectionId: Nhm2FullLoopAuditSectionId,
): boolean => {
  const record = asRecord(value);
  return (
    record.sectionId === sectionId &&
    isAuditState(record.state) &&
    isReasonCodeArray(record.reasons) &&
    isClaimTierArray(
      record.supportedClaimTiers,
      NHM2_FULL_LOOP_AUDIT_SECTION_TIER_MAP[sectionId],
    ) &&
    Array.isArray(record.artifactRefs) &&
    record.artifactRefs.every((entry) => isArtifactRef(entry))
  );
};

const isFamilySemanticsSection = (
  value: unknown,
): value is Nhm2FamilySemanticsSection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "family_semantics") &&
    asText(record.familyId) != null &&
    asText(record.baseFamily) != null &&
    typeof record.lapseExtension === "boolean" &&
    (record.selectedProfileId === null || asText(record.selectedProfileId) != null) &&
    isStringArray(record.semanticBoundaries) &&
    isStringArray(record.nonClaims)
  );
};

const isClaimTierSurfaceStage = (
  value: unknown,
): value is Nhm2ClaimTierSurfaceStage => {
  const record = asRecord(value);
  return asText(record.module) != null && isClaimTier(record.stage);
};

const isClaimTierSection = (
  value: unknown,
): value is Nhm2ClaimTierSection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "claim_tier") &&
    isClaimTier(record.currentTier) &&
    isClaimTier(record.maximumClaimTier) &&
    (record.viabilityStatus === "ADMISSIBLE" ||
      record.viabilityStatus === "MARGINAL" ||
      record.viabilityStatus === "INADMISSIBLE" ||
      record.viabilityStatus === "UNKNOWN") &&
    (record.promotionReason === null || isReasonCode(record.promotionReason)) &&
    Array.isArray(record.surfaceStages) &&
    record.surfaceStages.every((entry) => isClaimTierSurfaceStage(entry))
  );
};

const isLapseProvenanceSection = (
  value: unknown,
): value is Nhm2LapseProvenanceSection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "lapse_provenance") &&
    (record.metricFamily === null || asText(record.metricFamily) != null) &&
    (record.shiftLapseProfileId === null ||
      asText(record.shiftLapseProfileId) != null) &&
    (record.shiftLapseProfileStage === null ||
      asText(record.shiftLapseProfileStage) != null) &&
    (record.familyAuthorityStatus === null ||
      asText(record.familyAuthorityStatus) != null) &&
    (record.transportCertificationStatus === null ||
      asText(record.transportCertificationStatus) != null) &&
    (record.metricT00ContractStatus === null ||
      asText(record.metricT00ContractStatus) != null) &&
    (record.chartContractStatus === null ||
      asText(record.chartContractStatus) != null)
  );
};

const isStrictSignalReadinessSection = (
  value: unknown,
): value is Nhm2StrictSignalReadinessSection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "strict_signal_readiness") &&
    typeof record.strictModeEnabled === "boolean" &&
    isNullableBoolean(record.thetaMetricDerived) &&
    isNullableBoolean(record.tsMetricDerived) &&
    isNullableBoolean(record.qiMetricDerived) &&
    (record.qiApplicabilityStatus === null ||
      asText(record.qiApplicabilityStatus) != null) &&
    Array.isArray(record.missingSignals) &&
    record.missingSignals.every(
      (entry) => entry === "theta" || entry === "ts" || entry === "qi",
    )
  );
};

const isSourceClosureSection = (
  value: unknown,
): value is Nhm2SourceClosureSection => {
  const record = asRecord(value);
  const residualByRegion = asRecord(record.residualByRegion);
  return (
    hasValidSectionBase(record, "source_closure") &&
    (record.metricTensorRef === null || asText(record.metricTensorRef) != null) &&
    (record.tileEffectiveTensorRef === null ||
      asText(record.tileEffectiveTensorRef) != null) &&
    isNullableFiniteNumber(record.residualRms) &&
    isNullableFiniteNumber(record.residualMax) &&
    isNullableFiniteNumber(residualByRegion.hull) &&
    isNullableFiniteNumber(residualByRegion.wall) &&
    isNullableFiniteNumber(residualByRegion.exteriorShell) &&
    (record.toleranceRef === null || asText(record.toleranceRef) != null) &&
    isNullableBoolean(record.assumptionsDrifted)
  );
};

const isObserverAuditSection = (
  value: unknown,
): value is Nhm2ObserverAuditSection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "observer_audit") &&
    isObserverFamilyAudit(record.metric) &&
    isObserverFamilyAudit(record.tile)
  );
};

const isGrStabilitySafetySection = (
  value: unknown,
): value is Nhm2GrStabilitySafetySection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "gr_stability_safety") &&
    (record.solverHealth === null || asText(record.solverHealth) != null) &&
    isStringArray(record.perturbationFamilies) &&
    isNullableFiniteNumber(record.H_rms) &&
    isNullableFiniteNumber(record.M_rms) &&
    isNullableFiniteNumber(record.H_maxAbs) &&
    isNullableFiniteNumber(record.M_maxAbs) &&
    isNullableFiniteNumber(record.centerlineProperAcceleration_mps2) &&
    isNullableFiniteNumber(record.wallNormalSafetyMargin) &&
    isNullableFiniteNumber(record.blueshiftMax) &&
    (record.stabilityWorstCase === null ||
      asText(record.stabilityWorstCase) != null) &&
    (record.safetyWorstCaseLocation === null ||
      asText(record.safetyWorstCaseLocation) != null)
  );
};

const isMissionTimeOutputsSection = (
  value: unknown,
): value is Nhm2MissionTimeOutputsSection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "mission_time_outputs") &&
    (record.worldlineStatus === null || asText(record.worldlineStatus) != null) &&
    (record.routeTimeStatus === null || asText(record.routeTimeStatus) != null) &&
    (record.missionTimeEstimatorStatus === null ||
      asText(record.missionTimeEstimatorStatus) != null) &&
    (record.missionTimeComparisonStatus === null ||
      asText(record.missionTimeComparisonStatus) != null) &&
    (record.targetId === null || asText(record.targetId) != null) &&
    isNullableFiniteNumber(record.coordinateTimeEstimateSeconds) &&
    isNullableFiniteNumber(record.properTimeEstimateSeconds) &&
    isNullableFiniteNumber(record.properMinusCoordinateSeconds) &&
    (record.comparatorId === null || asText(record.comparatorId) != null)
  );
};

const isShiftVsLapseDecompositionSection = (
  value: unknown,
): value is Nhm2ShiftVsLapseDecompositionSection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "shift_vs_lapse_decomposition") &&
    isNullableFiniteNumber(record.shiftDrivenContribution) &&
    isNullableFiniteNumber(record.lapseDrivenContribution) &&
    isNullableFiniteNumber(record.expansionLeakageBound) &&
    (record.thetaFlatnessStatus === null ||
      asText(record.thetaFlatnessStatus) != null) &&
    (record.divBetaFlatnessStatus === null ||
      asText(record.divBetaFlatnessStatus) != null) &&
    (record.natarioBaselineComparisonRef === null ||
      asText(record.natarioBaselineComparisonRef) != null)
  );
};

const isUncertaintyPerturbationReproducibilitySection = (
  value: unknown,
): value is Nhm2UncertaintyPerturbationReproducibilitySection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "uncertainty_perturbation_reproducibility") &&
    (record.precisionAgreementStatus === null ||
      asText(record.precisionAgreementStatus) != null) &&
    isNullableFiniteNumber(record.meshConvergenceOrder) &&
    isNullableFiniteNumber(record.boundaryConditionSensitivity) &&
    isNullableFiniteNumber(record.smoothingKernelSensitivity) &&
    (record.coldStartReproductionStatus === null ||
      asText(record.coldStartReproductionStatus) != null) &&
    (record.independentReproductionStatus === null ||
      asText(record.independentReproductionStatus) != null) &&
    (record.artifactHashConsistencyStatus === null ||
      asText(record.artifactHashConsistencyStatus) != null)
  );
};

const isCertificatePolicyResultSection = (
  value: unknown,
): value is Nhm2CertificatePolicyResultSection => {
  const record = asRecord(value);
  return (
    hasValidSectionBase(record, "certificate_policy_result") &&
    (record.viabilityStatus === "ADMISSIBLE" ||
      record.viabilityStatus === "MARGINAL" ||
      record.viabilityStatus === "INADMISSIBLE" ||
      record.viabilityStatus === "UNKNOWN") &&
    isNullableBoolean(record.hardConstraintPass) &&
    (record.firstHardFailureId === null ||
      asText(record.firstHardFailureId) != null) &&
    (record.certificateStatus === null || asText(record.certificateStatus) != null) &&
    (record.certificateHash === null || asText(record.certificateHash) != null) &&
    (record.certificateIntegrity === "ok" ||
      record.certificateIntegrity === "fail" ||
      record.certificateIntegrity === "unavailable") &&
    (record.promotionTier === null || isClaimTier(record.promotionTier)) &&
    (record.promotionReason === null || isReasonCode(record.promotionReason))
  );
};

const isTierReadiness = (
  value: unknown,
  tier: Nhm2FullLoopAuditClaimTier,
  sections: Nhm2FullLoopAuditSections,
): value is Nhm2FullLoopTierReadiness => {
  const record = asRecord(value);
  const expected = computeTierReadiness(tier, sections);
  return (
    record.tier === tier &&
    record.state === expected.state &&
    isSectionIdArray(record.requiredSections, expected.requiredSections) &&
    isSectionIdArray(record.satisfiedSections, expected.satisfiedSections) &&
    isReasonCodeArray(record.blockingReasons) &&
    expected.blockingReasons.length === (record.blockingReasons as unknown[]).length &&
    expected.blockingReasons.every(
      (entry, index) => (record.blockingReasons as unknown[])[index] === entry,
    )
  );
};

export const isNhm2FullLoopAuditContract = (
  value: unknown,
): value is Nhm2FullLoopAuditContractV1 => {
  const record = asRecord(value);
  if (record.contractVersion !== NHM2_FULL_LOOP_AUDIT_CONTRACT_VERSION) return false;
  if (record.auditId !== NHM2_FULL_LOOP_AUDIT_ID) return false;
  if (record.laneId !== NHM2_FULL_LOOP_AUDIT_LANE_ID) return false;
  if (asText(record.generatedAt) == null) return false;
  if (
    !isSectionIdArray(
      record.sectionOrder,
      [...NHM2_FULL_LOOP_AUDIT_SECTION_ORDER],
    )
  ) {
    return false;
  }

  const sectionsRecord = asRecord(record.sections);
  const sections: Nhm2FullLoopAuditSections = {
    family_semantics: sectionsRecord.family_semantics as Nhm2FamilySemanticsSection,
    claim_tier: sectionsRecord.claim_tier as Nhm2ClaimTierSection,
    lapse_provenance: sectionsRecord.lapse_provenance as Nhm2LapseProvenanceSection,
    strict_signal_readiness:
      sectionsRecord.strict_signal_readiness as Nhm2StrictSignalReadinessSection,
    source_closure: sectionsRecord.source_closure as Nhm2SourceClosureSection,
    observer_audit: sectionsRecord.observer_audit as Nhm2ObserverAuditSection,
    gr_stability_safety:
      sectionsRecord.gr_stability_safety as Nhm2GrStabilitySafetySection,
    mission_time_outputs:
      sectionsRecord.mission_time_outputs as Nhm2MissionTimeOutputsSection,
    shift_vs_lapse_decomposition:
      sectionsRecord.shift_vs_lapse_decomposition as Nhm2ShiftVsLapseDecompositionSection,
    uncertainty_perturbation_reproducibility:
      sectionsRecord.uncertainty_perturbation_reproducibility as Nhm2UncertaintyPerturbationReproducibilitySection,
    certificate_policy_result:
      sectionsRecord.certificate_policy_result as Nhm2CertificatePolicyResultSection,
  };

  if (
    !isFamilySemanticsSection(sections.family_semantics) ||
    !isClaimTierSection(sections.claim_tier) ||
    !isLapseProvenanceSection(sections.lapse_provenance) ||
    !isStrictSignalReadinessSection(sections.strict_signal_readiness) ||
    !isSourceClosureSection(sections.source_closure) ||
    !isObserverAuditSection(sections.observer_audit) ||
    !isGrStabilitySafetySection(sections.gr_stability_safety) ||
    !isMissionTimeOutputsSection(sections.mission_time_outputs) ||
    !isShiftVsLapseDecompositionSection(sections.shift_vs_lapse_decomposition) ||
    !isUncertaintyPerturbationReproducibilitySection(
      sections.uncertainty_perturbation_reproducibility,
    ) ||
    !isCertificatePolicyResultSection(sections.certificate_policy_result)
  ) {
    return false;
  }

  const claimTierSectionMap = asRecord(record.claimTierSectionMap);
  if (
    !isSectionIdArray(
      claimTierSectionMap.diagnostic,
      NHM2_FULL_LOOP_AUDIT_TIER_SECTION_MAP.diagnostic,
    ) ||
    !isSectionIdArray(
      claimTierSectionMap["reduced-order"],
      NHM2_FULL_LOOP_AUDIT_TIER_SECTION_MAP["reduced-order"],
    ) ||
    !isSectionIdArray(
      claimTierSectionMap.certified,
      NHM2_FULL_LOOP_AUDIT_TIER_SECTION_MAP.certified,
    )
  ) {
    return false;
  }

  const claimTierReadiness = asRecord(record.claimTierReadiness);
  if (
    !isTierReadiness(claimTierReadiness.diagnostic, "diagnostic", sections) ||
    !isTierReadiness(
      claimTierReadiness["reduced-order"],
      "reduced-order",
      sections,
    ) ||
    !isTierReadiness(claimTierReadiness.certified, "certified", sections)
  ) {
    return false;
  }

  if (record.currentClaimTier !== sections.claim_tier.currentTier) return false;
  if (record.maximumClaimTier !== sections.claim_tier.maximumClaimTier) return false;

  const expectedReadiness = {
    diagnostic: computeTierReadiness("diagnostic", sections),
    "reduced-order": computeTierReadiness("reduced-order", sections),
    certified: computeTierReadiness("certified", sections),
  };
  if (
    record.highestPassingClaimTier !==
    computeHighestPassingTier(expectedReadiness)
  ) {
    return false;
  }
  const expectedOverallState = aggregateStates(
    NHM2_FULL_LOOP_AUDIT_SECTION_ORDER.map(
      (sectionId) => sections[sectionId].state,
    ),
  );
  if (record.overallState !== expectedOverallState) return false;

  const expectedBlockingReasons = computeBlockingReasons(sections);
  if (
    !isReasonCodeArray(record.blockingReasons) ||
    record.blockingReasons.length !== expectedBlockingReasons.length ||
    expectedBlockingReasons.some(
      (entry, index) => record.blockingReasons[index] !== entry,
    )
  ) {
    return false;
  }
  return true;
};
