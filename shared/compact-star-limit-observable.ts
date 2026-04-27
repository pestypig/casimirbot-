import { z } from "zod";
import { sharedObservableContractSchema } from "./solar-flare-observable";
import {
  COMPACT_STAR_BAND_SPACING_MODEL_VALUES,
  COMPACT_STAR_BRIDGE_STATUS_VALUES,
  COMPACT_STAR_DYNAMIC_SPECTRUM_FEATURE_VALUES,
  COMPACT_STAR_LANE_CONTRACT_SCHEMA_VERSION,
  COMPACT_STAR_LIMIT_KIND_VALUES,
  COMPACT_STAR_LIMIT_STATUS_VALUES,
  COMPACT_STAR_MATTER_HYPOTHESIS_STATUS_VALUES,
  COMPACT_STAR_MATTER_MODEL_VALUES,
  COMPACT_STAR_OBJECT_CLASS_VALUES,
  COMPACT_STAR_OBSERVABLE_KIND_VALUES,
} from "./contracts/compact-star-observable-contract.v1";

const compactStarObjectClassSchema = z.enum(COMPACT_STAR_OBJECT_CLASS_VALUES);
const compactStarObservableKindSchema = z.enum(COMPACT_STAR_OBSERVABLE_KIND_VALUES);
const compactStarLimitKindSchema = z.enum(COMPACT_STAR_LIMIT_KIND_VALUES);
const compactStarLimitStatusSchema = z.enum(COMPACT_STAR_LIMIT_STATUS_VALUES);
const compactStarMatterModelSchema = z.enum(COMPACT_STAR_MATTER_MODEL_VALUES);
const compactStarMatterHypothesisStatusSchema = z.enum(
  COMPACT_STAR_MATTER_HYPOTHESIS_STATUS_VALUES,
);
const compactStarFeatureKindSchema = z.enum(COMPACT_STAR_DYNAMIC_SPECTRUM_FEATURE_VALUES);
const compactStarBandSpacingSchema = z.enum(COMPACT_STAR_BAND_SPACING_MODEL_VALUES);
const compactStarBridgeStatusSchema = z.enum(COMPACT_STAR_BRIDGE_STATUS_VALUES);

export const COMPACT_STAR_MATH_CLAIMS = [
  "pulsar_period_period_derivative_state_point",
  "pulsar_spin_down_power_definition",
  "pulsar_death_line_limit_classifier",
  "pulsar_vacuum_gap_potential_definition",
  "pulsar_pair_cascade_threshold_descriptor",
  "pulsar_surface_mountain_gap_enhancement_descriptor",
  "pulsar_diffraction_band_spacing_observable",
  "compact_star_matter_hypothesis_envelope",
  "compact_star_micro_macro_bridge_descriptor",
] as const;
export type CompactStarMathClaimId = (typeof COMPACT_STAR_MATH_CLAIMS)[number];

