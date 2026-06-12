import type { CasimirMaterialReceiptV1 } from "./casimir-material-receipt.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorAuthorityMode,
  type Nhm2TensorComponent,
} from "./nhm2-regional-source-closure-evidence.v1";
import type {
  Nhm2RegionalSourceTensorTargetRegionV1,
  Nhm2RegionalSourceTensorTargetsArtifactV1,
  Nhm2RegionalSourceTensorTuningDirection,
} from "./nhm2-regional-source-tensor-targets.v1";

export const NHM2_REGIONAL_SOURCE_TENSOR_CANDIDATE_CONTRACT_VERSION =
  "nhm2_regional_source_tensor_candidate/v1";

export const NHM2_REGIONAL_SOURCE_TENSOR_CANDIDATE_COMPONENT_STATUS = [
  "target_fit",
  "template_scaled",
  "material_receipted",
  "missing",
  "blocked",
] as const;

export type Nhm2RegionalSourceTensorCandidateComponentStatus =
  (typeof NHM2_REGIONAL_SOURCE_TENSOR_CANDIDATE_COMPONENT_STATUS)[number];

export type Nhm2RegionalSourceTensorCandidateKind =
  | "target_fit_T00_only"
  | "template_scaled_tensor"
  | "material_receipted_tensor"
  | "missing";

export type Nhm2RegionalSourceTensorCandidateTemplateRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  tensor: Nhm2RegionalTensor;
  provenanceRef?: string | null;
};

export type Nhm2RegionalSourceTensorCandidateTemplateV1 = {
  templateId?: string | null;
  chartId?: string | null;
  regions?: Nhm2RegionalSourceTensorCandidateTemplateRegionV1[];
};

export type Nhm2RegionalSourceTensorCandidateRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  candidateKind: Nhm2RegionalSourceTensorCandidateKind;
  currentT00_SI: number | null;
  targetT00_SI: number | null;
  proposedT00_SI: number | null;
  T00ScaleFactor: number | null;
  deltaToTargetT00_SI: number | null;
  relativeErrorToTarget: number | null;
  scalarT00WithinTolerance: boolean | null;
  tuningDirection: Nhm2RegionalSourceTensorTuningDirection;
  tensor: Nhm2RegionalTensor;
  componentStatus: Partial<
    Record<Nhm2TensorComponent, Nhm2RegionalSourceTensorCandidateComponentStatus>
  >;
  tensorAuthorityMode: Nhm2TensorAuthorityMode;
  missingComponentIds: Nhm2TensorComponent[];
  materialReceiptStatus:
    | "material_receipted"
    | "ideal_scalar_only"
    | "blocked"
    | "missing";
  provenance: {
    source: "target_fit" | "template_scaled" | "material_receipt" | "missing";
    targetRef: string;
    templateRef: string | null;
    materialReceiptRef: string | null;
    notDerivedFromMetricRequiredTensor: false;
  };
  blockers: string[];
  warnings: string[];
};

export type Nhm2RegionalSourceTensorCandidateArtifactV1 = {
  contractVersion: typeof NHM2_REGIONAL_SOURCE_TENSOR_CANDIDATE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  runId: string;
  artifactRefs: {
    regionalSourceTensorTargets: string;
    fullTensorTemplate: string | null;
    materialReceipt: string | null;
  };
  regions: Nhm2RegionalSourceTensorCandidateRegionV1[];
  summary: {
    allRegionsHaveCandidate: boolean;
    allRegionsScalarAligned: boolean;
    allRegionsFullTensorCandidate: boolean;
    materialReceipted: boolean;
    regionalMaterialSourceModelReady: boolean;
    firstBlocker: string;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    targetFitDoesNotValidateMaterialSource: true;
    candidateDoesNotPassHarness: true;
    physicalClaimAllowed: false;
    transportClaimAllowed: false;
  };
};

export type BuildNhm2RegionalSourceTensorCandidateInput = {
  generatedAt?: string | null;
  artifactRefs: {
    regionalSourceTensorTargets: string;
    fullTensorTemplate?: string | null;
    materialReceipt?: string | null;
  };
  targets: Nhm2RegionalSourceTensorTargetsArtifactV1;
  fullTensorTemplate?: Nhm2RegionalSourceTensorCandidateTemplateV1 | null;
  materialReceipt?: CasimirMaterialReceiptV1 | null;
};

