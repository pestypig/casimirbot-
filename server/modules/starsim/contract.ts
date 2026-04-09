import { z } from "zod";

export const fieldStatusSchema = z.enum(["observed", "fit", "prior", "default", "inferred", "missing"]);
export const maturitySchema = z.enum([
  "teaching",
  "reduced_order",
  "grid_interp",
  "obs_fit",
  "research_sim",
  "ephemeris_exact",
]);
export const requestedLaneSchema = z.enum([
  "classification",
  "structure_1d",
  "structure_mesa",
  "oscillation_gyre",
  "activity",
  "barycenter",
]);
export const laneStatusSchema = z.enum(["available", "unavailable", "not_applicable", "failed"]);
export const executionKindSchema = z.enum(["simulation", "diagnostic", "replay", "analytic", "fit"]);
export const starSimExternalRuntimeKindSchema = z.enum(["mock", "docker", "wsl", "disabled"]);
export const starSimArtifactIntegritySchema = z.enum(["verified", "missing", "corrupt", "stale", "unknown"]);
export const starSimJobStatusSchema = z.enum(["queued", "running", "completed", "failed", "abandoned"]);
export const starSimJobStageSchema = z.enum([
  "resolving_sources",
  "resolved_sources",
  "preflight_blocked",
  "queued_structure_mesa",
  "running_structure_mesa",
  "queued_oscillation_gyre",
  "running_oscillation_gyre",
  "completed",
  "failed",
]);
export const starSimSourceCatalogSchema = z.enum(["gaia_dr3", "sdss_astra", "lamost_dr10", "tess_mast", "tasoc"]);
export const starSimSourceSelectionOriginSchema = z.enum([
  "user_override",
  "gaia_dr3",
  "sdss_astra",
  "lamost_dr10",
  "tess_mast",
  "tasoc",
]);
export const starSimSourceFetchModeSchema = z.enum(["fixture", "cache", "live", "cache_only", "disabled"]);
export const starSimPreconditionPolicySchema = z.enum(["strict_requested_lanes", "run_available_prefix"]);
export const starSimSupportedDomainReasonSchema = z.enum([
  "out_of_supported_domain",
  "insufficient_observables",
  "seismology_required",
  "unsupported_evolutionary_state",
]);
export const starSimArtifactRefSchema = z.object({
  kind: z.string().min(1),
  path: z.string().min(1),
  hash: z.string().min(1).optional(),
  integrity_status: starSimArtifactIntegritySchema.optional(),
});

const sectionMetaShape = {
  source: z.string().optional(),
  provenance_ref: z.string().optional(),
  uncertainties: z.record(z.number()).optional(),
  statuses: z.record(fieldStatusSchema).optional(),
  field_sources: z.record(z.string()).optional(),
  field_provenance_refs: z.record(z.string()).optional(),
} as const;

const targetSchema = z
  .object({
    object_id: z.string().optional(),
    name: z.string().optional(),
    epoch_iso: z.string().optional(),
    spectral_type: z.string().optional(),
    luminosity_class: z.string().optional(),
  })
  .optional();

const astrometrySchema = z
  .object({
    ...sectionMetaShape,
    parallax_mas: z.number().finite().optional(),
    proper_motion_ra_masyr: z.number().finite().optional(),
    proper_motion_dec_masyr: z.number().finite().optional(),
    radial_velocity_kms: z.number().finite().optional(),
  })
  .optional();

const photometrySchema = z
  .object({
    ...sectionMetaShape,
    bands: z.record(z.number()).optional(),
    time_series_ref: z.string().optional(),
  })
  .optional();

const spectroscopySchema = z
  .object({
    ...sectionMetaShape,
    teff_K: z.number().positive().optional(),
    logg_cgs: z.number().finite().optional(),
    metallicity_feh: z.number().finite().optional(),
    metallicity_Z: z.number().positive().optional(),
    vsini_kms: z.number().nonnegative().optional(),
    spectrum_ref: z.string().optional(),
    abundances: z.record(z.number()).optional(),
  })
  .optional();

