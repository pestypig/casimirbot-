import { z } from "zod";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const log10GapScore = (left: number, right: number): { gap: number; score: number } => {
  const safeLeft = Math.max(left, 1e-30);
  const safeRight = Math.max(right, 1e-30);
  const gap = Math.abs(Math.log10(safeLeft / safeRight));
  return {
    gap,
    score: 1 / (1 + gap),
  };
};

const logNormalizedScore = (value: number | undefined, reference: number, decades = 6): number => {
  if (value == null || !Number.isFinite(value) || value <= 0) return 0;
  const safeReference = Math.max(reference, 1e-30);
  const scaled = Math.log10(1 + value / safeReference);
  return clamp01(scaled / decades);
};

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const buildSubharmonicLockDiagnostics = (
  subharmonicLockRatio: number,
): { target: number | null; mismatch: number | null; score: number } => {
  if (!Number.isFinite(subharmonicLockRatio) || subharmonicLockRatio < 1.5) {
    return {
      target: null,
      mismatch: null,
      score: 0,
    };
  }

  const target = Math.max(2, Math.round(subharmonicLockRatio));
  const mismatch = Math.abs(subharmonicLockRatio - target);
  return {
    target,
    mismatch,
    score: clamp01(1 - mismatch / 0.25),
  };
};

export const QuantumSemiclassicalComparisonInput = z
  .object({
    schema_version: z.literal("quantum_semiclassical_comparison/1"),
    tau_or_predicted_s: z.number().positive(),
    tau_decoherence_measured_s: z.number().positive().optional(),
    tau_measurement_proxy_s: z.number().positive().optional(),
    measurement_timescale_kind: z
      .enum(["direct_decoherence_measurement", "microtubule_transport_lifetime_proxy"])
      .optional(),
    collapse_bound_margin: z.number().optional(),
    dp_bound_margin: z.number().optional(),
    microtubule_transport_length_m: z.number().positive().optional(),
    microtubule_transport_lifetime_s: z.number().positive().optional(),
    subharmonic_lock_ratio: z.number().nonnegative(),
    temporal_order_coherence_time_s: z.number().positive().optional(),
    dissipative_stability_window: z.number().nonnegative().optional(),
    time_crystal_signature_pass: z.boolean(),
    notes: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      (value.tau_decoherence_measured_s == null || !Number.isFinite(value.tau_decoherence_measured_s)) &&
      (value.tau_measurement_proxy_s == null || !Number.isFinite(value.tau_measurement_proxy_s))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tau_decoherence_measured_s"],
        message: "Provide tau_decoherence_measured_s or tau_measurement_proxy_s",
      });
    }
  })
  .transform((value) => ({
    ...value,
    tau_decoherence_measured_s: value.tau_decoherence_measured_s ?? value.tau_measurement_proxy_s!,
    measurement_timescale_kind:
      value.measurement_timescale_kind ??
      (value.tau_decoherence_measured_s != null
        ? "direct_decoherence_measurement"
        : "microtubule_transport_lifetime_proxy"),
    collapse_bound_margin: value.collapse_bound_margin ?? value.dp_bound_margin ?? null,
  }));

export type TQuantumSemiclassicalComparisonInput = z.input<typeof QuantumSemiclassicalComparisonInput>;
export type TQuantumSemiclassicalComparisonNormalizedInput = z.output<typeof QuantumSemiclassicalComparisonInput>;

export const QuantumSemiclassicalComparisonResult = z.object({
  schema_version: z.literal("quantum_semiclassical_comparison_result/1"),
  tau_or_predicted_s: z.number().positive(),
  tau_decoherence_measured_s: z.number().positive(),
  measurement_timescale_kind: z.enum(["direct_decoherence_measurement", "microtubule_transport_lifetime_proxy"]),
  collapse_bound_margin: z.number().nullable(),
  tau_log10_gap: z.number().nonnegative(),
  tau_or_vs_measurement_overlap_score: z.number().min(0).max(1),
  collapse_bound_support_score: z.number().min(0).max(1),
  microtubule_measurement_support_score: z.number().min(0).max(1),
  time_crystal_criteria_score: z.number().min(0).max(1),
  microtubule_time_crystal_criteria_score: z.number().min(0).max(1),
  orch_or_measurement_support_score: z.number().min(0).max(1),
  time_crystal_signature_pass: z.boolean(),
  subharmonic_lock_ratio: z.number().nonnegative(),
  subharmonic_lock_target: z.number().int().positive().nullable(),
  subharmonic_lock_mismatch: z.number().nonnegative().nullable(),
  falsifiers_triggered: z.array(z.string()),
  comparison_contract_ids: z.array(z.string()),
  provenance_class: z.literal("inferred"),
  claim_tier: z.literal("reduced-order"),
  certifying: z.literal(false),
  notes: z.array(z.string()),
});

export type TQuantumSemiclassicalComparisonResult = z.infer<typeof QuantumSemiclassicalComparisonResult>;

