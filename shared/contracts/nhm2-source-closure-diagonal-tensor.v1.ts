export const NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_ARTIFACT_ID =
  "nhm2_source_closure_diagonal_tensor";
export const NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_SCHEMA_VERSION =
  "nhm2_source_closure_diagonal_tensor/v1";

export const NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_ROLES = [
  "metric_required",
  "tile_effective",
] as const;

export type Nhm2SourceClosureDiagonalTensorRole =
  (typeof NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_ROLES)[number];

export type Nhm2SourceClosureDiagonalTensorSnapshotArtifact = {
  artifactId: typeof NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_ARTIFACT_ID;
  schemaVersion: typeof NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_SCHEMA_VERSION;
  tensorRole: Nhm2SourceClosureDiagonalTensorRole;
  familyId: string;
  shiftLapseProfileId: string | null;
  shiftLapseProfileStage: string | null;
  tensorSemanticRef: string | null;
  sourceArtifactPath: string | null;
  producer: string;
  diagonalTensor: {
    T00: number | null;
    T11: number | null;
    T22: number | null;
    T33: number | null;
  };
  note: string | null;
};

export type BuildNhm2SourceClosureDiagonalTensorSnapshotArtifactInput = {
  tensorRole: Nhm2SourceClosureDiagonalTensorRole;
  familyId?: string | null;
  shiftLapseProfileId?: string | null;
  shiftLapseProfileStage?: string | null;
  tensorSemanticRef?: string | null;
  sourceArtifactPath?: string | null;
  producer?: string | null;
  diagonalTensor?: Partial<Record<"T00" | "T11" | "T22" | "T33", number | null>> | null;
  note?: string | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toRepoPath = (value: unknown): string | null => {
  const text = asText(value);
  return text ? text.replace(/\\/g, "/") : null;
};

const toFinite = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Number(n) : null;
};

const isTensorRole = (value: unknown): value is Nhm2SourceClosureDiagonalTensorRole =>
  NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_ROLES.includes(
    value as Nhm2SourceClosureDiagonalTensorRole,
  );

export const buildNhm2SourceClosureDiagonalTensorSnapshotArtifact = (
  input: BuildNhm2SourceClosureDiagonalTensorSnapshotArtifactInput,
): Nhm2SourceClosureDiagonalTensorSnapshotArtifact => ({
  artifactId: NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_ARTIFACT_ID,
  schemaVersion: NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_SCHEMA_VERSION,
  tensorRole: input.tensorRole,
  familyId: asText(input.familyId) ?? "nhm2_shift_lapse",
  shiftLapseProfileId: asText(input.shiftLapseProfileId),
  shiftLapseProfileStage: asText(input.shiftLapseProfileStage),
  tensorSemanticRef: asText(input.tensorSemanticRef),
  sourceArtifactPath: toRepoPath(input.sourceArtifactPath),
  producer: asText(input.producer) ?? "scripts/warp-york-control-family-proof-pack.ts",
  diagonalTensor: {
    T00: toFinite(input.diagonalTensor?.T00),
    T11: toFinite(input.diagonalTensor?.T11),
    T22: toFinite(input.diagonalTensor?.T22),
    T33: toFinite(input.diagonalTensor?.T33),
  },
  note: asText(input.note),
});

export const isNhm2SourceClosureDiagonalTensorSnapshotArtifact = (
  value: unknown,
): value is Nhm2SourceClosureDiagonalTensorSnapshotArtifact => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const diagonalTensor =
    record.diagonalTensor && typeof record.diagonalTensor === "object"
      ? (record.diagonalTensor as Record<string, unknown>)
      : null;
  return (
    record.artifactId === NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_ARTIFACT_ID &&
    record.schemaVersion === NHM2_SOURCE_CLOSURE_DIAGONAL_TENSOR_SCHEMA_VERSION &&
    isTensorRole(record.tensorRole) &&
    typeof record.familyId === "string" &&
    typeof record.producer === "string" &&
    diagonalTensor != null &&
    ["T00", "T11", "T22", "T33"].every((component) => {
      const candidate = diagonalTensor[component];
      return candidate == null || Number.isFinite(Number(candidate));
    })
  );
};
