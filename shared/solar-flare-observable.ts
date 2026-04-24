import { z } from "zod";
import {
  SHARED_OBSERVABLE_CLAIM_TIER_VALUES,
  SHARED_OBSERVABLE_CONTRACT_SCHEMA_VERSION,
  SHARED_OBSERVABLE_COVERAGE_MODE_VALUES,
  SHARED_OBSERVABLE_MODALITY_VALUES,
  SHARED_OBSERVABLE_PROVENANCE_CLASS_VALUES,
  SHARED_OBSERVABLE_RAW_MASK_SEMANTICS_VALUES,
  SHARED_OBSERVABLE_RESPONSE_MODEL_KIND_VALUES,
  SHARED_OBSERVABLE_TIME_MODE_VALUES,
} from "./contracts/observable-contract.v1";
import {
  SOLAR_FLARE_HEATING_FAMILY_VALUES,
  SOLAR_FLARE_INSTRUMENT_VALUES,
  SOLAR_FLARE_INTERPRETATION_STATUS_VALUES,
  SOLAR_FLARE_OPTICAL_DEPTH_REGIME_VALUES,
  SOLAR_FLARE_PHASE_VALUES,
  SOLAR_FLARE_RIBBON_SEGMENT_VALUES,
  SOLAR_FLARE_SPECTRAL_OBSERVABLE_SCHEMA_VERSION,
  SOLAR_FLARE_STOKES_MODE_VALUES,
  SOLAR_FLARE_SUBTRACTION_METHOD_VALUES,
} from "./contracts/solar-flare-observable-contract.v1";

export const sharedObservableAxisSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  physical_type: z.string().optional(),
  time_mode: z.enum(SHARED_OBSERVABLE_TIME_MODE_VALUES).optional(),
  monotonic: z.boolean().optional(),
});
export type SharedObservableAxis = z.infer<typeof sharedObservableAxisSchema>;

export const sharedObservableDomainSchema = z.object({
  axis: z.string().min(1),
  min: z.number(),
  max: z.number(),
});
export type SharedObservableDomain = z.infer<typeof sharedObservableDomainSchema>;

export const sharedObservableResponseRefSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(SHARED_OBSERVABLE_RESPONSE_MODEL_KIND_VALUES),
  model_ref: z.string().optional(),
  notes: z.string().optional(),
});
export type SharedObservableResponseRef = z.infer<
  typeof sharedObservableResponseRefSchema
>;

export const sharedObservableProvenanceRefSchema = z.object({
  source_id: z.string().min(1),
  source_family: z.string().optional(),
  source_url: z.string().url().optional(),
  citation_refs: z.array(z.string().url()).optional(),
});
export type SharedObservableProvenanceRef = z.infer<
  typeof sharedObservableProvenanceRefSchema
>;

export const sharedObservableErrorSchema = z.object({
  uncertainty_ref: z.string().optional(),
  quality_label: z.string().optional(),
  lower: z.array(z.number()).optional(),
  upper: z.array(z.number()).optional(),
  sigma: z.array(z.number()).optional(),
});
export type SharedObservableError = z.infer<typeof sharedObservableErrorSchema>;

