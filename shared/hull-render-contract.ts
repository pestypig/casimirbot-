export type HullRendererBackendMode = "webgl" | "webgpu" | "mis-service";

export type HullRenderSkyboxMode = "off" | "flat" | "geodesic";
export type HullScientificSamplingMode = "nearest" | "trilinear";
export type HullScientificRenderView =
  | "diagnostic-quad"
  | "paper-rho"
  | "transport-3p1"
  | "york-time-3p1"
  | "york-surface-3p1"
  | "york-surface-rho-3p1"
  | "york-topology-normalized-3p1"
  | "york-shell-map-3p1"
  | "shift-shell-3p1"
  | "full-atlas";

export const HULL_SCIENTIFIC_ATLAS_PANES = [
  "hull",
  "adm",
  "derived",
  "causal",
  "optical",
] as const;

export type HullScientificAtlasPaneId =
  (typeof HULL_SCIENTIFIC_ATLAS_PANES)[number];

export type HullScientificAtlasPaneStatus = "ok" | "missing" | "error";

export const HULL_RENDER_CERTIFICATE_SCHEMA_VERSION = "nhm2.render-certificate.v1";

export const HULL_CANONICAL_REQUIRED_CHANNELS_BASE = [
  "alpha",
  "beta_x",
  "beta_y",
  "beta_z",
  "gamma_xx",
  "gamma_yy",
  "gamma_zz",
  "K_xx",
  "K_xy",
  "K_xz",
  "K_yy",
  "K_yz",
  "K_zz",
  "K_trace",
  "theta",
  "rho",
  "Sx",
  "Sy",
  "Sz",
  "S_xx",
  "S_xy",
  "S_xz",
  "S_yy",
  "S_yz",
  "S_zz",
  "H_constraint",
  "M_constraint_x",
  "M_constraint_y",
  "M_constraint_z",
] as const;

export const HULL_CANONICAL_GAMMA_OFFDIAGONAL_CHANNELS = [
  "gamma_xy",
  "gamma_xz",
  "gamma_yz",
] as const;

export type HullSupportMaskKind =
  | "hull_sdf"
  | "tile_support_mask"
  | "region_class"
  | "combined"
  | "analytic"
  | "missing";

export type HullMetricVolumeRefV1 = {
  kind: "gr-evolve-brick";
  url: string;
  source?: string | null;
  chart?: string | null;
  dims?: [number, number, number] | null;
  updatedAt?: number | null;
  hash?: string | null;
};

export type HullMisRenderRequestV1 = {
  version: 1;
  requestId?: string;
  width: number;
  height: number;
  dpr?: number;
  backendHint?: "mis-path-tracing";
  timestampMs?: number;
  skyboxMode?: HullRenderSkyboxMode;
  scienceLane?: {
    requireIntegralSignal?: boolean;
    requireScientificFrame?: boolean;
    requireCanonicalTensorVolume?: boolean;
    requireCongruentNhm2FullSolve?: boolean;
    diagnosticLaneId?: string | null;
    requireHullSupportChannels?: boolean;
    requireOffDiagonalGamma?: boolean;
    minVolumeDims?: [number, number, number] | null;
    samplingMode?: HullScientificSamplingMode;
    renderView?: HullScientificRenderView;
    attachmentDownsample?: number;
  };
  solve?: {
    beta?: number;
    alpha?: number;
    sigma?: number;
    R?: number;
    chart?: string | null;
  };
  geodesicDiagnostics?: {
    mode?: string | null;
    consistency?: "ok" | "warn" | "fail" | "unknown";
    maxNullResidual?: number | null;
    stepConvergence?: number | null;
    bundleSpread?: number | null;
  };
  metricSummary?: {
    source?: string | null;
    chart?: string | null;
    dims?: [number, number, number] | null;
    alphaRange?: [number, number] | null;
    consistency?: "ok" | "warn" | "fail" | "unknown";
    updatedAt?: number | null;
  };
  metricVolumeRef?: HullMetricVolumeRefV1 | null;
};

export type HullMisRenderAttachmentKind =
  | "depth-linear-m-f32le"
  | "shell-mask-u8";

export type HullMisRenderAttachmentV1 = {
  kind: HullMisRenderAttachmentKind;
  width: number;
  height: number;
  encoding: "base64";
  dataBase64: string;
};

