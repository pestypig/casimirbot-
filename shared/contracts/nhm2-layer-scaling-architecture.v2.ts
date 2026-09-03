export const NHM2_LAYER_SCALING_ARCHITECTURE_CONTRACT_VERSION =
  "nhm2_layer_scaling_architecture/v2";

export const NHM2_LAYER_SCALING_ARCHITECTURE_FAILURE_PRECEDENCE = [
  "blocked_missing_receipt",
  "blocked_mutable_alias",
  "blocked_fallback_authority",
  "blocked_target_calibrated_authority",
  "blocked_metric_echo",
  "blocked_profile_stale",
  "blocked_state_stale",
  "blocked_geometry_stale",
  "blocked_degenerate_metric_demand",
  "blocked_sample_count_unbound",
  "no_compatible_interval",
] as const;

export type Nhm2LayerScalingArchitectureFailureV2 =
  (typeof NHM2_LAYER_SCALING_ARCHITECTURE_FAILURE_PRECEDENCE)[number];

export type Nhm2LayerScalingArchitectureStatusV2 =
  Nhm2LayerScalingArchitectureFailureV2 | "architecture_reference_bound";

export type Nhm2LayerScalingStateClassV2 =
  | "static_unmodulated"
  | "instantaneous_driven"
  | "cycle_averaged_driven"
  | "differential_A_minus_B";

export type Nhm2LayerScalingEvidenceAuthorityModeV2 =
  | "MODEL_DERIVED"
  | "MEASURED_FORCE_INFERRED"
  | "WHITEPAPER_FALLBACK"
  | "TARGET_CALIBRATED";

export type Nhm2LayerScalingVolumeConventionV2 =
  "fixed_control_volume" | "expanded_wall_volume";

export type Nhm2LayerScalingEvidenceRefV2 = {
  artifactRef: string;
  sha256: string;
  producerId: string;
  authenticated: boolean;
  authorityMode: Nhm2LayerScalingEvidenceAuthorityModeV2;
  lineage: {
    profileSha256: string;
    stateId: string | null;
    geometryId: string;
  };
};

export type Nhm2LayerScalingComparisonFrameV2 = {
  profileId: string;
  profileSha256: string;
  chartId: string;
  basisId: string;
  normalizationId: string;
  atlasId: string;
  volumeConvention: Nhm2LayerScalingVolumeConventionV2;
};

export type Nhm2LayerScalingLayerIntervalV2 = {
  minInclusive: number;
  maxInclusive: number;
  receipt: Nhm2LayerScalingEvidenceRefV2;
};

export type Nhm2LayerScalingArchitectureInputV2 = {
  generatedAt: string;
  proposedArchitectureId: string | null;
  comparisonFrame: {
    metricRequired: Nhm2LayerScalingComparisonFrameV2;
    sourceRealized: Nhm2LayerScalingComparisonFrameV2;
  };
  tensorBindings: {
    metricRequired: Nhm2LayerScalingEvidenceRefV2 | null;
    sourceRealized: Nhm2LayerScalingEvidenceRefV2 | null;
  };
  sourceState: {
    stateId: string;
    stateClass: Nhm2LayerScalingStateClassV2;
    stateDefinitionRef: Nhm2LayerScalingEvidenceRefV2 | null;
    driveModelRef: Nhm2LayerScalingEvidenceRefV2 | null;
    averagingWindowRef: Nhm2LayerScalingEvidenceRefV2 | null;
    stateARef: Nhm2LayerScalingEvidenceRefV2 | null;
    stateBRef: Nhm2LayerScalingEvidenceRefV2 | null;
    qAsStaticEnergyMultiplier: boolean;
  };
  geometry: {
    geometryId: string;
    volumeConvention: Nhm2LayerScalingVolumeConventionV2;
    geometricLayerCount: number | null;
  };
  layerIntervals: {
    scalarEquivalentLayerInterval: Nhm2LayerScalingLayerIntervalV2 | null;
    measuredEffectiveLayerInterval: Nhm2LayerScalingLayerIntervalV2 | null;
    tensorClosureLayerInterval: Nhm2LayerScalingLayerIntervalV2 | null;
    mechanicallyAdmissibleLayerInterval: Nhm2LayerScalingLayerIntervalV2 | null;
    sourceRetentionInterval: Nhm2LayerScalingLayerIntervalV2 | null;
  };
  regionalSampling: {
    regionalTensorSampleCountMin: number | null;
    derivedFrom: "convergence_and_uncertainty" | "geometric_layer_count" | null;
    coupledToGeometricLayerCount: boolean;
    convergenceReceipt: Nhm2LayerScalingEvidenceRefV2 | null;
  };
  apparatusBindings: {
    materialResponseRef: Nhm2LayerScalingEvidenceRefV2 | null;
    packingOrientationRef: Nhm2LayerScalingEvidenceRefV2 | null;
    couplingRef: Nhm2LayerScalingEvidenceRefV2 | null;
    activeAreaRetentionRef: Nhm2LayerScalingEvidenceRefV2 | null;
    supportControlEnergyRef: Nhm2LayerScalingEvidenceRefV2 | null;
    uncertaintyPolicyRef: Nhm2LayerScalingEvidenceRefV2 | null;
  };
  metricDemand: {
    nondegeneracyStatus: "nondegenerate" | "degenerate" | "not_evaluated";
    signedProperVolumeIntegralRef: Nhm2LayerScalingEvidenceRefV2 | null;
  };
  massMode: "MODEL_DERIVED" | "MEASURED_FORCE_INFERRED" | "TARGET_CALIBRATED";
};

