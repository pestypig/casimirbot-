import {
  NHM2_MOMENTUM_DENSITY_COMPONENTS,
  type Nhm2MomentumDensityComponentId,
} from "./nhm2-source-momentum-density-audit.v1";
import type { Nhm2MomentumFrameProjectionReceiptV1 } from "./nhm2-momentum-frame-projection-receipt.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT_CONTRACT_VERSION =
  "nhm2_metric_required_momentum_demand_audit/v1";

export type Nhm2MetricRequiredMomentumDemandStatus =
  | "pass"
  | "fail"
  | "missing"
  | "blocked";

export type Nhm2MetricRequiredMomentumDemandComponentV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  componentId: Nhm2MomentumDensityComponentId;
  projectedMetricRequiredMomentumToEnergyRatio: number | null;
  causalMomentumToEnergyRatioLimit: number;
  exceedanceFactor: number | null;
  status: Nhm2MetricRequiredMomentumDemandStatus;
  blockers: string[];
};

export type Nhm2MetricRequiredMomentumDemandAuditV1 = {
  contractVersion: typeof NHM2_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  momentumFrameProjectionReceiptRef: string | null;
  projectionEvidenceRef: string | null;
  projectionApplicabilityStatus: "applicable" | "blocked" | "missing";
  ratioPolicy: string | null;
  components: Nhm2MetricRequiredMomentumDemandComponentV1[];
  summary: {
    allProjectedRatiosAvailable: boolean;
    anyProjectedMetricRequiredCausalMomentumBoundViolation: boolean | null;
    worstRegionId: Nhm2RegionalSourceClosureRegionId | null;
    worstComponentId: Nhm2MomentumDensityComponentId | null;
    worstProjectedMetricRequiredMomentumToEnergyRatio: number | null;
    worstExceedanceFactor: number | null;
    currentMetricProfileFalsified: boolean;
    falsifierScope:
      | "current_metric_profile_under_declared_projection"
      | "not_applicable";
    firstBlocker: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    metricDemandAuditDoesNotValidatePhysicalSource: true;
    reducedOrderProjectionDoesNotReplaceFullAdmTetrad: true;
    currentProfileFalsifierDoesNotProveUniversalMetricImpossibility: true;
    transportClaimAllowed: false;
  };
};

export type BuildNhm2MetricRequiredMomentumDemandAuditInput = {
  generatedAt?: string | null;
  momentumFrameProjectionReceipt: Nhm2MomentumFrameProjectionReceiptV1;
  momentumFrameProjectionReceiptRef?: string | null;
};

const CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT = 1;

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

const componentFor = (
  receipt: Nhm2MomentumFrameProjectionReceiptV1,
  regionId: Nhm2RegionalSourceClosureRegionId,
  componentId: Nhm2MomentumDensityComponentId,
) =>
  receipt.regions
    .find((region) => region.regionId === regionId)
    ?.components.find((component) => component.componentId === componentId) ?? null;