const asteroseismologySchema = z
  .object({
    ...sectionMetaShape,
    numax_uHz: z.number().positive().optional(),
    deltanu_uHz: z.number().positive().optional(),
    mode_frequencies_uHz: z.array(z.number().finite()).optional(),
  })
  .optional();

const activitySchema = z
  .object({
    ...sectionMetaShape,
    magnetic_activity_index: z.number().finite().optional(),
    rotation_period_days: z.number().positive().optional(),
    cycle_phase: z.number().finite().optional(),
    replay_series_id: z.string().optional(),
    flare_replay_series_id: z.string().optional(),
    sunquake_replay_series_id: z.string().optional(),
  })
  .optional();

const surfaceSchema = z
  .object({
    ...sectionMetaShape,
    resolved_surface_ref: z.string().optional(),
    granulation_timescale_min: z.number().positive().optional(),
  })
  .optional();

const structureSchema = z
  .object({
    ...sectionMetaShape,
    mass_Msun: z.number().positive().optional(),
    radius_Rsun: z.number().positive().optional(),
    age_Gyr: z.number().nonnegative().optional(),
    helium_fraction: z.number().positive().optional(),
  })
  .optional();

const orbitalContextSchema = z
  .object({
    ...sectionMetaShape,
    naif_body_id: z.number().int().optional(),
    ephemeris_source: z.string().optional(),
    companions: z
      .array(
        z.object({
          id: z.string().optional(),
          semi_major_axis_au: z.number().positive().optional(),
        }),
      )
      .optional(),
  })
  .optional();

const environmentSchema = z
  .object({
    ...sectionMetaShape,
    cloud_temperature_K: z.number().positive().optional(),
    cloud_nH_cm3: z.number().positive().optional(),
  })
  .optional();

const physicsFlagsSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional();
const starSimIdentifiersSchema = z
  .object({
    gaia_dr3_source_id: z.string().min(1).optional(),
    sdss_apogee_id: z.string().min(1).optional(),
    lamost_obsid: z.string().min(1).optional(),
    tess_tic_id: z.string().min(1).optional(),
    tasoc_target_id: z.string().min(1).optional(),
    mast_obs_id: z.string().min(1).optional(),
  })
  .optional();
const starSimSourceHintsSchema = z
  .object({
    preferred_catalogs: z.array(starSimSourceCatalogSchema).optional(),
    allow_fallbacks: z.boolean().optional(),
  })
  .optional();
const starSimSourcePolicySchema = z
  .object({
    user_overrides_win: z.boolean().optional(),
    strict_catalog_resolution: z.boolean().optional(),
  })
  .optional();
const starSimSourceContextSchema = z
  .object({
    source_cache_key: z.string().min(1).optional(),
    source_resolution_ref: z.string().min(1).optional(),
    source_selection_manifest_ref: z.string().min(1).optional(),
    resolved_draft_ref: z.string().min(1).optional(),
    resolved_draft_hash: z.string().min(1).optional(),
    identifiers_resolved: starSimIdentifiersSchema,
    fetch_modes_by_catalog: z.record(starSimSourceFetchModeSchema).optional(),
    selected_field_origins: z.record(starSimSourceSelectionOriginSchema).optional(),
    benchmark_target_id: z.string().min(1).optional(),
  })
  .optional();

export const starSimRequestSchema = z
  .object({
    target: targetSchema,
    identifiers: starSimIdentifiersSchema,
    source_hints: starSimSourceHintsSchema,
    source_policy: starSimSourcePolicySchema,
    astrometry: astrometrySchema,
    photometry: photometrySchema,
    spectroscopy: spectroscopySchema,
    asteroseismology: asteroseismologySchema,
    activity: activitySchema,
    surface: surfaceSchema,
    structure: structureSchema,
    orbital_context: orbitalContextSchema,
    environment: environmentSchema,
    evidence_refs: z.array(z.string()).optional(),
    requested_lanes: z.array(requestedLaneSchema).optional(),
    strict_lanes: z.boolean().optional(),
    resolve_before_run: z.boolean().optional(),
    precondition_policy: starSimPreconditionPolicySchema.optional(),
    benchmark_case_id: z.string().min(1).optional(),
    fit_profile_id: z.string().min(1).optional(),
    fit_constraints: physicsFlagsSchema,
    physics_flags: physicsFlagsSchema,
    source_context: starSimSourceContextSchema,
  })
  .strict();