export const sharedObservableContractSchema = z.object({
  schema_version: z.literal(SHARED_OBSERVABLE_CONTRACT_SCHEMA_VERSION),
  observable_id: z.string().min(1),
  lane_id: z.string().min(1),
  modality: z.enum(SHARED_OBSERVABLE_MODALITY_VALUES),
  axes: z.array(sharedObservableAxisSchema).min(1),
  data_ref: z.string().optional(),
  values: z.array(z.number()).optional(),
  value_unit: z.string().min(1),
  valid_mask_ref: z.string().optional(),
  valid_mask: z.array(z.boolean()).optional(),
  raw_mask_ref: z.string().optional(),
  raw_mask_semantics: z
    .enum(SHARED_OBSERVABLE_RAW_MASK_SEMANTICS_VALUES)
    .optional(),
  coverage_mode: z.enum(SHARED_OBSERVABLE_COVERAGE_MODE_VALUES).optional(),
  valid_domain: z.array(sharedObservableDomainSchema).optional(),
  min_valid_fraction: z.number().min(0).max(1).optional(),
  error: sharedObservableErrorSchema.optional(),
  response_model_ref: sharedObservableResponseRefSchema.optional(),
  baseline_ref: z.string().optional(),
  provenance_ref: sharedObservableProvenanceRefSchema,
  claim_tier: z.enum(SHARED_OBSERVABLE_CLAIM_TIER_VALUES),
  provenance_class: z.enum(SHARED_OBSERVABLE_PROVENANCE_CLASS_VALUES),
  intended_observables: z.array(z.string()).optional(),
});
export type SharedObservableContract = z.infer<
  typeof sharedObservableContractSchema
>;

export const originHypothesisSchema = z.object({
  mechanism: z.string().min(1),
  layer_support: z.array(z.string().min(1)).min(1),
  evidence_refs: z.array(z.string().min(1)).min(1),
  confidence: z.number().min(0).max(1),
  interpretation_status: z.enum(SOLAR_FLARE_INTERPRETATION_STATUS_VALUES),
});
export type OriginHypothesis = z.infer<typeof originHypothesisSchema>;

const solarFlareLineWindowSchema = z.object({
  line_id: z.string().min(1),
  wavelength_min_nm: z.number().positive(),
  wavelength_max_nm: z.number().positive(),
});

const solarFlareSpatialContextSchema = z.object({
  frame: z.literal("Helioprojective"),
  longitude_arcsec: z.number().optional(),
  latitude_arcsec: z.number().optional(),
  ribbon_segment: z.enum(SOLAR_FLARE_RIBBON_SEGMENT_VALUES).optional(),
  context_image_refs: z.array(z.string().min(1)).optional(),
  coalignment_ref: z.string().optional(),
  unresolved_mixing_flag: z.boolean().optional(),
  unresolved_mixing_note: z.string().optional(),
});

const solarFlareSubtractionSchema = z.object({
  method: z.enum(SOLAR_FLARE_SUBTRACTION_METHOD_VALUES),
  reference_observation_id: z.string().optional(),
  note: z.string().optional(),
});

const solarFlareLineDescriptorSchema = z.object({
  peak_count: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  central_reversal: z.boolean().optional(),
  red_wing_width_pm: z.number().nonnegative().optional(),
  blue_wing_width_pm: z.number().nonnegative().optional(),
  bisector_ref: z.string().optional(),
  gaussian_components_ref: z.string().optional(),
});

const solarFlareForwardModelComparisonSchema = z.object({
  model_family: z.enum(["RADYN_RH", "other"]),
  heating_family: z.enum(SOLAR_FLARE_HEATING_FAMILY_VALUES),
  model_state_ref: z.string().min(1),
  psf_ref: z.string().optional(),
  residual_summary_ref: z.string().min(1),
});
export type SolarFlareForwardModelComparison = z.infer<
  typeof solarFlareForwardModelComparisonSchema
>;

