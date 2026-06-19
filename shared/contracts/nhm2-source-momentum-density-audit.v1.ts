import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";
import type {
  Nhm2RegionalFullTensorResidualArtifactV1,
  Nhm2RegionalFullTensorResidualComponentV1,
} from "./nhm2-regional-full-tensor-residual.v1";
import type { Nhm2RegionalSupportFunctionAtlasV1 } from "./nhm2-regional-support-function-atlas.v1";
import type {
  Nhm2SourceComponentAuthority,
  Nhm2SourceComponentAuthorityLedgerArtifactV1,
  Nhm2SourceComponentAuthorityLedgerComponentV1,
} from "./nhm2-source-component-authority-ledger.v1";

export const NHM2_SOURCE_MOMENTUM_DENSITY_AUDIT_CONTRACT_VERSION =
  "nhm2_source_momentum_density_audit/v1";

export const NHM2_MOMENTUM_DENSITY_COMPONENTS = [
  "T01",
  "T02",
  "T03",
] as const;

export type Nhm2MomentumDensityComponentId =
  (typeof NHM2_MOMENTUM_DENSITY_COMPONENTS)[number];

export type Nhm2SourceMomentumDensityMechanismStatus =
  | "documented"
  | "missing"
  | "blocked"
  | "not_required";

export type Nhm2SourceMomentumDensityCausalBoundStatus =
  | "pass"
  | "fail"
  | "missing";

export type Nhm2SourceMomentumDensityCausalBoundApplicabilityStatus =
  | "applicable"
  | "blocked"
  | "missing";

export type Nhm2SourceMomentumDensityAuditComponentV1 = {
  componentId: Nhm2MomentumDensityComponentId;
  metricRequired: number | null;
  tileEffectiveCounterpart: number | null;
  passWindow: Nhm2RegionalFullTensorResidualComponentV1["passWindow"] | null;
  relResidual: number | null;
  currentToAllowedMagnitudeRatio: number | null;
  requiredAmplificationToPass: number | null;
  sourceFractionOfAbsT00: number | null;
  metricRequiredFractionOfAbsT00: number | null;
  sourceCausalMomentumBoundStatus: Nhm2SourceMomentumDensityCausalBoundStatus;
  metricRequiredCausalMomentumBoundStatus: Nhm2SourceMomentumDensityCausalBoundStatus;
  fractionalAmplificationToRequirement: number | null;
  correctionStatus: string;
  authority: Nhm2SourceComponentAuthority | "unknown";
  mechanismStatus: Nhm2SourceMomentumDensityMechanismStatus;
  mechanismEvidenceRef: string | null;
  provenanceRef: string | null;
  blockers: string[];
};

export type Nhm2SourceMomentumDensityAuditRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "pass" | "fail" | "missing";
  components: Nhm2SourceMomentumDensityAuditComponentV1[];
  worstComponentId: Nhm2MomentumDensityComponentId | null;
  worstRequiredAmplificationToPass: number | null;
  blockers: string[];
};

