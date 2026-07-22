// math-stage: reduced-order
import { z } from "zod";

export const VisibilityPowerInput = z.object({
  schema_version: z.literal("casimir_dp_visibility_power/1"),
  baseline_rate_s: z.number().nonnegative(),
  target_additional_rate_s: z.number().positive(),
  observation_time_s: z.number().positive(),
  type_i_error: z.number().gt(0).lt(0.5),
  target_power: z.number().gt(0.5).lt(1),
  technical_variance_inflation: z.number().min(1).default(1),
});

export type VisibilityPowerInput = z.infer<typeof VisibilityPowerInput>;

export type VisibilityPowerResult = {
  schema_version: "casimir_dp_visibility_power_result/1";
  baseline_visibility: number;
  alternative_visibility: number;
  visibility_difference: number;
  shots_per_setting: number;
  total_shots: number;
  gaussian_z_sum: number;
  status: "diagnostic_only" | "numerically_inaccessible";
  assumptions: string[];
};

// Peter J. Acklam's rational approximation, adequate for design-level power estimates.
function inverseStandardNormal(probability: number): number {
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ];
  const low = 0.02425;
  const high = 1 - low;
  if (probability < low) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (probability > high) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function estimateVisibilityRatePower(rawInput: VisibilityPowerInput): VisibilityPowerResult {
  const input = VisibilityPowerInput.parse(rawInput);
  const baselineVisibility = Math.exp(-input.baseline_rate_s * input.observation_time_s);
  const alternativeVisibility = Math.exp(
    -(input.baseline_rate_s + input.target_additional_rate_s) * input.observation_time_s,
  );
  const visibilityDifference = baselineVisibility - alternativeVisibility;
  const zAlpha = inverseStandardNormal(1 - input.type_i_error / 2);
  const zPower = inverseStandardNormal(input.target_power);
  const gaussianZSum = zAlpha + zPower;
  const varianceCoefficient =
    1 - baselineVisibility ** 2 + (1 - alternativeVisibility ** 2);
  const required =
    input.technical_variance_inflation *
    gaussianZSum ** 2 *
    varianceCoefficient /
    Math.max(visibilityDifference ** 2, Number.MIN_VALUE);
  const shotsPerSetting = Math.ceil(required);
  return {
    schema_version: "casimir_dp_visibility_power_result/1",
    baseline_visibility: baselineVisibility,
    alternative_visibility: alternativeVisibility,
    visibility_difference: visibilityDifference,
    shots_per_setting: shotsPerSetting,
    total_shots: shotsPerSetting * 2,
    gaussian_z_sum: gaussianZSum,
    status: Number.isSafeInteger(shotsPerSetting) ? "diagnostic_only" : "numerically_inaccessible",
    assumptions: [
      "Independent binomial fringe samples with a known analysis phase.",
      "Exponential visibility decay and a rate-only alternative.",
      "No drift, covariance, look-elsewhere correction, or parameter-fit penalty beyond the supplied variance inflation.",
      "A rate-only detection cannot identify objective collapse; a registered secondary observable is still required.",
    ],
  };
}

export const DynamicsSignatureInput = z.object({
  schema_version: z.literal("casimir_dp_dynamics_signature/1"),
  observable_ids: z.array(z.string().min(1)).min(2),
  standard_decoherence_signature: z.array(z.number()),
  collapse_signature: z.array(z.number()).nullable(),
  one_sigma_uncertainties: z.array(z.number().positive()),
  collapse_signature_source_ref: z.string().min(1).nullable(),
  maximum_whitened_cosine: z.number().min(0).max(1).default(0.95),
}).superRefine((input, context) => {
  const length = input.observable_ids.length;
  if (input.standard_decoherence_signature.length !== length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["standard_decoherence_signature"], message: "Signature length mismatch." });
  }
  if (input.collapse_signature != null && input.collapse_signature.length !== length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["collapse_signature"], message: "Signature length mismatch." });
  }
  if (input.one_sigma_uncertainties.length !== length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["one_sigma_uncertainties"], message: "Uncertainty length mismatch." });
  }
});

export type DynamicsSignatureInput = z.infer<typeof DynamicsSignatureInput>;

export function evaluateDynamicsSignature(rawInput: DynamicsSignatureInput) {
  const input = DynamicsSignatureInput.parse(rawInput);
  if (input.collapse_signature == null || input.collapse_signature_source_ref == null) {
    return {
      schema_version: "casimir_dp_dynamics_signature_result/1" as const,
      status: "blocked" as const,
      whitened_cosine: null,
      linearly_independent: false,
      blockers: ["missing_source_backed_collapse_secondary_observable_signature"],
    };
  }
  const whitenedStandard = input.standard_decoherence_signature.map(
    (value, index) => value / input.one_sigma_uncertainties[index],
  );
  const whitenedCollapse = input.collapse_signature.map(
    (value, index) => value / input.one_sigma_uncertainties[index],
  );
  const dot = whitenedStandard.reduce(
    (sum, value, index) => sum + value * whitenedCollapse[index],
    0,
  );
  const normStandard = Math.hypot(...whitenedStandard);
  const normCollapse = Math.hypot(...whitenedCollapse);
  const cosine = dot / Math.max(Number.MIN_VALUE, normStandard * normCollapse);
  const linearlyIndependent = Math.abs(cosine) <= input.maximum_whitened_cosine;
  return {
    schema_version: "casimir_dp_dynamics_signature_result/1" as const,
    status: linearlyIndependent ? "diagnostic_ready" as const : "blocked" as const,
    whitened_cosine: cosine,
    linearly_independent: linearlyIndependent,
    blockers: linearlyIndependent ? [] : ["model_signatures_not_resolved_under_declared_uncertainty"],
  };
}
