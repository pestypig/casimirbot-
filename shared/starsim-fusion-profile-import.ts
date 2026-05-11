import { z } from "zod";
import {
  starSimFusionChannelSchema,
  starSimObjectClassSchema,
} from "./starsim-fusion-microphysics";

export const starSimFusionProfileSourceSchema = z.enum([
  "mesa_profile",
  "mesa_fixture",
  "reduced_order_polytrope",
  "external_profile",
  "compact_object_glitch_fixture",
]);

export type StarSimFusionProfileSource = z.infer<
  typeof starSimFusionProfileSourceSchema
>;

export const starSimFusionProfileShellSchema = z.object({
  shellIndex: z.number().int().nonnegative(),
  radius_Rstar: z.number().min(0).max(1).optional(),
  radius_cm: z.number().positive().optional(),
  massCoordinate_Msun: z.number().nonnegative().optional(),
  enclosedMass_Msun: z.number().nonnegative().optional(),
  shellMass_g: z.number().positive().optional(),
  temperature_K: z.number().positive().optional(),
  density_g_cm3: z.number().positive().optional(),
  pressure_dyn_cm2: z.number().positive().optional(),
  luminosity_Lsun: z.number().nonnegative().optional(),
  epsNuc_erg_g_s: z.number().nonnegative().optional(),
  epsPp_erg_g_s: z.number().nonnegative().optional(),
  epsCno_erg_g_s: z.number().nonnegative().optional(),
  epsTripleAlpha_erg_g_s: z.number().nonnegative().optional(),
  hydrogenMassFraction: z.number().min(0).max(1).optional(),
  heliumMassFraction: z.number().min(0).max(1).optional(),
  metallicityMassFraction: z.number().min(0).max(1).optional(),
});

export type StarSimFusionProfileShell = z.infer<
  typeof starSimFusionProfileShellSchema
>;

export const starSimFusionProfileImportSchema = z
  .object({
    schemaVersion: z.literal("starsim-fusion-profile-import.v1"),
    objectId: z.string().min(1),
    source: starSimFusionProfileSourceSchema,
    sourceRef: z.string().min(1),
    sourceHash: z.string().optional(),
    stellarClass: z.object({
      spectralType: z.string().optional(),
      luminosityClass: z.string().optional(),
      objectClass: starSimObjectClassSchema,
    }),
    global: z.object({
      mass_Msun: z.number().positive().optional(),
      radius_Rsun: z.number().positive().optional(),
      luminosity_Lsun: z.number().positive().optional(),
      effectiveTemperature_K: z.number().positive().optional(),
      metallicity_feh: z.number().optional(),
      age_Gyr: z.number().nonnegative().optional(),
    }),
    mesaMetadata: z
      .object({
        mesaVersion: z.string().optional(),
        inlistHash: z.string().optional(),
        profileHash: z.string().min(1),
        historyHash: z.string().optional(),
        network: z.string().optional(),
        eos: z.string().optional(),
        opacity: z.string().optional(),
        metallicity_Z: z.number().nonnegative().optional(),
        mixingLengthAlpha: z.number().positive().optional(),
        initialMass_Msun: z.number().positive().optional(),
        age_Gyr: z.number().nonnegative().optional(),
      })
      .optional(),
    shells: z.array(starSimFusionProfileShellSchema).min(1),
    hSpectralFit: z
      .object({
        role: z.enum([
          "calibration_only",
          "new_measurement_of_h",
          "varying_planck_constant",
        ]),
      })
      .optional(),
    provenance: z.object({
      reproducibilityStatus: z.enum([
        "fixture_only",
        "reduced_order_simulated",
        "mesa_imported",
        "externally_reproduced",
      ]),
      qstRole: z
        .enum([
          "stellar_quantum_microphysics_prior",
          "cosmological_structure_prior",
          "not_direct_er_epr_evidence",
          "direct_er_epr_evidence",
        ])
        .default("stellar_quantum_microphysics_prior"),
      claimIds: z.array(z.string()).min(1),
      citations: z.array(z.string()).min(1),
      caveats: z.array(z.string()).min(1),
    }),
  })
  .superRefine((profile, ctx) => {
    if (profile.provenance.qstRole === "direct_er_epr_evidence") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provenance", "qstRole"],
        message: "Profile imports cannot claim direct ER=EPR evidence.",
      });
    }

    if (profile.stellarClass.objectClass === "neutron_star") return;

    const hasMassShellBasis = profile.shells.some(
      (shell) => shell.shellMass_g && shellHasEpsilon(shell),
    );
    const hasRadiusBasis =
      profile.global.radius_Rsun !== undefined &&
      profile.shells.filter((shell) => shell.radius_cm && shell.density_g_cm3 && shellHasEpsilon(shell))
        .length >= 2;
    if (!hasMassShellBasis && !hasRadiusBasis) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shells"],
        message: "Profile shells need shellMass_g or radius/density data with epsilon fields.",
      });
    }
  });

export type StarSimFusionProfileImport = z.infer<
  typeof starSimFusionProfileImportSchema
>;

export const starSimFusionProfileGraphNodeSchema = z.object({
  objectId: z.string().min(1),
  position_pc: z.tuple([z.number(), z.number(), z.number()]).optional(),
  velocity_km_s: z.tuple([z.number(), z.number(), z.number()]).optional(),
  spectralType: z.string().optional(),
  objectClass: starSimObjectClassSchema,
  dominantFusionChannel: starSimFusionChannelSchema,
  fusionZoneMode: z.enum([
    "core_fusion",
    "shell_fusion",
    "distributed_convective_core",
    "compact_object_not_applicable",
    "unknown",
  ]),
  activeVolumeFraction: z.number().min(0).max(1).optional(),
  quantumProcessIndex: z.number().min(0).max(1),
  qstRole: z.literal("astrophysical_population_prior"),
  caveat: z.literal("star_map_structure_is_not_direct_er_epr_evidence"),
});

export type StarSimFusionProfileGraphNode = z.infer<
  typeof starSimFusionProfileGraphNodeSchema
>;

export function parseStarSimFusionProfileImport(
  profile: StarSimFusionProfileImport,
): StarSimFusionProfileImport {
  return starSimFusionProfileImportSchema.parse(profile);
}

function shellHasEpsilon(shell: StarSimFusionProfileShell) {
  return Boolean(
    shell.epsNuc_erg_g_s ||
      shell.epsPp_erg_g_s ||
      shell.epsCno_erg_g_s ||
      shell.epsTripleAlpha_erg_g_s,
  );
}
