export const NHM2_QEI_DOSSIER_ARTIFACT_ID = "nhm2_qei_dossier";
export const NHM2_QEI_DOSSIER_SCHEMA_VERSION = "nhm2_qei_dossier/v1";

export type Nhm2QeiDossierArtifact = {
  artifactId: typeof NHM2_QEI_DOSSIER_ARTIFACT_ID;
  schemaVersion: typeof NHM2_QEI_DOSSIER_SCHEMA_VERSION;
  runId: string;
  profileId: string;
  status: "pass" | "fail" | "review" | "missing";
  rhoSource: "metric_required" | "tile_effective" | "proxy" | "unknown";
  qeiApplicabilityStatus: "PASS" | "FAIL" | "REVIEW" | "UNKNOWN";
  quantumStateAssumptions: string[];
  renormalizationConvention: string | null;
  cavityBoundaryModel: string | null;
  samplingWorldlines: Array<{
    id: string;
    regionId: string;
    properTimeWindow_s: number | null;
    qeiMargin: number | null;
    status: "pass" | "fail" | "review" | "unknown";
  }>;
  worstWorldlineId: string | null;
  dutyCyclePass: boolean | null;
  lightCrossingConsistencyStatus: "pass" | "fail" | "review" | "unknown";
  cycleAverageClosureStatus: "pass" | "fail" | "review" | "unknown";
  literatureRefs: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableText = (value: unknown): value is string | null =>
  value === null || isText(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isNullableBoolean = (value: unknown): value is boolean | null =>
  value === null || typeof value === "boolean";

const isStatus = (value: unknown): value is Nhm2QeiDossierArtifact["status"] =>
  value === "pass" || value === "fail" || value === "review" || value === "missing";

const isRhoSource = (
  value: unknown,
): value is Nhm2QeiDossierArtifact["rhoSource"] =>
  value === "metric_required" ||
  value === "tile_effective" ||
  value === "proxy" ||
  value === "unknown";

const isApplicability = (
  value: unknown,
): value is Nhm2QeiDossierArtifact["qeiApplicabilityStatus"] =>
  value === "PASS" || value === "FAIL" || value === "REVIEW" || value === "UNKNOWN";

const isLowerStatus = (
  value: unknown,
): value is Nhm2QeiDossierArtifact["samplingWorldlines"][number]["status"] =>
  value === "pass" || value === "fail" || value === "review" || value === "unknown";

const isWorldline = (
  value: unknown,
): value is Nhm2QeiDossierArtifact["samplingWorldlines"][number] => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    isText(record.id) &&
    isText(record.regionId) &&
    isNullableNumber(record.properTimeWindow_s) &&
    isNullableNumber(record.qeiMargin) &&
    isLowerStatus(record.status)
  );
};

export const buildNhm2QeiDossierArtifact = (
  input: Omit<Nhm2QeiDossierArtifact, "artifactId" | "schemaVersion">,
): Nhm2QeiDossierArtifact => ({
  artifactId: NHM2_QEI_DOSSIER_ARTIFACT_ID,
  schemaVersion: NHM2_QEI_DOSSIER_SCHEMA_VERSION,
  ...input,
});

export const isNhm2QeiDossierArtifact = (
  value: unknown,
): value is Nhm2QeiDossierArtifact => {
  const record = isRecord(value) ? value : null;
  return (
    record != null &&
    record.artifactId === NHM2_QEI_DOSSIER_ARTIFACT_ID &&
    record.schemaVersion === NHM2_QEI_DOSSIER_SCHEMA_VERSION &&
    isText(record.runId) &&
    isText(record.profileId) &&
    isStatus(record.status) &&
    isRhoSource(record.rhoSource) &&
    isApplicability(record.qeiApplicabilityStatus) &&
    Array.isArray(record.quantumStateAssumptions) &&
    record.quantumStateAssumptions.every(isText) &&
    isNullableText(record.renormalizationConvention) &&
    isNullableText(record.cavityBoundaryModel) &&
    Array.isArray(record.samplingWorldlines) &&
    record.samplingWorldlines.every(isWorldline) &&
    isNullableText(record.worstWorldlineId) &&
    isNullableBoolean(record.dutyCyclePass) &&
    isLowerStatus(record.lightCrossingConsistencyStatus) &&
    isLowerStatus(record.cycleAverageClosureStatus) &&
    Array.isArray(record.literatureRefs) &&
    record.literatureRefs.every(isText)
  );
};