export type StarSimRequest = z.infer<typeof starSimRequestSchema>;
export type FieldStatus = z.infer<typeof fieldStatusSchema>;
export type Maturity = z.infer<typeof maturitySchema>;
export type RequestedLane = z.infer<typeof requestedLaneSchema>;
export type LaneStatus = z.infer<typeof laneStatusSchema>;
export type ExecutionKind = z.infer<typeof executionKindSchema>;
export type StarSimExternalRuntimeKind = z.infer<typeof starSimExternalRuntimeKindSchema>;
export type StarSimArtifactIntegrityStatus = z.infer<typeof starSimArtifactIntegritySchema>;
export type StarSimJobStatus = z.infer<typeof starSimJobStatusSchema>;
export type StarSimJobStage = z.infer<typeof starSimJobStageSchema>;
export type StarSimSourceCatalog = z.infer<typeof starSimSourceCatalogSchema>;
export type StarSimSourceSelectionOrigin = z.infer<typeof starSimSourceSelectionOriginSchema>;
export type StarSimSourceFetchMode = z.infer<typeof starSimSourceFetchModeSchema>;
export type StarSimPreconditionPolicy = z.infer<typeof starSimPreconditionPolicySchema>;
export type StarSimSupportedDomainReason = z.infer<typeof starSimSupportedDomainReasonSchema>;
export type StarSimArtifactRef = z.infer<typeof starSimArtifactRefSchema>;
export type PhysicsFlagValue = string | number | boolean | null;
export type ObsClass = "O0" | "O1" | "O2" | "O3" | "O4" | "O5";
export type PhysClass = "P0" | "P1" | "P2" | "P3" | "P4" | "P5";

export interface StarSimBenchmarkMetricCheck {
  metric_id: string;
  actual: number;
  expected: number;
  tolerance: number;
  comparator: "abs";
  passed: boolean;
}

export interface StarSimBenchmarkValidation {
  passed: boolean;
  tolerance_profile: string;
  checked_metrics: StarSimBenchmarkMetricCheck[];
  notes: string[];
  benchmark_target_id?: string;
  crossmatch_summary?: StarSimCrossmatchSummary;
  quality_rejections?: StarSimQualityRejection[];
  diagnostic_summary?: StarSimDiagnosticSummary;
}

export interface StarSimSupportedDomain {
  id: string;
  version: string;
  lane_id: "structure_mesa" | "oscillation_gyre";
  passed: boolean;
  reasons: StarSimSupportedDomainReason[];
  required_observables: string[];
  optional_observables: string[];
  fit_profile_id: string | null;
  fit_constraints_applied: Record<string, PhysicsFlagValue>;
  benchmark_pack_id: string | null;
  notes: string[];
  benchmark_target_id?: string;
  crossmatch_summary?: StarSimCrossmatchSummary;
  quality_rejections?: StarSimQualityRejection[];
  diagnostic_summary?: StarSimDiagnosticSummary;
}

export interface StarSimFitSummary {
  profile_id: string;
  free_parameters: string[];
  fixed_priors: Record<string, unknown>;
  applied_constraints: Record<string, PhysicsFlagValue>;
  metrics: Record<string, number>;
  note?: string;
}

export interface StarSimComparisonSummary {
  profile_id: string;
  checked_observables: string[];
  coverage: number;
  metrics: Record<string, number>;
  note?: string;
}

export interface StarSimSeismicMatchSummary {
  used_observables: string[];
  matched_mode_count: number;
  available_mode_count: number;
}

export interface CanonicalField<T = unknown> {
  value: T | null;
  raw_value: unknown | null;
  unit: string | null;
  uncertainty: number | null;
  source: string | null;
  status: FieldStatus;
  provenance_ref: string | null;
  normalization: string | null;
}

export interface StarSimSourceIdentifiers {
  gaia_dr3_source_id?: string;
  sdss_apogee_id?: string;
  lamost_obsid?: string;
  tess_tic_id?: string;
  tasoc_target_id?: string;
  mast_obs_id?: string;
}

