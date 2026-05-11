import { z } from "zod";

export const starSimFusionAsteroseismicClosureInputSchema = z.object({
  objectId: z.string().min(1),
  source: z.enum([
    "gyre_external_run",
    "gyre_imported_summary",
    "helioseismic_fixture",
    "not_available",
  ]),
  modelSummary: z.object({
    largeSeparation_uHz: z.number().positive().optional(),
    smallSeparation_uHz: z.number().positive().optional(),
    modeCount: z.number().int().nonnegative().optional(),
    lowDegreeModesAvailable: z.boolean().optional(),
    soundSpeedProfileAvailable: z.boolean().optional(),
  }),
  referenceSummary: z.object({
    largeSeparation_uHz: z.number().positive().optional(),
    smallSeparation_uHz: z.number().positive().optional(),
    modeCount: z.number().int().nonnegative().optional(),
    sourceRef: z.string().optional(),
  }),
  warnRelErrMax: z.number().positive().default(0.02),
  failRelErrMax: z.number().positive().default(0.08),
});

export const starSimFusionAsteroseismicClosureSchema = z.object({
  schemaVersion: z.literal("starsim-fusion-asteroseismic-closure.v1"),
  objectId: z.string(),
  source: z.enum([
    "gyre_external_run",
    "gyre_imported_summary",
    "helioseismic_fixture",
    "not_available",
  ]),
  modelSummary: starSimFusionAsteroseismicClosureInputSchema.shape.modelSummary,
  referenceSummary: starSimFusionAsteroseismicClosureInputSchema.shape.referenceSummary,
  residuals: z.object({
    largeSeparationRelErr: z.number().nonnegative().optional(),
    smallSeparationRelErr: z.number().nonnegative().optional(),
    maxFrequencyResidual_uHz: z.number().nonnegative().optional(),
  }),
  status: z.enum(["not_tested", "pass", "warn", "fail"]),
  caveats: z.array(z.string()),
});

export type StarSimFusionAsteroseismicClosure = z.infer<
  typeof starSimFusionAsteroseismicClosureSchema
>;
export type StarSimFusionAsteroseismicClosureInput = z.infer<
  typeof starSimFusionAsteroseismicClosureInputSchema
>;

export function computeStarSimFusionAsteroseismicClosure(
  rawInput: unknown,
): StarSimFusionAsteroseismicClosure {
  const input = starSimFusionAsteroseismicClosureInputSchema.parse(rawInput);
  if (input.source === "not_available") {
    return starSimFusionAsteroseismicClosureSchema.parse({
      schemaVersion: "starsim-fusion-asteroseismic-closure.v1",
      objectId: input.objectId,
      source: input.source,
      modelSummary: input.modelSummary,
      referenceSummary: input.referenceSummary,
      residuals: {},
      status: "not_tested",
      caveats: ["Asteroseismic closure was not requested or no mode summary was available."],
    });
  }
  const largeSeparationRelErr = relErr(
    input.modelSummary.largeSeparation_uHz,
    input.referenceSummary.largeSeparation_uHz,
  );
  const smallSeparationRelErr = relErr(
    input.modelSummary.smallSeparation_uHz,
    input.referenceSummary.smallSeparation_uHz,
  );
  const residualValues = [largeSeparationRelErr, smallSeparationRelErr].filter(
    (value): value is number => value !== undefined,
  );
  const maxResidual = residualValues.length > 0 ? Math.max(...residualValues) : undefined;
  const missingMetadata =
    input.source.startsWith("gyre") &&
    (!input.modelSummary.lowDegreeModesAvailable || !input.referenceSummary.sourceRef);
  const status =
    maxResidual === undefined
      ? "not_tested"
      : maxResidual > input.failRelErrMax
        ? "fail"
        : maxResidual > input.warnRelErrMax || missingMetadata
          ? "warn"
          : "pass";
  return starSimFusionAsteroseismicClosureSchema.parse({
    schemaVersion: "starsim-fusion-asteroseismic-closure.v1",
    objectId: input.objectId,
    source: input.source,
    modelSummary: input.modelSummary,
    referenceSummary: input.referenceSummary,
    residuals: {
      largeSeparationRelErr,
      smallSeparationRelErr,
      maxFrequencyResidual_uHz:
        maxResidual !== undefined
          ? maxResidual * (input.referenceSummary.largeSeparation_uHz ?? 1)
          : undefined,
    },
    status,
    caveats: [
      "Asteroseismic closure is a model-summary comparison and does not certify the upstream GYRE run.",
      ...(missingMetadata ? ["GYRE or reference mode metadata is incomplete."] : []),
    ],
  });
}

function relErr(model?: number, reference?: number) {
  if (model === undefined || reference === undefined || reference === 0) return undefined;
  return Math.abs(model - reference) / reference;
}