export type Nhm2SourceMomentumDensityAuditArtifactV1 = {
  contractVersion: typeof NHM2_SOURCE_MOMENTUM_DENSITY_AUDIT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  sourceComponentAuthorityLedgerRef: string | null;
  regionalFullTensorResidualRef: string | null;
  regionalSupportFunctionAtlasRef: string | null;
  regions: Nhm2SourceMomentumDensityAuditRegionV1[];
  summary: {
    allMomentumComponentsPresent: boolean;
    allMomentumWithinTolerance: boolean;
    anyMomentumMechanismMissing: boolean;
    worstRegionId: Nhm2RegionalSourceClosureRegionId | null;
    worstComponentId: Nhm2MomentumDensityComponentId | null;
    worstRequiredAmplificationToPass: number | null;
    worstMetricRequiredMomentumToEnergyRatio: number | null;
    worstSourceMomentumToEnergyRatio: number | null;
    causalMomentumBoundApplicabilityStatus: Nhm2SourceMomentumDensityCausalBoundApplicabilityStatus;
    causalMomentumBoundFrameRef: string | null;
    causalMomentumBoundRequiresLocalOrthonormalFrame: true;
    causalMomentumBoundApplicabilityBlockers: string[];
    anyMetricRequiredCausalMomentumBoundViolation: boolean;
    anySourceCausalMomentumBoundViolation: boolean;
    uniformFractionalMomentumAnsatzDetected: boolean;
    sourceFractionByComponent: Record<Nhm2MomentumDensityComponentId, number | null>;
    worstFractionalAmplificationToRequirement: number | null;
    firstBlocker: string | null;
    falsifierCandidate: boolean;
    currentDeclaredSourceModelFalsified: boolean;
    causalMaterialMomentumBoundFalsifier: boolean;
    falsifierScope: "current_declared_source_model" | "none";
    falsifierReason: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    momentumAuditDoesNotValidatePhysicalSource: true;
    passWindowCannotBeUsedAsSourceModelInput: true;
    missingMomentumMechanismBlocksClosure: true;
    currentModelFalsifierDoesNotProveUniversalSourceImpossibility: true;
  };
};

export type BuildNhm2SourceMomentumDensityAuditInput = {
  generatedAt?: string | null;
  sourceComponentAuthorityLedger: Nhm2SourceComponentAuthorityLedgerArtifactV1;
  regionalFullTensorResidual: Nhm2RegionalFullTensorResidualArtifactV1;
  regionalSupportFunctionAtlas?: Nhm2RegionalSupportFunctionAtlasV1 | null;
  sourceComponentAuthorityLedgerRef?: string | null;
  regionalFullTensorResidualRef?: string | null;
  regionalSupportFunctionAtlasRef?: string | null;
};

const CURRENT_MODEL_FALSIFIER_AMPLIFICATION_THRESHOLD = 1e6;
const CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT = 1;

const safeAbsRatio = (numerator: number | null, denominator: number | null): number | null => {
  if (numerator == null || denominator == null) return null;
  if (denominator === 0) {
    if (numerator === 0) return 0;
    return Number.MAX_VALUE;
  }
  return Math.abs(numerator) / Math.abs(denominator);
};

const textContainsMomentumMechanism = (value: string | null | undefined): boolean =>
  value != null &&
  /(momentum|poynting|flux|flow|current|boost|drift|em[_-]?momentum|constitutive[_-]?momentum)/i.test(
    value,
  );

const hasDocumentedMomentumMechanism = (
  component: Nhm2SourceComponentAuthorityLedgerComponentV1 | null,
): boolean =>
  component != null &&
  (textContainsMomentumMechanism(component.receiptRef) ||
    textContainsMomentumMechanism(component.provenance.sourceModelId) ||
    textContainsMomentumMechanism(component.provenance.derivationMode));

const componentBlockers = (input: {
  residual: Nhm2RegionalFullTensorResidualComponentV1 | null;
  authority: Nhm2SourceComponentAuthority | "unknown";
  mechanismStatus: Nhm2SourceMomentumDensityMechanismStatus;
  metricRequiredCausalMomentumBoundStatus: Nhm2SourceMomentumDensityCausalBoundStatus;
  sourceCausalMomentumBoundStatus: Nhm2SourceMomentumDensityCausalBoundStatus;
}): string[] => {
  const blockers: string[] = [];
  if (input.residual == null) blockers.push("momentum_component_residual_missing");
  if (input.residual != null && input.residual.status !== "pass") {
    blockers.push("momentum_component_residual_exceeded");
  }
  if (input.authority !== "source_model" && input.authority !== "constitutive_model") {
    blockers.push("momentum_component_source_authority_missing");
  }
  if (input.mechanismStatus === "missing") {
    blockers.push("momentum_density_mechanism_missing");
  }
  if (input.mechanismStatus === "blocked") {
    blockers.push("momentum_density_mechanism_blocked");
  }
  if (input.metricRequiredCausalMomentumBoundStatus === "fail") {
    blockers.push("metric_required_momentum_density_causal_bound_exceeded");
  }
  if (input.sourceCausalMomentumBoundStatus === "fail") {
    blockers.push("source_momentum_density_causal_bound_exceeded");
  }
  return Array.from(new Set(blockers));
};

