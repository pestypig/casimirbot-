import type { Nhm2MetricMomentumRemediationTargetsV1 } from "./nhm2-metric-momentum-remediation-targets.v1";
import type { Nhm2CampaignFrontierDispositionV1 } from "./nhm2-campaign-frontier-disposition.v1";

export const NHM2_CAMPAIGN_PROFILE_SEARCH_CONTRACT_VERSION =
  "nhm2_campaign_profile_search/v1";

export type Nhm2CampaignProfileSearchCandidateStatusV1 =
  | "screen_pass_needs_campaign_run"
  | "rejected_metric_momentum"
  | "rejected_forbidden_lever"
  | "review";

export type Nhm2CampaignProfileSearchCandidateV1 = {
  candidateProfileId: string;
  parentProfileId: string;
  alphaCenterline: number;
  subjectiveEfficiencyProxy: number;
  proposalKind:
    | "alpha_only"
    | "shift_suppressed"
    | "smoothing_suppressed"
    | "combined_metric_redesign";
  levers: {
    lapseDepthScale: number;
    shiftAmplitudeScale: number;
    wallThicknessScale: number;
    smoothingWidthScale: number;
    transitionKernel: "reuse_current" | "smootherstep_c2" | "compact_bump";
    projectedT0iSuppressionFactor: number;
  };
  campaignScreen: {
    screeningModel: "declared_reduced_order_frontier_screen";
    sourceTensorCopiedFromMetric: false;
    silentlyZeroesT0i: false;
    silentlyZeroesOffDiagonalTij: false;
    usesScalarT00Only: false;
    estimatedWorstMetricMomentumRatio: number | null;
    requiredSuppressionFactor: number | null;
    clearsCurrentProfileMomentumRejection: boolean;
    needsFullCampaignRun: true;
    status: Nhm2CampaignProfileSearchCandidateStatusV1;
    blockers: string[];
  };
};