export const solarFlareSpectralObservableSchema =
  sharedObservableContractSchema
    .extend({
      schema_version: z.literal(SOLAR_FLARE_SPECTRAL_OBSERVABLE_SCHEMA_VERSION),
      lane_id: z.literal("stellar_radiation"),
      modality: z.enum(["spectrum", "spectrogram"]),
      instrument: z.enum(SOLAR_FLARE_INSTRUMENT_VALUES),
      line_window: z.array(solarFlareLineWindowSchema).min(1),
      optical_depth_regime: z
        .enum(SOLAR_FLARE_OPTICAL_DEPTH_REGIME_VALUES)
        .optional(),
      flare_phase: z.enum(SOLAR_FLARE_PHASE_VALUES).optional(),
      stokes_mode: z.enum(SOLAR_FLARE_STOKES_MODE_VALUES).optional(),
      spatial_context: solarFlareSpatialContextSchema.optional(),
      subtraction: solarFlareSubtractionSchema.optional(),
      descriptors: solarFlareLineDescriptorSchema.optional(),
      forward_model_comparisons: z
        .array(solarFlareForwardModelComparisonSchema)
        .optional(),
      origin_hypotheses: z.array(originHypothesisSchema).optional(),
    })
    .superRefine((value, context) => {
      if (value.optical_depth_regime === "optically_thick") {
        if (!value.subtraction || value.subtraction.method === "none") {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["subtraction"],
            message:
              "Optically thick flare lines require baseline-aware subtraction metadata.",
          });
        }
      }
      if (
        value.forward_model_comparisons &&
        value.forward_model_comparisons.length > 0
      ) {
        const hasResponse = Boolean(value.response_model_ref);
        const missingPsf = value.forward_model_comparisons.some(
          (entry) => !entry.psf_ref || !entry.psf_ref.trim(),
        );
        if (missingPsf && !hasResponse) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["forward_model_comparisons"],
            message:
              "Forward-model comparisons must provide response/PSF metadata.",
          });
        }
      }
      if (
        value.spatial_context?.unresolved_mixing_flag &&
        !value.spatial_context.unresolved_mixing_note
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["spatial_context", "unresolved_mixing_note"],
          message:
            "Unresolved spatial mixing must be explicitly documented in the observable record.",
        });
      }
    });
export type SolarFlareSpectralObservable = z.infer<
  typeof solarFlareSpectralObservableSchema
>;

export type RawMaskSemantics =
  (typeof SHARED_OBSERVABLE_RAW_MASK_SEMANTICS_VALUES)[number];

export function normalizeValidMask(
  rawMask: ArrayLike<number | boolean>,
  semantics: RawMaskSemantics = "native",
): boolean[] {
  const toBool = (value: number | boolean): boolean => Boolean(value);
  if (semantics === "native") {
    return Array.from(rawMask, (value) => toBool(value));
  }
  if (semantics === "astropy_true_invalid") {
    return Array.from(rawMask, (value) => !toBool(value));
  }
  // IMAS validity convention in diagnostic IDS fields: 0 or 1 valid, negatives invalid.
  return Array.from(rawMask, (value) => Number(value) >= 0);
}

export function validMaskFraction(validMask: ArrayLike<boolean>): number {
  if (validMask.length === 0) {
    return 0;
  }
  let count = 0;
  for (let index = 0; index < validMask.length; index += 1) {
    if (Boolean(validMask[index])) {
      count += 1;
    }
  }
  return count / validMask.length;
}

export function evaluateSolarFlareObservableGuardrails(
  observable: SolarFlareSpectralObservable,
): string[] {
  const findings: string[] = [];
  if (observable.valid_mask && observable.min_valid_fraction != null) {
    const fraction = validMaskFraction(observable.valid_mask);
    if (fraction < observable.min_valid_fraction) {
      findings.push(
        `valid-mask fraction ${fraction.toFixed(3)} below threshold ${observable.min_valid_fraction.toFixed(3)}`,
      );
    }
  }
  if (
    observable.optical_depth_regime === "optically_thick" &&
    (!observable.subtraction || observable.subtraction.method === "none")
  ) {
    findings.push("optically thick interpretation missing non-flare subtraction context");
  }
  if (
    observable.forward_model_comparisons &&
    observable.forward_model_comparisons.length > 0 &&
    !observable.response_model_ref &&
    observable.forward_model_comparisons.some((entry) => !entry.psf_ref)
  ) {
    findings.push("forward-model comparison missing response/PSF metadata");
  }
  if (
    observable.spatial_context?.unresolved_mixing_flag &&
    !observable.spatial_context.unresolved_mixing_note
  ) {
    findings.push("unresolved mixing flagged without explicit note");
  }
  return findings;
}
