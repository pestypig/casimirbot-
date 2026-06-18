import type {
  Nhm2RegionalFullTensorResidualArtifactV1,
  Nhm2RegionalFullTensorResidualComponentV1,
  Nhm2RegionalFullTensorResidualPassWindowV1,
} from "./nhm2-regional-full-tensor-residual.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "./nhm2-regional-source-closure-evidence.v1";
import type {
  Nhm2SourceComponentAuthority,
  Nhm2SourceComponentAuthorityLedgerArtifactV1,
  Nhm2SourceComponentAuthorityLedgerComponentV1,
} from "./nhm2-source-component-authority-ledger.v1";

export const NHM2_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT_CONTRACT_VERSION =
  "nhm2_source_off_diagonal_shear_audit/v1";

export const NHM2_OFF_DIAGONAL_SHEAR_COMPONENTS = ["T12", "T13", "T23"] as const;

export type Nhm2OffDiagonalShearComponentId =
  (typeof NHM2_OFF_DIAGONAL_SHEAR_COMPONENTS)[number];

export type Nhm2SourceOffDiagonalShearMechanismStatus =
  | "documented"
  | "missing"
  | "not_required"
  | "blocked";

export type Nhm2SourceOffDiagonalShearFalsifierScope =
  | "none"
  | "current_declared_source_model";

export type Nhm2SourceOffDiagonalShearAuditComponentV1 = {
  componentId: Nhm2OffDiagonalShearComponentId;
  metricRequired: number | null;
  tileEffectiveCounterpart: number | null;
  passWindow: Nhm2RegionalFullTensorResidualPassWindowV1 | null;
  relResidual: number | null;
  currentToAllowedMagnitudeRatio: number | null;
  sourceFractionOfAbsT00: number | null;
  metricRequiredFractionOfAbsT00: number | null;
  fractionalSuppressionToRequirement: number | null;
  correctionStatus:
    | "already_within_tolerance"
    | "reduce_magnitude_or_reorient"
    | "increase_magnitude"
    | "missing";
  authority: Nhm2SourceComponentAuthority | "unknown";
  mechanismStatus: Nhm2SourceOffDiagonalShearMechanismStatus;
  mechanismEvidenceRef: string | null;
  provenanceRef: string | null;
  blockers: string[];
};

export type Nhm2SourceOffDiagonalShearAuditRegionV1 = {
  regionId: Nhm2RegionalSourceClosureRegionId;
  status: "pass" | "review" | "fail" | "missing";
  components: Nhm2SourceOffDiagonalShearAuditComponentV1[];
  worstComponentId: Nhm2OffDiagonalShearComponentId | null;
  worstCurrentToAllowedMagnitudeRatio: number | null;
  blockers: string[];
};

export type Nhm2SourceOffDiagonalShearAuditArtifactV1 = {
  contractVersion: typeof NHM2_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  runId: string;
  sourceComponentAuthorityLedgerRef: string | null;
  regionalFullTensorResidualRef: string | null;
  regions: Nhm2SourceOffDiagonalShearAuditRegionV1[];
  summary: {
    allOffDiagonalComponentsPresent: boolean;
    allOffDiagonalWithinTolerance: boolean;
    anyShearMechanismMissing: boolean;
    worstRegionId: Nhm2RegionalSourceClosureRegionId | null;
    worstComponentId: Nhm2OffDiagonalShearComponentId | null;
    worstCurrentToAllowedMagnitudeRatio: number | null;
    uniformFractionalShearAnsatzDetected: boolean;
    sourceFractionByComponent: Record<Nhm2OffDiagonalShearComponentId, number | null>;
    worstFractionalSuppressionToRequirement: number | null;
    firstBlocker: string | null;
    falsifierCandidate: boolean;
    currentDeclaredSourceModelFalsified: boolean;
    falsifierScope: Nhm2SourceOffDiagonalShearFalsifierScope;
    falsifierReason: string | null;
    blockerCount: number;
  };
  claimBoundary: {
    diagnosticOnly: true;
    shearAuditDoesNotValidatePhysicalSource: true;
    passWindowCannotBeUsedAsSourceModelInput: true;
    missingShearMechanismBlocksClosure: true;
    currentModelFalsifierDoesNotProveUniversalSourceImpossibility: true;
  };
};