export interface StarSimSourceHints {
  preferred_catalogs?: StarSimSourceCatalog[];
  allow_fallbacks?: boolean;
}

export interface StarSimSourcePolicy {
  user_overrides_win?: boolean;
  strict_catalog_resolution?: boolean;
}

export interface StarSimSourceContext {
  source_cache_key?: string;
  source_resolution_ref?: string;
  source_selection_manifest_ref?: string;
  resolved_draft_ref?: string;
  resolved_draft_hash?: string;
  identifiers_resolved?: StarSimSourceIdentifiers;
  identifiers_trusted?: StarSimSourceIdentifiers;
  fetch_modes_by_catalog?: Partial<Record<StarSimSourceCatalog, StarSimSourceFetchMode>>;
  selected_field_origins?: Record<string, StarSimSourceSelectionOrigin>;
  benchmark_target_id?: string;
  benchmark_target_match_mode?: StarSimBenchmarkTargetMatchMode;
  benchmark_target_conflict_reason?: string;
  benchmark_target_quality_ok?: boolean;
}

export type StarSimBenchmarkTargetMatchMode =
  | "matched_by_identifier"
  | "matched_by_name"
  | "conflicted_name_vs_identifier"
  | "no_match";

export type StarSimBenchmarkTargetIdentityBasis =
  | "trusted_identifier"
  | "name_label"
  | "conflicted_trusted_identifier_vs_name"
  | "none";

export interface StarSimCrossmatchSummary {
  accepted: number;
  rejected: number;
  fallback_used: boolean;
  accepted_with_warnings?: number;
  fallback_fields?: Array<{
    field_path: string;
    selected_from: StarSimSourceSelectionOrigin;
    preferred_catalog: StarSimSourceCatalog | null;
    preferred_status: "absent" | "rejected" | "available_not_selected" | "unknown";
  }>;
}

export interface StarSimQualityRejection {
  catalog: string;
  reason: string;
  field_path?: string;
  quality_flags?: string[];
  fallback_consequence?: string;
}

export interface StarSimQualityWarning {
  catalog: string;
  reason: string;
  field_path?: string;
  quality_flags?: string[];
}

export interface StarSimDiagnosticSummary {
  fit_quality?: "good" | "borderline" | "poor";
  comparison_quality?: "good" | "borderline" | "poor";
  top_residual_fields?: string[];
  observable_coverage?: {
    used: number;
    requested: number;
    ratio: number;
  };
}

export interface StarSimSourceCandidate {
  field_path: string;
  selected_from: StarSimSourceSelectionOrigin;
  value: unknown;
  unit: string | null;
  uncertainty: number | null;
  status: FieldStatus;
  source_record_id: string | null;
  identifiers: StarSimSourceIdentifiers;
  quality_flags: string[];
  provenance_ref: string | null;
  raw_payload_ref: string | null;
  fetch_mode?: StarSimSourceFetchMode;
  fetched_at_iso?: string | null;
  query_metadata?: Record<string, unknown> | null;
}

export interface StarSimSourceFieldSelection {
  field_path: string;
  selected_from: StarSimSourceSelectionOrigin;
  reason:
    | "user_override"
    | "strict_catalog_resolution"
    | "preferred_catalog_order"
    | "fallback_catalog"
    | "only_available_candidate";
  chosen: StarSimSourceCandidate;
  candidates: StarSimSourceCandidate[];
}

export const STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION = "star-sim-source-selection/3" as const;

export interface StarSimSourceSelectionManifest {
  schema_version: typeof STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION;
  target_query: {
    object_id: string | null;
    name: string | null;
    identifiers: StarSimSourceIdentifiers;
  };
  fields: Record<string, StarSimSourceFieldSelection>;
  quality_rejections?: StarSimQualityRejection[];
  quality_warnings?: StarSimQualityWarning[];
}

