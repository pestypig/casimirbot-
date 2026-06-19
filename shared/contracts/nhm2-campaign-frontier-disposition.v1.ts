import type { Nhm2TimeDependentSourceCampaignArtifactV1 } from "./nhm2-time-dependent-source-campaign.v1";
import type { Nhm2MetricMomentumRemediationTargetsV1 } from "./nhm2-metric-momentum-remediation-targets.v1";

export const NHM2_CAMPAIGN_FRONTIER_DISPOSITION_CONTRACT_VERSION =
  "nhm2_campaign_frontier_disposition/v1";

export type Nhm2CampaignFrontierDispositionStatusV1 =
  | "current_profile_rejected"
  | "remediation_required"
  | "projection_upgrade_required"
  | "no_frontier_blocker"
  | "missing";

export type Nhm2CampaignFrontierDispositionV1 = {
  contractVersion: typeof NHM2_CAMPAIGN_FRONTIER_DISPOSITION_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  chartId: string | null;
  campaignRef: string | null;
  metricMomentumRemediationTargetsRef: string | null;
  frontier: {
    gateId: "full_regional_tensor_closure";
    campaignFirstBlocker: string | null;
    blockerClass: "metric_required_momentum_density" | "none" | "unknown";
    currentProfileNonResolvable: boolean;
  };
  disposition: {
    status: Nhm2CampaignFrontierDispositionStatusV1;
    reason: string;
    allowedNextActions: Array<
      | "reduce_metric_required_projected_t0i"
      | "change_metric_profile_geometry"
      | "provide_full_adm_tetrad_projection_that_changes_ratio"
      | "reject_current_profile_for_campaign"
      | "continue_downstream_campaign_gates"
    >;
    forbiddenNextActions: Array<
      | "copy_metric_required_tensor_into_source"
      | "hide_momentum_density_in_global_average"
      | "silently_zero_t0i"
      | "treat_reduced_order_projection_as_physical_viability"
    >;
  };
  quantitativeSummary: {
    worstRegionId: string | null;
    worstComponentId: string | null;
    worstRequiredSuppressionFactor: number | null;
    worstRequiredFractionalReduction: number | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    frontierDispositionDoesNotValidateNewMetric: true;
    currentProfileRejectionDoesNotProveUniversalNoGo: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
  };
};