export type Nhm2LayerScalingArchitectureV2 =
  Nhm2LayerScalingArchitectureInputV2 & {
    contractVersion: typeof NHM2_LAYER_SCALING_ARCHITECTURE_CONTRACT_VERSION;
    decision: {
      status: Nhm2LayerScalingArchitectureStatusV2;
      firstFailure: Nhm2LayerScalingArchitectureFailureV2 | null;
      blockers: Nhm2LayerScalingArchitectureFailureV2[];
      compatibleLayerInterval: {
        minInclusive: number;
        maxInclusive: number;
      } | null;
      selectedArchitectureId: string | null;
    };
    migrationBoundary: {
      v1EvidencePreserved: true;
      legacy447MayAuthorizeV2: false;
      architectureRefRequiredForV2Consumers: true;
      regionalSampleCountIndependentOfLayerCount: true;
    };
    claimBoundary: {
      diagnosticOnly: true;
      contractBindingIsNotPhysicalValidation: true;
      architectureSelectionAuthority: false;
      proposalReady: false;
      experimentAuthority: false;
      bmrIEligible: false;
      g3Eligible: false;
      physicalViabilityClaimAllowed: false;
      propulsionClaimAllowed: false;
      transportClaimAllowed: false;
    };
  };

const SHA256_RE = /^[a-f0-9]{64}$/;
const MUTABLE_LATEST_RE = /(^|[/\\:._-])latest([/\\:._-]|$)/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isStateClass = (value: unknown): value is Nhm2LayerScalingStateClassV2 =>
  value === "static_unmodulated" ||
  value === "instantaneous_driven" ||
  value === "cycle_averaged_driven" ||
  value === "differential_A_minus_B";

const isVolumeConvention = (
  value: unknown,
): value is Nhm2LayerScalingVolumeConventionV2 =>
  value === "fixed_control_volume" || value === "expanded_wall_volume";

const isComparisonFrame = (
  value: unknown,
): value is Nhm2LayerScalingComparisonFrameV2 => {
  const frame = isRecord(value) ? value : null;
  return (
    frame != null &&
    isText(frame.profileId) &&
    typeof frame.profileSha256 === "string" &&
    SHA256_RE.test(frame.profileSha256) &&
    isText(frame.chartId) &&
    isText(frame.basisId) &&
    isText(frame.normalizationId) &&
    isText(frame.atlasId) &&
    isVolumeConvention(frame.volumeConvention)
  );
};

