export const CASIMIR_MATERIAL_RECEIPT_CONTRACT_VERSION =
  "casimir_material_receipt/v1";
export const CASIMIR_MATERIAL_RECEIPT_ARTIFACT_REF =
  "casimir_material_receipt";

export const CASIMIR_GAP_METROLOGY_STATUS_VALUES = [
  "measured",
  "design",
  "proxy",
  "missing",
] as const;

export const CASIMIR_BEYOND_PFA_VALIDITY_VALUES = [
  "pass",
  "fail",
  "unknown",
  "not_evaluated",
] as const;

export const CASIMIR_MATERIAL_MODEL_KIND_VALUES = [
  "lifshitz",
  "perfect_conductor_ideal",
  "measured_dielectric",
  "missing",
] as const;

export const CASIMIR_VACUUM_SEAL_EVIDENCE_VALUES = [
  "present",
  "missing",
  "proxy",
] as const;

export const CASIMIR_MATERIAL_RECEIPT_STATUS_VALUES = [
  "material_receipted",
  "ideal_scalar_only",
  "blocked",
  "missing",
] as const;

export const CASIMIR_MATERIAL_RECEIPT_LITERATURE_REFS = [
  "reid_white_johnson_2010_arbitrary_geometry_casimir",
  "klimchitskaya_mohideen_mostepanenko_2009_lifshitz_review",
] as const;

export type CasimirGapMetrologyStatus =
  (typeof CASIMIR_GAP_METROLOGY_STATUS_VALUES)[number];
export type CasimirBeyondPfaValidity =
  (typeof CASIMIR_BEYOND_PFA_VALIDITY_VALUES)[number];
export type CasimirMaterialModelKind =
  (typeof CASIMIR_MATERIAL_MODEL_KIND_VALUES)[number];
export type CasimirVacuumSealEvidence =
  (typeof CASIMIR_VACUUM_SEAL_EVIDENCE_VALUES)[number];
export type CasimirMaterialReceiptStatus =
  (typeof CASIMIR_MATERIAL_RECEIPT_STATUS_VALUES)[number];

export type CasimirMaterialReceiptV1 = {
  contractVersion: typeof CASIMIR_MATERIAL_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  tileBatchId: string;
  geometry: {
    gapMeters: number | null;
    gapMetrologyStatus: CasimirGapMetrologyStatus;
    roughnessRmsMeters: number | null;
    beyondPfaValidity: CasimirBeyondPfaValidity;
  };
  material: {
    modelKind: CasimirMaterialModelKind;
    dielectricResponseRef?: string;
    finiteConductivityIncluded: boolean;
    finiteTemperatureIncluded: boolean;
    roughnessCorrectionIncluded: boolean;
  };
  environment: {
    vacuumSealEvidence: CasimirVacuumSealEvidence;
    temperatureK: number | null;
  };
  correctionFactors: {
    conductivity: number | null;
    temperature: number | null;
    roughness: number | null;
    geometry: number | null;
  };
  status: CasimirMaterialReceiptStatus;
  literatureRefs: typeof CASIMIR_MATERIAL_RECEIPT_LITERATURE_REFS;
  claimBoundary: {
    diagnosticOnly: true;
    idealCasimirDoesNotValidateTileSource: true;
  };
};

type PartialReceiptInput = {
  generatedAt?: string | null;
  tileBatchId?: string | null;
  geometry?: Partial<CasimirMaterialReceiptV1["geometry"]> | null;
  material?: Partial<CasimirMaterialReceiptV1["material"]> | null;
  environment?: Partial<CasimirMaterialReceiptV1["environment"]> | null;
  correctionFactors?: Partial<CasimirMaterialReceiptV1["correctionFactors"]> | null;
  status?: CasimirMaterialReceiptStatus | null;
};

export type BuildCasimirMaterialReceiptInput = PartialReceiptInput;

const DEFAULT_GENERATED_AT = "1970-01-01T00:00:00.000Z";

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFiniteOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const normalizeEnum = <T extends readonly string[]>(
  values: T,
  value: unknown,
  fallback: T[number],
): T[number] => {
  const text = asText(value);
  return values.includes(text as T[number]) ? (text as T[number]) : fallback;
};

const normalizeGapMetrologyStatus = (value: unknown): CasimirGapMetrologyStatus =>
  normalizeEnum(CASIMIR_GAP_METROLOGY_STATUS_VALUES, value, "missing");

const normalizeBeyondPfaValidity = (value: unknown): CasimirBeyondPfaValidity =>
  normalizeEnum(CASIMIR_BEYOND_PFA_VALIDITY_VALUES, value, "not_evaluated");

const normalizeMaterialModelKind = (value: unknown): CasimirMaterialModelKind =>
  normalizeEnum(CASIMIR_MATERIAL_MODEL_KIND_VALUES, value, "missing");

const normalizeVacuumSealEvidence = (value: unknown): CasimirVacuumSealEvidence =>
  normalizeEnum(CASIMIR_VACUUM_SEAL_EVIDENCE_VALUES, value, "missing");

