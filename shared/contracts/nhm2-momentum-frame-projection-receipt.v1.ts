import type { Nhm2RegionalSupportFunctionAtlasV1 } from "./nhm2-regional-support-function-atlas.v1";
import {
  NHM2_MOMENTUM_DENSITY_COMPONENTS,
  type Nhm2MomentumDensityComponentId,
  type Nhm2SourceMomentumDensityAuditArtifactV1,
} from "./nhm2-source-momentum-density-audit.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";

export const NHM2_MOMENTUM_FRAME_PROJECTION_RECEIPT_CONTRACT_VERSION =
  "nhm2_momentum_frame_projection_receipt/v1";
export const NHM2_MOMENTUM_FRAME_PROJECTION_EVIDENCE_CONTRACT_VERSION =
  "nhm2_momentum_frame_projection_evidence/v1";

export type Nhm2MomentumFrameProjectionStatus = "pass" | "blocked" | "missing";
export type Nhm2MomentumFrameProjectionMethod =
  | "atlas_local_orthonormal_to_chart"
  | "declared_reduced_order_local_orthonormal"
  | "missing_tetrad"
  | "missing_atlas";
export type Nhm2MomentumFrameProjectionRatioPolicy =
  | "explicit_projected_ratios"
  | "use_audit_same_chart_ratios_as_local_frame_reduced_order";

export type Nhm2MomentumFrameProjectionEvidenceComponentV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  componentId: Nhm2MomentumDensityComponentId;
  projectedMetricRequiredMomentumToEnergyRatio: number | null;
  projectedSourceMomentumToEnergyRatio: number | null;
};

export type Nhm2MomentumFrameProjectionEvidenceV1 = {
  contractVersion: typeof NHM2_MOMENTUM_FRAME_PROJECTION_EVIDENCE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  regionalSupportFunctionAtlasRef: string | null;
  atlasHash: string | null;
  frame: {
    frameId: string;
    requestedFrame: "local_orthonormal";
    sourceTensorBasis: "local_orthonormal_to_chart";
    tetradRef: string;
    projectionMethod: Extract<
      Nhm2MomentumFrameProjectionMethod,
      "atlas_local_orthonormal_to_chart" | "declared_reduced_order_local_orthonormal"
    >;
    ratioPolicy: Nhm2MomentumFrameProjectionRatioPolicy;
    projectionStatus: Extract<Nhm2MomentumFrameProjectionStatus, "pass" | "blocked">;
    assumptions: string[];
    blockers: string[];
  };
  components: Nhm2MomentumFrameProjectionEvidenceComponentV1[];
  claimBoundary: {
    diagnosticOnly: true;
    projectionEvidenceDoesNotValidatePhysicalSource: true;
    reducedOrderFrameDoesNotReplaceFullAdmTetrad: true;
    causalBoundConclusionRequiresProjectionStatusPass: true;
  };
};

export type Nhm2MomentumFrameProjectionComponentV1 = {
  componentId: Nhm2MomentumDensityComponentId;
  sameChartMetricRequiredMomentumToEnergyRatio: number | null;
  projectedMetricRequiredMomentumToEnergyRatio: number | null;
  sameChartSourceMomentumToEnergyRatio: number | null;
  projectedSourceMomentumToEnergyRatio: number | null;
  projectionStatus: Nhm2MomentumFrameProjectionStatus;
  blockers: string[];
};

export type Nhm2MomentumFrameProjectionRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  projectionStatus: Nhm2MomentumFrameProjectionStatus;
  components: Nhm2MomentumFrameProjectionComponentV1[];
  blockers: string[];
};