export const compactStarLimitProbeSchema = z
  .object({
    limit_kind: compactStarLimitKindSchema,
    quantity_ref: z.string().min(1),
    threshold_ref: z.string().optional(),
    observed_status: compactStarLimitStatusSchema,
    evidence_refs: z.array(z.string().min(1)).min(1),
    substitute_state_ref: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();
export type CompactStarLimitProbe = z.infer<typeof compactStarLimitProbeSchema>;

export const compactStarMatterHypothesisSchema = z
  .object({
    hypothesis_id: z.string().min(1),
    matter_model: compactStarMatterModelSchema,
    status: compactStarMatterHypothesisStatusSchema,
    eos_ref: z.string().optional(),
    surface_rigidity_ref: z.string().optional(),
    supporting_observable_refs: z.array(z.string().min(1)).optional(),
    contradicting_observable_refs: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type CompactStarMatterHypothesis = z.infer<typeof compactStarMatterHypothesisSchema>;

export const compactStarDynamicSpectrumFeatureSchema = z
  .object({
    feature_kind: compactStarFeatureKindSchema,
    frequency_min_hz: z.number().positive().optional(),
    frequency_max_hz: z.number().positive().optional(),
    band_spacing_model: compactStarBandSpacingSchema.optional(),
    polarization_ref: z.string().optional(),
    phase_window_ref: z.string().optional(),
    fit_summary_ref: z.string().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.frequency_min_hz != null &&
      value.frequency_max_hz != null &&
      value.frequency_max_hz <= value.frequency_min_hz
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["frequency_max_hz"],
        message: "frequency_max_hz must be greater than frequency_min_hz.",
      });
    }
  });
export type CompactStarDynamicSpectrumFeature = z.infer<
  typeof compactStarDynamicSpectrumFeatureSchema
>;

export const compactStarMicroMacroBridgeSchema = z
  .object({
    quantum_side_refs: z.array(z.string().min(1)).min(1),
    classical_side_refs: z.array(z.string().min(1)).min(1),
    bridge_status: compactStarBridgeStatusSchema,
    notes: z.string().optional(),
  })
  .strict();
export type CompactStarMicroMacroBridge = z.infer<typeof compactStarMicroMacroBridgeSchema>;

const modalityByKind: Record<string, string[]> = {
  pulse_profile: ["time_series"],
  dynamic_spectrum: ["spectrogram", "channel_series"],
  polarization_profile: ["channel_series"],
  timing_solution: ["time_series"],
  limit_envelope: ["channel_series", "time_series"],
};

export const compactStarObservableContractSchema = sharedObservableContractSchema
  .extend({
    lane_id: z.literal("compact_star_radio"),
    object_class: compactStarObjectClassSchema,
    observable_kind: compactStarObservableKindSchema,
    source_name: z.string().optional(),
    period_s: z.number().positive().optional(),
    period_dot: z.number().positive().optional(),
    spin_down_power_ref: z.string().optional(),
    death_line_status: compactStarLimitStatusSchema.optional(),
    dynamic_spectrum_features: z.array(compactStarDynamicSpectrumFeatureSchema).optional(),
    limit_probes: z.array(compactStarLimitProbeSchema).optional(),
    matter_hypotheses: z.array(compactStarMatterHypothesisSchema).optional(),
    micro_macro_bridge: compactStarMicroMacroBridgeSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const allowedModalities = modalityByKind[value.observable_kind];
    if (allowedModalities && !allowedModalities.includes(value.modality)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["modality"],
        message: `observable_kind ${value.observable_kind} must use one of: ${allowedModalities.join(", ")}`,
      });
    }

    if (
      value.object_class === "strangeon_star_candidate" &&
      value.claim_tier === "certified"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["claim_tier"],
        message:
          "strangeon_star_candidate cannot be certified in phase-1 compact-star contracts.",
      });
    }

    if (
      value.dynamic_spectrum_features?.some(
        (entry) => entry.feature_kind === "zebra_band",
      ) &&
      value.modality !== "spectrogram" &&
      value.modality !== "channel_series"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dynamic_spectrum_features"],
        message:
          "zebra-band features must be represented with spectrogram or channel_series modality.",
      });
    }

    for (const [index, probe] of (value.limit_probes ?? []).entries()) {
      if (
        probe.limit_kind === "pulsar_death_line" &&
        (value.period_s == null || value.period_dot == null) &&
        !probe.substitute_state_ref
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["limit_probes", index, "substitute_state_ref"],
          message:
            "pulsar_death_line probes require period_s and period_dot, or substitute_state_ref.",
        });
      }
    }

    for (const [index, hypothesis] of (value.matter_hypotheses ?? []).entries()) {
      const supports = hypothesis.supporting_observable_refs?.length ?? 0;
      const contradicts = hypothesis.contradicting_observable_refs?.length ?? 0;
      if (supports + contradicts === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["matter_hypotheses", index],
          message:
            "matter hypotheses must include supporting_observable_refs or contradicting_observable_refs.",
        });
      }
    }
  });