const normalizeReceiptStatus = (value: unknown): CasimirMaterialReceiptStatus | null => {
  const text = asText(value);
  return CASIMIR_MATERIAL_RECEIPT_STATUS_VALUES.includes(
    text as CasimirMaterialReceiptStatus,
  )
    ? (text as CasimirMaterialReceiptStatus)
    : null;
};

const allCorrectionsFinite = (
  corrections: CasimirMaterialReceiptV1["correctionFactors"],
): boolean =>
  corrections.conductivity != null &&
  corrections.temperature != null &&
  corrections.roughness != null &&
  corrections.geometry != null;

export const deriveCasimirMaterialReceiptStatus = (args: {
  geometry: CasimirMaterialReceiptV1["geometry"];
  material: CasimirMaterialReceiptV1["material"];
  environment: CasimirMaterialReceiptV1["environment"];
  correctionFactors: CasimirMaterialReceiptV1["correctionFactors"];
  requestedStatus?: CasimirMaterialReceiptStatus | null;
}): CasimirMaterialReceiptStatus => {
  const materialModelReceiptable =
    args.material.modelKind === "lifshitz" ||
    args.material.modelKind === "measured_dielectric";
  const materialResponseComplete =
    materialModelReceiptable &&
    asText(args.material.dielectricResponseRef) != null &&
    args.material.finiteConductivityIncluded &&
    args.material.finiteTemperatureIncluded &&
    args.material.roughnessCorrectionIncluded;
  const geometryComplete =
    args.geometry.gapMeters != null &&
    args.geometry.gapMetrologyStatus === "measured" &&
    args.geometry.beyondPfaValidity === "pass";
  const environmentComplete =
    args.environment.vacuumSealEvidence === "present" &&
    args.environment.temperatureK != null;

  if (
    materialResponseComplete &&
    geometryComplete &&
    environmentComplete &&
    allCorrectionsFinite(args.correctionFactors)
  ) {
    return "material_receipted";
  }

  const hasAnyGeometry =
    args.geometry.gapMeters != null || args.geometry.roughnessRmsMeters != null;
  const hasAnyCorrection =
    args.correctionFactors.conductivity != null ||
    args.correctionFactors.temperature != null ||
    args.correctionFactors.roughness != null ||
    args.correctionFactors.geometry != null;
  const requestedMaterialReceipt = args.requestedStatus === "material_receipted";
  if (
    requestedMaterialReceipt ||
    materialModelReceiptable ||
    asText(args.material.dielectricResponseRef) != null ||
    hasAnyCorrection
  ) {
    return "blocked";
  }

  if (args.material.modelKind === "perfect_conductor_ideal" && hasAnyGeometry) {
    return "ideal_scalar_only";
  }

  return hasAnyGeometry ? "ideal_scalar_only" : "missing";
};

export const buildCasimirMaterialReceipt = (
  input: BuildCasimirMaterialReceiptInput = {},
): CasimirMaterialReceiptV1 => {
  const geometry: CasimirMaterialReceiptV1["geometry"] = {
    gapMeters: toFiniteOrNull(input.geometry?.gapMeters),
    gapMetrologyStatus: normalizeGapMetrologyStatus(
      input.geometry?.gapMetrologyStatus,
    ),
    roughnessRmsMeters: toFiniteOrNull(input.geometry?.roughnessRmsMeters),
    beyondPfaValidity: normalizeBeyondPfaValidity(
      input.geometry?.beyondPfaValidity,
    ),
  };
  const dielectricResponseRef = asText(input.material?.dielectricResponseRef);
  const material: CasimirMaterialReceiptV1["material"] = {
    modelKind: normalizeMaterialModelKind(input.material?.modelKind),
    ...(dielectricResponseRef != null ? { dielectricResponseRef } : {}),
    finiteConductivityIncluded: input.material?.finiteConductivityIncluded === true,
    finiteTemperatureIncluded: input.material?.finiteTemperatureIncluded === true,
    roughnessCorrectionIncluded: input.material?.roughnessCorrectionIncluded === true,
  };
  const environment: CasimirMaterialReceiptV1["environment"] = {
    vacuumSealEvidence: normalizeVacuumSealEvidence(
      input.environment?.vacuumSealEvidence,
    ),
    temperatureK: toFiniteOrNull(input.environment?.temperatureK),
  };
  const correctionFactors: CasimirMaterialReceiptV1["correctionFactors"] = {
    conductivity: toFiniteOrNull(input.correctionFactors?.conductivity),
    temperature: toFiniteOrNull(input.correctionFactors?.temperature),
    roughness: toFiniteOrNull(input.correctionFactors?.roughness),
    geometry: toFiniteOrNull(input.correctionFactors?.geometry),
  };
  const requestedStatus = normalizeReceiptStatus(input.status);
  return {
    contractVersion: CASIMIR_MATERIAL_RECEIPT_CONTRACT_VERSION,
    generatedAt: asText(input.generatedAt) ?? DEFAULT_GENERATED_AT,
    tileBatchId: asText(input.tileBatchId) ?? "tile_batch:unknown",
    geometry,
    material,
    environment,
    correctionFactors,
    status: deriveCasimirMaterialReceiptStatus({
      geometry,
      material,
      environment,
      correctionFactors,
      requestedStatus,
    }),
    literatureRefs: CASIMIR_MATERIAL_RECEIPT_LITERATURE_REFS,
    claimBoundary: {
      diagnosticOnly: true,
      idealCasimirDoesNotValidateTileSource: true,
    },
  };
};