const causalBoundStatus = (
  ratio: number | null,
): Nhm2SourceMomentumDensityCausalBoundStatus => {
  if (ratio == null) return "missing";
  return ratio <= CAUSAL_MOMENTUM_TO_ENERGY_RATIO_LIMIT ? "pass" : "fail";
};

const causalBoundApplicability = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1 | null | undefined,
): {
  status: Nhm2SourceMomentumDensityCausalBoundApplicabilityStatus;
  frameRef: string | null;
  blockers: string[];
} => {
  if (atlas == null) {
    return {
      status: "missing",
      frameRef: null,
      blockers: ["regional_support_function_atlas_missing"],
    };
  }
  if (atlas.basisAndUnits.tensorBasis === "local_orthonormal_to_chart") {
    return {
      status: "applicable",
      frameRef: atlas.runIdentity.gridRef,
      blockers: [],
    };
  }
  return {
    status: "blocked",
    frameRef: atlas.runIdentity.gridRef,
    blockers: [
      `causal_momentum_bound_requires_local_orthonormal_frame:atlas_tensor_basis=${atlas.basisAndUnits.tensorBasis}`,
    ],
  };
};

const buildRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  ledger: Nhm2SourceComponentAuthorityLedgerArtifactV1,
  residual: Nhm2RegionalFullTensorResidualArtifactV1,
): Nhm2SourceMomentumDensityAuditRegionV1 => {
  const ledgerRegion = ledger.regions.find((region) => region.regionId === regionId);
  const residualRegion = residual.regions.find((region) => region.regionId === regionId);
  if (ledgerRegion == null || residualRegion == null) {
    return {
      regionId,
      status: "missing",
      components: [],
      worstComponentId: null,
      worstRequiredAmplificationToPass: null,
      blockers: ["momentum_density_region_missing"],
    };
  }

  const components = NHM2_MOMENTUM_DENSITY_COMPONENTS.map((componentId) => {
    const ledgerComponent =
      ledgerRegion.components.find((component) => component.componentId === componentId) ?? null;
    const residualComponent =
      residualRegion.componentResiduals.find((component) => component.componentId === componentId) ??
      null;
    const t00Residual =
      residualRegion.componentResiduals.find((component) => component.componentId === "T00") ??
      null;
    const sourceFractionOfAbsT00 = safeAbsRatio(
      residualComponent?.tileEffectiveCounterpart ?? null,
      t00Residual?.tileEffectiveCounterpart ?? null,
    );
    const metricRequiredFractionOfAbsT00 = safeAbsRatio(
      residualComponent?.metricRequired ?? null,
      t00Residual?.metricRequired ?? null,
    );
    const sourceCausalMomentumBoundStatus = causalBoundStatus(sourceFractionOfAbsT00);
    const metricRequiredCausalMomentumBoundStatus = causalBoundStatus(
      metricRequiredFractionOfAbsT00,
    );
    const fractionalAmplificationToRequirement =
      sourceFractionOfAbsT00 == null ||
      sourceFractionOfAbsT00 === 0 ||
      metricRequiredFractionOfAbsT00 == null
        ? null
        : metricRequiredFractionOfAbsT00 / sourceFractionOfAbsT00;
    const currentToAllowedMagnitudeRatio =
      residualComponent?.correctionHint.currentToAllowedMagnitudeRatio ?? null;
    const requiredAmplificationToPass =
      currentToAllowedMagnitudeRatio != null && currentToAllowedMagnitudeRatio > 0
        ? 1 / currentToAllowedMagnitudeRatio
        : currentToAllowedMagnitudeRatio === 0
          ? Number.POSITIVE_INFINITY
          : null;
    const mechanismStatus: Nhm2SourceMomentumDensityMechanismStatus =
      residualComponent?.status === "pass"
        ? "not_required"
        : hasDocumentedMomentumMechanism(ledgerComponent)
          ? "documented"
          : ledgerComponent == null
            ? "blocked"
            : "missing";
    const authority = ledgerComponent?.authority ?? "unknown";
    const blockers = componentBlockers({
      residual: residualComponent,
      authority,
      mechanismStatus,
      metricRequiredCausalMomentumBoundStatus,
      sourceCausalMomentumBoundStatus,
    });
    return {
      componentId,
      metricRequired: residualComponent?.metricRequired ?? null,
      tileEffectiveCounterpart: residualComponent?.tileEffectiveCounterpart ?? null,
      passWindow: residualComponent?.passWindow ?? null,
      relResidual: residualComponent?.relResidual ?? null,
      currentToAllowedMagnitudeRatio,
      requiredAmplificationToPass:
        requiredAmplificationToPass != null && Number.isFinite(requiredAmplificationToPass)
          ? requiredAmplificationToPass
          : requiredAmplificationToPass === Number.POSITIVE_INFINITY
            ? Number.MAX_VALUE
            : null,
      sourceFractionOfAbsT00,
      metricRequiredFractionOfAbsT00,
      sourceCausalMomentumBoundStatus,
      metricRequiredCausalMomentumBoundStatus,
      fractionalAmplificationToRequirement:
        fractionalAmplificationToRequirement != null &&
        Number.isFinite(fractionalAmplificationToRequirement)
          ? fractionalAmplificationToRequirement
          : null,
      correctionStatus: residualComponent?.correctionHint.status ?? "missing",
      authority,
      mechanismStatus,
      mechanismEvidenceRef: mechanismStatus === "documented" ? ledgerComponent?.receiptRef ?? null : null,
      provenanceRef: ledgerComponent?.provenance.counterpartRegionRef ?? null,
      blockers,
    } satisfies Nhm2SourceMomentumDensityAuditComponentV1;
  });

  const worst = components.reduce<Nhm2SourceMomentumDensityAuditComponentV1 | null>(
    (current, next) => {
      if (next.requiredAmplificationToPass == null) return current;
      if (current == null || current.requiredAmplificationToPass == null) return next;
      return next.requiredAmplificationToPass > current.requiredAmplificationToPass
        ? next
        : current;
    },
    null,
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
    status: components.some((component) => component.correctionStatus === "missing")
      ? "missing"
      : blockers.length > 0
        ? "fail"
        : "pass",
    components,
    worstComponentId: worst?.componentId ?? null,
    worstRequiredAmplificationToPass: worst?.requiredAmplificationToPass ?? null,
    blockers,
  };
};