export type HullRenderCertificateV1 = {
  certificate_schema_version: string;
  certificate_hash: string;
  metric_ref_hash: string | null;
  channel_hashes: Record<string, string>;
  support_mask_hash: string | null;
  chart: string | null;
  observer: string;
  theta_definition: string;
  kij_sign_convention: string;
  unit_system: string;
  camera: {
    pose: string;
    proj: string;
  } | null;
  render: {
    view: HullScientificRenderView;
    integrator: string;
    steps: number;
    field_key?: string | null;
    lane_id?: string | null;
    slice_plane?: string | null;
    coordinate_mode?: string | null;
    normalization?: string | null;
    magnitude_mode?: string | null;
    surface_height?: string | null;
    support_overlay?: string | null;
    vector_context?: string | null;
  };
  diagnostics: {
    null_residual_max: number;
    step_convergence: number;
    bundle_spread: number;
    constraint_rms: number | null;
    support_coverage_pct: number | null;
    lane_id?: string | null;
    observer_definition_id?: string | null;
    observer_inputs_required?: string[] | null;
    observer_construction_inputs?: string[] | null;
    observer_construction_formula?: string | null;
    observer_normalized?: boolean | null;
    observer_approximation?: string | null;
    observer_inputs_present?: boolean | null;
    lane_b_semantic_mode?: string | null;
    lane_b_tensor_inputs_hash?: string | null;
    lane_b_geometry_ready?: boolean | null;
    lane_b_semantics_closed?: boolean | null;
    requires_gamma_metric?: boolean | null;
    semantics_closed?: boolean | null;
    cross_lane_claim_ready?: boolean | null;
    cross_lane_claim_block_reason?: string | null;
    metric_ref_hash?: string | null;
    timestamp_ms?: number | null;
    theta_definition?: string | null;
    theta_channel_hash?: string | null;
    slice_array_hash?: string | null;
    normalized_slice_hash?: string | null;
    support_mask_slice_hash?: string | null;
    shell_masked_slice_hash?: string | null;
    theta_min_raw?: number | null;
    theta_max_raw?: number | null;
    theta_abs_max_raw?: number | null;
    theta_min_display?: number | null;
    theta_max_display?: number | null;
    theta_abs_max_display?: number | null;
    display_range_method?: string | null;
    theta_min?: number | null;
    theta_max?: number | null;
    theta_abs_max?: number | null;
    near_zero_theta?: boolean | null;
    zero_contour_segments?: number | null;
    display_gain?: number | null;
    height_scale?: number | null;
    sampling_choice?: string | null;
    coordinate_mode?: string | null;
    theta_shell_min_raw?: number | null;
    theta_shell_max_raw?: number | null;
    theta_shell_abs_max_raw?: number | null;
    theta_shell_min_display?: number | null;
    theta_shell_max_display?: number | null;
    theta_shell_abs_max_display?: number | null;
    shell_support_count?: number | null;
    shell_active_count?: number | null;
    shell_mask_slice_hash?: string | null;
    supported_theta_fraction?: number | null;
    shell_theta_overlap_pct?: number | null;
    peak_theta_cell?: [number, number, number] | null;
    peak_theta_in_supported_region?: boolean | null;
    beta_min?: number | null;
    beta_max?: number | null;
    beta_abs_max?: number | null;
    slice_support_pct?: number | null;
    support_overlap_pct?: number | null;
    shell_contour_segments?: number | null;
    peak_beta_cell?: [number, number, number] | null;
    peak_beta_in_supported_region?: boolean | null;
  };
  frame_hash: string;
  timestamp_ms: number;
};

export type HullScientificAtlasPaneMetaV1 = {
  status: HullScientificAtlasPaneStatus;
  metric_ref_hash: string | null;
  chart: string | null;
  observer: string;
  theta_definition: string;
  kij_sign_convention: string;
  unit_system: string;
  timestamp_ms: number;
  channels: string[];
  channel_hashes: Record<string, string>;
  integrator: string | null;
  geodesic_mode: string | null;
};

export type HullScientificAtlasSidecarV1 = {
  atlas_view: "full-atlas";
  certificate_schema_version: string;
  certificate_hash: string;
  metric_ref_hash: string | null;
  pane_ids: HullScientificAtlasPaneId[];
  pane_status: Record<HullScientificAtlasPaneId, HullScientificAtlasPaneStatus>;
  pane_channel_sets: Record<HullScientificAtlasPaneId, string[]>;
  pane_meta: Record<HullScientificAtlasPaneId, HullScientificAtlasPaneMetaV1>;
  chart: string | null;
  observer: string;
  theta_definition: string;
  kij_sign_convention: string;
  unit_system: string;
  timestamp_ms: number;
};