export type Nhm2MomentumFrameProjectionReceiptV1 = {
  contractVersion: typeof NHM2_MOMENTUM_FRAME_PROJECTION_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  sourceMomentumDensityAuditRef: string | null;
  regionalSupportFunctionAtlasRef: string | null;
  atlasHash: string | null;
  momentumFrameProjectionEvidenceRef: string | null;
  frame: {
    requestedFrame: "local_orthonormal";
    sourceTensorBasis: "chart" | "local_orthonormal_to_chart" | "missing";
    tetradRef: string | null;
    projectionMethod: Nhm2MomentumFrameProjectionMethod;
    ratioPolicy: Nhm2MomentumFrameProjectionRatioPolicy | null;
    projectionStatus: Nhm2MomentumFrameProjectionStatus;
    assumptions: string[];
    blockers: string[];
  };
  regions: Nhm2MomentumFrameProjectionRegionV1[];
  summary: {
    projectionAvailable: boolean;
    causalBoundApplicabilityStatus: "applicable" | "blocked" | "missing";
    worstProjectedMetricRequiredMomentumToEnergyRatio: number | null;
    worstProjectedSourceMomentumToEnergyRatio: number | null;
    anyProjectedMetricRequiredCausalMomentumBoundViolation: boolean | null;
    anyProjectedSourceCausalMomentumBoundViolation: boolean | null;
    firstBlocker: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    frameProjectionDoesNotValidatePhysicalSource: true;
    chartBasisRatioCannotProveCausalBound: true;
    localFrameReceiptRequiredForCausalMaterialBound: true;
  };
};

export type BuildNhm2MomentumFrameProjectionReceiptInput = {
  generatedAt?: string | null;
  sourceMomentumDensityAudit: Nhm2SourceMomentumDensityAuditArtifactV1;
  regionalSupportFunctionAtlas?: Nhm2RegionalSupportFunctionAtlasV1 | null;
  sourceMomentumDensityAuditRef?: string | null;
  regionalSupportFunctionAtlasRef?: string | null;
  momentumFrameProjectionEvidence?: Nhm2MomentumFrameProjectionEvidenceV1 | null;
  momentumFrameProjectionEvidenceRef?: string | null;
};

const CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT = 1;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isRatioPolicy = (
  value: unknown,
): value is Nhm2MomentumFrameProjectionRatioPolicy =>
  value === "explicit_projected_ratios" ||
  value === "use_audit_same_chart_ratios_as_local_frame_reduced_order";

const evidenceComponent = (
  evidence: Nhm2MomentumFrameProjectionEvidenceV1 | null | undefined,
  regionId: Nhm2RegionalSourceClosureRegionId,
  componentId: Nhm2MomentumDensityComponentId,
): Nhm2MomentumFrameProjectionEvidenceComponentV1 | null =>
  evidence?.components.find(
    (component) => component.regionId === regionId && component.componentId === componentId,
  ) ?? null;

const projectionFrame = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1 | null | undefined,
  evidence: Nhm2MomentumFrameProjectionEvidenceV1 | null | undefined,
): Nhm2MomentumFrameProjectionReceiptV1["frame"] => {
  if (atlas == null) {
    return {
      requestedFrame: "local_orthonormal",
      sourceTensorBasis: "missing",
      tetradRef: null,
      projectionMethod: "missing_atlas",
      ratioPolicy: null,
      projectionStatus: "missing",
      assumptions: [],
      blockers: ["regional_support_function_atlas_missing"],
    };
  }
  if (evidence != null) {
    const blockers = Array.from(
      new Set([
        ...(evidence.atlasHash !== atlas.provenance.atlasHash
          ? ["momentum_projection_evidence_atlas_hash_mismatch"]
          : []),
        ...(evidence.laneId !== "" && evidence.laneId !== undefined && evidence.laneId !== null
          ? []
          : ["momentum_projection_evidence_lane_missing"]),
        ...evidence.frame.blockers,
      ]),
    );
    if (evidence.frame.projectionStatus === "pass" && blockers.length === 0) {
      return {
        requestedFrame: "local_orthonormal",
        sourceTensorBasis: "local_orthonormal_to_chart",
        tetradRef: evidence.frame.tetradRef,
        projectionMethod: evidence.frame.projectionMethod,
        ratioPolicy: evidence.frame.ratioPolicy,
        projectionStatus: "pass",
        assumptions: evidence.frame.assumptions,
        blockers: [],
      };
    }
    return {
      requestedFrame: "local_orthonormal",
      sourceTensorBasis: "local_orthonormal_to_chart",
      tetradRef: evidence.frame.tetradRef,
      projectionMethod: evidence.frame.projectionMethod,
      ratioPolicy: evidence.frame.ratioPolicy,
      projectionStatus: "blocked",
      assumptions: evidence.frame.assumptions,
      blockers: blockers.length === 0 ? ["momentum_projection_evidence_blocked"] : blockers,
    };
  }
  if (atlas.basisAndUnits.tensorBasis === "local_orthonormal_to_chart") {
    return {
      requestedFrame: "local_orthonormal",
      sourceTensorBasis: "local_orthonormal_to_chart",
      tetradRef: atlas.runIdentity.gridRef,
      projectionMethod: "atlas_local_orthonormal_to_chart",
      ratioPolicy: "use_audit_same_chart_ratios_as_local_frame_reduced_order",
      projectionStatus: "pass",
      assumptions: [
        "regional support atlas declares local orthonormal-to-chart tensor basis",
      ],
      blockers: [],
    };
  }
  return {
    requestedFrame: "local_orthonormal",
    sourceTensorBasis: "chart",
    tetradRef: null,
    projectionMethod: "missing_tetrad",
    ratioPolicy: null,
    projectionStatus: "blocked",
    assumptions: [],
    blockers: ["local_orthonormal_tetrad_or_projection_receipt_missing"],
  };
};