export const buildNhm2SourceMomentumDensityAudit = (
  input: BuildNhm2SourceMomentumDensityAuditInput,
): Nhm2SourceMomentumDensityAuditArtifactV1 => {
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    buildRegion(regionId, input.sourceComponentAuthorityLedger, input.regionalFullTensorResidual),
  );
  const worstRegion = regions.reduce<Nhm2SourceMomentumDensityAuditRegionV1 | null>(
    (current, next) => {
      if (next.worstRequiredAmplificationToPass == null) return current;
      if (current == null || current.worstRequiredAmplificationToPass == null) return next;
      return next.worstRequiredAmplificationToPass > current.worstRequiredAmplificationToPass
        ? next
        : current;
    },
    null,
  );
  const blockers = regions.flatMap((region) =>
    region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
  );
  const anyMomentumMechanismMissing = regions.some((region) =>
    region.components.some((component) => component.mechanismStatus === "missing"),
  );
  const fractionsByComponent = Object.fromEntries(
    NHM2_MOMENTUM_DENSITY_COMPONENTS.map((componentId) => {
      const values = regions
        .flatMap((region) => region.components)
        .filter((component) => component.componentId === componentId)
        .map((component) => component.sourceFractionOfAbsT00)
        .filter((value): value is number => value != null);
      if (values.length === 0) return [componentId, null];
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      return [componentId, mean];
    }),
  ) as Record<Nhm2MomentumDensityComponentId, number | null>;
  const allSourceFractions = regions
    .flatMap((region) => region.components)
    .map((component) => component.sourceFractionOfAbsT00)
    .filter((value): value is number => value != null);
  const allZeroMomentumSource =
    allSourceFractions.length > 0 &&
    allSourceFractions.every((value) => Math.abs(value) <= 1e-15);
  const uniformFractionalMomentumAnsatzDetected =
    !allZeroMomentumSource && NHM2_MOMENTUM_DENSITY_COMPONENTS.every((componentId) => {
      const values = regions
        .flatMap((region) => region.components)
        .filter((component) => component.componentId === componentId)
        .map((component) => component.sourceFractionOfAbsT00)
        .filter((value): value is number => value != null);
      if (values.length < 2) return false;
      const max = Math.max(...values);
      const min = Math.min(...values);
      return Math.abs(max - min) <= Math.max(1e-15, Math.abs(max) * 1e-9);
    });
  const worstFractionalAmplificationToRequirement = regions
    .flatMap((region) => region.components)
    .reduce<number | null>((current, component) => {
      const value = component.fractionalAmplificationToRequirement;
      if (value == null) return current;
      return current == null || value > current ? value : current;
    }, null);
  const worstMetricRequiredMomentumToEnergyRatio = regions
    .flatMap((region) => region.components)
    .reduce<number | null>((current, component) => {
      const value = component.metricRequiredFractionOfAbsT00;
      if (value == null) return current;
      return current == null || value > current ? value : current;
    }, null);
  const worstSourceMomentumToEnergyRatio = regions
    .flatMap((region) => region.components)
    .reduce<number | null>((current, component) => {
      const value = component.sourceFractionOfAbsT00;
      if (value == null) return current;
      return current == null || value > current ? value : current;
    }, null);
  const anyMetricRequiredCausalMomentumBoundViolation = regions.some((region) =>
    region.components.some(
      (component) => component.metricRequiredCausalMomentumBoundStatus === "fail",
    ),
  );
  const anySourceCausalMomentumBoundViolation = regions.some((region) =>
    region.components.some(
      (component) => component.sourceCausalMomentumBoundStatus === "fail",
    ),
  );
  const causalApplicability = causalBoundApplicability(input.regionalSupportFunctionAtlas);
  const falsifierCandidate =
    anyMomentumMechanismMissing &&
    ((worstRegion?.worstRequiredAmplificationToPass ?? 0) >
      CURRENT_MODEL_FALSIFIER_AMPLIFICATION_THRESHOLD ||
      (worstFractionalAmplificationToRequirement ?? 0) >
        CURRENT_MODEL_FALSIFIER_AMPLIFICATION_THRESHOLD);
  const currentDeclaredSourceModelFalsified =
    falsifierCandidate && uniformFractionalMomentumAnsatzDetected;
  const causalMaterialMomentumBoundFalsifier =
    causalApplicability.status === "applicable" &&
    anyMetricRequiredCausalMomentumBoundViolation;
  const falsifierReason = currentDeclaredSourceModelFalsified
    ? "declared_uniform_fractional_momentum_density_without_mechanism_exceeds_required_amplification"
    : causalMaterialMomentumBoundFalsifier
      ? "metric_required_momentum_density_exceeds_causal_material_momentum_bound"
    : falsifierCandidate
      ? "momentum_density_residual_and_missing_mechanism_require_new_source_model_evidence"
      : null;
  return {
    contractVersion: NHM2_SOURCE_MOMENTUM_DENSITY_AUDIT_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.regionalFullTensorResidual.selectedProfileId,
    runId: input.regionalFullTensorResidual.runId,
    sourceComponentAuthorityLedgerRef: input.sourceComponentAuthorityLedgerRef ?? null,
    regionalFullTensorResidualRef: input.regionalFullTensorResidualRef ?? null,
    regionalSupportFunctionAtlasRef: input.regionalSupportFunctionAtlasRef ?? null,
    regions,
    summary: {
      allMomentumComponentsPresent: regions.every((region) => region.status !== "missing"),
      allMomentumWithinTolerance: regions.every((region) =>
        region.components.every((component) => component.correctionStatus === "already_within_tolerance"),
      ),
      anyMomentumMechanismMissing,
      worstRegionId: worstRegion?.regionId ?? null,
      worstComponentId: worstRegion?.worstComponentId ?? null,
      worstRequiredAmplificationToPass: worstRegion?.worstRequiredAmplificationToPass ?? null,
      worstMetricRequiredMomentumToEnergyRatio,
      worstSourceMomentumToEnergyRatio,
      causalMomentumBoundApplicabilityStatus: causalApplicability.status,
      causalMomentumBoundFrameRef: causalApplicability.frameRef,
      causalMomentumBoundRequiresLocalOrthonormalFrame: true,
      causalMomentumBoundApplicabilityBlockers: causalApplicability.blockers,
      anyMetricRequiredCausalMomentumBoundViolation,
      anySourceCausalMomentumBoundViolation,
      uniformFractionalMomentumAnsatzDetected,
      sourceFractionByComponent: fractionsByComponent,
      worstFractionalAmplificationToRequirement,
      firstBlocker: blockers[0] ?? null,
      falsifierCandidate,
      currentDeclaredSourceModelFalsified,
      causalMaterialMomentumBoundFalsifier,
      falsifierScope: currentDeclaredSourceModelFalsified
        ? "current_declared_source_model"
        : "none",
      falsifierReason,
      blockerCount: blockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      momentumAuditDoesNotValidatePhysicalSource: true,
      passWindowCannotBeUsedAsSourceModelInput: true,
      missingMomentumMechanismBlocksClosure: true,
      currentModelFalsifierDoesNotProveUniversalSourceImpossibility: true,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isNullableText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isMomentumComponentId = (value: unknown): value is Nhm2MomentumDensityComponentId =>
  NHM2_MOMENTUM_DENSITY_COMPONENTS.includes(value as Nhm2MomentumDensityComponentId);

const isMechanismStatus = (
  value: unknown,
): value is Nhm2SourceMomentumDensityMechanismStatus =>
  value === "documented" ||
  value === "missing" ||
  value === "blocked" ||
  value === "not_required";

const isComponent = (
  value: unknown,
): value is Nhm2SourceMomentumDensityAuditComponentV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isMomentumComponentId(record.componentId) &&
    isNullableNumber(record.metricRequired) &&
    isNullableNumber(record.tileEffectiveCounterpart) &&
    (record.passWindow === null || isRecord(record.passWindow)) &&
    isNullableNumber(record.relResidual) &&
    isNullableNumber(record.currentToAllowedMagnitudeRatio) &&
    isNullableNumber(record.requiredAmplificationToPass) &&
    isNullableNumber(record.sourceFractionOfAbsT00) &&
    isNullableNumber(record.metricRequiredFractionOfAbsT00) &&
    (record.sourceCausalMomentumBoundStatus === "pass" ||
      record.sourceCausalMomentumBoundStatus === "fail" ||
      record.sourceCausalMomentumBoundStatus === "missing") &&
    (record.metricRequiredCausalMomentumBoundStatus === "pass" ||
      record.metricRequiredCausalMomentumBoundStatus === "fail" ||
      record.metricRequiredCausalMomentumBoundStatus === "missing") &&
    isNullableNumber(record.fractionalAmplificationToRequirement) &&
    typeof record.correctionStatus === "string" &&
    typeof record.authority === "string" &&
    isMechanismStatus(record.mechanismStatus) &&
    isNullableText(record.mechanismEvidenceRef) &&
    isNullableText(record.provenanceRef) &&
    isStringArray(record.blockers)
  );
};

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isRegion = (value: unknown): value is Nhm2SourceMomentumDensityAuditRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    (record.status === "pass" || record.status === "fail" || record.status === "missing") &&
    Array.isArray(record.components) &&
    record.components.every(isComponent) &&
    (record.worstComponentId === null || isMomentumComponentId(record.worstComponentId)) &&
    isNullableNumber(record.worstRequiredAmplificationToPass) &&
    isStringArray(record.blockers)
  );
};

