import { z } from "zod";

const G_CGS = 6.6743e-8;
const M_SUN_G = 1.98847e33;
const R_SUN_CM = 6.957e10;
const L_SUN_ERG_S = 3.828e33;
const SIGMA_SB_CGS = 5.670374419e-5;

export const starSimFusionClosureSummarySchema = z.object({
  effectiveTemperatureFromLR_K: z.number().positive().optional(),
  surfaceGravityLogg_cgs: z.number().optional(),
  luminosityClosureRelErr: z.number().nonnegative().optional(),
  warnings: z.array(
    z.enum([
      "surface_luminosity_not_identical_to_nuclear_luminosity",
      "surface_teff_not_core_temperature",
      "profile_fixture_not_external_reproduction",
      "mesa_import_missing_inlist_hash",
      "mesa_import_missing_network_metadata",
    ]),
  ),
});

export type StarSimFusionClosureSummary = z.infer<
  typeof starSimFusionClosureSummarySchema
>;

export function computeStarSimFusionClosure(args: {
  luminosity_Lsun?: number;
  radius_Rsun?: number;
  mass_Msun?: number;
  integratedNucLuminosity_Lsun?: number;
  reproducibilityStatus?: string;
  mesaMetadata?: { inlistHash?: string; network?: string };
}): StarSimFusionClosureSummary {
  const luminosityErgS = args.luminosity_Lsun
    ? args.luminosity_Lsun * L_SUN_ERG_S
    : undefined;
  const radiusCm = args.radius_Rsun ? args.radius_Rsun * R_SUN_CM : undefined;
  const massG = args.mass_Msun ? args.mass_Msun * M_SUN_G : undefined;
  const effectiveTemperatureFromLR_K =
    luminosityErgS && radiusCm
      ? Math.pow(luminosityErgS / (4 * Math.PI * radiusCm * radiusCm * SIGMA_SB_CGS), 0.25)
      : undefined;
  const surfaceGravityLogg_cgs =
    massG && radiusCm ? Math.log10((G_CGS * massG) / (radiusCm * radiusCm)) : undefined;
  const luminosityClosureRelErr =
    args.integratedNucLuminosity_Lsun && args.luminosity_Lsun
      ? Math.abs(args.integratedNucLuminosity_Lsun - args.luminosity_Lsun) /
        args.luminosity_Lsun
      : undefined;
  const warnings: StarSimFusionClosureSummary["warnings"] = [
    "surface_teff_not_core_temperature",
  ];
  if (luminosityClosureRelErr !== undefined && luminosityClosureRelErr > 0.25) {
    warnings.push("surface_luminosity_not_identical_to_nuclear_luminosity");
  }
  if (args.reproducibilityStatus === "fixture_only") {
    warnings.push("profile_fixture_not_external_reproduction");
  }
  if (args.reproducibilityStatus === "mesa_imported" && !args.mesaMetadata?.inlistHash) {
    warnings.push("mesa_import_missing_inlist_hash");
  }
  if (args.reproducibilityStatus === "mesa_imported" && !args.mesaMetadata?.network) {
    warnings.push("mesa_import_missing_network_metadata");
  }
  return starSimFusionClosureSummarySchema.parse({
    effectiveTemperatureFromLR_K,
    surfaceGravityLogg_cgs,
    luminosityClosureRelErr,
    warnings: [...new Set(warnings)],
  });
}
