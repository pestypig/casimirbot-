import { z } from "zod";

const fluxes = z.object({
  pp: z.number().positive().optional(),
  be7: z.number().positive().optional(),
  pep: z.number().positive().optional(),
  b8: z.number().positive().optional(),
  cno: z.number().positive().optional(),
  units: z.literal("cm^-2 s^-1"),
});

export const starSimFusionNeutrinoClosureInputSchema = z.object({
  objectId: z.string().min(1),
  modelFluxes: fluxes,
  referenceFluxes: fluxes.extend({ sourceRef: z.string().min(1) }),
  warnRelErrMax: z.number().positive().default(0.15),
  failRelErrMax: z.number().positive().default(0.35),
});

export const starSimFusionNeutrinoClosureSchema = z.object({
  schemaVersion: z.literal("starsim-fusion-neutrino-closure.v1"),
  objectId: z.string(),
  modelFluxes: fluxes,
  referenceFluxes: fluxes.extend({ sourceRef: z.string() }),
  residuals: z.object({
    ppRelErr: z.number().nonnegative().optional(),
    be7RelErr: z.number().nonnegative().optional(),
    pepRelErr: z.number().nonnegative().optional(),
    b8RelErr: z.number().nonnegative().optional(),
    cnoRelErr: z.number().nonnegative().optional(),
    maxRelErr: z.number().nonnegative().optional(),
  }),
  status: z.enum(["not_tested", "pass", "warn", "fail"]),
  caveats: z.array(z.string()),
});

export type StarSimFusionNeutrinoClosure = z.infer<
  typeof starSimFusionNeutrinoClosureSchema
>;
export type StarSimFusionNeutrinoClosureInput = z.infer<
  typeof starSimFusionNeutrinoClosureInputSchema
>;

export function computeStarSimFusionNeutrinoClosure(
  rawInput: unknown,
): StarSimFusionNeutrinoClosure {
  const input = starSimFusionNeutrinoClosureInputSchema.parse(rawInput);
  if (input.objectId !== "Sun") {
    return starSimFusionNeutrinoClosureSchema.parse({
      schemaVersion: "starsim-fusion-neutrino-closure.v1",
      objectId: input.objectId,
      modelFluxes: input.modelFluxes,
      referenceFluxes: input.referenceFluxes,
      residuals: {},
      status: "not_tested",
      caveats: ["Solar neutrino closure is only evaluated for the solar anchor."],
    });
  }
  const residuals = {
    ppRelErr: relErr(input.modelFluxes.pp, input.referenceFluxes.pp),
    be7RelErr: relErr(input.modelFluxes.be7, input.referenceFluxes.be7),
    pepRelErr: relErr(input.modelFluxes.pep, input.referenceFluxes.pep),
    b8RelErr: relErr(input.modelFluxes.b8, input.referenceFluxes.b8),
    cnoRelErr: relErr(input.modelFluxes.cno, input.referenceFluxes.cno),
  };
  const values = Object.values(residuals).filter((value): value is number => value !== undefined);
  const maxRelErr = values.length > 0 ? Math.max(...values) : undefined;
  const status =
    maxRelErr === undefined
      ? "not_tested"
      : maxRelErr > input.failRelErrMax
        ? "fail"
        : maxRelErr > input.warnRelErrMax
          ? "warn"
          : "pass";
  return starSimFusionNeutrinoClosureSchema.parse({
    schemaVersion: "starsim-fusion-neutrino-closure.v1",
    objectId: input.objectId,
    modelFluxes: input.modelFluxes,
    referenceFluxes: input.referenceFluxes,
    residuals: { ...residuals, maxRelErr },
    status,
    caveats: [
      "Solar neutrino closure is an observational residual check and not a standalone certification.",
      "Residuals inherit solar composition, opacity, reaction-rate, and neutrino flavor-conversion assumptions.",
    ],
  });
}

function relErr(model?: number, reference?: number) {
  if (model === undefined || reference === undefined || reference === 0) return undefined;
  return Math.abs(model - reference) / reference;
}
