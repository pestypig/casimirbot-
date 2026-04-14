import {
  STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION,
} from "../contract";
import { getSolarProductRegistryIdentity } from "../solar-product-registry";
import { getSolarReferencePackIdentity } from "../solar-reference-pack";
import type {
  FieldStatus,
  StarSimSolarArtifactMetadata,
  StarSimArtifactIntegrityStatus,
  StarSimArtifactRef,
  StarSimRequest,
  StarSimResolveResponse,
  StarSimSourceCatalog,
  StarSimSourceFetchMode,
  StarSimSourceIdentifiers,
  StarSimSourcePolicy,
  StarSimSourceSelectionManifest,
} from "../contract";

export { STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION };
export const STAR_SIM_SOURCE_CACHE_SCHEMA_VERSION = "star-sim-source-cache/1" as const;
const buildSourceRegistryVersion = (): string => {
  const referenceIdentity = getSolarReferencePackIdentity();
  const productIdentity = getSolarProductRegistryIdentity();
  const referenceHashFragment = referenceIdentity.content_hash.replace(/^sha256:/, "").slice(0, 12);
  const productHashFragment = productIdentity.content_hash.replace(/^sha256:/, "").slice(0, 12);
  return `star-sim-sources/27+${referenceIdentity.version}+${referenceHashFragment}+${productIdentity.version}+${productHashFragment}`;
};

export const STAR_SIM_SOURCE_REGISTRY_VERSION = buildSourceRegistryVersion();
export const getStarSimSourceRegistryVersion = (): string => buildSourceRegistryVersion();

type AstrometryRequest = NonNullable<StarSimRequest["astrometry"]>;
type PhotometryRequest = NonNullable<StarSimRequest["photometry"]>;
type SpectroscopyRequest = NonNullable<StarSimRequest["spectroscopy"]>;
type AsteroseismologyRequest = NonNullable<StarSimRequest["asteroseismology"]>;
type TargetRequest = NonNullable<StarSimRequest["target"]>;

export interface StarSimSourceRecord {
  catalog: StarSimSourceCatalog;
  adapter_version: string;
  fetch_mode: Exclude<StarSimSourceFetchMode, "cache" | "cache_only">;
  record_id: string;
  identifiers: StarSimSourceIdentifiers;
  aliases: string[];
  quality_flags: string[];
  quality_score?: number;
  notes?: string[];
  fetched_at_iso?: string;
  query_metadata?: Record<string, unknown>;
  target?: Partial<TargetRequest>;
  astrometry?: Partial<AstrometryRequest>;
  photometry?: Partial<PhotometryRequest>;
  spectroscopy?: Partial<SpectroscopyRequest>;
  asteroseismology?: Partial<AsteroseismologyRequest>;
  raw_payload: Record<string, unknown>;
}

export interface StarSimSourceAdapterResult {
  catalog: StarSimSourceCatalog;
  attempted: boolean;
  record: StarSimSourceRecord | null;
  reason: string | null;
}

export interface StarSimSourceResolutionInput {
  request: StarSimRequest;
  policy: Required<StarSimSourcePolicy>;
  preferredCatalogs: StarSimSourceCatalog[];
  allowFallbacks: boolean;
}

export interface StarSimSourceResolvedDraft {
  request_draft: StarSimRequest | null;
  identifiers_resolved: StarSimSourceIdentifiers;
  selection_manifest: StarSimSourceSelectionManifest;
  reasons: string[];
  notes: string[];
}

export interface StarSimSourceCacheIdentity {
  registry_version: string;
  adapter_versions: Record<StarSimSourceCatalog, string>;
  fetch_modes: Record<StarSimSourceCatalog, Exclude<StarSimSourceFetchMode, "cache">>;
  runtime_identities: Record<StarSimSourceCatalog, string>;
}

export interface StarSimSourceCacheReadResult {
  status: "hit" | "miss";
  miss_reason?: "missing" | "stale" | "corrupt" | "incompatible";
  detail?: string;
  artifact_integrity_status: StarSimArtifactIntegrityStatus;
  response?: StarSimResolveResponse;
}

export interface StarSimSourceCacheWriteArgs {
  cache_key: string;
  request_hash: string;
  request: StarSimRequest;
  response: StarSimResolveResponse;
  selection_manifest: StarSimSourceSelectionManifest;
  raw_records: StarSimSourceRecord[];
  cache_identity: StarSimSourceCacheIdentity;
  extra_artifacts?: StarSimSourceCacheExtraArtifact[];
}

export interface StarSimSourceCacheWriteResult {
  artifact_refs: StarSimArtifactRef[];
}

export interface StarSimSourceCacheExtraArtifact {
  kind: string;
  file_name: string;
  content: unknown;
  metadata?: StarSimSolarArtifactMetadata;
}

export type SourceSelectionReason =
  | "user_override"
  | "strict_catalog_resolution"
  | "preferred_catalog_order"
  | "fallback_catalog"
  | "only_available_candidate";

export interface SourceFieldDefinition {
  path: string;
  section:
    | "astrometry"
    | "photometry"
    | "spectroscopy"
    | "asteroseismology"
    | "activity"
    | "surface"
    | "structure"
    | "orbital_context"
    | "environment";
  key: string;
  unit: string | null;
  value_kind: "number" | "string" | "record" | "number_array";
  allowed_catalogs: Array<StarSimSourceCatalog | "user_override">;
}

export interface SourceFieldCandidateInput {
  catalog: StarSimSourceCatalog | "user_override";
  record_id: string | null;
  identifiers: StarSimSourceIdentifiers;
  quality_flags: string[];
  quality_score: number;
  value: unknown;
  uncertainty: number | null;
  unit: string | null;
  status: FieldStatus;
  provenance_ref: string | null;
  raw_payload_ref: string | null;
  fetch_mode?: StarSimSourceFetchMode;
  fetched_at_iso?: string | null;
  query_metadata?: Record<string, unknown> | null;
}