const buildComponent = (
  componentId: Nhm2MomentumDensityComponentId,
  audit: Nhm2SourceMomentumDensityAuditArtifactV1,
  regionId: Nhm2RegionalSourceClosureRegionId,
  frame: Nhm2MomentumFrameProjectionReceiptV1["frame"],
  evidence: Nhm2MomentumFrameProjectionEvidenceV1 | null | undefined,
): Nhm2MomentumFrameProjectionComponentV1 => {
  const auditRegion = audit.regions.find((region) => region.regionId === regionId);
  const auditComponent =
    auditRegion?.components.find((component) => component.componentId === componentId) ??
    null;
  const projectedEvidence = evidenceComponent(evidence, regionId, componentId);
  const frameStatus = frame.projectionStatus;
  const blockers =
    frameStatus === "pass"
      ? []
      : frameStatus === "missing"
        ? ["momentum_projection_atlas_missing"]
        : ["local_orthonormal_projection_missing"];
  return {
    componentId,
    sameChartMetricRequiredMomentumToEnergyRatio:
      auditComponent?.metricRequiredFractionOfAbsT00 ?? null,
    projectedMetricRequiredMomentumToEnergyRatio:
      frameStatus !== "pass"
        ? null
        : frame.ratioPolicy === "explicit_projected_ratios"
          ? projectedEvidence?.projectedMetricRequiredMomentumToEnergyRatio ?? null
          : auditComponent?.metricRequiredFractionOfAbsT00 ?? null,
    sameChartSourceMomentumToEnergyRatio: auditComponent?.sourceFractionOfAbsT00 ?? null,
    projectedSourceMomentumToEnergyRatio:
      frameStatus !== "pass"
        ? null
        : frame.ratioPolicy === "explicit_projected_ratios"
          ? projectedEvidence?.projectedSourceMomentumToEnergyRatio ?? null
          : auditComponent?.sourceFractionOfAbsT00 ?? null,
    projectionStatus: auditComponent == null ? "missing" : frameStatus,
    blockers:
      auditComponent == null
        ? ["momentum_component_audit_missing"]
        : frameStatus === "pass" &&
            frame.ratioPolicy === "explicit_projected_ratios" &&
            projectedEvidence == null
          ? ["momentum_component_projection_evidence_missing"]
          : blockers,
  };
};