const isEvidenceRef = (
  value: unknown,
): value is Nhm2LayerScalingEvidenceRefV2 => {
  const record = isRecord(value) ? value : null;
  const lineage = isRecord(record?.lineage) ? record.lineage : null;
  return (
    record != null &&
    isText(record.artifactRef) &&
    typeof record.sha256 === "string" &&
    SHA256_RE.test(record.sha256) &&
    isText(record.producerId) &&
    typeof record.authenticated === "boolean" &&
    (record.authorityMode === "MODEL_DERIVED" ||
      record.authorityMode === "MEASURED_FORCE_INFERRED" ||
      record.authorityMode === "WHITEPAPER_FALLBACK" ||
      record.authorityMode === "TARGET_CALIBRATED") &&
    lineage != null &&
    typeof lineage.profileSha256 === "string" &&
    SHA256_RE.test(lineage.profileSha256) &&
    (lineage.stateId === null || isText(lineage.stateId)) &&
    isText(lineage.geometryId)
  );
};

const intervalIsWellFormed = (
  value: Nhm2LayerScalingLayerIntervalV2 | null | undefined,
): value is Nhm2LayerScalingLayerIntervalV2 =>
  value != null &&
  isPositiveInteger(value.minInclusive) &&
  isPositiveInteger(value.maxInclusive) &&
  value.minInclusive <= value.maxInclusive &&
  isEvidenceRef(value.receipt);

const refsForStateClass = (
  state: Nhm2LayerScalingArchitectureInputV2["sourceState"],
): Array<Nhm2LayerScalingEvidenceRefV2 | null> => {
  if (state.stateClass === "instantaneous_driven") {
    return [state.driveModelRef];
  }
  if (state.stateClass === "cycle_averaged_driven") {
    return [state.driveModelRef, state.averagingWindowRef];
  }
  if (state.stateClass === "differential_A_minus_B") {
    return [state.stateARef, state.stateBRef];
  }
  return [];
};

const intervalValues = (
  input: Nhm2LayerScalingArchitectureInputV2,
): Array<Nhm2LayerScalingLayerIntervalV2 | null> => [
  input.layerIntervals.scalarEquivalentLayerInterval,
  input.layerIntervals.measuredEffectiveLayerInterval,
  input.layerIntervals.tensorClosureLayerInterval,
  input.layerIntervals.mechanicallyAdmissibleLayerInterval,
  input.layerIntervals.sourceRetentionInterval,
];

const allSuppliedSourceEvidenceRefs = (
  input: Nhm2LayerScalingArchitectureInputV2,
): Array<Nhm2LayerScalingEvidenceRefV2 | null> => [
  input.tensorBindings.sourceRealized,
  input.sourceState.stateDefinitionRef,
  input.sourceState.driveModelRef,
  input.sourceState.averagingWindowRef,
  input.sourceState.stateARef,
  input.sourceState.stateBRef,
  ...intervalValues(input).map((interval) => interval?.receipt ?? null),
  input.regionalSampling.convergenceReceipt,
  input.apparatusBindings.materialResponseRef,
  input.apparatusBindings.packingOrientationRef,
  input.apparatusBindings.couplingRef,
  input.apparatusBindings.activeAreaRetentionRef,
  input.apparatusBindings.supportControlEnergyRef,
  input.apparatusBindings.uncertaintyPolicyRef,
];

const metricEvidenceRefs = (
  input: Nhm2LayerScalingArchitectureInputV2,
): Array<Nhm2LayerScalingEvidenceRefV2 | null> => [
  input.tensorBindings.metricRequired,
  input.metricDemand.signedProperVolumeIntegralRef,
];

const requiredSourceEvidenceRefs = (
  input: Nhm2LayerScalingArchitectureInputV2,
): Array<Nhm2LayerScalingEvidenceRefV2 | null> => [
  input.tensorBindings.sourceRealized,
  input.sourceState.stateDefinitionRef,
  ...refsForStateClass(input.sourceState),
  ...intervalValues(input).map((interval) => interval?.receipt ?? null),
  input.regionalSampling.convergenceReceipt,
  input.apparatusBindings.materialResponseRef,
  input.apparatusBindings.packingOrientationRef,
  input.apparatusBindings.couplingRef,
  input.apparatusBindings.activeAreaRetentionRef,
  input.apparatusBindings.supportControlEnergyRef,
  input.apparatusBindings.uncertaintyPolicyRef,
];