export type BuildNhm2SourceOffDiagonalShearAuditInput = {
  generatedAt?: string | null;
  sourceComponentAuthorityLedger: Nhm2SourceComponentAuthorityLedgerArtifactV1;
  regionalFullTensorResidual: Nhm2RegionalFullTensorResidualArtifactV1;
  sourceComponentAuthorityLedgerRef?: string | null;
  regionalFullTensorResidualRef?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isRegionId = (value: unknown): value is Nhm2RegionalSourceClosureRegionId =>
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(
    value as Nhm2RegionalSourceClosureRegionId,
  );

const isOffDiagonalComponent = (value: unknown): value is Nhm2OffDiagonalShearComponentId =>
  NHM2_OFF_DIAGONAL_SHEAR_COMPONENTS.includes(value as Nhm2OffDiagonalShearComponentId);

const hasDocumentedShearMechanism = (
  component: Nhm2SourceComponentAuthorityLedgerComponentV1 | null,
): boolean => {
  const searchable = [
    component?.receiptRef,
    component?.provenance.counterpartRegionRef,
    component?.provenance.derivationMode,
    component?.provenance.sourceModelId,
    component?.provenance.sourceModelVersion,
    ...(component?.blockers ?? []),
  ].join(" ");
  return /shear|off[-_ ]?diagonal|anisotrop|constitutive|lifshitz/i.test(
    searchable,
  );
};

const componentBlockers = (args: {
  residual: Nhm2RegionalFullTensorResidualComponentV1 | null;
  authority: Nhm2SourceComponentAuthority | "unknown";
  mechanismStatus: Nhm2SourceOffDiagonalShearMechanismStatus;
}): string[] => {
  const blockers: string[] = [];
  if (args.residual == null || args.residual.status === "missing") {
    blockers.push("off_diagonal_component_residual_missing");
  }
  if (args.authority !== "source_model" && args.authority !== "constitutive_model") {
    blockers.push("off_diagonal_component_source_authority_not_strong");
  }
  if (args.residual?.status === "fail") {
    blockers.push("off_diagonal_component_residual_exceeded");
  }
  if (args.mechanismStatus === "missing") {
    blockers.push("off_diagonal_shear_mechanism_missing");
  }
  if (args.mechanismStatus === "blocked") {
    blockers.push("off_diagonal_shear_mechanism_blocked");
  }
  return blockers;
};

const safeAbsRatio = (numerator: number | null, denominator: number | null): number | null => {
  if (numerator == null || denominator == null || denominator === 0) return null;
  const ratio = Math.abs(numerator) / Math.abs(denominator);
  return Number.isFinite(ratio) ? ratio : null;
};

const CURRENT_MODEL_FALSIFIER_RATIO_THRESHOLD = 1_000_000;

const buildRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  ledger: Nhm2SourceComponentAuthorityLedgerArtifactV1,
  residual: Nhm2RegionalFullTensorResidualArtifactV1,
): Nhm2SourceOffDiagonalShearAuditRegionV1 => {
  const ledgerRegion = ledger.regions.find((region) => region.regionId === regionId);
  const residualRegion = residual.regions.find((region) => region.regionId === regionId);
  if (ledgerRegion == null || residualRegion == null) {
    return {
      regionId,
      status: "missing",
      components: [],
      worstComponentId: null,
      worstCurrentToAllowedMagnitudeRatio: null,
      blockers: ["off_diagonal_shear_region_missing"],
    };
  }

  const components = NHM2_OFF_DIAGONAL_SHEAR_COMPONENTS.map((componentId) => {
    const ledgerComponent =
      ledgerRegion.components.find((component) => component.componentId === componentId) ?? null;
    const residualComponent =
      residualRegion.componentResiduals.find((component) => component.componentId === componentId) ?? null;
    const t00Residual =
      residualRegion.componentResiduals.find((component) => component.componentId === "T00") ?? null;
    const sourceFractionOfAbsT00 = safeAbsRatio(
      residualComponent?.tileEffectiveCounterpart ?? null,
      t00Residual?.tileEffectiveCounterpart ?? null,
    );
    const metricRequiredFractionOfAbsT00 = safeAbsRatio(
      residualComponent?.metricRequired ?? null,
      t00Residual?.metricRequired ?? null,
    );
    const fractionalSuppressionToRequirement =
      sourceFractionOfAbsT00 == null ||
      metricRequiredFractionOfAbsT00 == null ||
      metricRequiredFractionOfAbsT00 === 0
        ? null
        : sourceFractionOfAbsT00 / metricRequiredFractionOfAbsT00;
    const mechanismStatus: Nhm2SourceOffDiagonalShearMechanismStatus =
      residualComponent?.status === "pass"
        ? "not_required"
        : hasDocumentedShearMechanism(ledgerComponent)
          ? "documented"
          : ledgerComponent == null
            ? "blocked"
            : "missing";
    const authority = ledgerComponent?.authority ?? "unknown";
    const blockers = componentBlockers({
      residual: residualComponent,
      authority,
      mechanismStatus,
    });
    return {
      componentId,
      metricRequired: residualComponent?.metricRequired ?? null,
      tileEffectiveCounterpart: residualComponent?.tileEffectiveCounterpart ?? null,
      passWindow: residualComponent?.passWindow ?? null,
      relResidual: residualComponent?.relResidual ?? null,
      currentToAllowedMagnitudeRatio:
        residualComponent?.correctionHint.currentToAllowedMagnitudeRatio ?? null,
      sourceFractionOfAbsT00,
      metricRequiredFractionOfAbsT00,
      fractionalSuppressionToRequirement:
        fractionalSuppressionToRequirement != null &&
        Number.isFinite(fractionalSuppressionToRequirement)
          ? fractionalSuppressionToRequirement
          : null,
      correctionStatus: residualComponent?.correctionHint.status ?? "missing",
      authority,
      mechanismStatus,
      mechanismEvidenceRef: mechanismStatus === "documented" ? ledgerComponent?.receiptRef ?? null : null,
      provenanceRef: ledgerComponent?.provenance.counterpartRegionRef ?? null,
      blockers,
    } satisfies Nhm2SourceOffDiagonalShearAuditComponentV1;
  });

  const worst = components.reduce<Nhm2SourceOffDiagonalShearAuditComponentV1 | null>(
    (current, next) => {
      if (next.currentToAllowedMagnitudeRatio == null) return current;
      if (current == null || current.currentToAllowedMagnitudeRatio == null) return next;
      return next.currentToAllowedMagnitudeRatio > current.currentToAllowedMagnitudeRatio
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
    worstCurrentToAllowedMagnitudeRatio: worst?.currentToAllowedMagnitudeRatio ?? null,
    blockers,
  };
};

export const buildNhm2SourceOffDiagonalShearAudit = (
  input: BuildNhm2SourceOffDiagonalShearAuditInput,
): Nhm2SourceOffDiagonalShearAuditArtifactV1 => {
  const regions = NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
    buildRegion(regionId, input.sourceComponentAuthorityLedger, input.regionalFullTensorResidual),
  );
  const worstRegion = regions.reduce<Nhm2SourceOffDiagonalShearAuditRegionV1 | null>(
    (current, next) => {
      if (next.worstCurrentToAllowedMagnitudeRatio == null) return current;
      if (current == null || current.worstCurrentToAllowedMagnitudeRatio == null) return next;
      return next.worstCurrentToAllowedMagnitudeRatio > current.worstCurrentToAllowedMagnitudeRatio
        ? next
        : current;
    },
    null,
  );
  const blockers = regions.flatMap((region) =>
    region.blockers.map((blocker) => `${region.regionId}:${blocker}`),
  );
  const anyShearMechanismMissing = regions.some((region) =>
    region.components.some((component) => component.mechanismStatus === "missing"),
  );
  const fractionsByComponent = Object.fromEntries(
    NHM2_OFF_DIAGONAL_SHEAR_COMPONENTS.map((componentId) => {
      const values = regions
        .flatMap((region) => region.components)
        .filter((component) => component.componentId === componentId)
        .map((component) => component.sourceFractionOfAbsT00)
        .filter((value): value is number => value != null);
      if (values.length === 0) return [componentId, null];
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      return [componentId, mean];
    }),
  ) as Record<Nhm2OffDiagonalShearComponentId, number | null>;
  const allSourceFractions = regions
    .flatMap((region) => region.components)
    .map((component) => component.sourceFractionOfAbsT00)
    .filter((value): value is number => value != null);
  const allZeroShearSuppression =
    allSourceFractions.length > 0 &&
    allSourceFractions.every((value) => Math.abs(value) <= 1e-15);
  const uniformFractionalShearAnsatzDetected =
    !allZeroShearSuppression && NHM2_OFF_DIAGONAL_SHEAR_COMPONENTS.every(
    (componentId) => {
      const values = regions
        .flatMap((region) => region.components)
        .filter((component) => component.componentId === componentId)
        .map((component) => component.sourceFractionOfAbsT00)
        .filter((value): value is number => value != null);
      if (values.length < 2) return false;
      const max = Math.max(...values);
      const min = Math.min(...values);
      return Math.abs(max - min) <= Math.max(1e-15, Math.abs(max) * 1e-9);
    },
  );
  const worstFractionalSuppressionToRequirement = regions
    .flatMap((region) => region.components)
    .reduce<number | null>((current, component) => {
      const value = component.fractionalSuppressionToRequirement;
      if (value == null) return current;
      return current == null || value > current ? value : current;
    }, null);
  const falsifierCandidate =
    anyShearMechanismMissing &&
    ((worstRegion?.worstCurrentToAllowedMagnitudeRatio ?? 0) >
      CURRENT_MODEL_FALSIFIER_RATIO_THRESHOLD ||
      (worstFractionalSuppressionToRequirement ?? 0) >
        CURRENT_MODEL_FALSIFIER_RATIO_THRESHOLD);
  const currentDeclaredSourceModelFalsified =
    falsifierCandidate && uniformFractionalShearAnsatzDetected;
  const falsifierReason = currentDeclaredSourceModelFalsified
    ? "declared_uniform_fractional_off_diagonal_shear_without_mechanism_exceeds_required_suppression"
    : falsifierCandidate
      ? "off_diagonal_shear_residual_and_missing_mechanism_require_new_source_model_evidence"
      : null;
  return {
    contractVersion: NHM2_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.regionalFullTensorResidual.selectedProfileId,
    runId: input.regionalFullTensorResidual.runId,
    sourceComponentAuthorityLedgerRef: input.sourceComponentAuthorityLedgerRef ?? null,
    regionalFullTensorResidualRef: input.regionalFullTensorResidualRef ?? null,
    regions,
    summary: {
      allOffDiagonalComponentsPresent: regions.every((region) => region.status !== "missing"),
      allOffDiagonalWithinTolerance: regions.every((region) =>
        region.components.every((component) => component.correctionStatus === "already_within_tolerance"),
      ),
      anyShearMechanismMissing,
      worstRegionId: worstRegion?.regionId ?? null,
      worstComponentId: worstRegion?.worstComponentId ?? null,
      worstCurrentToAllowedMagnitudeRatio:
        worstRegion?.worstCurrentToAllowedMagnitudeRatio ?? null,
      uniformFractionalShearAnsatzDetected,
      sourceFractionByComponent: fractionsByComponent,
      worstFractionalSuppressionToRequirement,
      firstBlocker: blockers[0] ?? null,
      falsifierCandidate,
      currentDeclaredSourceModelFalsified,
      falsifierScope: currentDeclaredSourceModelFalsified
        ? "current_declared_source_model"
        : "none",
      falsifierReason,
      blockerCount: blockers.length,
    },
    claimBoundary: {
      diagnosticOnly: true,
      shearAuditDoesNotValidatePhysicalSource: true,
      passWindowCannotBeUsedAsSourceModelInput: true,
      missingShearMechanismBlocksClosure: true,
      currentModelFalsifierDoesNotProveUniversalSourceImpossibility: true,
    },
  };
};

