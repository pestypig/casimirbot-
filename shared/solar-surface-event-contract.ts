import { z } from "zod";
import { sharedObservableContractSchema } from "./solar-flare-observable";

export const SOLAR_SURFACE_EVENT_MATH_CLAIMS = [
  "solar_doppler_impulse_definition",
  "solar_time_distance_ridge_definition",
  "solar_egression_power_definition",
  "solar_line_transient_baseline_definition",
  "solar_surface_origin_alignment_score",
] as const;
export type SolarSurfaceEventMathClaimId =
  (typeof SOLAR_SURFACE_EVENT_MATH_CLAIMS)[number];

export const solarSurfaceEventModalitySchema = z.enum([
  "line_profile",
  "continuum_map",
  "dopplergram",
  "magnetogram",
  "xray_curve",
  "time_distance",
  "egression_map",
]);
export type SolarSurfaceEventModality = z.infer<typeof solarSurfaceEventModalitySchema>;

export const solarSurfaceObservableRoleSchema = z.enum([
  "radiative",
  "impact",
  "helioseismic",
  "magnetic",
  "energetic",
]);
export type SolarSurfaceObservableRole = z.infer<
  typeof solarSurfaceObservableRoleSchema
>;

export const solarEventObservableSchema = sharedObservableContractSchema
  .extend({
    event_id: z.string().min(1),
    instrument: z.string().min(1),
    modality: solarSurfaceEventModalitySchema,
    cadence_s: z.number().positive().optional(),
    coords_ref: z.string().min(1),
    observable_role: solarSurfaceObservableRoleSchema,
  })
  .strict();
export type SolarEventObservable = z.infer<typeof solarEventObservableSchema>;

export const sunquakeLocationKindSchema = z.enum([
  "initial_impact",
  "reconstructed_source",
]);
export type SunquakeLocationKind = z.infer<typeof sunquakeLocationKindSchema>;

export const sunquakeDetectionMethodSchema = z.enum([
  "doppler_impulse",
  "time_distance",
  "acoustic_holography",
]);
export type SunquakeDetectionMethod = z.infer<typeof sunquakeDetectionMethodSchema>;

export const sunquakeImpactSourceSchema = z
  .object({
    source_id: z.string().min(1),
    event_id: z.string().min(1),
    location_ref: z.string().min(1),
    location_kind: sunquakeLocationKindSchema,
    detection_method: sunquakeDetectionMethodSchema,
    source_motion_kms: z.number().nonnegative().optional(),
    ribbon_segment: z.string().optional(),
    anisotropy_ref: z.string().optional(),
    magnetic_context_ref: z.string().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.detection_method === "acoustic_holography" &&
      value.location_kind !== "reconstructed_source"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location_kind"],
        message:
          "Acoustic holography detections must be tagged as reconstructed_source.",
      });
    }
  });
export type SunquakeImpactSource = z.infer<typeof sunquakeImpactSourceSchema>;

export const photosphericLineTransientSchema = z
  .object({
    observable_id: z.string().min(1),
    line_id: z.string().min(1),
    baseline_ref: z.string().optional(),
    line_center_shift_ref: z.string().optional(),
    width_ref: z.string().optional(),
    asymmetry_ref: z.string().optional(),
    equivalent_width_ref: z.string().optional(),
    stokes_mode: z.enum(["I", "IQUV"]).optional(),
  })
  .strict();
export type PhotosphericLineTransient = z.infer<typeof photosphericLineTransientSchema>;

export const helioseismicWavefrontObservableSchema = z
  .object({
    observable_id: z.string().min(1),
    event_id: z.string().min(1),
    modality: z.enum(["time_distance", "egression_map"]),
    source_ref: z.string().min(1),
    anisotropy_ref: z.string().optional(),
    ridge_ref: z.string().optional(),
    egression_ref: z.string().optional(),
  })
  .strict();
export type HelioseismicWavefrontObservable = z.infer<
  typeof helioseismicWavefrontObservableSchema