const allRequiredEvidenceRefs = (
  input: Nhm2LayerScalingArchitectureInputV2,
): Array<Nhm2LayerScalingEvidenceRefV2 | null> => [
  ...metricEvidenceRefs(input),
  ...requiredSourceEvidenceRefs(input),
];

const allSuppliedEvidenceRefs = (
  input: Nhm2LayerScalingArchitectureInputV2,
): Array<Nhm2LayerScalingEvidenceRefV2 | null> => [
  ...metricEvidenceRefs(input),
  ...allSuppliedSourceEvidenceRefs(input),
];

const framesMatch = (
  left: Nhm2LayerScalingComparisonFrameV2,
  right: Nhm2LayerScalingComparisonFrameV2,
): boolean =>
  left.profileId === right.profileId &&
  left.profileSha256 === right.profileSha256 &&
  left.chartId === right.chartId &&
  left.basisId === right.basisId &&
  left.normalizationId === right.normalizationId &&
  left.atlasId === right.atlasId &&
  left.volumeConvention === right.volumeConvention;

const compatibleInterval = (
  input: Nhm2LayerScalingArchitectureInputV2,
): { minInclusive: number; maxInclusive: number } | null => {
  const intervals = intervalValues(input);
  if (!intervals.every(intervalIsWellFormed)) return null;
  const minInclusive = Math.max(
    ...intervals.map((interval) => interval.minInclusive),
  );
  const maxInclusive = Math.min(
    ...intervals.map((interval) => interval.maxInclusive),
  );
  if (minInclusive > maxInclusive) return null;
  if (
    !isPositiveInteger(input.geometry.geometricLayerCount) ||
    input.geometry.geometricLayerCount < minInclusive ||
    input.geometry.geometricLayerCount > maxInclusive
  ) {
    return null;
  }
  return { minInclusive, maxInclusive };
};

const hasMissingReceipt = (
  input: Nhm2LayerScalingArchitectureInputV2,
): boolean =>
  !isText(input.generatedAt) ||
  !isText(input.proposedArchitectureId) ||
  !isComparisonFrame(input.comparisonFrame.metricRequired) ||
  !isComparisonFrame(input.comparisonFrame.sourceRealized) ||
  !isText(input.sourceState.stateId) ||
  !isStateClass(input.sourceState.stateClass) ||
  typeof input.sourceState.qAsStaticEnergyMultiplier !== "boolean" ||
  !isText(input.geometry.geometryId) ||
  !isVolumeConvention(input.geometry.volumeConvention) ||
  !isPositiveInteger(input.geometry.geometricLayerCount) ||
  !intervalValues(input).every(intervalIsWellFormed) ||
  !isPositiveInteger(input.regionalSampling.regionalTensorSampleCountMin) ||
  (input.regionalSampling.derivedFrom !== "convergence_and_uncertainty" &&
    input.regionalSampling.derivedFrom !== "geometric_layer_count") ||
  typeof input.regionalSampling.coupledToGeometricLayerCount !== "boolean" ||
  (input.metricDemand.nondegeneracyStatus !== "nondegenerate" &&
    input.metricDemand.nondegeneracyStatus !== "degenerate" &&
    input.metricDemand.nondegeneracyStatus !== "not_evaluated") ||
  (input.massMode !== "MODEL_DERIVED" &&
    input.massMode !== "MEASURED_FORCE_INFERRED" &&
    input.massMode !== "TARGET_CALIBRATED") ||
  allRequiredEvidenceRefs(input).some(
    (ref) => !isEvidenceRef(ref) || ref.authenticated !== true,
  ) ||
  allSuppliedEvidenceRefs(input).some(
    (ref) => ref != null && !isEvidenceRef(ref),
  );

const hasMutableAlias = (input: Nhm2LayerScalingArchitectureInputV2): boolean =>
  allSuppliedEvidenceRefs(input).some(
    (ref) => isEvidenceRef(ref) && MUTABLE_LATEST_RE.test(ref.artifactRef),
  );