export type HullMisRenderResponseV1 = {
  version: 1;
  ok: boolean;
  backend: "proxy" | "local-deterministic";
  imageMime: "image/png";
  imageDataUrl: string;
  width: number;
  height: number;
  deterministicSeed: number;
  renderMs: number;
  attachments?: HullMisRenderAttachmentV1[];
  renderCertificate?: HullRenderCertificateV1;
  scientificAtlas?: HullScientificAtlasSidecarV1;
  diagnostics?: {
    note?: string;
    geodesicMode?: string | null;
    consistency?: "ok" | "warn" | "fail" | "unknown";
    maxNullResidual?: number | null;
    stepConvergence?: number | null;
    bundleSpread?: number | null;
    scientificTier?: "research-grade" | "teaching" | "scaffold" | "unknown" | null;
    samplingMode?: HullScientificSamplingMode | null;
    supportCoveragePct?: number | null;
    maskedOutPct?: number | null;
    supportMaskKind?: HullSupportMaskKind | null;
    lane_id?: string | null;
    observer_definition_id?: string | null;
    observer_inputs_required?: string[] | null;
    observer_construction_inputs?: string[] | null;
    observer_construction_formula?: string | null;
    observer_normalized?: boolean | null;
    observer_approximation?: string | null;
    observer_inputs_present?: boolean | null;
    lane_b_semantic_mode?: string | null;
    lane_b_tensor_inputs_hash?: string | null;
    lane_b_geometry_ready?: boolean | null;
    lane_b_semantics_closed?: boolean | null;
    requires_gamma_metric?: boolean | null;
    semantics_closed?: boolean | null;
    cross_lane_claim_ready?: boolean | null;
    cross_lane_claim_block_reason?: string | null;
    metric_ref_hash?: string | null;
    timestamp_ms?: number | null;
    theta_definition?: string | null;
    theta_channel_hash?: string | null;
    slice_array_hash?: string | null;
    normalized_slice_hash?: string | null;
    support_mask_slice_hash?: string | null;
    shell_masked_slice_hash?: string | null;
    theta_min_raw?: number | null;
    theta_max_raw?: number | null;
    theta_abs_max_raw?: number | null;
    theta_min_display?: number | null;
    theta_max_display?: number | null;
    theta_abs_max_display?: number | null;
    display_range_method?: string | null;
    theta_min?: number | null;
    theta_max?: number | null;
    theta_abs_max?: number | null;
    near_zero_theta?: boolean | null;
    zero_contour_segments?: number | null;
    display_gain?: number | null;
    height_scale?: number | null;
    sampling_choice?: string | null;
    coordinate_mode?: string | null;
    theta_shell_min_raw?: number | null;
    theta_shell_max_raw?: number | null;
    theta_shell_abs_max_raw?: number | null;
    theta_shell_min_display?: number | null;
    theta_shell_max_display?: number | null;
    theta_shell_abs_max_display?: number | null;
    shell_support_count?: number | null;
    shell_active_count?: number | null;
    shell_mask_slice_hash?: string | null;
    peak_theta_in_supported_region?: boolean | null;
    thetaMin?: number | null;
    thetaMax?: number | null;
    thetaAbsMax?: number | null;
    nearZeroTheta?: boolean | null;
    zeroContourSegments?: number | null;
    displayGain?: number | null;
    heightScale?: number | null;
    samplingChoice?: string | null;
    coordinateMode?: string | null;
    laneId?: string | null;
    thetaShellMinRaw?: number | null;
    thetaShellMaxRaw?: number | null;
    thetaShellAbsMaxRaw?: number | null;
    thetaShellMinDisplay?: number | null;
    thetaShellMaxDisplay?: number | null;
    thetaShellAbsMaxDisplay?: number | null;
    shellSupportCount?: number | null;
    shellActiveCount?: number | null;
    shellMaskSliceHash?: string | null;
    thetaChannelHash?: string | null;
    sliceArrayHash?: string | null;
    normalizedSliceHash?: string | null;
    supportMaskSliceHash?: string | null;
    shellMaskedSliceHash?: string | null;
    peakThetaCell?: [number, number, number] | null;
    peakThetaInSupportedRegion?: boolean | null;
    betaMin?: number | null;
    betaMax?: number | null;
    betaAbsMax?: number | null;
    sliceSupportPct?: number | null;
    supportOverlapPct?: number | null;
    shellContourSegments?: number | null;
    peakBetaCell?: [number, number, number] | null;
    peakBetaInSupportedRegion?: boolean | null;
  };
  provenance?: {
    source: string;
    serviceUrl?: string | null;
    timestampMs: number;
    researchGrade?: boolean;
    scientificTier?: "research-grade" | "teaching" | "scaffold" | "unknown" | null;
    serviceVersion?: string | null;
    buildHash?: string | null;
    commitSha?: string | null;
    processStartedAtMs?: number | null;
    runtimeInstanceId?: string | null;
  };
};