export interface StarSimSourceResolution {
  status: "resolved" | "partial" | "unresolved";
  cache_key: string;
  cache_status: "hit" | "missing" | "stale" | "corrupt" | "incompatible";
  fetch_mode: StarSimSourceFetchMode;
  fetch_modes_by_catalog?: Record<StarSimSourceCatalog, StarSimSourceFetchMode>;
  artifact_integrity_status: StarSimArtifactIntegrityStatus;
  identifiers_resolved: StarSimSourceIdentifiers;
  identifiers_observed?: StarSimSourceIdentifiers;
  identifiers_trusted?: StarSimSourceIdentifiers;
  artifact_refs: StarSimArtifactRef[];
  selection_manifest: StarSimSourceSelectionManifest;
  candidate_counts: {
    total: number;
    by_catalog: Record<StarSimSourceSelectionOrigin, number>;
    by_field: Record<string, number>;
  };
  resolved_sections: string[];
  reasons: string[];
  notes: string[];
  benchmark_target_id?: string;
  benchmark_target_match_mode?: StarSimBenchmarkTargetMatchMode;
  benchmark_target_conflict_reason?: string;
  benchmark_target_identity_basis?: StarSimBenchmarkTargetIdentityBasis;
  benchmark_target_quality_ok?: boolean;
  crossmatch_summary?: StarSimCrossmatchSummary;
  crossmatch_identity_basis?: Partial<Record<StarSimSourceCatalog, string[]>>;
  quality_rejections?: StarSimQualityRejection[];
  quality_warnings?: StarSimQualityWarning[];
  diagnostic_summary?: StarSimDiagnosticSummary;
}

export interface StarSimResolveResponse {
  schema_version: "star-sim-source-resolve-v1";
  target: {
    requested_object_id: string | null;
    requested_name: string | null;
    resolved_name: string | null;
  };
  identifiers_resolved: StarSimSourceIdentifiers;
  identifiers_observed?: StarSimSourceIdentifiers;
  identifiers_trusted?: StarSimSourceIdentifiers;
  canonical_request_draft: StarSimRequest | null;
  source_resolution: StarSimSourceResolution;
  structure_mesa_ready: boolean;
  supported_domain_preview: StarSimSupportedDomain | null;
  oscillation_gyre_ready: boolean;
  oscillation_supported_domain_preview: StarSimSupportedDomain | null;
  benchmark_target_id?: string;
  benchmark_target_match_mode?: StarSimBenchmarkTargetMatchMode;
  benchmark_target_conflict_reason?: string;
  benchmark_target_identity_basis?: StarSimBenchmarkTargetIdentityBasis;
  benchmark_target_quality_ok?: boolean;
  crossmatch_summary?: StarSimCrossmatchSummary;
  crossmatch_identity_basis?: Partial<Record<StarSimSourceCatalog, string[]>>;
  quality_rejections?: StarSimQualityRejection[];
  quality_warnings?: StarSimQualityWarning[];
  diagnostic_summary?: StarSimDiagnosticSummary;
}

export interface StarSimPreflightLane {
  requested_lane: RequestedLane;
  ready: boolean;
  will_run: boolean;
  blocked_reasons: string[];
  supported_domain: StarSimSupportedDomain | null;
  depends_on: RequestedLane[];
}

export interface StarSimPreflight {
  policy: StarSimPreconditionPolicy;
  requested_lanes: RequestedLane[];
  runnable_lanes: RequestedLane[];
  blocked_lanes: RequestedLane[];
  blocked_reasons: string[];
  passed: boolean;
  enqueue_allowed: boolean;
  by_lane: Partial<Record<RequestedLane, StarSimPreflightLane>>;
  benchmark_target_id?: string;
  benchmark_backed?: boolean;
  benchmark_target_match_mode?: StarSimBenchmarkTargetMatchMode;
  benchmark_target_conflict_reason?: string;
  benchmark_target_quality_ok?: boolean;
  source_resolution_quality_ok?: boolean;
  fallback_used?: boolean;
}

export interface StarSimLanePlan {
  policy: StarSimPreconditionPolicy;
  requested_lanes: RequestedLane[];
  runnable_lanes: RequestedLane[];
  blocked_lanes: RequestedLane[];
  blocked_reasons_by_lane: Partial<Record<RequestedLane, string[]>>;
}