const hasAuthorityMode = (
  input: Nhm2LayerScalingArchitectureInputV2,
  mode: Nhm2LayerScalingEvidenceAuthorityModeV2,
): boolean =>
  allSuppliedEvidenceRefs(input).some(
    (ref) => isEvidenceRef(ref) && ref.authorityMode === mode,
  );

const hasMetricEcho = (input: Nhm2LayerScalingArchitectureInputV2): boolean => {
  const metric = input.tensorBindings.metricRequired;
  const source = input.tensorBindings.sourceRealized;
  if (!isEvidenceRef(metric) || !isEvidenceRef(source)) return false;
  return (
    metric.artifactRef === source.artifactRef ||
    metric.sha256 === source.sha256 ||
    metric.producerId === source.producerId
  );
};

const hasProfileStaleness = (
  input: Nhm2LayerScalingArchitectureInputV2,
): boolean => {
  const metricFrame = input.comparisonFrame.metricRequired;
  const sourceFrame = input.comparisonFrame.sourceRealized;
  if (!framesMatch(metricFrame, sourceFrame)) return true;
  return (
    metricEvidenceRefs(input).some(
      (ref) =>
        isEvidenceRef(ref) &&
        ref.lineage.profileSha256 !== metricFrame.profileSha256,
    ) ||
    allSuppliedSourceEvidenceRefs(input).some(
      (ref) =>
        isEvidenceRef(ref) &&
        ref.lineage.profileSha256 !== sourceFrame.profileSha256,
    )
  );
};

const hasStateStaleness = (
  input: Nhm2LayerScalingArchitectureInputV2,
): boolean => {
  if (input.sourceState.qAsStaticEnergyMultiplier !== false) return true;
  if (
    allSuppliedSourceEvidenceRefs(input).some(
      (ref) =>
        isEvidenceRef(ref) && ref.lineage.stateId !== input.sourceState.stateId,
    )
  ) {
    return true;
  }
  return metricEvidenceRefs(input).some(
    (ref) => isEvidenceRef(ref) && ref.lineage.stateId !== null,
  );
};

const hasGeometryStaleness = (
  input: Nhm2LayerScalingArchitectureInputV2,
): boolean => {
  const metricFrame = input.comparisonFrame.metricRequired;
  const sourceFrame = input.comparisonFrame.sourceRealized;
  if (
    metricFrame.volumeConvention !== input.geometry.volumeConvention ||
    sourceFrame.volumeConvention !== input.geometry.volumeConvention
  ) {
    return true;
  }
  return allSuppliedEvidenceRefs(input).some(
    (ref) =>
      isEvidenceRef(ref) &&
      ref.lineage.geometryId !== input.geometry.geometryId,
  );
};

const sampleCountIsUnbound = (
  input: Nhm2LayerScalingArchitectureInputV2,
): boolean =>
  input.regionalSampling.derivedFrom !== "convergence_and_uncertainty" ||
  input.regionalSampling.coupledToGeometricLayerCount !== false ||
  !isPositiveInteger(input.regionalSampling.regionalTensorSampleCountMin) ||
  !isEvidenceRef(input.regionalSampling.convergenceReceipt);

const pushFailure = (
  blockers: Nhm2LayerScalingArchitectureFailureV2[],
  condition: boolean,
  failure: Nhm2LayerScalingArchitectureFailureV2,
): void => {
  if (condition) blockers.push(failure);
};

