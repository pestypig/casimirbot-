import { z } from "zod";

export const starSimGalacticRotationControlModelSchema = z.enum([
  "baryonic_newtonian",
  "dark_matter_halo_nfw",
  "dark_matter_halo_burkert",
  "mond_low_acceleration",
  "empirical_sparc_reference",
]);

export type StarSimGalacticRotationControlModel = z.infer<
  typeof starSimGalacticRotationControlModelSchema
>;

export const starSimGalacticRotationPointSchema = z.object({
  radius_kpc: z.number().nonnegative(),
  observedVelocity_km_s: z.number().nonnegative().optional(),
  modelVelocity_km_s: z.number().nonnegative().optional(),
  baryonicVelocity_km_s: z.number().nonnegative().optional(),
  residual_km_s: z.number().optional(),
});

export const starSimGalacticRotationControlResultSchema = z.object({
  galaxyId: z.string().min(1),
  model: starSimGalacticRotationControlModelSchema,
  rotationCurve: z.array(starSimGalacticRotationPointSchema).min(1),
  summary: z.object({
    rmsResidual_km_s: z.number().nonnegative().optional(),
    maxAbsResidual_km_s: z.number().nonnegative().optional(),
    baryonicToObservedRatio: z.number().nonnegative().optional(),
    fitQuality: z.enum(["not_tested", "pass", "warn", "fail"]),
  }),
  caveats: z.array(z.string()).min(1),
});

export type StarSimGalacticRotationControlResult = z.infer<
  typeof starSimGalacticRotationControlResultSchema
>;

export type StarSimRotationCurveInputPoint = {
  radius_kpc: number;
  observedVelocity_km_s?: number;
  baryonicVelocity_km_s?: number;
  modelVelocities?: Partial<Record<StarSimGalacticRotationControlModel, number>>;
};

export type ComputeStarSimGalacticRotationControlsInput = {
  galaxyId: string;
  points: StarSimRotationCurveInputPoint[];
  models?: StarSimGalacticRotationControlModel[];
  passRmsResidual_km_s?: number;
  warnRmsResidual_km_s?: number;
  interpretationRequest?: "null_model_only" | "direct_er_epr";
};

export function computeStarSimGalacticRotationControls(
  input: ComputeStarSimGalacticRotationControlsInput,
): StarSimGalacticRotationControlResult[] {
  if (input.interpretationRequest === "direct_er_epr") {
    throw new Error("galactic rotation residuals cannot be interpreted as direct ER=EPR evidence");
  }
  const models = input.models ?? [
    "baryonic_newtonian",
    "dark_matter_halo_nfw",
    "mond_low_acceleration",
    "empirical_sparc_reference",
  ];
  return models.map((model) => buildControl(input, model));
}

function buildControl(
  input: ComputeStarSimGalacticRotationControlsInput,
  model: StarSimGalacticRotationControlModel,
): StarSimGalacticRotationControlResult {
  const curve = input.points.map((point) => {
    const modelVelocity = modelVelocityFor(point, model);
    const residual =
      point.observedVelocity_km_s !== undefined && modelVelocity !== undefined
        ? point.observedVelocity_km_s - modelVelocity
        : undefined;
    return {
      radius_kpc: point.radius_kpc,
      observedVelocity_km_s: point.observedVelocity_km_s,
      modelVelocity_km_s: modelVelocity,
      baryonicVelocity_km_s: point.baryonicVelocity_km_s,
      residual_km_s: residual,
    };
  });
  const residuals = curve
    .map((point) => point.residual_km_s)
    .filter((value): value is number => value !== undefined && Number.isFinite(value));
  const observed = input.points
    .map((point) => point.observedVelocity_km_s)
    .filter((value): value is number => value !== undefined && value > 0);
  const baryonic = input.points
    .map((point) => point.baryonicVelocity_km_s)
    .filter((value): value is number => value !== undefined);
  const rmsResidual =
    residuals.length > 0
      ? Math.sqrt(residuals.reduce((acc, value) => acc + value ** 2, 0) / residuals.length)
      : undefined;
  const maxAbsResidual =
    residuals.length > 0 ? Math.max(...residuals.map((value) => Math.abs(value))) : undefined;
  const baryonicToObservedRatio =
    baryonic.length > 0 && observed.length > 0
      ? average(baryonic) / Math.max(1e-12, average(observed))
      : undefined;
  return starSimGalacticRotationControlResultSchema.parse({
    galaxyId: input.galaxyId,
    model,
    rotationCurve: curve,
    summary: {
      rmsResidual_km_s: rmsResidual,
      maxAbsResidual_km_s: maxAbsResidual,
      baryonicToObservedRatio,
      fitQuality: fitQuality(rmsResidual, input.passRmsResidual_km_s, input.warnRmsResidual_km_s),
    },
    caveats: [
      "rotation_control_is_null_model_comparison",
      "galactic_dynamics_result_does_not_select_physics_winner",
    ],
  });
}

function modelVelocityFor(
  point: StarSimRotationCurveInputPoint,
  model: StarSimGalacticRotationControlModel,
): number | undefined {
  if (point.modelVelocities?.[model] !== undefined) return point.modelVelocities[model];
  if (model === "baryonic_newtonian") return point.baryonicVelocity_km_s;
  if (model === "empirical_sparc_reference") return point.observedVelocity_km_s;
  if (point.baryonicVelocity_km_s === undefined) return undefined;
  if (model === "dark_matter_halo_nfw") return Math.sqrt(point.baryonicVelocity_km_s ** 2 + 90 ** 2);
  if (model === "dark_matter_halo_burkert") return Math.sqrt(point.baryonicVelocity_km_s ** 2 + 75 ** 2);
  if (model === "mond_low_acceleration") return point.baryonicVelocity_km_s * 1.35;
  return undefined;
}

function fitQuality(
  rmsResidual: number | undefined,
  pass = 20,
  warn = 45,
): "not_tested" | "pass" | "warn" | "fail" {
  if (rmsResidual === undefined) return "not_tested";
  if (rmsResidual <= pass) return "pass";
  if (rmsResidual <= warn) return "warn";
  return "fail";
}

function average(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0) / Math.max(1, values.length);
}