>;

export const surfaceOriginDriverSchema = z.enum([
  "particle_beam_shock",
  "low_energy_particle_deposition",
  "lorentz_force",
  "flux_rope_eruption",
  "mixed",
  "unknown",
]);
export type SurfaceOriginDriver = z.infer<typeof surfaceOriginDriverSchema>;

const originObservableRefSchema = z
  .object({
    observable_id: z.string().min(1),
    role: solarSurfaceObservableRoleSchema,
  })
  .strict();

export const surfaceEventOriginHypothesisSchema = z
  .object({
    hypothesis_id: z.string().min(1),
    driver: surfaceOriginDriverSchema,
    formation_region: z.array(z.string().min(1)).min(1),
    supporting_observables: z.array(originObservableRefSchema).min(1),
    contradicting_observables: z.array(originObservableRefSchema).optional(),
    observed_lag_s: z.number().optional(),
    predicted_lag_s: z.number().optional(),
    confidence: z.number().min(0).max(1),
    status: z.enum(["descriptive", "supported", "contradicted"]),
  })
  .strict()
  .superRefine((value, context) => {
    const hasRadiative = value.supporting_observables.some(
      (entry) => entry.role === "radiative",
    );
    const hasImpactOrHelioseismic = value.supporting_observables.some(
      (entry) => entry.role === "impact" || entry.role === "helioseismic",
    );
    if (!hasRadiative || !hasImpactOrHelioseismic) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supporting_observables"],
        message:
          "Surface-origin hypotheses require at least one radiative and one impact/helioseismic observable.",
      });
    }
  });
export type SurfaceEventOriginHypothesis = z.infer<
  typeof surfaceEventOriginHypothesisSchema
>;

export function downgradeHypothesisStatusForLagMismatch(
  hypothesis: SurfaceEventOriginHypothesis,
  toleranceS = 60,
): SurfaceEventOriginHypothesis {
  if (
    hypothesis.predicted_lag_s == null ||
    hypothesis.observed_lag_s == null ||
    !Number.isFinite(hypothesis.predicted_lag_s) ||
    !Number.isFinite(hypothesis.observed_lag_s)
  ) {
    return hypothesis;
  }
  const mismatch = Math.abs(hypothesis.predicted_lag_s - hypothesis.observed_lag_s);
  if (mismatch <= toleranceS) {
    return hypothesis;
  }
  if (hypothesis.status === "supported") {
    return {
      ...hypothesis,
      status: "descriptive",
    };
  }
  return hypothesis;
}

export const solarSurfaceEventBundleSchema = z
  .object({
    event_id: z.string().min(1),
    radiative_observables: z.array(solarEventObservableSchema).default([]),
    surface_impact_observables: z.array(solarEventObservableSchema).default([]),
    magnetic_observables: z.array(solarEventObservableSchema).default([]),
    energetic_observables: z.array(solarEventObservableSchema).default([]),
    helioseismic_observables: z.array(solarEventObservableSchema).default([]),
    line_transients: z.array(photosphericLineTransientSchema).default([]),
    impact_sources: z.array(sunquakeImpactSourceSchema).default([]),
    origin_hypotheses: z.array(surfaceEventOriginHypothesisSchema).default([]),
  })
  .strict()
  .superRefine((value, context) => {
    const hasLineProfile = value.radiative_observables.some(
      (entry) => entry.modality === "line_profile",
    );
    const hasContinuum = value.radiative_observables.some(
      (entry) => entry.modality === "continuum_map",
    );
    const hasMagnetogram = value.magnetic_observables.some(
      (entry) => entry.modality === "magnetogram",
    );
    if (!(hasLineProfile && hasContinuum && hasMagnetogram)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["radiative_observables"],
        message:
          "A complete surface-event bundle must be able to attach line-profile, continuum, and magnetogram observables to one event.",
      });
    }
  });
export type SolarSurfaceEventBundle = z.infer<typeof solarSurfaceEventBundleSchema>;