const isMechanismStatus = (
  value: unknown,
): value is Nhm2SourceOffDiagonalShearMechanismStatus =>
  value === "documented" ||
  value === "missing" ||
  value === "not_required" ||
    value === "blocked";

const isFalsifierScope = (
  value: unknown,
): value is Nhm2SourceOffDiagonalShearFalsifierScope =>
  value === "none" || value === "current_declared_source_model";

const isCorrectionStatus = (
  value: unknown,
): value is Nhm2SourceOffDiagonalShearAuditComponentV1["correctionStatus"] =>
  value === "already_within_tolerance" ||
  value === "reduce_magnitude_or_reorient" ||
  value === "increase_magnitude" ||
  value === "missing";

const isAuthority = (value: unknown): value is Nhm2SourceComponentAuthority | "unknown" =>
  value === "source_model" ||
  value === "constitutive_model" ||
  value === "reduced_order_declared" ||
  value === "scalar_proxy" ||
  value === "metric_echo" ||
  value === "missing" ||
  value === "unknown";

const isPassWindow = (value: unknown): value is Nhm2RegionalFullTensorResidualPassWindowV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isFiniteNumber(record.minCounterpartForPassSI) &&
    isFiniteNumber(record.maxCounterpartForPassSI) &&
    isFiniteNumber(record.toleranceAbsSI) &&
    record.derivedFromMetricRequiredTensor === true &&
    record.sourceModelInputAllowed === false
  );
};