export type BuildNhm2CampaignFrontierDispositionInput = {
  generatedAt?: string | null;
  campaign?: Nhm2TimeDependentSourceCampaignArtifactV1 | null;
  campaignRef?: string | null;
  metricMomentumRemediationTargets?: Nhm2MetricMomentumRemediationTargetsV1 | null;
  metricMomentumRemediationTargetsRef?: string | null;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const blockerClassFor = (
  firstBlocker: string | null,
): Nhm2CampaignFrontierDispositionV1["frontier"]["blockerClass"] => {
  if (firstBlocker == null || firstBlocker === "none") return "none";
  return firstBlocker.includes("metric_required_momentum_density") ||
    firstBlocker.includes("metric_momentum")
    ? "metric_required_momentum_density"
    : "unknown";
};

export const buildNhm2CampaignFrontierDisposition = (
  input: BuildNhm2CampaignFrontierDispositionInput,
): Nhm2CampaignFrontierDispositionV1 => {
  const targets = input.metricMomentumRemediationTargets ?? null;
  const campaign = input.campaign ?? null;
  const firstBlocker = campaign?.summary.firstBlocker ?? targets?.summary.firstBlocker ?? null;
  const currentProfileNonResolvable =
    targets?.summary.nonResolvableForCurrentProfile === true;
  const status: Nhm2CampaignFrontierDispositionStatusV1 =
    targets == null
      ? "missing"
      : currentProfileNonResolvable
        ? "current_profile_rejected"
        : targets.summary.remediationRequired
          ? "remediation_required"
          : "no_frontier_blocker";
  const reason =
    status === "current_profile_rejected"
      ? "current_profile_rejected_under_declared_reduced_order_projected_momentum_demand"
      : status === "remediation_required"
        ? "metric_required_projected_momentum_remediation_required"
        : status === "no_frontier_blocker"
          ? "metric_required_projected_momentum_within_declared_bound"
          : "metric_momentum_remediation_targets_missing";
  return {
    contractVersion: NHM2_CAMPAIGN_FRONTIER_DISPOSITION_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: targets?.laneId ?? campaign?.laneId ?? "unknown",
    selectedProfileId: targets?.selectedProfileId ?? campaign?.selectedProfileId ?? "unknown",
    runId: targets?.runId ?? campaign?.runId ?? "unknown",
    chartId: campaign?.chartId ?? null,
    campaignRef: input.campaignRef ?? null,
    metricMomentumRemediationTargetsRef:
      input.metricMomentumRemediationTargetsRef ?? null,
    frontier: {
      gateId: "full_regional_tensor_closure",
      campaignFirstBlocker: firstBlocker,
      blockerClass: blockerClassFor(firstBlocker),
      currentProfileNonResolvable,
    },
    disposition: {
      status,
      reason,
      allowedNextActions:
        status === "no_frontier_blocker"
          ? ["continue_downstream_campaign_gates"]
          : [
              "reduce_metric_required_projected_t0i",
              "change_metric_profile_geometry",
              "provide_full_adm_tetrad_projection_that_changes_ratio",
              "reject_current_profile_for_campaign",
            ],
      forbiddenNextActions: [
        "copy_metric_required_tensor_into_source",
        "hide_momentum_density_in_global_average",
        "silently_zero_t0i",
        "treat_reduced_order_projection_as_physical_viability",
      ],
    },
    quantitativeSummary: {
      worstRegionId: targets?.summary.worstRegionId ?? null,
      worstComponentId: targets?.summary.worstComponentId ?? null,
      worstRequiredSuppressionFactor:
        targets?.summary.worstRequiredSuppressionFactor ?? null,
      worstRequiredFractionalReduction:
        targets?.summary.worstRequiredFractionalReduction ?? null,
      blockerCount: targets?.summary.blockerCount ?? 0,
    },
    claimBoundary: {
      diagnosticOnly: true,
      frontierDispositionDoesNotValidateNewMetric: true,
      currentProfileRejectionDoesNotProveUniversalNoGo: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
    },
  };
};

export const isNhm2CampaignFrontierDisposition = (
  value: unknown,
): value is Nhm2CampaignFrontierDispositionV1 => {
  const record = isRecord(value) ? value : null;
  const frontier = isRecord(record?.frontier) ? record.frontier : null;
  const disposition = isRecord(record?.disposition) ? record.disposition : null;
  const quantitativeSummary = isRecord(record?.quantitativeSummary)
    ? record.quantitativeSummary
    : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion === NHM2_CAMPAIGN_FRONTIER_DISPOSITION_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    isNullableText(record.chartId) &&
    isNullableText(record.campaignRef) &&
    isNullableText(record.metricMomentumRemediationTargetsRef) &&
    frontier?.gateId === "full_regional_tensor_closure" &&
    isNullableText(frontier.campaignFirstBlocker) &&
    (frontier.blockerClass === "metric_required_momentum_density" ||
      frontier.blockerClass === "none" ||
      frontier.blockerClass === "unknown") &&
    typeof frontier.currentProfileNonResolvable === "boolean" &&
    disposition != null &&
    (disposition.status === "current_profile_rejected" ||
      disposition.status === "remediation_required" ||
      disposition.status === "projection_upgrade_required" ||
      disposition.status === "no_frontier_blocker" ||
      disposition.status === "missing") &&
    typeof disposition.reason === "string" &&
    isStringArray(disposition.allowedNextActions) &&
    isStringArray(disposition.forbiddenNextActions) &&
    quantitativeSummary != null &&
    isNullableText(quantitativeSummary.worstRegionId) &&
    isNullableText(quantitativeSummary.worstComponentId) &&
    isNullableNumber(quantitativeSummary.worstRequiredSuppressionFactor) &&
    isNullableNumber(quantitativeSummary.worstRequiredFractionalReduction) &&
    typeof quantitativeSummary.blockerCount === "number" &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.frontierDispositionDoesNotValidateNewMetric === true &&
    claimBoundary.currentProfileRejectionDoesNotProveUniversalNoGo === true &&
    claimBoundary.physicalViabilityClaimAllowed === false &&
    claimBoundary.transportClaimAllowed === false
  );
};
