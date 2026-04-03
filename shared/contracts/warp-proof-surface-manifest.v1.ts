const HEX64 = /^[a-f0-9]{64}$/i;

export const WARP_PROOF_SURFACE_MANIFEST_CONTRACT_VERSION =
  "warp_proof_surface_manifest/v1";

export const WARP_PROOF_SURFACE_MANIFEST_PUBLICATION_MODE =
  "bounded_stack_latest_sequential_single_writer";

export const WARP_PROOF_SURFACE_MANIFEST_SURFACE_ORDER = [
  "warp_worldline",
  "cruise_preflight",
  "route_time_worldline",
  "mission_time_estimator",
  "mission_time_comparison",
  "cruise_envelope",
  "in_hull_proper_acceleration",
  "proof_pack_latest",
] as const;

export type WarpProofSurfaceManifestSurfaceId =
  (typeof WARP_PROOF_SURFACE_MANIFEST_SURFACE_ORDER)[number];

export type WarpProofSurfaceManifestStatus =
  "bounded_stack_publication_hardened";

export type WarpProofSurfaceManifestTrackedRepoEvidenceStatus =
  | "repo_trackable_latest_evidence"
  | "repo_tracked_latest_evidence"
  | "repo_landed_clean_latest_evidence";

export type WarpProofSurfaceManifestSurfaceEntryV1 = {
  surfaceId: WarpProofSurfaceManifestSurfaceId;
  artifactType: string;
  jsonPath: string;
  mdPath: string;
  jsonChecksum: string;
  generatedOn: string;
  generatedAt: string;
  status: string;
  certified: boolean;
  contractVersion: string;
};

