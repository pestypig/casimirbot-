import crypto from "node:crypto";

export const WARP_RODC_SNAPSHOT_SCHEMA_VERSION = "warp_rodc_snapshot/v1";
export const WARP_RODC_DRIFT_REPORT_SCHEMA_VERSION = "warp_rodc_drift_report/v1";

export type WarpRodcVerdictStatus = "congruent" | "distinct" | "inconclusive";
export type WarpRodcStability = "stable" | "marginal" | "unstable" | "not_evaluated";
export type WarpRodcFeatureValue = number | string | boolean | null;

export type WarpRodcContractRefV1 = {
  id: string;
  version: number;
  lane_id: string;
  classification_scope: string;
};

export type WarpRodcEvidenceHashesV1 = {
  metric_ref_hash: string | null;
  theta_channel_hash: string | null;
  k_trace_hash: string | null;
  slice_hashes_by_view: Record<string, string | null>;
  other_hashes?: Record<string, string | null>;
};

export type WarpRodcDistanceSummaryV1 = {
  to_alcubierre: number | null;
  to_natario: number | null;
  to_other_baselines?: Record<string, number | null>;
  winning_reference: string | null;
  reference_margin: number | null;
};

export type WarpRodcPolicySummaryV1 = {
  distance_metric: string;
  normalization_method: string;
  reference_margin_min: number;
  reference_match_threshold: number;
  distinctness_threshold: number;
  feature_weights: Record<string, number>;
};

export type WarpRodcRobustnessSummaryV1 = {
  enabled: boolean;
  totalVariants: number;
  evaluatedVariants: number;
  dominantFraction: number;
  dominantVerdict: string | null;
  stableVerdict: string | null;
  stabilityStatus: string;
  stable_fraction_min: number;
  marginal_fraction_min: number;
  verdictCounts: Record<string, number>;
};

export type WarpRodcPreconditionsV1 = {
  controlsIndependent: boolean;
  allRequiredViewsRendered: boolean;
  provenanceHashesPresent: boolean;
  runtimeStatusProvenancePresent: boolean;
  offlineRenderParityComputed?: boolean;
  thetaKTraceParityComputed?: boolean;
  snapshotIdentityComplete?: boolean;
  diagnosticParityClosed?: boolean;
  // Legacy alias retained for historical artifacts.
  laneAParityClosed?: boolean;
  readyForFamilyVerdict: boolean;
};

export type WarpRodcVerdictV1 = {
  family_label: string;
  status: WarpRodcVerdictStatus;
  stability: WarpRodcStability;
};

export type WarpRodcProvenanceV1 = {
  repo_commit_sha: string | null;
  serviceVersion: string | null;
  buildHash: string | null;
  runtimeInstanceId: string | null;
  timestamp_ms: number | null;
  sourceAuditArtifact?: string | null;
};

export type WarpRodcSnapshotV1 = {
  artifactType: typeof WARP_RODC_SNAPSHOT_SCHEMA_VERSION;
  artifactFamily: string;
  generatedOn: string;
  generatedAt: string;
  boundaryStatement: string;
  contract: WarpRodcContractRefV1;
  inputs: {
    metricT00Ref: string | null;
    metricT00Source: string | null;
    shape_function_id: string | null;
    warpFieldType: string | null;
    dims: [number, number, number] | null;
    source_case_id: string;
  };
  provenance: WarpRodcProvenanceV1;
  evidence_hashes: WarpRodcEvidenceHashesV1;
  feature_vector: Record<string, WarpRodcFeatureValue>;
  distance: WarpRodcDistanceSummaryV1;
  policy: WarpRodcPolicySummaryV1;
  robustness: WarpRodcRobustnessSummaryV1;
  preconditions: WarpRodcPreconditionsV1;
  cross_lane: {
    baseline_lane_id: string | null;
    alternate_lane_id: string | null;
    cross_lane_status: string;
  };
  verdict: WarpRodcVerdictV1;
  notes: string[];
  checksum?: string;
};

export type WarpRodcFeatureDriftV1 = {
  key: string;
  latest: WarpRodcFeatureValue;
  previous: WarpRodcFeatureValue;
  changed: boolean;
  delta: number | null;
};

export type WarpRodcDistanceDriftV1 = {
  key: string;
  latest: number | null;
  previous: number | null;
  delta: number | null;
  changed: boolean;
};

export type WarpRodcDriftReportV1 = {
  artifactType: typeof WARP_RODC_DRIFT_REPORT_SCHEMA_VERSION;
  generatedOn: string;
  generatedAt: string;
  boundaryStatement: string;
  family: string;
  latestArtifactPath: string;
  previousArtifactPath: string | null;
  latestChecksum: string | null;
  previousChecksum: string | null;
  contract: {
    latest: WarpRodcContractRefV1 | null;
    previous: WarpRodcContractRefV1 | null;
    changed: boolean;
  };
  verdict: {
    latest: WarpRodcVerdictV1 | null;
    previous: WarpRodcVerdictV1 | null;
    changed: boolean;
  };
  featureDrift: {
    totalChanged: number;
    rows: WarpRodcFeatureDriftV1[];
  };
  distanceDrift: {
    totalChanged: number;
    rows: WarpRodcDistanceDriftV1[];
  };
  evidenceHashChanges: Record<string, { latest: string | null; previous: string | null; changed: boolean }>;
  summary: {
    status: "stable" | "drifted" | "contract_drift" | "inconclusive";
    note: string;
  };
  checksum?: string;
};

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((entry) => stableValue(entry));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = stableValue(record[key]);
        return acc;
      }, {});
  }
  return value;
};

export const stableStringifyWarpRodc = (value: unknown): string =>
  JSON.stringify(stableValue(value));

export const computeWarpRodcChecksum = (payload: Record<string, unknown>): string => {
  const copy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  delete copy.checksum;
  return crypto
    .createHash("sha256")
    .update(stableStringifyWarpRodc(copy))
    .digest("hex");
};
