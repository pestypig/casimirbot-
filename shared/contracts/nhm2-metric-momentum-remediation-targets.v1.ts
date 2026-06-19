import {
  type Nhm2MetricRequiredMomentumDemandAuditV1,
  type Nhm2MetricRequiredMomentumDemandComponentV1,
} from "./nhm2-metric-required-momentum-demand-audit.v1";
import type { Nhm2MomentumDensityComponentId } from "./nhm2-source-momentum-density-audit.v1";
import type { Nhm2RegionalSourceClosureRegionId } from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_METRIC_MOMENTUM_REMEDIATION_TARGETS_CONTRACT_VERSION =
  "nhm2_metric_momentum_remediation_targets/v1";

export type Nhm2MetricMomentumRemediationTargetComponentV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  componentId: Nhm2MomentumDensityComponentId;
  projectedMetricRequiredMomentumToEnergyRatio: number | null;
  admissibleMomentumToEnergyRatio: number;
  requiredSuppressionFactor: number | null;
  requiredFractionalReduction: number | null;
  status: "within_bound" | "remediation_required" | "missing";
};

export type Nhm2MetricMomentumRemediationTargetsV1 = {
  contractVersion: typeof NHM2_METRIC_MOMENTUM_REMEDIATION_TARGETS_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  metricRequiredMomentumDemandAuditRef: string | null;
  projectionEvidenceRef: string | null;
  ratioPolicy: string | null;
  components: Nhm2MetricMomentumRemediationTargetComponentV1[];
  summary: {
    remediationRequired: boolean;
    currentMetricProfileFalsified: boolean;
    worstRegionId: Nhm2RegionalSourceClosureRegionId | null;
    worstComponentId: Nhm2MomentumDensityComponentId | null;
    worstRequiredSuppressionFactor: number | null;
    worstRequiredFractionalReduction: number | null;
    nonResolvableForCurrentProfile: boolean;
    firstBlocker: string | null;
    blockerCount: number;
  };
  allowedRemediationLevers: Array<
    | "reduce_metric_required_projected_t0i"
    | "change_metric_profile_geometry"
    | "provide_full_adm_tetrad_projection_that_changes_ratio"
    | "reject_current_profile_for_campaign"
  >;
  forbiddenRemediationLevers: Array<
    | "copy_metric_required_tensor_into_source"
    | "hide_momentum_density_in_global_average"
    | "silently_zero_t0i"
    | "treat_reduced_order_projection_as_physical_viability"
  >;
  claimBoundary: {
    diagnosticOnly: true;
    remediationTargetsDoNotValidateNewMetric: true;
    currentProfileFailureDoesNotProveUniversalNoGo: true;
    transportClaimAllowed: false;
  };
};