export const isNhm2SourceMomentumDensityAudit = (
  value: unknown,
): value is Nhm2SourceMomentumDensityAuditArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_SOURCE_MOMENTUM_DENSITY_AUDIT_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    isNullableText(record.sourceComponentAuthorityLedgerRef) &&
    isNullableText(record.regionalFullTensorResidualRef) &&
    isNullableText(record.regionalSupportFunctionAtlasRef) &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.allMomentumComponentsPresent === "boolean" &&
    typeof summary.allMomentumWithinTolerance === "boolean" &&
    typeof summary.anyMomentumMechanismMissing === "boolean" &&
    (summary.worstRegionId === null || isRegionId(summary.worstRegionId)) &&
    (summary.worstComponentId === null || isMomentumComponentId(summary.worstComponentId)) &&
    isNullableNumber(summary.worstRequiredAmplificationToPass) &&
    isNullableNumber(summary.worstMetricRequiredMomentumToEnergyRatio) &&
    isNullableNumber(summary.worstSourceMomentumToEnergyRatio) &&
    (summary.causalMomentumBoundApplicabilityStatus === "applicable" ||
      summary.causalMomentumBoundApplicabilityStatus === "blocked" ||
      summary.causalMomentumBoundApplicabilityStatus === "missing") &&
    isNullableText(summary.causalMomentumBoundFrameRef) &&
    summary.causalMomentumBoundRequiresLocalOrthonormalFrame === true &&
    isStringArray(summary.causalMomentumBoundApplicabilityBlockers) &&
    typeof summary.anyMetricRequiredCausalMomentumBoundViolation === "boolean" &&
    typeof summary.anySourceCausalMomentumBoundViolation === "boolean" &&
    typeof summary.uniformFractionalMomentumAnsatzDetected === "boolean" &&
    isRecord(summary.sourceFractionByComponent) &&
    NHM2_MOMENTUM_DENSITY_COMPONENTS.every((componentId) =>
      isNullableNumber(summary.sourceFractionByComponent?.[componentId]),
    ) &&
    isNullableNumber(summary.worstFractionalAmplificationToRequirement) &&
    isNullableText(summary.firstBlocker) &&
    typeof summary.falsifierCandidate === "boolean" &&
    typeof summary.currentDeclaredSourceModelFalsified === "boolean" &&
    typeof summary.causalMaterialMomentumBoundFalsifier === "boolean" &&
    (summary.falsifierScope === "current_declared_source_model" ||
      summary.falsifierScope === "none") &&
    isNullableText(summary.falsifierReason) &&
    typeof summary.blockerCount === "number" &&
    Number.isFinite(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary.momentumAuditDoesNotValidatePhysicalSource === true &&
    claimBoundary.passWindowCannotBeUsedAsSourceModelInput === true &&
    claimBoundary.missingMomentumMechanismBlocksClosure === true &&
    claimBoundary.currentModelFalsifierDoesNotProveUniversalSourceImpossibility === true
  );
};
