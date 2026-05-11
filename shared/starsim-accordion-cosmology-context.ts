import { z } from "zod";

export const starSimAccordionExpansionRoleSchema = z.enum([
  "large_scale_background",
  "bound_system_not_locally_expanding",
  "not_applicable",
]);

export const starSimAccordionCosmologyContextSchema = z.object({
  schemaVersion: z.literal("starsim-accordion-cosmology-context.v1"),
  epoch: z.object({
    redshift: z.number().nonnegative().optional(),
    scaleFactor: z.number().positive().optional(),
    cosmicTime_Gyr: z.number().nonnegative().optional(),
    lookbackTime_Gyr: z.number().nonnegative().optional(),
  }),
  distances: z.object({
    comovingDistance_Mpc: z.number().nonnegative().optional(),
    properDistance_Mpc: z.number().nonnegative().optional(),
    luminosityDistance_Mpc: z.number().nonnegative().optional(),
    angularDiameterDistance_Mpc: z.number().nonnegative().optional(),
  }),
  expansionRole: starSimAccordionExpansionRoleSchema,
  caveats: z.tuple([
    z.literal("cosmic_expansion_context_not_local_stellar_core_expansion"),
    z.literal("bound_galactic_systems_require_dynamics_model"),
  ]),
});

export type StarSimAccordionCosmologyContext = z.infer<
  typeof starSimAccordionCosmologyContextSchema
>;

export type BuildStarSimAccordionCosmologyContextInput = {
  redshift?: number;
  scaleFactor?: number;
  cosmicTime_Gyr?: number;
  lookbackTime_Gyr?: number;
  comovingDistance_Mpc?: number;
  properDistance_Mpc?: number;
  luminosityDistance_Mpc?: number;
  angularDiameterDistance_Mpc?: number;
  systemKind?: "large_scale" | "bound_galaxy" | "stellar_core" | "not_applicable";
};

export function buildStarSimAccordionCosmologyContext(
  input: BuildStarSimAccordionCosmologyContextInput,
): StarSimAccordionCosmologyContext {
  const redshift = input.redshift;
  const scaleFactor =
    input.scaleFactor ?? (redshift !== undefined ? 1 / (1 + redshift) : undefined);
  const expansionRole =
    input.systemKind === "large_scale"
      ? "large_scale_background"
      : input.systemKind === "not_applicable"
        ? "not_applicable"
        : "bound_system_not_locally_expanding";
  return starSimAccordionCosmologyContextSchema.parse({
    schemaVersion: "starsim-accordion-cosmology-context.v1",
    epoch: {
      redshift,
      scaleFactor,
      cosmicTime_Gyr: input.cosmicTime_Gyr,
      lookbackTime_Gyr: input.lookbackTime_Gyr,
    },
    distances: {
      comovingDistance_Mpc: input.comovingDistance_Mpc,
      properDistance_Mpc: input.properDistance_Mpc,
      luminosityDistance_Mpc: input.luminosityDistance_Mpc,
      angularDiameterDistance_Mpc: input.angularDiameterDistance_Mpc,
    },
    expansionRole,
    caveats: [
      "cosmic_expansion_context_not_local_stellar_core_expansion",
      "bound_galactic_systems_require_dynamics_model",
    ],
  });
}