export interface StarSimResolveBeforeRunResponse {
  schema_version: "star-sim-resolve-run-v1";
  resolution_stage: "preflight_blocked" | "job_enqueued";
  job_enqueued: boolean;
  job_id: string | null;
  result_url: string | null;
  policy_used: StarSimPreconditionPolicy;
  target: StarSimResolveResponse["target"];
  identifiers_resolved: StarSimSourceIdentifiers;
  identifiers_observed?: StarSimSourceIdentifiers;
  identifiers_trusted?: StarSimSourceIdentifiers;
  source_resolution_ref: string | null;
  resolved_draft_ref: string | null;
  resolved_draft_hash: string | null;
  source_cache_key: string | null;
  source_artifact_refs: StarSimArtifactRef[];
  preflight: StarSimPreflight;
  lane_plan: StarSimLanePlan;
  blocked_reasons: string[];
  benchmark_target_id?: string;
  benchmark_target_match_mode?: StarSimBenchmarkTargetMatchMode;
  benchmark_target_conflict_reason?: string;
  benchmark_target_identity_basis?: StarSimBenchmarkTargetIdentityBasis;
  benchmark_target_quality_ok?: boolean;
  crossmatch_summary?: StarSimCrossmatchSummary;
  crossmatch_identity_basis?: Partial<Record<StarSimSourceCatalog, string[]>>;
  quality_rejections?: StarSimQualityRejection[];
  quality_warnings?: StarSimQualityWarning[];
  diagnostic_summary?: StarSimDiagnosticSummary;
}

export interface CanonicalStarTarget {
  object_id: string;
  name: string;
  canonical_target_id: string;
  epoch_iso: string;
  spectral_type: string | null;
  luminosity_class: string | null;
  is_solar_calibrator: boolean;
}

export interface CanonicalStarFields {
  astrometry: {
    parallax_mas: CanonicalField<number>;
    proper_motion_ra_masyr: CanonicalField<number>;
    proper_motion_dec_masyr: CanonicalField<number>;
    radial_velocity_kms: CanonicalField<number>;
  };
  photometry: {
    band_count: CanonicalField<number>;
    time_series_ref: CanonicalField<string>;
  };
  spectroscopy: {
    teff_K: CanonicalField<number>;
    logg_cgs: CanonicalField<number>;
    metallicity_feh: CanonicalField<number>;
    metallicity_Z: CanonicalField<number>;
    vsini_kms: CanonicalField<number>;
    spectrum_ref: CanonicalField<string>;
    abundance_count: CanonicalField<number>;
  };
  asteroseismology: {
    numax_uHz: CanonicalField<number>;
    deltanu_uHz: CanonicalField<number>;
    mode_count: CanonicalField<number>;
  };
  activity: {
    magnetic_activity_index: CanonicalField<number>;
    rotation_period_days: CanonicalField<number>;
    cycle_phase: CanonicalField<number>;
    replay_series_id: CanonicalField<string>;
    flare_replay_series_id: CanonicalField<string>;
    sunquake_replay_series_id: CanonicalField<string>;
  };
  surface: {
    resolved_surface_ref: CanonicalField<string>;
    granulation_timescale_min: CanonicalField<number>;
  };
  structure: {
    mass_Msun: CanonicalField<number>;
    radius_Rsun: CanonicalField<number>;
    age_Gyr: CanonicalField<number>;
    helium_fraction: CanonicalField<number>;
  };
  orbital_context: {
    naif_body_id: CanonicalField<number>;
    ephemeris_source: CanonicalField<string>;
    companion_count: CanonicalField<number>;
  };
  environment: {
    cloud_temperature_K: CanonicalField<number>;
    cloud_nH_cm3: CanonicalField<number>;
  };
}

export interface CanonicalStar {
  schema_version: "star-sim-v1";
  target: CanonicalStarTarget;
  fields: CanonicalStarFields;
  evidence_refs: string[];
  requested_lanes: RequestedLane[];
  strict_lanes: boolean;
  precondition_policy: StarSimPreconditionPolicy;
  benchmark_case_id: string | null;
  fit_profile_id: string | null;
  fit_constraints: Record<string, PhysicsFlagValue>;
  physics_flags: Record<string, PhysicsFlagValue>;
  source_context: StarSimSourceContext | null;
}