export const buildNhm2MomentumFrameProjectionReceipt = (
  input: BuildNhm2MomentumFrameProjectionReceiptInput,
): Nhm2MomentumFrameProjectionReceiptV1 => {
  const frame = projectionFrame(
    input.regionalSupportFunctionAtlas,
    input.momentumFrameProjectionEvidence,
  );
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const components = NHM2_MOMENTUM_DENSITY_COMPONENTS.map((componentId) =>
      buildComponent(
        componentId,
        input.sourceMomentumDensityAudit,
        regionId,
        frame,
        input.momentumFrameProjectionEvidence,
      ),
    );
    const blockers = Array.from(
      new Set(
        components.flatMap((component) =>
          component.blockers.map((blocker) => `${component.componentId}:${blocker}`),
        ),
      ),
    );
    return {
      regionId,
      projectionStatus:
        components.every((component) => component.projectionStatus === "pass")
          ? "pass"
          : components.some((component) => component.projectionStatus === "missing")
            ? "missing"
            : "blocked",
      components,
      blockers,
    } satisfies Nhm2MomentumFrameProjectionRegionV1;
  });
  const projectedMetricRatios = regions
    .flatMap((region) => region.components)
    .map((component) => component.projectedMetricRequiredMomentumToEnergyRatio)
    .filter((value): value is number => value != null);
  const projectedSourceRatios = regions
    .flatMap((region) => region.components)
    .map((component) => component.projectedSourceMomentumToEnergyRatio)
    .filter((value): value is number => value != null);
  const blockers = Array.from(
    new Set([
      ...frame.blockers,
      ...regions.flatMap((region) =>
        region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
      ),
    ]),
  );
  const worstMetric =
    projectedMetricRatios.length === 0 ? null : Math.max(...projectedMetricRatios);
  const worstSource =
    projectedSourceRatios.length === 0 ? null : Math.max(...projectedSourceRatios);
  const projectionAvailable = frame.projectionStatus === "pass" && blockers.length === 0;
  return {
    contractVersion: NHM2_MOMENTUM_FRAME_PROJECTION_RECEIPT_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: input.sourceMomentumDensityAudit.laneId,
    selectedProfileId: input.sourceMomentumDensityAudit.selectedProfileId,
    runId: input.sourceMomentumDensityAudit.runId,
    sourceMomentumDensityAuditRef: input.sourceMomentumDensityAuditRef ?? null,
    regionalSupportFunctionAtlasRef: input.regionalSupportFunctionAtlasRef ?? null,
    atlasHash: input.regionalSupportFunctionAtlas?.provenance.atlasHash ?? null,
    momentumFrameProjectionEvidenceRef: input.momentumFrameProjectionEvidenceRef ?? null,
    frame,
    regions,
    summary: {
      projectionAvailable,
      causalBoundApplicabilityStatus: projectionAvailable
        ? "applicable"
        : frame.projectionStatus === "missing"
          ? "missing"
          : "blocked",
      worstProjectedMetricRequiredMomentumToEnergyRatio: worstMetric,
      worstProjectedSourceMomentumToEnergyRatio: worstSource,
      anyProjectedMetricRequiredCausalMomentumBoundViolation:
        projectionAvailable && worstMetric != null
          ? worstMetric > CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT
          : null,
      anyProjectedSourceCausalMomentumBoundViolation:
        projectionAvailable && worstSource != null
          ? worstSource > CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT
          : null,
      firstBlocker: blockers[0] ?? null,
      blockerCount: blockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      frameProjectionDoesNotValidatePhysicalSource: true,
      chartBasisRatioCannotProveCausalBound: true,
      localFrameReceiptRequiredForCausalMaterialBound: true,
    },
  };
};

const isStatus = (value: unknown): value is Nhm2MomentumFrameProjectionStatus =>
  value === "pass" || value === "blocked" || value === "missing";

const isProjectionMethod = (value: unknown): value is Nhm2MomentumFrameProjectionMethod =>
  value === "atlas_local_orthonormal_to_chart" ||
  value === "declared_reduced_order_local_orthonormal" ||
  value === "missing_tetrad" ||
  value === "missing_atlas";

const isComponent = (value: unknown): value is Nhm2MomentumFrameProjectionComponentV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    NHM2_MOMENTUM_DENSITY_COMPONENTS.includes(
      record.componentId as Nhm2MomentumDensityComponentId,
    ) &&
    isNullableNumber(record.sameChartMetricRequiredMomentumToEnergyRatio) &&
    isNullableNumber(record.projectedMetricRequiredMomentumToEnergyRatio) &&
    isNullableNumber(record.sameChartSourceMomentumToEnergyRatio) &&
    isNullableNumber(record.projectedSourceMomentumToEnergyRatio) &&
    isStatus(record.projectionStatus) &&
    isStringArray(record.blockers)
  );
};