const isComponent = (
  value: unknown,
): value is Nhm2SourceOffDiagonalShearAuditComponentV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isOffDiagonalComponent(record.componentId) &&
    isNullableNumber(record.metricRequired) &&
    isNullableNumber(record.tileEffectiveCounterpart) &&
    (record.passWindow === null || isPassWindow(record.passWindow)) &&
    isNullableNumber(record.relResidual) &&
    isNullableNumber(record.currentToAllowedMagnitudeRatio) &&
    isNullableNumber(record.sourceFractionOfAbsT00) &&
    isNullableNumber(record.metricRequiredFractionOfAbsT00) &&
    isNullableNumber(record.fractionalSuppressionToRequirement) &&
    isCorrectionStatus(record.correctionStatus) &&
    isAuthority(record.authority) &&
    isMechanismStatus(record.mechanismStatus) &&
    isNullableText(record.mechanismEvidenceRef) &&
    isNullableText(record.provenanceRef) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText)
  );
};

const isRegion = (value: unknown): value is Nhm2SourceOffDiagonalShearAuditRegionV1 => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isRegionId(record.regionId) &&
    (record.status === "pass" ||
      record.status === "review" ||
      record.status === "fail" ||
      record.status === "missing") &&
    Array.isArray(record.components) &&
    record.components.every(isComponent) &&
    (record.worstComponentId === null || isOffDiagonalComponent(record.worstComponentId)) &&
    isNullableNumber(record.worstCurrentToAllowedMagnitudeRatio) &&
    Array.isArray(record.blockers) &&
    record.blockers.every(isText)
  );
};