const SYMMETRIC_TENSOR_COMPONENTS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const satisfies readonly Nhm2TensorComponent[];

const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );

const safeDivide = (numerator: number | null, denominator: number | null): number | null =>
  numerator == null || denominator == null || denominator === 0
    ? null
    : numerator / denominator;

const subtract = (left: number | null, right: number | null): number | null =>
  left == null || right == null ? null : left - right;

const templateByRegion = (
  template: Nhm2RegionalSourceTensorCandidateTemplateV1 | null | undefined,
): Map<Nhm2RegionalSourceClosureRegionId, Nhm2RegionalSourceTensorCandidateTemplateRegionV1> =>
  new Map(
    (template?.regions ?? []).map((region) => [region.regionId, region]),
  );

const inferAuthority = (tensor: Nhm2RegionalTensor): Nhm2TensorAuthorityMode => {
  const available = new Set(
    NHM2_TENSOR_COMPONENTS.filter((component) => tensor[component] != null),
  );
  if (NHM2_TENSOR_COMPONENTS.every((component) => available.has(component))) {
    return "full_tensor";
  }
  if (SYMMETRIC_TENSOR_COMPONENTS.every((component) => available.has(component))) {
    return "symmetric_full_tensor";
  }
  if (["T00", "T11", "T22", "T33"].every((component) => available.has(component as Nhm2TensorComponent))) {
    return "diagonal_reduced_order";
  }
  return available.size > 0 ? "proxy" : "unknown";
};

const missingComponents = (tensor: Nhm2RegionalTensor): Nhm2TensorComponent[] => {
  const authority = inferAuthority(tensor);
  const required =
    authority === "symmetric_full_tensor"
      ? SYMMETRIC_TENSOR_COMPONENTS
      : NHM2_TENSOR_COMPONENTS;
  return required.filter((component) => tensor[component] == null);
};

const scaledTemplateTensor = (
  target: Nhm2RegionalSourceTensorTargetRegionV1,
  template: Nhm2RegionalSourceTensorCandidateTemplateRegionV1 | null,
): Nhm2RegionalTensor => {
  const scale = finite(target.requiredOverCurrentSource);
  const proposed: Nhm2RegionalTensor = {};
  if (template != null && scale != null) {
    for (const component of NHM2_TENSOR_COMPONENTS) {
      const value = finite(template.tensor[component]);
      if (value != null) proposed[component] = value * scale;
    }
  }
  if (proposed.T00 == null && target.targetSourceT00_SI != null) {
    proposed.T00 = target.targetSourceT00_SI;
  }
  return proposed;
};

const componentStatus = (
  tensor: Nhm2RegionalTensor,
  template: Nhm2RegionalSourceTensorCandidateTemplateRegionV1 | null,
  materialReceipted: boolean,
): Nhm2RegionalSourceTensorCandidateRegionV1["componentStatus"] => {
  const statuses: Nhm2RegionalSourceTensorCandidateRegionV1["componentStatus"] = {};
  for (const component of NHM2_TENSOR_COMPONENTS) {
    if (tensor[component] == null) {
      statuses[component] = "missing";
    } else if (materialReceipted && template != null) {
      statuses[component] = "material_receipted";
    } else if (template != null) {
      statuses[component] = "template_scaled";
    } else {
      statuses[component] = component === "T00" ? "target_fit" : "missing";
    }
  }
  return statuses;
};

const regionKind = (args: {
  tensor: Nhm2RegionalTensor;
  template: Nhm2RegionalSourceTensorCandidateTemplateRegionV1 | null;
  materialReceipted: boolean;
}): Nhm2RegionalSourceTensorCandidateKind => {
  const authority = inferAuthority(args.tensor);
  if (authority === "unknown") return "missing";
  if (args.template == null) return "target_fit_T00_only";
  if (args.materialReceipted && (authority === "full_tensor" || authority === "symmetric_full_tensor")) {
    return "material_receipted_tensor";
  }
  return "template_scaled_tensor";
};

const materialStatus = (
  receipt: CasimirMaterialReceiptV1 | null | undefined,
): Nhm2RegionalSourceTensorCandidateRegionV1["materialReceiptStatus"] =>
  receipt?.status ?? "missing";