export const buildIdealCasimirMaterialReceipt = (input: {
  generatedAt?: string | null;
  tileBatchId?: string | null;
  gapMeters?: number | null;
  roughnessRmsMeters?: number | null;
  temperatureK?: number | null;
} = {}): CasimirMaterialReceiptV1 =>
  buildCasimirMaterialReceipt({
    generatedAt: input.generatedAt,
    tileBatchId: input.tileBatchId,
    geometry: {
      gapMeters: input.gapMeters ?? null,
      gapMetrologyStatus: input.gapMeters == null ? "missing" : "design",
      roughnessRmsMeters: input.roughnessRmsMeters ?? null,
      beyondPfaValidity: "not_evaluated",
    },
    material: {
      modelKind: "perfect_conductor_ideal",
      finiteConductivityIncluded: false,
      finiteTemperatureIncluded: false,
      roughnessCorrectionIncluded: false,
    },
    environment: {
      vacuumSealEvidence: "missing",
      temperatureK: input.temperatureK ?? null,
    },
    correctionFactors: {
      conductivity: null,
      temperature: null,
      roughness: null,
      geometry: null,
    },
  });

export const isCasimirMaterialReceipt = (
  value: unknown,
): value is CasimirMaterialReceiptV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const geometry =
    record.geometry && typeof record.geometry === "object"
      ? (record.geometry as Record<string, unknown>)
      : null;
  const material =
    record.material && typeof record.material === "object"
      ? (record.material as Record<string, unknown>)
      : null;
  const environment =
    record.environment && typeof record.environment === "object"
      ? (record.environment as Record<string, unknown>)
      : null;
  const corrections =
    record.correctionFactors && typeof record.correctionFactors === "object"
      ? (record.correctionFactors as Record<string, unknown>)
      : null;
  const claimBoundary =
    record.claimBoundary && typeof record.claimBoundary === "object"
      ? (record.claimBoundary as Record<string, unknown>)
      : null;
  return (
    record.contractVersion === CASIMIR_MATERIAL_RECEIPT_CONTRACT_VERSION &&
    asText(record.generatedAt) != null &&
    asText(record.tileBatchId) != null &&
    geometry != null &&
    (geometry.gapMeters === null || toFiniteOrNull(geometry.gapMeters) != null) &&
    CASIMIR_GAP_METROLOGY_STATUS_VALUES.includes(
      geometry.gapMetrologyStatus as CasimirGapMetrologyStatus,
    ) &&
    (geometry.roughnessRmsMeters === null ||
      toFiniteOrNull(geometry.roughnessRmsMeters) != null) &&
    CASIMIR_BEYOND_PFA_VALIDITY_VALUES.includes(
      geometry.beyondPfaValidity as CasimirBeyondPfaValidity,
    ) &&
    material != null &&
    CASIMIR_MATERIAL_MODEL_KIND_VALUES.includes(
      material.modelKind as CasimirMaterialModelKind,
    ) &&
    (material.dielectricResponseRef === undefined ||
      asText(material.dielectricResponseRef) != null) &&
    typeof material.finiteConductivityIncluded === "boolean" &&
    typeof material.finiteTemperatureIncluded === "boolean" &&
    typeof material.roughnessCorrectionIncluded === "boolean" &&
    environment != null &&
    CASIMIR_VACUUM_SEAL_EVIDENCE_VALUES.includes(
      environment.vacuumSealEvidence as CasimirVacuumSealEvidence,
    ) &&
    (environment.temperatureK === null ||
      toFiniteOrNull(environment.temperatureK) != null) &&
    corrections != null &&
    (corrections.conductivity === null ||
      toFiniteOrNull(corrections.conductivity) != null) &&
    (corrections.temperature === null ||
      toFiniteOrNull(corrections.temperature) != null) &&
    (corrections.roughness === null ||
      toFiniteOrNull(corrections.roughness) != null) &&
    (corrections.geometry === null ||
      toFiniteOrNull(corrections.geometry) != null) &&
    CASIMIR_MATERIAL_RECEIPT_STATUS_VALUES.includes(
      record.status as CasimirMaterialReceiptStatus,
    ) &&
    Array.isArray(record.literatureRefs) &&
    record.literatureRefs.length === CASIMIR_MATERIAL_RECEIPT_LITERATURE_REFS.length &&
    CASIMIR_MATERIAL_RECEIPT_LITERATURE_REFS.every(
      (entry, index) => record.literatureRefs?.[index] === entry,
    ) &&
    claimBoundary?.diagnosticOnly === true &&
    claimBoundary?.idealCasimirDoesNotValidateTileSource === true
  );
};

export const isMaterialReceiptedCasimirMaterialReceipt = (
  value: unknown,
): value is CasimirMaterialReceiptV1 =>
  isCasimirMaterialReceipt(value) && value.status === "material_receipted";