export type Nhm2CampaignProfileSearchArtifactV1 = {
  contractVersion: typeof NHM2_CAMPAIGN_PROFILE_SEARCH_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  sourceCampaignRef: string | null;
  campaignFrontierDispositionRef: string | null;
  metricMomentumRemediationTargetsRef: string | null;
  baseline: {
    selectedProfileId: string;
    runId: string;
    firstBlocker: string | null;
    worstRegionId: string | null;
    worstComponentId: string | null;
    worstRequiredSuppressionFactor: number | null;
    currentProfileRejected: boolean;
  };
  searchPolicy: {
    fastestMeans: "lowest_alpha_after_campaign_screen";
    latestAliasesForbidden: true;
    alphaOnlyCannotRetireMetricMomentum: true;
    screenPassIsNotCampaignPass: true;
    candidateRequiresFrozenCampaignRun: true;
  };
  candidates: Nhm2CampaignProfileSearchCandidateV1[];
  ranking: {
    fastestScreenedCandidateProfileId: string | null;
    fastestAlphaOnlyRejectedProfileId: string | null;
    recommendedNextProfileId: string | null;
    recommendationReason: string;
  };
  summary: {
    candidateCount: number;
    screenPassCount: number;
    rejectedCount: number;
    fastestScreenedAlpha: number | null;
    firstBlocker: string | null;
    profileSearchComplete: boolean;
  };
  claimBoundary: {
    diagnosticOnly: true;
    profileSearchDoesNotValidateProfile: true;
    screenPassDoesNotPassCampaign: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2CampaignProfileSearchInput = {
  generatedAt?: string | null;
  sourceCampaignRef?: string | null;
  campaignFrontierDisposition?: Nhm2CampaignFrontierDispositionV1 | null;
  campaignFrontierDispositionRef?: string | null;
  metricMomentumRemediationTargets: Nhm2MetricMomentumRemediationTargetsV1;
  metricMomentumRemediationTargetsRef?: string | null;
  candidateSpecs?: Array<{
    alphaCenterline: number;
    proposalKind: Nhm2CampaignProfileSearchCandidateV1["proposalKind"];
    lapseDepthScale?: number;
    shiftAmplitudeScale?: number;
    wallThicknessScale?: number;
    smoothingWidthScale?: number;
    transitionKernel?: Nhm2CampaignProfileSearchCandidateV1["levers"]["transitionKernel"];
    projectedT0iSuppressionFactor?: number;
  }> | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const tagForAlpha = (alpha: number): string =>
  `0p${Math.round(alpha * 10000).toString().padStart(4, "0")}`;

const defaultCandidateSpecs: NonNullable<
  BuildNhm2CampaignProfileSearchInput["candidateSpecs"]
> = [
  {
    alphaCenterline: 0.99,
    proposalKind: "alpha_only",
    projectedT0iSuppressionFactor: 1,
  },
  {
    alphaCenterline: 0.95,
    proposalKind: "alpha_only",
    projectedT0iSuppressionFactor: 1,
  },
  {
    alphaCenterline: 0.9,
    proposalKind: "alpha_only",
    projectedT0iSuppressionFactor: 1,
  },
  {
    alphaCenterline: 0.7,
    proposalKind: "alpha_only",
    projectedT0iSuppressionFactor: 1,
  },
  {
    alphaCenterline: 0.99,
    proposalKind: "combined_metric_redesign",
    shiftAmplitudeScale: 1e-8,
    wallThicknessScale: 10,
    smoothingWidthScale: 10,
    projectedT0iSuppressionFactor: 3e15,
    transitionKernel: "smootherstep_c2",
  },
  {
    alphaCenterline: 0.95,
    proposalKind: "combined_metric_redesign",
    shiftAmplitudeScale: 1e-9,
    wallThicknessScale: 10,
    smoothingWidthScale: 10,
    projectedT0iSuppressionFactor: 1e16,
    transitionKernel: "smootherstep_c2",
  },
  {
    alphaCenterline: 0.9,
    proposalKind: "combined_metric_redesign",
    shiftAmplitudeScale: 1e-10,
    wallThicknessScale: 10,
    smoothingWidthScale: 20,
    projectedT0iSuppressionFactor: 5e16,
    transitionKernel: "compact_bump",
  },
];

const candidateIdFor = (
  alpha: number,
  proposalKind: Nhm2CampaignProfileSearchCandidateV1["proposalKind"],
): string => `stage1_centerline_alpha_${tagForAlpha(alpha)}_${proposalKind}_campaign_screen_v1`;

const buildCandidate = (
  spec: NonNullable<BuildNhm2CampaignProfileSearchInput["candidateSpecs"]>[number],
  parentProfileId: string,
  worstRequiredSuppressionFactor: number | null,
): Nhm2CampaignProfileSearchCandidateV1 => {
  const projectedT0iSuppressionFactor = spec.projectedT0iSuppressionFactor ?? 1;
  const estimatedWorstMetricMomentumRatio =
    worstRequiredSuppressionFactor == null
      ? null
      : worstRequiredSuppressionFactor / projectedT0iSuppressionFactor;
  const clearsCurrentProfileMomentumRejection =
    estimatedWorstMetricMomentumRatio != null &&
    estimatedWorstMetricMomentumRatio <= 1;
  const forbiddenLever = projectedT0iSuppressionFactor <= 0;
  const blockers =
    forbiddenLever
      ? ["forbidden_or_invalid_profile_lever"]
      : spec.proposalKind === "alpha_only"
        ? ["alpha_only_does_not_reduce_projected_t0i"]
        : clearsCurrentProfileMomentumRejection
          ? ["full_frozen_campaign_run_required"]
          : ["metric_momentum_rejection_not_cleared_by_screen"];
  const status: Nhm2CampaignProfileSearchCandidateStatusV1 =
    forbiddenLever
      ? "rejected_forbidden_lever"
      : spec.proposalKind === "alpha_only" || !clearsCurrentProfileMomentumRejection
        ? "rejected_metric_momentum"
        : "screen_pass_needs_campaign_run";

  return {
    candidateProfileId: candidateIdFor(spec.alphaCenterline, spec.proposalKind),
    parentProfileId,
    alphaCenterline: spec.alphaCenterline,
    subjectiveEfficiencyProxy: 1 / spec.alphaCenterline,
    proposalKind: spec.proposalKind,
    levers: {
      lapseDepthScale: spec.lapseDepthScale ?? 1,
      shiftAmplitudeScale: spec.shiftAmplitudeScale ?? 1,
      wallThicknessScale: spec.wallThicknessScale ?? 1,
      smoothingWidthScale: spec.smoothingWidthScale ?? 1,
      transitionKernel: spec.transitionKernel ?? "reuse_current",
      projectedT0iSuppressionFactor,
    },
    campaignScreen: {
      screeningModel: "declared_reduced_order_frontier_screen",
      sourceTensorCopiedFromMetric: false,
      silentlyZeroesT0i: false,
      silentlyZeroesOffDiagonalTij: false,
      usesScalarT00Only: false,
      estimatedWorstMetricMomentumRatio,
      requiredSuppressionFactor: worstRequiredSuppressionFactor,
      clearsCurrentProfileMomentumRejection,
      needsFullCampaignRun: true,
      status,
      blockers,
    },
  };
};

export const buildNhm2CampaignProfileSearch = (
  input: BuildNhm2CampaignProfileSearchInput,
): Nhm2CampaignProfileSearchArtifactV1 => {
  const targets = input.metricMomentumRemediationTargets;
  const worstRequiredSuppressionFactor =
    targets.summary.worstRequiredSuppressionFactor;
  const candidates = (input.candidateSpecs?.length
    ? input.candidateSpecs
    : defaultCandidateSpecs
  ).map((spec) =>
    buildCandidate(spec, targets.selectedProfileId, worstRequiredSuppressionFactor),
  );
  const screenPasses = candidates
    .filter((candidate) => candidate.campaignScreen.status === "screen_pass_needs_campaign_run")
    .sort((lhs, rhs) => lhs.alphaCenterline - rhs.alphaCenterline);
  const alphaOnlyRejected = candidates
    .filter((candidate) => candidate.proposalKind === "alpha_only")
    .sort((lhs, rhs) => lhs.alphaCenterline - rhs.alphaCenterline);
  const fastestScreened = screenPasses[0] ?? null;

  return {
    contractVersion: NHM2_CAMPAIGN_PROFILE_SEARCH_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    sourceCampaignRef: input.sourceCampaignRef ?? null,
    campaignFrontierDispositionRef: input.campaignFrontierDispositionRef ?? null,
    metricMomentumRemediationTargetsRef:
      input.metricMomentumRemediationTargetsRef ?? null,
    baseline: {
      selectedProfileId: targets.selectedProfileId,
      runId: targets.runId,
      firstBlocker:
        input.campaignFrontierDisposition?.frontier.campaignFirstBlocker ??
        targets.summary.firstBlocker,
      worstRegionId: targets.summary.worstRegionId,
      worstComponentId: targets.summary.worstComponentId,
      worstRequiredSuppressionFactor,
      currentProfileRejected:
        input.campaignFrontierDisposition?.disposition.status ===
          "current_profile_rejected" ||
        targets.summary.nonResolvableForCurrentProfile,
    },
    searchPolicy: {
      fastestMeans: "lowest_alpha_after_campaign_screen",
      latestAliasesForbidden: true,
      alphaOnlyCannotRetireMetricMomentum: true,
      screenPassIsNotCampaignPass: true,
      candidateRequiresFrozenCampaignRun: true,
    },
    candidates,
    ranking: {
      fastestScreenedCandidateProfileId:
        fastestScreened?.candidateProfileId ?? null,
      fastestAlphaOnlyRejectedProfileId:
        alphaOnlyRejected[0]?.candidateProfileId ?? null,
      recommendedNextProfileId: fastestScreened?.candidateProfileId ?? null,
      recommendationReason:
        fastestScreened == null
          ? "no_candidate_clears_metric_momentum_frontier_screen"
          : "run_fastest_screened_candidate_through_full_frozen_campaign_before_any_promotion",
    },
    summary: {
      candidateCount: candidates.length,
      screenPassCount: screenPasses.length,
      rejectedCount: candidates.length - screenPasses.length,
      fastestScreenedAlpha: fastestScreened?.alphaCenterline ?? null,
      firstBlocker:
        fastestScreened == null
          ? "no_candidate_clears_metric_momentum_frontier_screen"
          : "full_frozen_campaign_run_required",
      profileSearchComplete: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      profileSearchDoesNotValidateProfile: true,
      screenPassDoesNotPassCampaign: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

const isCandidate = (
  value: unknown,
): value is Nhm2CampaignProfileSearchCandidateV1 => {
  const record = isRecord(value) ? value : null;
  const levers = isRecord(record?.levers) ? record.levers : null;
  const screen = isRecord(record?.campaignScreen) ? record.campaignScreen : null;
  return (
    record != null &&
    typeof record.candidateProfileId === "string" &&
    typeof record.parentProfileId === "string" &&
    isFiniteNumber(record.alphaCenterline) &&
    isFiniteNumber(record.subjectiveEfficiencyProxy) &&
    ["alpha_only", "shift_suppressed", "smoothing_suppressed", "combined_metric_redesign"].includes(
      String(record.proposalKind),
    ) &&
    levers != null &&
    isFiniteNumber(levers.lapseDepthScale) &&
    isFiniteNumber(levers.shiftAmplitudeScale) &&
    isFiniteNumber(levers.wallThicknessScale) &&
    isFiniteNumber(levers.smoothingWidthScale) &&
    typeof levers.transitionKernel === "string" &&
    isFiniteNumber(levers.projectedT0iSuppressionFactor) &&
    screen != null &&
    screen.screeningModel === "declared_reduced_order_frontier_screen" &&
    screen.sourceTensorCopiedFromMetric === false &&
    screen.silentlyZeroesT0i === false &&
    screen.silentlyZeroesOffDiagonalTij === false &&
    screen.usesScalarT00Only === false &&
    isNullableNumber(screen.estimatedWorstMetricMomentumRatio) &&
    isNullableNumber(screen.requiredSuppressionFactor) &&
    typeof screen.clearsCurrentProfileMomentumRejection === "boolean" &&
    screen.needsFullCampaignRun === true &&
    typeof screen.status === "string" &&
    Array.isArray(screen.blockers)
  );
};

export const isNhm2CampaignProfileSearch = (
  value: unknown,
): value is Nhm2CampaignProfileSearchArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const baseline = isRecord(record?.baseline) ? record.baseline : null;
  const searchPolicy = isRecord(record?.searchPolicy) ? record.searchPolicy : null;
  const ranking = isRecord(record?.ranking) ? record.ranking : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_CAMPAIGN_PROFILE_SEARCH_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    record.laneId === "nhm2_shift_lapse" &&
    isNullableText(record.sourceCampaignRef) &&
    isNullableText(record.campaignFrontierDispositionRef) &&
    isNullableText(record.metricMomentumRemediationTargetsRef) &&
    baseline != null &&
    typeof baseline.selectedProfileId === "string" &&
    typeof baseline.runId === "string" &&
    isNullableText(baseline.firstBlocker) &&
    isNullableText(baseline.worstRegionId) &&
    isNullableText(baseline.worstComponentId) &&
    isNullableNumber(baseline.worstRequiredSuppressionFactor) &&
    typeof baseline.currentProfileRejected === "boolean" &&
    searchPolicy?.latestAliasesForbidden === true &&
    searchPolicy.alphaOnlyCannotRetireMetricMomentum === true &&
    searchPolicy.screenPassIsNotCampaignPass === true &&
    searchPolicy.candidateRequiresFrozenCampaignRun === true &&
    Array.isArray(record.candidates) &&
    record.candidates.every(isCandidate) &&
    ranking != null &&
    isNullableText(ranking.fastestScreenedCandidateProfileId) &&
    isNullableText(ranking.fastestAlphaOnlyRejectedProfileId) &&
    isNullableText(ranking.recommendedNextProfileId) &&
    typeof ranking.recommendationReason === "string" &&
    summary != null &&
    typeof summary.candidateCount === "number" &&
    typeof summary.screenPassCount === "number" &&
    typeof summary.rejectedCount === "number" &&
    isNullableNumber(summary.fastestScreenedAlpha) &&
    isNullableText(summary.firstBlocker) &&
    summary.profileSearchComplete === false &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.profileSearchDoesNotValidateProfile === true &&
    claimBoundary.screenPassDoesNotPassCampaign === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false &&
    claimBoundary.routeEtaClaimAllowed === false &&
    claimBoundary.propulsionClaimAllowed === false
  );
};