const regionBlockers = (args: {
  target: Nhm2RegionalSourceTensorTargetRegionV1;
  tensor: Nhm2RegionalTensor;
  template: Nhm2RegionalSourceTensorCandidateTemplateRegionV1 | null;
  materialReceipted: boolean;
  materialReceiptStatus: Nhm2RegionalSourceTensorCandidateRegionV1["materialReceiptStatus"];
}): string[] => {
  const authority = inferAuthority(args.tensor);
  const missing = missingComponents(args.tensor);
  return unique([
    args.target.targetSourceT00_SI == null ? "target_T00_missing" : null,
    args.tensor.T00 == null ? "candidate_T00_missing" : null,
    args.template == null ? "full_tensor_template_missing" : null,
    args.template == null ? "target_fit_candidate_not_material_source" : null,
    args.template == null ? "target_fit_provenance_not_source_evidence" : null,
    authority !== "full_tensor" && authority !== "symmetric_full_tensor"
      ? "candidate_full_tensor_authority_missing"
      : null,
    missing.length > 0 ? "candidate_tensor_components_missing" : null,
    args.materialReceiptStatus !== "material_receipted"
      ? `material_receipt_status:${args.materialReceiptStatus}`
      : null,
    args.materialReceipted && args.template == null
      ? "material_receipt_without_tensor_template"
      : null,
  ]);
};

const candidateRegion = (args: {
  target: Nhm2RegionalSourceTensorTargetRegionV1;
  targetRef: string;
  templateRef: string | null;
  materialReceiptRef: string | null;
  template: Nhm2RegionalSourceTensorCandidateTemplateRegionV1 | null;
  materialReceipt: CasimirMaterialReceiptV1 | null | undefined;
}): Nhm2RegionalSourceTensorCandidateRegionV1 => {
  const materialReceiptStatus = materialStatus(args.materialReceipt);
  const materialReceipted = materialReceiptStatus === "material_receipted";
  const tensor = scaledTemplateTensor(args.target, args.template);
  const authority = inferAuthority(tensor);
  const missing = missingComponents(tensor);
  const proposedT00 = finite(tensor.T00);
  const delta = subtract(proposedT00, args.target.targetSourceT00_SI);
  const relativeError = safeDivide(
    delta == null ? null : Math.abs(delta),
    args.target.targetSourceT00_SI == null ? null : Math.abs(args.target.targetSourceT00_SI),
  );
  const source =
    args.template == null
      ? "target_fit"
      : materialReceipted
        ? "material_receipt"
        : "template_scaled";
  return {
    regionId: args.target.regionId,
    candidateKind: regionKind({
      tensor,
      template: args.template,
      materialReceipted,
    }),
    currentT00_SI: args.target.currentSourceT00_SI,
    targetT00_SI: args.target.targetSourceT00_SI,
    proposedT00_SI: proposedT00,
    T00ScaleFactor: args.target.requiredOverCurrentSource,
    deltaToTargetT00_SI: delta,
    relativeErrorToTarget: relativeError,
    scalarT00WithinTolerance: relativeError == null ? null : relativeError <= 0.1,
    tuningDirection: args.target.tuningDirection,
    tensor,
    componentStatus: componentStatus(tensor, args.template, materialReceipted),
    tensorAuthorityMode: authority,
    missingComponentIds: missing,
    materialReceiptStatus,
    provenance: {
      source,
      targetRef: args.targetRef,
      templateRef: args.templateRef,
      materialReceiptRef: args.materialReceiptRef,
      notDerivedFromMetricRequiredTensor: false,
    },
    blockers: regionBlockers({
      target: args.target,
      tensor,
      template: args.template,
      materialReceipted,
      materialReceiptStatus,
    }),
    warnings: unique([
      args.template == null
        ? "T00 is fitted directly to target and is not independent source evidence"
        : null,
      "candidate must be rerun through source authority, conservation, QEI, and observer gates",
      "conservation_recheck_required",
      "qei_worldline_dossier_recheck_required",
      "observer_robust_energy_condition_recheck_required",
    ]),
  };
};

