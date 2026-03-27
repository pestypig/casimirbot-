import type {
  HullMetricVolumeRefV1,
  HullRenderCertificateV1,
  HullScientificAtlasSidecarV1,
} from "./hull-render-contract";
import {
  HULL_CANONICAL_GAMMA_OFFDIAGONAL_CHANNELS,
  HULL_CANONICAL_REQUIRED_CHANNELS_BASE,
  HULL_RENDER_CERTIFICATE_SCHEMA_VERSION,
} from "./hull-render-contract";

export const HULL_SCIENTIFIC_EXPORT_SCHEMA_VERSION = "nhm2.scientific-export.v1";
export const HULL_SCIENTIFIC_EXPORT_FORMAT = "hdf5-xdmf";
export const HULL_SCIENTIFIC_EXPORT_FORMAT_VERSION = "hdf5-xdmf.v1";
export const HULL_SCIENTIFIC_EXPORT_STORAGE_ORDER = "zyx";

export const HULL_SCIENTIFIC_EXPORT_ENDPOINT = "/api/helix/hull-export/dataset";
export const HULL_SCIENTIFIC_EXPORT_PARITY_ENDPOINT = "/api/helix/hull-export/parity";

export const HULL_SCIENTIFIC_EXPORT_SUPPORT_CHANNELS = [
  "hull_sdf",
  "tile_support_mask",
  "region_class",
] as const;

export const HULL_SCIENTIFIC_EXPORT_REQUIRED_CHANNELS = [
  ...HULL_CANONICAL_REQUIRED_CHANNELS_BASE,
  ...HULL_CANONICAL_GAMMA_OFFDIAGONAL_CHANNELS,
  ...HULL_SCIENTIFIC_EXPORT_SUPPORT_CHANNELS,
] as const;

export const HULL_SCIENTIFIC_EXPORT_OPTIONAL_CHANNELS = [
  "light_cone",
  "worldtube",
  "transport_image",
  "transport_bundle_spread",
  "transport_step_convergence",
  "transport_null_residual",
] as const;

export type HullScientificExportRequiredChannel =
  (typeof HULL_SCIENTIFIC_EXPORT_REQUIRED_CHANNELS)[number];

export type HullScientificExportOptionalChannel =
  (typeof HULL_SCIENTIFIC_EXPORT_OPTIONAL_CHANNELS)[number];

export type HullScientificExportFailureReason =
  | "scientific_export_certificate_missing"
  | "scientific_export_certificate_mismatch"
  | "scientific_export_channel_hash_mismatch"
  | "scientific_export_metadata_mismatch"
  | "scientific_export_slice_parity_fail"
  | "scientific_export_constraint_parity_fail"
  | "scientific_export_optical_parity_fail";

export type HullScientificExportParityCheckId =
  | "field_hash_parity"
  | "metadata_parity"
  | "slice_parity"
  | "constraint_parity"
  | "support_mask_parity"
  | "optical_diagnostics_parity"
  | "timestamp_certificate_linkage";

export type HullScientificExportParityCheckStatus = "pass" | "fail" | "skipped";

export type HullScientificExportCoordinateMetadataV1 = {
  dims: [number, number, number];
  spacing_m: [number, number, number];
  axes: ["x", "y", "z"];
  storage_order: typeof HULL_SCIENTIFIC_EXPORT_STORAGE_ORDER;
  origin_m?: [number, number, number] | null;
};

export type HullScientificExportMetadataV1 = {
  metric_ref_hash: string | null;
  certificate_hash: string;
  certificate_schema_version: string;
  chart: string | null;
  observer: string;
  theta_definition: string;
  kij_sign_convention: string;
  unit_system: string;
  timestamp_ms: number;
  coordinate: HullScientificExportCoordinateMetadataV1;
};

export type HullScientificExportParityCheckResultV1 = {
  status: HullScientificExportParityCheckStatus;
  tolerance?: number | null;
  observed?: number | null;
  expected?: number | null;
  detail?: string | null;
  failureReason?: HullScientificExportFailureReason | null;
};

export type HullScientificExportParityReportV1 = {
  version: 1;
  metric_ref_hash: string | null;
  certificate_hash: string;
  checks: Record<HullScientificExportParityCheckId, HullScientificExportParityCheckResultV1>;
};

export type HullScientificExportArtifactKind =
  | "hdf5"
  | "xdmf"
  | "sidecar-json"
  | "parity-report-json"
  | "slice-png"
  | "summary-csv";

export type HullScientificExportArtifactV1 = {
  kind: HullScientificExportArtifactKind;
  path: string;
  sha256: string | null;
};

export type HullScientificExportRequestV1 = {
  version: 1;
  requestId?: string;
  strictScientific?: boolean;
  metricVolumeRef: HullMetricVolumeRefV1;
  renderCertificate: HullRenderCertificateV1;
  scientificAtlas?: HullScientificAtlasSidecarV1 | null;
  requiredChannels?: string[];
  optionalChannels?: string[];
  outputs?: {
    includeSlicePngs?: boolean;
    includeCsvSummary?: boolean;
  };
  parity?: {
    requireFieldHashParity?: boolean;
    requireMetadataParity?: boolean;
    requireSliceParity?: boolean;
    requireConstraintParity?: boolean;
    requireSupportMaskParity?: boolean;
    requireOpticalDiagnosticsParity?: boolean;
    tolerance?: {
      sliceLinf?: number;
      constraintRms?: number;
      opticalResidual?: number;
    };
  };
};

export type HullScientificExportSidecarV1 = {
  export_schema_version: typeof HULL_SCIENTIFIC_EXPORT_SCHEMA_VERSION;
  export_format: typeof HULL_SCIENTIFIC_EXPORT_FORMAT;
  export_format_version: typeof HULL_SCIENTIFIC_EXPORT_FORMAT_VERSION;
  metadata: HullScientificExportMetadataV1;
  field_hashes: Record<string, string>;
  required_channels: string[];
  optional_channels: string[];
};

export type HullScientificExportResponseV1 = {
  version: 1;
  ok: boolean;
  failureReason?: HullScientificExportFailureReason;
  message?: string;
  artifacts?: HullScientificExportArtifactV1[];
  exportSidecar?: HullScientificExportSidecarV1;
  parityReport?: HullScientificExportParityReportV1;
};

export const isHullScientificExportRequestV1 = (
  value: unknown,
): value is HullScientificExportRequestV1 => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<HullScientificExportRequestV1>;
  if (candidate.version !== 1) return false;
  if (!candidate.metricVolumeRef || candidate.metricVolumeRef.kind !== "gr-evolve-brick") {
    return false;
  }
  if (!candidate.renderCertificate || typeof candidate.renderCertificate !== "object") {
    return false;
  }
  return (
    candidate.renderCertificate.certificate_schema_version ===
    HULL_RENDER_CERTIFICATE_SCHEMA_VERSION
  );
};
