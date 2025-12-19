import { z } from "zod";

/**
 * Physics unit-system contract.
 *
 * We standardize on SI base units across physics/curvature paths:
 * - length: meters (m)
 * - time: seconds (s)
 * - curvature: 1/m^2 (m^-2)
 * - energy density (u): J/m^3
 * - mass density (rho): kg/m^3
 * - power flux (P/A): W/m^2
 */
export const UnitSystemSI = z.object({
  schema_version: z.literal("units/1"),
  system: z.literal("SI"),
  length: z.literal("m"),
  time: z.literal("s"),
  curvature: z.literal("m^-2"),
  energy_density: z.literal("J/m^3"),
  mass_density: z.literal("kg/m^3"),
  power_flux: z.literal("W/m^2"),
});

export type TUnitSystemSI = z.infer<typeof UnitSystemSI>;

export const SI_UNITS: TUnitSystemSI = {
  schema_version: "units/1",
  system: "SI",
  length: "m",
  time: "s",
  curvature: "m^-2",
  energy_density: "J/m^3",
  mass_density: "kg/m^3",
  power_flux: "W/m^2",
};