export type BuildNhm2MetricMomentumRemediationTargetsInput = {
  generatedAt?: string | null;
  metricRequiredMomentumDemandAudit: Nhm2MetricRequiredMomentumDemandAuditV1;
  metricRequiredMomentumDemandAuditRef?: string | null;
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

const targetFor = (
  component: Nhm2MetricRequiredMomentumDemandComponentV1,
): Nhm2MetricMomentumRemediationTargetComponentV1 => {
  const ratio = component.projectedMetricRequiredMomentumToEnergyRatio;
  const admissible = component.causalMomentumToEnergyRatioLimit;
  const requiredSuppressionFactor =
    ratio == null ? null : ratio > admissible ? ratio / admissible : 1;
  const requiredFractionalReduction =
    requiredSuppressionFactor == null
      ? null
      : requiredSuppressionFactor <= 1
        ? 0
        : 1 - 1 / requiredSuppressionFactor;
  return {
    regionId: component.regionId,
    componentId: component.componentId,
    projectedMetricRequiredMomentumToEnergyRatio: ratio,
    admissibleMomentumToEnergyRatio: admissible,
    requiredSuppressionFactor,
    requiredFractionalReduction,
    status:
      ratio == null
        ? "missing"
        : ratio > admissible
          ? "remediation_required"
          : "within_bound",
  };
};

export const buildNhm2MetricMomentumRemediationTargets = (
  input: BuildNhm2MetricMomentumRemediationTargetsInput,
): Nhm2MetricMomentumRemediationTargetsV1 => {
  const demand = input.metricRequiredMomentumDemandAudit;
  const components = demand.components.map(targetFor);
  const requiringRemediation = components.filter(
    (component) => component.status === "remediation_required",
  );
  const worst =
    requiringRemediation.length === 0
      ? null
      : requiringRemediation.reduce((current, next) =>
          (next.requiredSuppressionFactor ?? 0) >
          (current.requiredSuppressionFactor ?? 0)
            ? next
            : current,
        );
  const blockers = requiringRemediation.map(
    (component) =>
      `${component.regionId}:${component.componentId}:metric_momentum_suppression_required`,
  );
  const remediationRequired = requiringRemediation.length > 0;
  return {
    contractVersion: NHM2_METRIC_MOMENTUM_REMEDIATION_TARGETS_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: demand.laneId,
    selectedProfileId: demand.selectedProfileId,
    runId: demand.runId,
    metricRequiredMomentumDemandAuditRef:
      input.metricRequiredMomentumDemandAuditRef ?? null,
    projectionEvidenceRef: demand.projectionEvidenceRef,
    ratioPolicy: demand.ratioPolicy,
    components,
    summary: {
      remediationRequired,
      currentMetricProfileFalsified: demand.summary.currentMetricProfileFalsified,
      worstRegionId: worst?.regionId ?? null,
      worstComponentId: worst?.componentId ?? null,
      worstRequiredSuppressionFactor: worst?.requiredSuppressionFactor ?? null,
      worstRequiredFractionalReduction: worst?.requiredFractionalReduction ?? null,
      nonResolvableForCurrentProfile:
        demand.summary.currentMetricProfileFalsified && remediationRequired,
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    allowedRemediationLevers: [
      "reduce_metric_required_projected_t0i",
      "change_metric_profile_geometry",
      "provide_full_adm_tetrad_projection_that_changes_ratio",
      "reject_current_profile_for_campaign",
    ],
    forbiddenRemediationLevers: [
      "copy_metric_required_tensor_into_source",
      "hide_momentum_density_in_global_average",
      "silently_zero_t0i",
      "treat_reduced_order_projection_as_physical_viability",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      remediationTargetsDoNotValidateNewMetric: true,
      currentProfileFailureDoesNotProveUniversalNoGo: true,
      transportClaimAllowed: false,
    },
  };
};

const isComponent = (
  value: unknown,
): value is Nhm2MetricMomentumRemediationTargetComponentV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    typeof record.regionId === "string" &&
    typeof record.componentId === "string" &&
    isNullableNumber(record.projectedMetricRequiredMomentumToEnergyRatio) &&
    typeof record.admissibleMomentumToEnergyRatio === "number" &&
    Number.isFinite(record.admissibleMomentumToEnergyRatio) &&
    isNullableNumber(record.requiredSuppressionFactor) &&
    isNullableNumber(record.requiredFractionalReduction) &&
    (record.status === "within_bound" ||
      record.status === "remediation_required" ||
      record.status === "missing")
  );
};

export const isNhm2MetricMomentumRemediationTargets = (
  value: unknown,
): value is Nhm2MetricMomentumRemediationTargetsV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_METRIC_MOMENTUM_REMEDIATION_TARGETS_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    isNullableText(record.metricRequiredMomentumDemandAuditRef) &&
    isNullableText(record.projectionEvidenceRef) &&
    (record.ratioPolicy === null || typeof record.ratioPolicy === "string") &&
    Array.isArray(record.components) &&
    record.components.every(isComponent) &&
    summary != null &&
    typeof summary.remediationRequired === "boolean" &&
    typeof summary.currentMetricProfileFalsified === "boolean" &&
    isNullableText(summary.worstRegionId) &&
    isNullableText(summary.worstComponentId) &&
    isNullableNumber(summary.worstRequiredSuppressionFactor) &&
    isNullableNumber(summary.worstRequiredFractionalReduction) &&
    typeof summary.nonResolvableForCurrentProfile === "boolean" &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.blockerCount === "number" &&
    isStringArray(record.allowedRemediationLevers) &&
    isStringArray(record.forbiddenRemediationLevers) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.remediationTargetsDoNotValidateNewMetric === true &&
    claimBoundary.currentProfileFailureDoesNotProveUniversalNoGo === true &&
    claimBoundary.transportClaimAllowed === false
  );
};