export const buildNhm2RegionalSourceTensorCandidate = (
  input: BuildNhm2RegionalSourceTensorCandidateInput,
): Nhm2RegionalSourceTensorCandidateArtifactV1 => {
  const templates = templateByRegion(input.fullTensorTemplate);
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => {
    const target = input.targets.regions.find((entry) => entry.regionId === regionId);
    if (target == null) {
      const missingTarget: Nhm2RegionalSourceTensorTargetRegionV1 = {
        regionId,
        requiredT00_SI: null,
        currentSourceT00_SI: null,
        requiredOverCurrentSource: null,
        currentSourceOverRequired: null,
        currentRelativeResidual: null,
        toleranceRelLInf: null,
        targetSourceT00_SI: null,
        tuningDirection: "missing",
        scalarT00WithinTolerance: null,
        tensorAuthorityRequired: true,
        materialReceiptRequired: true,
        blockers: ["target_region_missing"],
      };
      return candidateRegion({
        target: missingTarget,
        targetRef: input.artifactRefs.regionalSourceTensorTargets,
        templateRef: input.artifactRefs.fullTensorTemplate ?? null,
        materialReceiptRef: input.artifactRefs.materialReceipt ?? null,
        template: templates.get(regionId) ?? null,
        materialReceipt: input.materialReceipt,
      });
    }
    return candidateRegion({
      target,
      targetRef: input.artifactRefs.regionalSourceTensorTargets,
      templateRef: input.artifactRefs.fullTensorTemplate ?? null,
      materialReceiptRef: input.artifactRefs.materialReceipt ?? null,
      template: templates.get(regionId) ?? null,
      materialReceipt: input.materialReceipt,
    });
  });
  const blockerCount = regions.reduce((sum, region) => sum + region.blockers.length, 0);
  const firstBlocked = regions.find((region) => region.blockers.length > 0);
  const allRegionsFullTensorCandidate = regions.every(
    (region) =>
      region.tensorAuthorityMode === "full_tensor" ||
      region.tensorAuthorityMode === "symmetric_full_tensor",
  );
  const materialReceipted = regions.every(
    (region) => region.materialReceiptStatus === "material_receipted",
  );
  return {
    contractVersion: NHM2_REGIONAL_SOURCE_TENSOR_CANDIDATE_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: input.targets.laneId,
    selectedProfileId: input.targets.selectedProfileId,
    runId: input.targets.runId,
    artifactRefs: {
      regionalSourceTensorTargets: input.artifactRefs.regionalSourceTensorTargets,
      fullTensorTemplate: input.artifactRefs.fullTensorTemplate ?? null,
      materialReceipt: input.artifactRefs.materialReceipt ?? null,
    },
    regions,
    summary: {
      allRegionsHaveCandidate: regions.every((region) => region.proposedT00_SI != null),
      allRegionsScalarAligned: regions.every(
        (region) => region.scalarT00WithinTolerance === true,
      ),
      allRegionsFullTensorCandidate,
      materialReceipted,
      regionalMaterialSourceModelReady:
        allRegionsFullTensorCandidate && materialReceipted && blockerCount === 0,
      firstBlocker:
        firstBlocked == null
          ? "none"
          : `${firstBlocked.regionId}:${firstBlocked.blockers[0]}`,
      blockerCount,
    },
    claimBoundary: {
      diagnosticOnly: true,
      targetFitDoesNotValidateMaterialSource: true,
      candidateDoesNotPassHarness: true,
      physicalClaimAllowed: false,
      transportClaimAllowed: false,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isComponent = (value: string): value is Nhm2TensorComponent =>
  NHM2_TENSOR_COMPONENTS.includes(value as Nhm2TensorComponent);

const isTensor = (value: unknown): value is Nhm2RegionalTensor => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    Object.entries(record).every(([key, entry]) => isComponent(key) && isNullableNumber(entry))
  );
};

const isAuthority = (value: unknown): value is Nhm2TensorAuthorityMode =>
  value === "full_tensor" ||
  value === "symmetric_full_tensor" ||
  value === "diagonal_reduced_order" ||
  value === "proxy" ||
  value === "unknown";

const isCandidateKind = (
  value: unknown,
): value is Nhm2RegionalSourceTensorCandidateKind =>
  value === "target_fit_T00_only" ||
  value === "template_scaled_tensor" ||
  value === "material_receipted_tensor" ||
  value === "missing";

const isComponentStatus = (
  value: unknown,
): value is Nhm2RegionalSourceTensorCandidateComponentStatus =>
  NHM2_REGIONAL_SOURCE_TENSOR_CANDIDATE_COMPONENT_STATUS.includes(
    value as Nhm2RegionalSourceTensorCandidateComponentStatus,
  );

