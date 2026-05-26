export const STARSIM_RUNTIME_RECEIPT_ARTIFACT_ID = "starsim_runtime_receipt" as const;
export const STARSIM_RUNTIME_RECEIPT_SCHEMA_VERSION = "starsim_runtime_receipt/v1" as const;

export type StarSimRuntimeActionV1 =
  | "evaluate_fusion_microphysics"
  | "build_star_map_fusion_graph";

export type StarSimRuntimeReceiptV1 = {
  artifactId: typeof STARSIM_RUNTIME_RECEIPT_ARTIFACT_ID;
  schemaVersion: typeof STARSIM_RUNTIME_RECEIPT_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  badgeId: string;
  action: StarSimRuntimeActionV1;
  inputSummary: {
    objectId: string | null;
    objectClass: string | null;
    spectralType: string | null;
    modelMode: string | null;
    mass_Msun: number | null;
    radius_Rsun: number | null;
    luminosity_Lsun: number | null;
    effectiveTemperature_K: number | null;
    metallicity_feh: number | null;
    logg_cgs: number | null;
    parallax_mas: number | null;
    radialVelocity_kms: number | null;
  };
  outputSummary: {
    dominantFusionChannel: string | null;
    secondaryFusionChannels: string[];
    fusionActive: boolean | null;
    effectiveTemperature_K: number | null;
    estimatedCoreTemperature_K: number | null;
    estimatedCoreDensity_g_cm3: number | null;
    fusionZoneMode: string | null;
    r10_Rstar: number | null;
    r50_Rstar: number | null;
    r90_Rstar: number | null;
    activeVolumeFraction: number | null;
    tunnelingRequired: boolean | null;
    quantumMicrophysicsRole: string | null;
    quantumProcessIndex: number | null;
    qstRole: string | null;
    spacetimeCL: string | null;
    mayPromoteToCL4: false;
    blockedClaims: string[];
    claimIds: string[];
    citations: string[];
  };
  claimBoundaryNotes: string[];
  caveats: string[];
  sourceRefs: Array<{
    kind: "repo_module" | "doc" | "test" | "claim_ledger";
    path: string;
    id?: string | null;
  }>;
  rawEvaluation?: unknown;
};

type BuildStarSimRuntimeReceiptInput = Omit<
  StarSimRuntimeReceiptV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "runId"
> & {
  generatedAt?: string;
  runId?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

export function buildStarSimRuntimeReceiptV1(
  input: BuildStarSimRuntimeReceiptInput,
): StarSimRuntimeReceiptV1 {
  return {
    artifactId: STARSIM_RUNTIME_RECEIPT_ARTIFACT_ID,
    schemaVersion: STARSIM_RUNTIME_RECEIPT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    runId: input.runId ?? `starsim-runtime:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`,
    badgeId: input.badgeId,
    action: input.action,
    inputSummary: input.inputSummary,
    outputSummary: {
      ...input.outputSummary,
      mayPromoteToCL4: false,
    },
    claimBoundaryNotes: Array.from(new Set(input.claimBoundaryNotes)),
    caveats: Array.from(new Set(input.caveats)),
    sourceRefs: input.sourceRefs,
    ...(input.rawEvaluation === undefined ? {} : { rawEvaluation: input.rawEvaluation }),
  };
}

export function validateStarSimRuntimeReceiptV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["receipt must be an object"];
  if (value.artifactId !== STARSIM_RUNTIME_RECEIPT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STARSIM_RUNTIME_RECEIPT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STARSIM_RUNTIME_RECEIPT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${STARSIM_RUNTIME_RECEIPT_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "runId", "badgeId", "action"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (value.action !== "evaluate_fusion_microphysics" && value.action !== "build_star_map_fusion_graph") {
    issues.push("action is invalid");
  }
  if (!isRecord(value.inputSummary)) issues.push("inputSummary must be an object");
  if (!isRecord(value.outputSummary)) issues.push("outputSummary must be an object");
  const output = isRecord(value.outputSummary) ? value.outputSummary : {};
  if (output.mayPromoteToCL4 !== false) issues.push("outputSummary.mayPromoteToCL4 must be false");
  for (const field of [
    "secondaryFusionChannels",
    "blockedClaims",
    "claimIds",
    "citations",
  ] as const) {
    if (!isStringArray(output[field])) issues.push(`outputSummary.${field} must be a string array`);
  }
  for (const field of [
    "effectiveTemperature_K",
    "estimatedCoreTemperature_K",
    "estimatedCoreDensity_g_cm3",
    "r10_Rstar",
    "r50_Rstar",
    "r90_Rstar",
    "activeVolumeFraction",
    "quantumProcessIndex",
  ] as const) {
    if (!isNullableNumber(output[field])) issues.push(`outputSummary.${field} must be a number or null`);
  }
  if (!Array.isArray(value.claimBoundaryNotes)) issues.push("claimBoundaryNotes must be an array");
  if (!Array.isArray(value.caveats)) issues.push("caveats must be an array");
  if (!Array.isArray(value.sourceRefs)) issues.push("sourceRefs must be an array");
  return issues;
}

export function isStarSimRuntimeReceiptV1(value: unknown): value is StarSimRuntimeReceiptV1 {
  return validateStarSimRuntimeReceiptV1(value).length === 0;
}