export type CompactStarObservableContract = z.infer<typeof compactStarObservableContractSchema>;

export const compactStarGeometryStateSchema = z
  .object({
    compactness_ref: z.string().optional(),
    radius_ref: z.string().optional(),
    mass_ref: z.string().optional(),
    polar_cap_geometry_ref: z.string().optional(),
    surface_topography_ref: z.string().optional(),
    line_of_sight_ref: z.string().optional(),
    magnetosphere_geometry_ref: z.string().optional(),
  })
  .strict();
export type CompactStarGeometryState = z.infer<typeof compactStarGeometryStateSchema>;

export const compactStarForcingStateSchema = z
  .object({
    gap_electric_field_ref: z.string().optional(),
    particle_injection_ref: z.string().optional(),
    spin_down_driver_ref: z.string().optional(),
    glitch_or_burst_ref: z.string().optional(),
  })
  .strict();
export type CompactStarForcingState = z.infer<typeof compactStarForcingStateSchema>;

export const compactStarStateVectorSchema = z
  .object({
    period_s: z.number().positive().optional(),
    period_dot: z.number().positive().optional(),
    magnetic_field_ref: z.string().optional(),
    plasma_density_profile_ref: z.string().optional(),
    eos_hypothesis_refs: z.array(z.string().min(1)).optional(),
    surface_material_state_ref: z.string().optional(),
  })
  .strict();
export type CompactStarStateVector = z.infer<typeof compactStarStateVectorSchema>;

export const compactStarClosureStateSchema = z
  .object({
    death_line_model_ref: z.string().optional(),
    pair_cascade_model_ref: z.string().optional(),
    vacuum_gap_model_ref: z.string().optional(),
    diffraction_screen_model_ref: z.string().optional(),
    surface_mountain_model_ref: z.string().optional(),
    eos_model_refs: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type CompactStarClosureState = z.infer<typeof compactStarClosureStateSchema>;

export const compactStarLaneBundleSchema = z
  .object({
    schema_version: z.literal(COMPACT_STAR_LANE_CONTRACT_SCHEMA_VERSION),
    G_geometry: compactStarGeometryStateSchema,
    F_forcing: compactStarForcingStateSchema,
    S_state: compactStarStateVectorSchema,
    C_closure: compactStarClosureStateSchema,
    O_observables: z.array(compactStarObservableContractSchema),
  })
  .strict();
export type CompactStarLaneBundle = z.infer<typeof compactStarLaneBundleSchema>;

export function classifyLongPeriodPulsarBridgeStatus(input: {
  period_s?: number;
  death_line_status?: CompactStarLimitProbe["observed_status"];
  source_name?: string;
}): "bridge_case" | "inside_expected_envelope" | "unknown" {
  const source = String(input.source_name ?? "").toLowerCase();
  if (source.includes("psr j0311+1402") || input.death_line_status === "bridge_case") {
    return "bridge_case";
  }
  if (typeof input.period_s === "number" && Number.isFinite(input.period_s)) {
    return input.period_s >= 10 ? "bridge_case" : "inside_expected_envelope";
  }
  return "unknown";
}

export function evaluateCompactStarContractGuardrails(
  observable: CompactStarObservableContract,
): string[] {
  const findings: string[] = [];
  if (
    observable.object_class === "strangeon_star_candidate" &&
    observable.claim_tier === "certified"
  ) {
    findings.push("strangeon candidates are restricted to non-certified claim tiers in phase 1");
  }
  for (const probe of observable.limit_probes ?? []) {
    if (
      probe.limit_kind === "pulsar_death_line" &&
      (observable.period_s == null || observable.period_dot == null) &&
      !probe.substitute_state_ref
    ) {
      findings.push("death-line probe missing period/pdot or substitute state reference");
    }
  }
  return findings;
}