const isRegion = (value: unknown): value is Nhm2MomentumFrameProjectionRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
      record.regionId as Nhm2RegionalSourceClosureRegionId,
    ) &&
    isStatus(record.projectionStatus) &&
    Array.isArray(record.components) &&
    record.components.every(isComponent) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2MomentumFrameProjectionReceipt = (
  value: unknown,
): value is Nhm2MomentumFrameProjectionReceiptV1 => {
  const record = isRecord(value) ? value : null;
  const frame = isRecord(record?.frame) ? record.frame : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_MOMENTUM_FRAME_PROJECTION_RECEIPT_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    isNullableText(record.sourceMomentumDensityAuditRef) &&
    isNullableText(record.regionalSupportFunctionAtlasRef) &&
    isNullableText(record.atlasHash) &&
    isNullableText(record.momentumFrameProjectionEvidenceRef) &&
    frame != null &&
    frame.requestedFrame === "local_orthonormal" &&
    (frame.sourceTensorBasis === "chart" ||
      frame.sourceTensorBasis === "local_orthonormal_to_chart" ||
      frame.sourceTensorBasis === "missing") &&
    isNullableText(frame.tetradRef) &&
    isProjectionMethod(frame.projectionMethod) &&
    (frame.ratioPolicy === null || isRatioPolicy(frame.ratioPolicy)) &&
    isStatus(frame.projectionStatus) &&
    Array.isArray(frame.assumptions) &&
    frame.assumptions.every((entry) => typeof entry === "string") &&
    isStringArray(frame.blockers) &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.projectionAvailable === "boolean" &&
    (summary.causalBoundApplicabilityStatus === "applicable" ||
      summary.causalBoundApplicabilityStatus === "blocked" ||
      summary.causalBoundApplicabilityStatus === "missing") &&
    isNullableNumber(summary.worstProjectedMetricRequiredMomentumToEnergyRatio) &&
    isNullableNumber(summary.worstProjectedSourceMomentumToEnergyRatio) &&
    (summary.anyProjectedMetricRequiredCausalMomentumBoundViolation === null ||
      typeof summary.anyProjectedMetricRequiredCausalMomentumBoundViolation === "boolean") &&
    (summary.anyProjectedSourceCausalMomentumBoundViolation === null ||
      typeof summary.anyProjectedSourceCausalMomentumBoundViolation === "boolean") &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.frameProjectionDoesNotValidatePhysicalSource === true &&
    claimBoundary.chartBasisRatioCannotProveCausalBound === true &&
    claimBoundary.localFrameReceiptRequiredForCausalMaterialBound === true
  );
};

const isEvidenceComponent = (
  value: unknown,
): value is Nhm2MomentumFrameProjectionEvidenceComponentV1 => {
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
    isNullableNumber(record.projectedSourceMomentumToEnergyRatio)
  );
};

export const isNhm2MomentumFrameProjectionEvidence = (
  value: unknown,
): value is Nhm2MomentumFrameProjectionEvidenceV1 => {
  const record = isRecord(value) ? value : null;
  const frame = isRecord(record?.frame) ? record.frame : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_MOMENTUM_FRAME_PROJECTION_EVIDENCE_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    isNullableText(record.regionalSupportFunctionAtlasRef) &&
    isNullableText(record.atlasHash) &&
    frame != null &&
    typeof frame.frameId === "string" &&
    frame.requestedFrame === "local_orthonormal" &&
    frame.sourceTensorBasis === "local_orthonormal_to_chart" &&
    typeof frame.tetradRef === "string" &&
    (frame.projectionMethod === "atlas_local_orthonormal_to_chart" ||
      frame.projectionMethod === "declared_reduced_order_local_orthonormal") &&
    isRatioPolicy(frame.ratioPolicy) &&
    (frame.projectionStatus === "pass" || frame.projectionStatus === "blocked") &&
    Array.isArray(frame.assumptions) &&
    frame.assumptions.every((entry) => typeof entry === "string") &&
    isStringArray(frame.blockers) &&
    Array.isArray(record.components) &&
    record.components.every(isEvidenceComponent) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.projectionEvidenceDoesNotValidatePhysicalSource === true &&
    claimBoundary.reducedOrderFrameDoesNotReplaceFullAdmTetrad === true &&
    claimBoundary.causalBoundConclusionRequiresProjectionStatusPass === true
  );
};