export type WarpProofSurfaceManifestContractV1 = {
  contractVersion: typeof WARP_PROOF_SURFACE_MANIFEST_CONTRACT_VERSION;
  status: WarpProofSurfaceManifestStatus;
  certified: true;
  generatedOn: string;
  generatedAt: string;
  publicationMode: typeof WARP_PROOF_SURFACE_MANIFEST_PUBLICATION_MODE;
  proofSurfaceCount: number;
  proofSurfaces: WarpProofSurfaceManifestSurfaceEntryV1[];
  proofPackPath: string;
  proofPackChecksum: string;
  trackedRepoEvidenceStatus: WarpProofSurfaceManifestTrackedRepoEvidenceStatus;
  claimBoundary: string[];
  nonClaims: string[];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isHex64 = (value: unknown): value is string =>
  typeof value === "string" && HEX64.test(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isTrackedRepoEvidenceStatus = (
  value: unknown,
): value is WarpProofSurfaceManifestTrackedRepoEvidenceStatus =>
  value === "repo_trackable_latest_evidence" ||
  value === "repo_tracked_latest_evidence" ||
  value === "repo_landed_clean_latest_evidence";

const matchesSurfaceOrder = (value: unknown): value is WarpProofSurfaceManifestSurfaceId[] =>
  Array.isArray(value) &&
  value.length === WARP_PROOF_SURFACE_MANIFEST_SURFACE_ORDER.length &&
  WARP_PROOF_SURFACE_MANIFEST_SURFACE_ORDER.every(
    (entry, index) => value[index] === entry,
  );

const isSurfaceEntry = (value: unknown): value is WarpProofSurfaceManifestSurfaceEntryV1 => {
  const record = asRecord(value);
  const surfaceId = asText(record.surfaceId);
  return (
    surfaceId != null &&
    WARP_PROOF_SURFACE_MANIFEST_SURFACE_ORDER.includes(
      surfaceId as WarpProofSurfaceManifestSurfaceId,
    ) &&
    asText(record.artifactType) != null &&
    asText(record.jsonPath) != null &&
    asText(record.mdPath) != null &&
    isHex64(record.jsonChecksum) &&
    asText(record.generatedOn) != null &&
    asText(record.generatedAt) != null &&
    asText(record.status) != null &&
    typeof record.certified === "boolean" &&
    asText(record.contractVersion) != null
  );
};

export const buildWarpProofSurfaceManifestContract = (args: {
  generatedOn: string;
  generatedAt: string;
  proofSurfaces: WarpProofSurfaceManifestSurfaceEntryV1[];
  proofPackPath: string;
  proofPackChecksum: string;
  trackedRepoEvidenceStatus: WarpProofSurfaceManifestTrackedRepoEvidenceStatus;
  claimBoundary?: string[];
  nonClaims?: string[];
}): WarpProofSurfaceManifestContractV1 | null => {
  const proofSurfaces = args.proofSurfaces.map((entry) => ({ ...entry }));
  if (
    proofSurfaces.length !== WARP_PROOF_SURFACE_MANIFEST_SURFACE_ORDER.length ||
    proofSurfaces.some((entry) => !isSurfaceEntry(entry))
  ) {
    return null;
  }
  const surfaceIds = proofSurfaces.map((entry) => entry.surfaceId);
  if (!matchesSurfaceOrder(surfaceIds)) return null;
  if (
    asText(args.generatedOn) == null ||
    asText(args.generatedAt) == null ||
    asText(args.proofPackPath) == null ||
    !isHex64(args.proofPackChecksum) ||
    !isTrackedRepoEvidenceStatus(args.trackedRepoEvidenceStatus)
  ) {
    return null;
  }
  if (
    !proofSurfaces.every(
      (entry) => typeof entry.certified === "boolean" && entry.contractVersion.length > 0,
    )
  ) {
    return null;
  }
  return {
    contractVersion: WARP_PROOF_SURFACE_MANIFEST_CONTRACT_VERSION,
    status: "bounded_stack_publication_hardened",
    certified: true,
    generatedOn: args.generatedOn,
    generatedAt: args.generatedAt,
    publicationMode: WARP_PROOF_SURFACE_MANIFEST_PUBLICATION_MODE,
    proofSurfaceCount: proofSurfaces.length,
    proofSurfaces,
    proofPackPath: args.proofPackPath,
    proofPackChecksum: args.proofPackChecksum,
    trackedRepoEvidenceStatus: args.trackedRepoEvidenceStatus,
    claimBoundary: args.claimBoundary?.length
      ? [...args.claimBoundary]
      : [
          "publication/provenance manifest only",
          "bounded NHM2 latest proof surfaces only",
        ],
    nonClaims: args.nonClaims?.length
      ? [...args.nonClaims]
      : [
          "does not widen transport claims",
          "does not widen gravity claims",
          "does not certify viability",
        ],
  };
};

export const isCertifiedWarpProofSurfaceManifestContract = (
  value: unknown,
): value is WarpProofSurfaceManifestContractV1 => {
  const record = asRecord(value);
  const proofSurfaces = Array.isArray(record.proofSurfaces) ? record.proofSurfaces : [];
  return (
    record.contractVersion === WARP_PROOF_SURFACE_MANIFEST_CONTRACT_VERSION &&
    record.status === "bounded_stack_publication_hardened" &&
    record.certified === true &&
    asText(record.generatedOn) != null &&
    asText(record.generatedAt) != null &&
    record.publicationMode === WARP_PROOF_SURFACE_MANIFEST_PUBLICATION_MODE &&
    record.proofSurfaceCount === WARP_PROOF_SURFACE_MANIFEST_SURFACE_ORDER.length &&
    proofSurfaces.length === WARP_PROOF_SURFACE_MANIFEST_SURFACE_ORDER.length &&
    proofSurfaces.every((entry) => isSurfaceEntry(entry)) &&
    matchesSurfaceOrder(proofSurfaces.map((entry) => asRecord(entry).surfaceId)) &&
    asText(record.proofPackPath) != null &&
    isHex64(record.proofPackChecksum) &&
    isTrackedRepoEvidenceStatus(record.trackedRepoEvidenceStatus) &&
    isStringArray(record.claimBoundary) &&
    isStringArray(record.nonClaims)
  );
};