export const isNhm2SourceOffDiagonalShearAudit = (
  value: unknown,
): value is Nhm2SourceOffDiagonalShearAuditArtifactV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const claimBoundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_SOURCE_OFF_DIAGONAL_SHEAR_AUDIT_CONTRACT_VERSION &&
    isText(record.generatedAt) &&
    record.laneId === "nhm2_shift_lapse" &&
    isText(record.selectedProfileId) &&
    isText(record.runId) &&
    isNullableText(record.sourceComponentAuthorityLedgerRef) &&
    isNullableText(record.regionalFullTensorResidualRef) &&
    Array.isArray(record.regions) &&
    record.regions.every(isRegion) &&
    summary != null &&
    typeof summary.allOffDiagonalComponentsPresent === "boolean" &&
    typeof summary.allOffDiagonalWithinTolerance === "boolean" &&
    typeof summary.anyShearMechanismMissing === "boolean" &&
    (summary.worstRegionId === null || isRegionId(summary.worstRegionId)) &&
    (summary.worstComponentId === null || isOffDiagonalComponent(summary.worstComponentId)) &&
    isNullableNumber(summary.worstCurrentToAllowedMagnitudeRatio) &&
    typeof summary.uniformFractionalShearAnsatzDetected === "boolean" &&
    isRecord(summary.sourceFractionByComponent) &&
    NHM2_OFF_DIAGONAL_SHEAR_COMPONENTS.every((componentId) =>
      isNullableNumber(summary.sourceFractionByComponent?.[componentId]),
    ) &&
    isNullableNumber(summary.worstFractionalSuppressionToRequirement) &&
    (summary.firstBlocker === null || isText(summary.firstBlocker)) &&
    typeof summary.falsifierCandidate === "boolean" &&
    typeof summary.currentDeclaredSourceModelFalsified === "boolean" &&
    isFalsifierScope(summary.falsifierScope) &&
    isNullableText(summary.falsifierReason) &&
    isFiniteNumber(summary.blockerCount) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.shearAuditDoesNotValidatePhysicalSource === true &&
    claimBoundary?.passWindowCannotBeUsedAsSourceModelInput === true &&
    claimBoundary?.missingShearMechanismBlocksClosure === true &&
    claimBoundary?.currentModelFalsifierDoesNotProveUniversalSourceImpossibility === true
  );
};
