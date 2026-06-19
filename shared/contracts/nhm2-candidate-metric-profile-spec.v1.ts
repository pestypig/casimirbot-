import type {
  Nhm2CampaignProfileSearchArtifactV1,
  Nhm2CampaignProfileSearchCandidateV1,
} from "./nhm2-campaign-profile-search.v1";

export const NHM2_CANDIDATE_METRIC_PROFILE_SPEC_CONTRACT_VERSION =
  "nhm2_candidate_metric_profile_spec/v1";

export type Nhm2CandidateMetricProfileSpecExecutableGeometryStatusV1 =
  | "available"
  | "missing"
  | "blocked";

export type Nhm2CandidateMetricProfileSpecAdapterStatusV1 =
  | "available"
  | "partial_runtime_profile_only"
  | "missing"
  | "blocked";

export type Nhm2CandidateMetricProfileSpecV1 = {
  contractVersion: typeof NHM2_CANDIDATE_METRIC_PROFILE_SPEC_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  candidateProfileId: string;
  parentProfileId: string;
  alphaCenterline: number;
  subjectiveEfficiencyProxy: number;
  proposalKind: Nhm2CampaignProfileSearchCandidateV1["proposalKind"];
  sourceProfileSearchRef: string | null;
  profileDefinition: {
    lapseDepthScale: number;
    shiftAmplitudeScale: number;
    wallThicknessScale: number;
    smoothingWidthScale: number;
    transitionKernel: Nhm2CampaignProfileSearchCandidateV1["levers"]["transitionKernel"];
    projectedT0iSuppressionFactor: number;
    sourceTensorCopiedFromMetric: false;
    silentlyZeroesT0i: false;
    silentlyZeroesOffDiagonalTij: false;
    usesScalarT00Only: false;
  };
  tripClockingDiagnostic: {
    properTimeRatio: number;
    subjectiveEfficiencyProxy: number;
    formula: "tau = alpha_centerline * T_coordinate";
    coordinateTimeSeconds: number | null;
    shipProperTimeSeconds: number | null;
    clockSavingSeconds: number | null;
    routeEtaCertified: false;
  };
  executableGeometry: {
    runtimeProfileId: string | null;
    runtimeProfileRef: string | null;
    runtimeProfileRegistered: boolean;
    runtimeProfileMatchesCandidateLevers: boolean;
    supportedCandidateLevers: string[];
    unsupportedCandidateLevers: string[];
    candidateGeometryAdapterStatus: Nhm2CandidateMetricProfileSpecAdapterStatusV1;
    transitionKernelAdapterRef: string | null;
    shiftFieldEvaluatorStatus: Nhm2CandidateMetricProfileSpecExecutableGeometryStatusV1;
    shiftFieldEvaluatorRef: string | null;
    regionalSupportAtlasRef: string | null;
    gridRef: string | null;
    admRouteReady: boolean;
    blockers: string[];
  };
  campaignReadiness: {
    canEnterFullAdmMetricTensorRoute: boolean;
    needsFrozenCampaignRun: true;
    firstBlocker: string | null;
    blockers: string[];
  };
  claimBoundary: {
    diagnosticOnly: true;
    profileSpecDoesNotValidateProfile: true;
    tripClockingDoesNotCertifyRouteEta: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2CandidateMetricProfileSpecInput = {
  generatedAt?: string | null;
  profileSearch: Nhm2CampaignProfileSearchArtifactV1;
  profileSearchRef?: string | null;
  candidateProfileId: string;
  coordinateTimeSeconds?: number | null;
  runtimeProfileId?: string | null;
  runtimeProfileRef?: string | null;
  transitionKernelAdapterRef?: string | null;
  shiftFieldEvaluatorRef?: string | null;
  regionalSupportAtlasRef?: string | null;
  gridRef?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const nullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const nullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const candidateFromSearch = (
  profileSearch: Nhm2CampaignProfileSearchArtifactV1,
  candidateProfileId: string,
): Nhm2CampaignProfileSearchCandidateV1 => {
  const candidate = profileSearch.candidates.find(
    (entry) => entry.candidateProfileId === candidateProfileId,
  );
  if (candidate == null) {
    throw new Error(`candidate profile not found in profile search: ${candidateProfileId}`);
  }
  return candidate;
};

const tagForAlpha = (alpha: number): string =>
  `0p${Math.round(alpha * 10000).toString().padStart(4, "0")}`;

const defaultRuntimeProfileIdFor = (
  candidate: Nhm2CampaignProfileSearchCandidateV1,
): string => `stage1_centerline_alpha_${tagForAlpha(candidate.alphaCenterline)}_v1`;

const unsupportedRuntimeLeversFor = (
  candidate: Nhm2CampaignProfileSearchCandidateV1,
): string[] => {
  const unsupported = new Set<string>();
  if (candidate.levers.transitionKernel === "compact_bump") {
    unsupported.add("transition_kernel");
  }
  return Array.from(unsupported);
};

const supportedRuntimeLeversFor = (
  candidate: Nhm2CampaignProfileSearchCandidateV1,
  transitionKernelAdapterRef?: string | null,
): string[] => {
  const supported = new Set<string>(["lapse_depth_scale"]);
  if (candidate.levers.shiftAmplitudeScale !== 1) {
    supported.add("shift_amplitude_scale");
  }
  if (candidate.levers.wallThicknessScale !== 1) {
    supported.add("wall_thickness_scale");
  }
  if (candidate.levers.smoothingWidthScale !== 1) {
    supported.add("smoothing_width_scale");
  }
  if (
    candidate.levers.transitionKernel === "smootherstep_c2" ||
    transitionKernelAdapterRef != null
  ) {
    supported.add("transition_kernel");
  }
  return Array.from(supported);
};

export const buildNhm2CandidateMetricProfileSpec = (
  input: BuildNhm2CandidateMetricProfileSpecInput,
): Nhm2CandidateMetricProfileSpecV1 => {
  const candidate = candidateFromSearch(input.profileSearch, input.candidateProfileId);
  const runtimeProfileId =
    input.runtimeProfileId?.trim() || defaultRuntimeProfileIdFor(candidate);
  const runtimeProfileRegistered =
    input.runtimeProfileRef != null || input.shiftFieldEvaluatorRef != null;
  const supportedCandidateLevers = supportedRuntimeLeversFor(
    candidate,
    input.transitionKernelAdapterRef,
  );
  const unsupportedCandidateLevers = unsupportedRuntimeLeversFor(candidate).filter(
    (lever) => !(lever === "transition_kernel" && input.transitionKernelAdapterRef != null),
  );
  const runtimeProfileMatchesCandidateLevers =
    runtimeProfileRegistered && unsupportedCandidateLevers.length === 0;
  const coordinateTimeSeconds =
    input.coordinateTimeSeconds != null && Number.isFinite(input.coordinateTimeSeconds)
      ? input.coordinateTimeSeconds
      : null;
  const shipProperTimeSeconds =
    coordinateTimeSeconds == null
      ? null
      : coordinateTimeSeconds * candidate.alphaCenterline;
  const executableRefs = [
    input.shiftFieldEvaluatorRef,
    input.regionalSupportAtlasRef,
    input.gridRef,
  ].filter((entry) => typeof entry === "string" && entry.trim().length > 0);
  const candidateRejected =
    candidate.campaignScreen.status !== "screen_pass_needs_campaign_run";
  const executableGeometryReady =
    !candidateRejected &&
    runtimeProfileMatchesCandidateLevers &&
    executableRefs.length === 3;
  const candidateGeometryAdapterStatus: Nhm2CandidateMetricProfileSpecAdapterStatusV1 =
    candidateRejected
      ? "blocked"
      : runtimeProfileMatchesCandidateLevers
        ? "available"
        : runtimeProfileRegistered
          ? "partial_runtime_profile_only"
          : "missing";
  const executableBlockers = candidateRejected
    ? ["candidate_rejected_by_profile_screen"]
    : runtimeProfileRegistered && !runtimeProfileMatchesCandidateLevers
      ? [
          ...unsupportedCandidateLevers.map(
            (lever) => `candidate_${lever}_adapter_missing`,
          ),
          "candidate_combined_metric_redesign_adapter_missing",
          ...(input.regionalSupportAtlasRef == null
            ? ["candidate_regional_support_atlas_ref_missing"]
            : []),
          ...(input.gridRef == null ? ["candidate_grid_ref_missing"] : []),
        ]
      : [
          ...(input.shiftFieldEvaluatorRef == null
            ? ["candidate_executable_shift_field_evaluator_missing"]
            : []),
          ...(input.regionalSupportAtlasRef == null
            ? ["candidate_regional_support_atlas_ref_missing"]
            : []),
          ...(input.gridRef == null ? ["candidate_grid_ref_missing"] : []),
        ];
  const blockers = executableGeometryReady
    ? ["full_frozen_campaign_run_required"]
    : executableBlockers;

  return {
    contractVersion: NHM2_CANDIDATE_METRIC_PROFILE_SPEC_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    candidateProfileId: candidate.candidateProfileId,
    parentProfileId: candidate.parentProfileId,
    alphaCenterline: candidate.alphaCenterline,
    subjectiveEfficiencyProxy: candidate.subjectiveEfficiencyProxy,
    proposalKind: candidate.proposalKind,
    sourceProfileSearchRef: input.profileSearchRef ?? null,
    profileDefinition: {
      lapseDepthScale: candidate.levers.lapseDepthScale,
      shiftAmplitudeScale: candidate.levers.shiftAmplitudeScale,
      wallThicknessScale: candidate.levers.wallThicknessScale,
      smoothingWidthScale: candidate.levers.smoothingWidthScale,
      transitionKernel: candidate.levers.transitionKernel,
      projectedT0iSuppressionFactor:
        candidate.levers.projectedT0iSuppressionFactor,
      sourceTensorCopiedFromMetric: false,
      silentlyZeroesT0i: false,
      silentlyZeroesOffDiagonalTij: false,
      usesScalarT00Only: false,
    },
    tripClockingDiagnostic: {
      properTimeRatio: candidate.alphaCenterline,
      subjectiveEfficiencyProxy: candidate.subjectiveEfficiencyProxy,
      formula: "tau = alpha_centerline * T_coordinate",
      coordinateTimeSeconds,
      shipProperTimeSeconds,
      clockSavingSeconds:
        coordinateTimeSeconds == null || shipProperTimeSeconds == null
          ? null
          : coordinateTimeSeconds - shipProperTimeSeconds,
      routeEtaCertified: false,
    },
    executableGeometry: {
      runtimeProfileId,
      runtimeProfileRef: input.runtimeProfileRef ?? null,
      runtimeProfileRegistered,
      runtimeProfileMatchesCandidateLevers,
      supportedCandidateLevers,
      unsupportedCandidateLevers,
      candidateGeometryAdapterStatus,
      transitionKernelAdapterRef: input.transitionKernelAdapterRef ?? null,
      shiftFieldEvaluatorStatus: executableGeometryReady
        ? "available"
        : candidateRejected
          ? "blocked"
          : runtimeProfileRegistered
            ? "available"
            : "missing",
      shiftFieldEvaluatorRef: input.shiftFieldEvaluatorRef ?? null,
      regionalSupportAtlasRef: input.regionalSupportAtlasRef ?? null,
      gridRef: input.gridRef ?? null,
      admRouteReady: executableGeometryReady,
      blockers: executableBlockers,
    },
    campaignReadiness: {
      canEnterFullAdmMetricTensorRoute: executableGeometryReady,
      needsFrozenCampaignRun: true,
      firstBlocker: blockers[0] ?? null,
      blockers,
    },
    claimBoundary: {
      diagnosticOnly: true,
      profileSpecDoesNotValidateProfile: true,
      tripClockingDoesNotCertifyRouteEta: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2CandidateMetricProfileSpec = (
  value: unknown,
): value is Nhm2CandidateMetricProfileSpecV1 => {
  const record = isRecord(value) ? value : null;
  const profileDefinition = isRecord(record?.profileDefinition)
    ? record.profileDefinition
    : null;
  const tripClockingDiagnostic = isRecord(record?.tripClockingDiagnostic)
    ? record.tripClockingDiagnostic
    : null;
  const executableGeometry = isRecord(record?.executableGeometry)
    ? record.executableGeometry
    : null;
  const campaignReadiness = isRecord(record?.campaignReadiness)
    ? record.campaignReadiness
    : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record.claimBoundary
    : null;

  return (
    record != null &&
    record.contractVersion === NHM2_CANDIDATE_METRIC_PROFILE_SPEC_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    record.laneId === "nhm2_shift_lapse" &&
    typeof record.candidateProfileId === "string" &&
    typeof record.parentProfileId === "string" &&
    isFiniteNumber(record.alphaCenterline) &&
    isFiniteNumber(record.subjectiveEfficiencyProxy) &&
    typeof record.proposalKind === "string" &&
    nullableText(record.sourceProfileSearchRef) &&
    profileDefinition != null &&
    isFiniteNumber(profileDefinition.lapseDepthScale) &&
    isFiniteNumber(profileDefinition.shiftAmplitudeScale) &&
    isFiniteNumber(profileDefinition.wallThicknessScale) &&
    isFiniteNumber(profileDefinition.smoothingWidthScale) &&
    typeof profileDefinition.transitionKernel === "string" &&
    isFiniteNumber(profileDefinition.projectedT0iSuppressionFactor) &&
    profileDefinition.sourceTensorCopiedFromMetric === false &&
    profileDefinition.silentlyZeroesT0i === false &&
    profileDefinition.silentlyZeroesOffDiagonalTij === false &&
    profileDefinition.usesScalarT00Only === false &&
    tripClockingDiagnostic != null &&
    isFiniteNumber(tripClockingDiagnostic.properTimeRatio) &&
    isFiniteNumber(tripClockingDiagnostic.subjectiveEfficiencyProxy) &&
    tripClockingDiagnostic.formula === "tau = alpha_centerline * T_coordinate" &&
    nullableNumber(tripClockingDiagnostic.coordinateTimeSeconds) &&
    nullableNumber(tripClockingDiagnostic.shipProperTimeSeconds) &&
    nullableNumber(tripClockingDiagnostic.clockSavingSeconds) &&
    tripClockingDiagnostic.routeEtaCertified === false &&
    executableGeometry != null &&
    nullableText(executableGeometry.runtimeProfileId) &&
    nullableText(executableGeometry.runtimeProfileRef) &&
    typeof executableGeometry.runtimeProfileRegistered === "boolean" &&
    typeof executableGeometry.runtimeProfileMatchesCandidateLevers === "boolean" &&
    Array.isArray(executableGeometry.supportedCandidateLevers) &&
    Array.isArray(executableGeometry.unsupportedCandidateLevers) &&
    [
      "available",
      "partial_runtime_profile_only",
      "missing",
      "blocked",
    ].includes(String(executableGeometry.candidateGeometryAdapterStatus)) &&
    nullableText(executableGeometry.transitionKernelAdapterRef) &&
    ["available", "missing", "blocked"].includes(
      String(executableGeometry.shiftFieldEvaluatorStatus),
    ) &&
    nullableText(executableGeometry.shiftFieldEvaluatorRef) &&
    nullableText(executableGeometry.regionalSupportAtlasRef) &&
    nullableText(executableGeometry.gridRef) &&
    typeof executableGeometry.admRouteReady === "boolean" &&
    Array.isArray(executableGeometry.blockers) &&
    campaignReadiness != null &&
    typeof campaignReadiness.canEnterFullAdmMetricTensorRoute === "boolean" &&
    campaignReadiness.needsFrozenCampaignRun === true &&
    nullableText(campaignReadiness.firstBlocker) &&
    Array.isArray(campaignReadiness.blockers) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.profileSpecDoesNotValidateProfile === true &&
    claimBoundary.tripClockingDoesNotCertifyRouteEta === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false
  );
};