export interface TreeDagClaim {
  claim_id: string;
  parent_claim_ids: string[];
  equation_refs: string[];
  evidence_refs: string[];
}

export interface StarSimLaneResult {
  lane_id: string;
  requested_lane: RequestedLane;
  solver_id: string;
  label: string;
  availability: "available" | "unavailable";
  status: LaneStatus;
  status_reason?: string;
  execution_kind: ExecutionKind;
  maturity: Maturity;
  phys_class: PhysClass;
  assumptions: string[];
  domain_validity: Record<string, unknown>;
  observables_used: string[];
  inferred_params: Record<string, unknown>;
  residuals_sigma: Record<string, number>;
  falsifier_ids: string[];
  tree_dag: TreeDagClaim;
  result: Record<string, unknown>;
  artifact_refs?: StarSimArtifactRef[];
  cache_key?: string;
  runtime_mode?: StarSimExternalRuntimeKind;
  runtime_fingerprint?: string;
  artifact_integrity_status?: StarSimArtifactIntegrityStatus;
  cache_status?: "hit" | "missing" | "stale" | "corrupt" | "incompatible";
  cache_status_reason?: string;
  benchmark_validation?: StarSimBenchmarkValidation;
  evidence_fit: number;
  domain_penalty: number;
  lane_score?: number;
  maturity_weight?: number;
  note?: string;
}

export interface StarSimCompleteness {
  observed_field_count: number;
  missing_field_count: number;
  present_sections: string[];
  missing_field_ids: string[];
  reasons: string[];
}

export interface StarSimCongruence {
  scoring_model: "harmonic_mean";
  lane_scores: Array<{
    lane_id: string;
    requested_lane: RequestedLane;
    availability: "available" | "unavailable";
    status: LaneStatus;
    evidence_fit: number;
    domain_penalty: number;
    maturity_weight: number;
    lane_score: number | null;
  }>;
  overall_score: number;
  overall_available_score: number;
  overall_requested_score: number;
  requested_blockers: RequestedLane[];
  not_applicable_requested_lanes: RequestedLane[];
}

export interface StarSimResponse {
  schema_version: "star-sim-v1";
  meta: {
    contract_version: "star-sim-v1";
    normalization_version: "star-sim.canonicalize/5";
    solver_manifest_version: "star-sim.registry/7";
    congruence_version: "star-sim.harmonic/2";
    claim_identity_version: "star-sim.claims/3";
    deterministic_request_hash: string;
    canonical_observables_hash: string;
    solver_manifest_hash: string;
  };
  target: CanonicalStarTarget;
  taxonomy: {
    obs_class: ObsClass;
    phys_class: PhysClass;
    requested_phys_class: PhysClass | null;
    requested_phys_class_status: "complete" | "partial" | "blocked";
  };
  canonical_observables: CanonicalStarFields;
  completeness: StarSimCompleteness;
  solver_plan: {
    requested_lanes: RequestedLane[];
    executed_lanes: string[];
    unavailable_requested_lanes: RequestedLane[];
  };
  lanes: StarSimLaneResult[];
  congruence: StarSimCongruence;
}

export interface StarSimJobRecord {
  job_id: string;
  status: StarSimJobStatus;
  stage: StarSimJobStage | null;
  status_reason: string | null;
  created_at_iso: string;
  started_at_iso: string | null;
  completed_at_iso: string | null;
  requested_lanes: RequestedLane[];
  heavy_lanes: RequestedLane[];
  request_hash: string;
  job_fingerprint: string;
  attempt_count: number;
  max_attempts: number;
  queue_position: number;
  result_path: string | null;
  error: string | null;
  deduped: boolean;
  deduped_from_job_id: string | null;
  precondition_policy: StarSimPreconditionPolicy | null;
  resolved_draft_hash: string | null;
  resolved_draft_ref: string | null;
  source_resolution_ref: string | null;
  source_cache_key: string | null;
  lane_plan: StarSimLanePlan | null;
}
