import { z } from "zod";

export const fieldStatusSchema = z.enum(["observed", "fit", "prior", "default", "missing"]);
export const maturitySchema = z.enum([
  "teaching",
  "reduced_order",
  "grid_interp",
  "obs_fit",
  "research_sim",
  "ephemeris_exact",
]);
export const requestedLaneSchema = z.enum(["classification", "structure_1d", "activity", "barycenter"]);

const sectionMetaShape = {
  source: z.string().optional(),
  provenance_ref: z.string().optional(),
  uncertainties: z.record(z.number()).optional(),
  statuses: z.record(fieldStatusSchema).optional(),
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

export const starSimRequestSchema = z
  .object({
    target: targetSchema,
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
  })
  .strict();

export type StarSimRequest = z.infer<typeof starSimRequestSchema>;
export type FieldStatus = z.infer<typeof fieldStatusSchema>;
export type Maturity = z.infer<typeof maturitySchema>;
export type RequestedLane = z.infer<typeof requestedLaneSchema>;
export type ObsClass = "O0" | "O1" | "O2" | "O3" | "O4" | "O5";
export type PhysClass = "P0" | "P1" | "P2" | "P3" | "P4" | "P5";

export interface CanonicalField<T = unknown> {
  value: T | null;
  unit: string | null;
  uncertainty: number | null;
  source: string | null;
  status: FieldStatus;
  provenance_ref: string | null;
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
  maturity: Maturity;
  assumptions: string[];
  domain_validity: Record<string, unknown>;
  observables_used: string[];
  inferred_params: Record<string, unknown>;
  residuals_sigma: Record<string, number>;
  falsifier_ids: string[];
  tree_dag: TreeDagClaim;
  result: Record<string, unknown>;
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
    evidence_fit: number;
    domain_penalty: number;
    maturity_weight: number;
    lane_score: number;
  }>;
  overall_score: number;
}

export interface StarSimResponse {
  schema_version: "star-sim-v1";
  target: CanonicalStarTarget;
  taxonomy: {
    obs_class: ObsClass;
    phys_class: PhysClass;
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