const isMaterialStatus = (
  value: unknown,
): value is Nhm2RegionalSourceTensorCandidateRegionV1["materialReceiptStatus"] =>
  value === "material_receipted" ||
  value === "ideal_scalar_only" ||
  value === "blocked" ||
  value === "missing";

const isDirection = (value: unknown): value is Nhm2RegionalSourceTensorTuningDirection =>
  value === "increase_magnitude" ||
  value === "decrease_magnitude" ||
  value === "hold" ||
  value === "missing";

const isRegion = (
  value: unknown,
): value is Nhm2RegionalSourceTensorCandidateRegionV1 => {
  const record = isRecord(value) ? value : null;
  const statuses = isRecord(record?.componentStatus) ? record?.componentStatus : null;
  const provenance = isRecord(record?.provenance) ? record?.provenance : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    isCandidateKind(record.candidateKind) &&
    isNullableNumber(record.currentT00_SI) &&
    isNullableNumber(record.targetT00_SI) &&
    isNullableNumber(record.proposedT00_SI) &&
    isNullableNumber(record.T00ScaleFactor) &&
    isNullableNumber(record.deltaToTargetT00_SI) &&
    isNullableNumber(record.relativeErrorToTarget) &&
    (record.scalarT00WithinTolerance === null ||
      typeof record.scalarT00WithinTolerance === "boolean") &&
    isDirection(record.tuningDirection) &&
    isTensor(record.tensor) &&
    statuses != null &&
    Object.entries(statuses).every(([key, entry]) => isComponent(key) && isComponentStatus(entry)) &&
    isAuthority(record.tensorAuthorityMode) &&
    Array.isArray(record.missingComponentIds) &&
    record.missingComponentIds.every(isComponent) &&
    isMaterialStatus(record.materialReceiptStatus) &&
    provenance != null &&
    (provenance.source === "target_fit" ||
      provenance.source === "template_scaled" ||
      provenance.source === "material_receipt" ||
      provenance.source === "missing") &&
    isText(provenance.targetRef) &&
    isNullableText(provenance.templateRef) &&
    isNullableText(provenance.materialReceiptRef) &&
    provenance.notDerivedFromMetricRequiredTensor === false &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings)
  );
};

export const isNhm2RegionalSourceTensorCandidateArtifact = (
  value: unknown,
): value is Nhm2RegionalSourceTensorCandidateArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const refs = isRecord(record?.artifactRefs) ? record?.artifactRefs : null;
  const summary = isRecord(record?.summary) ? record?.summary : null;
  const boundary = isRecord(record?.claimBoundary) ? record?.claimBoundary : null;
  if (
    record == null ||
    record.contractVersion !== NHM2_REGIONAL_SOURCE_TENSOR_CANDIDATE_CONTRACT_VERSION ||
    !isText(record.generatedAt) ||
    record.laneId !== "nhm2_shift_lapse" ||
    !isText(record.selectedProfileId) ||
    !isText(record.runId) ||
    refs == null ||
    !isText(refs.regionalSourceTensorTargets) ||
    !isNullableText(refs.fullTensorTemplate) ||
    !isNullableText(refs.materialReceipt) ||
    !Array.isArray(record.regions) ||
    !record.regions.every(isRegion) ||
    summary == null ||
    typeof summary.allRegionsHaveCandidate !== "boolean" ||
    typeof summary.allRegionsScalarAligned !== "boolean" ||
    typeof summary.allRegionsFullTensorCandidate !== "boolean" ||
    typeof summary.materialReceipted !== "boolean" ||
    typeof summary.regionalMaterialSourceModelReady !== "boolean" ||
    !isText(summary.firstBlocker) ||
    typeof summary.blockerCount !== "number" ||
    !Number.isFinite(summary.blockerCount) ||
    boundary?.diagnosticOnly !== true ||
    boundary?.targetFitDoesNotValidateMaterialSource !== true ||
    boundary?.candidateDoesNotPassHarness !== true ||
    boundary?.physicalClaimAllowed !== false ||
    boundary?.transportClaimAllowed !== false
  ) {
    return false;
  }
  const regions = record.regions as Nhm2RegionalSourceTensorCandidateRegionV1[];
  const ids = new Set(regions.map((region) => region.regionId));
  if (ids.size !== NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.length) return false;
  return NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.every((regionId) =>
    ids.has(regionId),
  );
};