export const buildNhm2MetricRequiredMomentumDemandAudit = (
  input: BuildNhm2MetricRequiredMomentumDemandAuditInput,
): Nhm2MetricRequiredMomentumDemandAuditV1 => {
  const receipt = input.momentumFrameProjectionReceipt;
  const projectionApplicable =
    receipt.summary.causalBoundApplicabilityStatus === "applicable" &&
    receipt.summary.projectionAvailable;
  const components = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.flatMap((regionId) =>
    NHM2_MOMENTUM_DENSITY_COMPONENTS.map((componentId) => {
      const projected =
        componentFor(receipt, regionId, componentId)
          ?.projectedMetricRequiredMomentumToEnergyRatio ?? null;
      const blockers = projectionApplicable
        ? projected == null
          ? ["projected_metric_required_momentum_ratio_missing"]
          : projected > CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT
            ? ["metric_required_momentum_density_causal_bound_exceeded"]
            : []
        : [receipt.summary.firstBlocker ?? "momentum_frame_projection_not_applicable"];
      return {
        regionId,
        componentId,
        projectedMetricRequiredMomentumToEnergyRatio: projected,
        causalMomentumToEnergyRatioLimit: CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT,
        exceedanceFactor:
          projected == null ? null : projected / CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT,
        status: !projectionApplicable
          ? receipt.summary.causalBoundApplicabilityStatus === "missing"
            ? "missing"
            : "blocked"
          : projected == null
            ? "missing"
            : projected > CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT
              ? "fail"
              : "pass",
        blockers,
      } satisfies Nhm2MetricRequiredMomentumDemandComponentV1;
    }),
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
  const anyViolation =
    !projectionApplicable ? null : components.some((component) => component.status === "fail");
  return {
    contractVersion: NHM2_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: receipt.laneId,
    selectedProfileId: receipt.selectedProfileId,
    runId: receipt.runId,
    momentumFrameProjectionReceiptRef:
      input.momentumFrameProjectionReceiptRef ?? null,
    projectionEvidenceRef: receipt.momentumFrameProjectionEvidenceRef,
    projectionApplicabilityStatus: receipt.summary.causalBoundApplicabilityStatus,
    ratioPolicy: receipt.frame.ratioPolicy,
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
      currentMetricProfileFalsified: anyViolation === true,
      falsifierScope:
        anyViolation === true
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

const isStatus = (value: unknown): value is Nhm2MetricRequiredMomentumDemandStatus =>
  value === "pass" || value === "fail" || value === "missing" || value === "blocked";

const isComponent = (
  value: unknown,
): value is Nhm2MetricRequiredMomentumDemandComponentV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
      record.regionId as Nhm2RegionalSourceClosureRegionId,
    ) &&
    NHM2_MOMENTUM_DENSITY_COMPONENTS.includes(
      record.componentId as Nhm2MomentumDensityComponentId,
    ) &&
    isNullableNumber(record.projectedMetricRequiredMomentumToEnergyRatio) &&
    typeof record.causalMomentumToEnergyRatioLimit === "number" &&
    Number.isFinite(record.causalMomentumToEnergyRatioLimit) &&
    isNullableNumber(record.exceedanceFactor) &&
    isStatus(record.status) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2MetricRequiredMomentumDemandAudit = (
  value: unknown,
): value is Nhm2MetricRequiredMomentumDemandAuditV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary)
    ? record.claimBoundary
    : null;
  return (
    record != null &&
    record.contractVersion ===
      NHM2_METRIC_REQUIRED_MOMENTUM_DEMAND_AUDIT_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    isNullableText(record.momentumFrameProjectionReceiptRef) &&
    isNullableText(record.projectionEvidenceRef) &&
    (record.projectionApplicabilityStatus === "applicable" ||
      record.projectionApplicabilityStatus === "blocked" ||
      record.projectionApplicabilityStatus === "missing") &&
    (record.ratioPolicy === null || typeof record.ratioPolicy === "string") &&
    Array.isArray(record.components) &&
    record.components.every(isComponent) &&
    summary != null &&
    typeof summary.allProjectedRatiosAvailable === "boolean" &&
    (summary.anyProjectedMetricRequiredCausalMomentumBoundViolation === null ||
      typeof summary.anyProjectedMetricRequiredCausalMomentumBoundViolation ===
        "boolean") &&
    (summary.worstRegionId === null ||
      NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
        summary.worstRegionId as Nhm2RegionalSourceClosureRegionId,
      )) &&
    (summary.worstComponentId === null ||
      NHM2_MOMENTUM_DENSITY_COMPONENTS.includes(
        summary.worstComponentId as Nhm2MomentumDensityComponentId,
      )) &&
    isNullableNumber(summary.worstProjectedMetricRequiredMomentumToEnergyRatio) &&
    isNullableNumber(summary.worstExceedanceFactor) &&
    typeof summary.currentMetricProfileFalsified === "boolean" &&
    (summary.falsifierScope === "current_metric_profile_under_declared_projection" ||
      summary.falsifierScope === "not_applicable") &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.blockerCount === "number" &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.metricDemandAuditDoesNotValidatePhysicalSource === true &&
    claimBoundary.reducedOrderProjectionDoesNotReplaceFullAdmTetrad === true &&
    claimBoundary.currentProfileFalsifierDoesNotProveUniversalMetricImpossibility === true &&
    claimBoundary.transportClaimAllowed === false
  );
};
