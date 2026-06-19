import {
  NHM2_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT_CONTRACT_VERSION,
  type Nhm2MetricRequiredMomentumDemandAuditV1,
  type Nhm2MetricRequiredMomentumDemandComponentV1,
} from "./nhm2-metric-required-momentum-demand-audit.v1";
import type {
  Nhm2CampaignProfileSearchArtifactV1,
  Nhm2CampaignProfileSearchCandidateV1,
} from "./nhm2-campaign-profile-search.v1";

export type BuildNhm2CandidateProfileMomentumDemandScreenInput = {
  generatedAt?: string | null;
  sourceMetricRequiredMomentumDemandAudit: Nhm2MetricRequiredMomentumDemandAuditV1;
  sourceMetricRequiredMomentumDemandAuditRef?: string | null;
  profileSearch: Nhm2CampaignProfileSearchArtifactV1;
  profileSearchRef?: string | null;
  candidateProfileId: string;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const scaledComponent = (
  component: Nhm2MetricRequiredMomentumDemandComponentV1,
  suppressionFactor: number,
): Nhm2MetricRequiredMomentumDemandComponentV1 => {
  const projected =
    component.projectedMetricRequiredMomentumToEnergyRatio == null
      ? null
      : component.projectedMetricRequiredMomentumToEnergyRatio / suppressionFactor;
  const exceedanceFactor =
    projected == null ? null : projected / component.causalMomentumToEnergyRatioLimit;
  const status =
    projected == null
      ? "missing"
      : exceedanceFactor != null && exceedanceFactor > 1
        ? "fail"
        : "pass";
  return {
    ...component,
    projectedMetricRequiredMomentumToEnergyRatio: projected,
    exceedanceFactor,
    status,
    blockers:
      status === "fail"
        ? ["metric_required_momentum_density_causal_bound_exceeded"]
        : status === "missing"
          ? ["projected_metric_required_momentum_ratio_missing"]
          : [],
  };
};

const screenableCandidate = (
  profileSearch: Nhm2CampaignProfileSearchArtifactV1,
  candidateProfileId: string,
): Nhm2CampaignProfileSearchCandidateV1 => {
  const candidate = profileSearch.candidates.find(
    (entry) => entry.candidateProfileId === candidateProfileId,
  );
  if (candidate == null) {
    throw new Error(`candidate profile not found in profile search: ${candidateProfileId}`);
  }
  if (candidate.campaignScreen.status !== "screen_pass_needs_campaign_run") {
    throw new Error(
      `candidate profile is not screen-pass eligible: ${candidateProfileId}`,
    );
  }
  if (!isFiniteNumber(candidate.levers.projectedT0iSuppressionFactor)) {
    throw new Error("candidate projected T0i suppression factor must be finite");
  }
  if (candidate.levers.projectedT0iSuppressionFactor <= 0) {
    throw new Error("candidate projected T0i suppression factor must be positive");
  }
  return candidate;
};

export const buildNhm2CandidateProfileMomentumDemandScreen = (
  input: BuildNhm2CandidateProfileMomentumDemandScreenInput,
): Nhm2MetricRequiredMomentumDemandAuditV1 => {
  const candidate = screenableCandidate(input.profileSearch, input.candidateProfileId);
  const source = input.sourceMetricRequiredMomentumDemandAudit;
  const suppressionFactor = candidate.levers.projectedT0iSuppressionFactor;
  const components = source.components.map((component) =>
    scaledComponent(component, suppressionFactor),
  );
  const finite = components.filter(
    (component) =>
      component.projectedMetricRequiredMomentumToEnergyRatio != null &&
      Number.isFinite(component.projectedMetricRequiredMomentumToEnergyRatio),
  );
  const worst =
    finite.length === 0
      ? null
      : finite.reduce((current, next) =>
          (next.exceedanceFactor ?? 0) > (current.exceedanceFactor ?? 0)
            ? next
            : current,
        );
  const blockers = Array.from(
    new Set(
      components.flatMap((component) =>
        component.blockers.map(
          (blocker) => `${component.regionId}:${component.componentId}:${blocker}`,
        ),
      ),
    ),
  );
  const anyViolation = components.some((component) => component.status === "fail");
  return {
    contractVersion: NHM2_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: source.laneId,
    selectedProfileId: candidate.candidateProfileId,
    runId: `${source.runId}:${candidate.candidateProfileId}:momentum-screen`,
    momentumFrameProjectionReceiptRef:
      input.sourceMetricRequiredMomentumDemandAuditRef ??
      source.momentumFrameProjectionReceiptRef,
    projectionEvidenceRef: input.profileSearchRef ?? source.projectionEvidenceRef,
    projectionApplicabilityStatus: source.projectionApplicabilityStatus,
    ratioPolicy: [
      "candidate_profile_screen_scaled_from_current_metric_momentum_audit",
      `sourceProfile=${source.selectedProfileId}`,
      `sourceAudit=${input.sourceMetricRequiredMomentumDemandAuditRef ?? "inline"}`,
      `profileSearch=${input.profileSearchRef ?? "inline"}`,
      `projectedT0iSuppressionFactor=${suppressionFactor}`,
      "screen_only_not_full_adm_tetrad",
    ].join(";"),
    components,
    summary: {
      allProjectedRatiosAvailable: components.every(
        (component) => component.projectedMetricRequiredMomentumToEnergyRatio != null,
      ),
      anyProjectedMetricRequiredCausalMomentumBoundViolation: anyViolation,
      worstRegionId: worst?.regionId ?? null,
      worstComponentId: worst?.componentId ?? null,
      worstProjectedMetricRequiredMomentumToEnergyRatio:
        worst?.projectedMetricRequiredMomentumToEnergyRatio ?? null,
      worstExceedanceFactor: worst?.exceedanceFactor ?? null,
      currentMetricProfileFalsified: anyViolation,
      falsifierScope: anyViolation
        ? "current_metric_profile_under_declared_projection"
        : "not_applicable",
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      metricDemandAuditDoesNotValidatePhysicalSource: true,
      reducedOrderProjectionDoesNotReplaceFullAdmTetrad: true,
      currentProfileFalsifierDoesNotProveUniversalMetricImpossibility: true,
      transportClaimAllowed: false,
    },
  };
};