export const QuantumSemiclassicalSourceReplay = z.object({
  profile_id: z.string().min(1),
  title: z.string().min(1),
  measurement_timescale_kind: z.literal("microtubule_transport_lifetime_proxy"),
  tau_measurement_proxy_s: z.number().positive(),
  microtubule_transport_length_m: z.number().positive(),
  microtubule_diffusion_coefficient_m2_s: z.number().positive(),
  subharmonic_lock_ratio: z.number().nonnegative(),
  time_crystal_signature_pass: z.boolean(),
  source_refs: z.array(z.string().min(1)).min(1),
  notes: z.array(z.string()).min(1),
});

export type TQuantumSemiclassicalSourceReplay = z.infer<typeof QuantumSemiclassicalSourceReplay>;

export function buildQuantumSemiclassicalComparisonResult(
  rawInput: TQuantumSemiclassicalComparisonInput,
): TQuantumSemiclassicalComparisonResult {
  const input = QuantumSemiclassicalComparisonInput.parse(rawInput);

  const tauOverlap = log10GapScore(input.tau_or_predicted_s, input.tau_decoherence_measured_s);
  const collapseBoundSupport =
    input.collapse_bound_margin == null || !Number.isFinite(input.collapse_bound_margin)
      ? 0
      : input.collapse_bound_margin <= 0
        ? 0
        : clamp01(1 - 1 / (1 + input.collapse_bound_margin));

  const transportLengthScore = logNormalizedScore(input.microtubule_transport_length_m, 1e-9, 6);
  const transportLifetimeScore = logNormalizedScore(input.microtubule_transport_lifetime_s, 1e-12, 9);
  const microtubuleMeasurementSupport = average(
    [transportLengthScore, transportLifetimeScore].filter((value) => value > 0),
  );

  const lock = buildSubharmonicLockDiagnostics(input.subharmonic_lock_ratio);
  const temporalOrderScore = logNormalizedScore(input.temporal_order_coherence_time_s, 1e-6, 6);
  const robustnessScore =
    input.dissipative_stability_window == null
      ? 0
      : clamp01(input.dissipative_stability_window);

  const timeCrystalCriteriaScore = clamp01(
    (input.time_crystal_signature_pass ? 0.6 : 0) +
      0.25 * lock.score +
      0.15 * average([temporalOrderScore, robustnessScore].filter((value) => value > 0)),
  );

  const microtubuleTimeCrystalCriteriaScore = clamp01(
    0.5 * microtubuleMeasurementSupport + 0.5 * timeCrystalCriteriaScore,
  );

  const rawSupport =
    0.45 * tauOverlap.score +
    0.2 * collapseBoundSupport +
    0.35 * microtubuleTimeCrystalCriteriaScore;

  let supportCap = 1;
  if (!input.time_crystal_signature_pass) {
    supportCap = Math.min(supportCap, 0.45);
  }
  if (input.collapse_bound_margin != null && input.collapse_bound_margin <= 0) {
    supportCap = Math.min(supportCap, 0.55);
  }

  const falsifiersTriggered: string[] = [];
  if (tauOverlap.score < 0.2) {
    falsifiersTriggered.push("tau_or_predicted_s_unbounded_or_inconsistent");
  }
  if (!input.time_crystal_signature_pass) {
    falsifiersTriggered.push("no_time_crystal_signature");
  }
  if (lock.score < 0.6) {
    falsifiersTriggered.push("no_subharmonic_locking");
  }
  if (microtubuleMeasurementSupport < 0.2) {
    falsifiersTriggered.push("microtubule_time_crystal_status_not_established");
  }
  if (input.collapse_bound_margin != null && input.collapse_bound_margin <= 0) {
    falsifiersTriggered.push("gravity_related_collapse_not_validated_in_biology");
  }

  return QuantumSemiclassicalComparisonResult.parse({
    schema_version: "quantum_semiclassical_comparison_result/1",
    tau_or_predicted_s: input.tau_or_predicted_s,
    tau_decoherence_measured_s: input.tau_decoherence_measured_s,
    measurement_timescale_kind: input.measurement_timescale_kind,
    collapse_bound_margin: input.collapse_bound_margin,
    tau_log10_gap: tauOverlap.gap,
    tau_or_vs_measurement_overlap_score: tauOverlap.score,
    collapse_bound_support_score: collapseBoundSupport,
    microtubule_measurement_support_score: microtubuleMeasurementSupport,
    time_crystal_criteria_score: timeCrystalCriteriaScore,
    microtubule_time_crystal_criteria_score: microtubuleTimeCrystalCriteriaScore,
    orch_or_measurement_support_score: Math.min(rawSupport, supportCap),
    time_crystal_signature_pass: input.time_crystal_signature_pass,
    subharmonic_lock_ratio: input.subharmonic_lock_ratio,
    subharmonic_lock_target: lock.target,
    subharmonic_lock_mismatch: lock.mismatch,
    falsifiers_triggered: falsifiersTriggered,
    comparison_contract_ids: [
      "uncertainty-dp-timescale-comparison-contract",
      "uncertainty-microtubule-observable-measurement-contract",
      "uncertainty-time-crystal-signature-contract",
    ],
    provenance_class: "inferred",
    claim_tier: "reduced-order",
    certifying: false,
    notes: [
      "Reduced-order exploratory comparison only.",
      "This result does not certify Orch-OR, biological time-crystal order, or consciousness.",
      ...(input.notes ?? []),
    ],
  });
}