export const buildNhm2LayerScalingArchitectureV2 = (
  input: Nhm2LayerScalingArchitectureInputV2,
): Nhm2LayerScalingArchitectureV2 => {
  const blockers: Nhm2LayerScalingArchitectureFailureV2[] = [];
  const interval = compatibleInterval(input);

  pushFailure(blockers, hasMissingReceipt(input), "blocked_missing_receipt");
  pushFailure(blockers, hasMutableAlias(input), "blocked_mutable_alias");
  pushFailure(
    blockers,
    hasAuthorityMode(input, "WHITEPAPER_FALLBACK"),
    "blocked_fallback_authority",
  );
  pushFailure(
    blockers,
    input.massMode === "TARGET_CALIBRATED" ||
      hasAuthorityMode(input, "TARGET_CALIBRATED"),
    "blocked_target_calibrated_authority",
  );
  pushFailure(blockers, hasMetricEcho(input), "blocked_metric_echo");
  pushFailure(blockers, hasProfileStaleness(input), "blocked_profile_stale");
  pushFailure(blockers, hasStateStaleness(input), "blocked_state_stale");
  pushFailure(blockers, hasGeometryStaleness(input), "blocked_geometry_stale");
  pushFailure(
    blockers,
    input.metricDemand.nondegeneracyStatus !== "nondegenerate",
    "blocked_degenerate_metric_demand",
  );
  pushFailure(
    blockers,
    sampleCountIsUnbound(input),
    "blocked_sample_count_unbound",
  );
  pushFailure(blockers, interval == null, "no_compatible_interval");

  const firstFailure = blockers[0] ?? null;
  const status: Nhm2LayerScalingArchitectureStatusV2 =
    firstFailure ?? "architecture_reference_bound";

  return {
    contractVersion: NHM2_LAYER_SCALING_ARCHITECTURE_CONTRACT_VERSION,
    ...input,
    decision: {
      status,
      firstFailure,
      blockers,
      compatibleLayerInterval: interval,
      selectedArchitectureId:
        firstFailure == null ? input.proposedArchitectureId : null,
    },
    migrationBoundary: {
      v1EvidencePreserved: true,
      legacy447MayAuthorizeV2: false,
      architectureRefRequiredForV2Consumers: true,
      regionalSampleCountIndependentOfLayerCount: true,
    },
    claimBoundary: {
      diagnosticOnly: true,
      contractBindingIsNotPhysicalValidation: true,
      architectureSelectionAuthority: false,
      proposalReady: false,
      experimentAuthority: false,
      bmrIEligible: false,
      g3Eligible: false,
      physicalViabilityClaimAllowed: false,
      propulsionClaimAllowed: false,
      transportClaimAllowed: false,
    },
  };
};

export const isNhm2LayerScalingArchitectureV2 = (
  value: unknown,
): value is Nhm2LayerScalingArchitectureV2 => {
  if (!isRecord(value)) return false;
  if (
    value.contractVersion !== NHM2_LAYER_SCALING_ARCHITECTURE_CONTRACT_VERSION
  ) {
    return false;
  }
  const decision = isRecord(value.decision) ? value.decision : null;
  const migrationBoundary = isRecord(value.migrationBoundary)
    ? value.migrationBoundary
    : null;
  const claimBoundary = isRecord(value.claimBoundary)
    ? value.claimBoundary
    : null;
  if (
    decision == null ||
    migrationBoundary?.v1EvidencePreserved !== true ||
    migrationBoundary?.legacy447MayAuthorizeV2 !== false ||
    migrationBoundary?.architectureRefRequiredForV2Consumers !== true ||
    migrationBoundary?.regionalSampleCountIndependentOfLayerCount !== true ||
    claimBoundary?.diagnosticOnly !== true ||
    claimBoundary?.contractBindingIsNotPhysicalValidation !== true ||
    claimBoundary?.architectureSelectionAuthority !== false ||
    claimBoundary?.proposalReady !== false ||
    claimBoundary?.experimentAuthority !== false ||
    claimBoundary?.bmrIEligible !== false ||
    claimBoundary?.g3Eligible !== false ||
    claimBoundary?.physicalViabilityClaimAllowed !== false ||
    claimBoundary?.propulsionClaimAllowed !== false ||
    claimBoundary?.transportClaimAllowed !== false
  ) {
    return false;
  }

  try {
    const input = value as unknown as Nhm2LayerScalingArchitectureInputV2;
    const rebuilt = buildNhm2LayerScalingArchitectureV2(input);
    return JSON.stringify(rebuilt.decision) === JSON.stringify(decision);
  } catch {
    return false;
  }
};
