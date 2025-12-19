import { z } from "zod";
import { UnitSystemSI, SI_UNITS } from "./unit-system";

/**
 * Versioned solar energy-proxy calibration artifact.
 *
 * The calibration ties a normalized solar intensity map (e.g., SunPy AIA 193 A resampled
 * to 0..1 using a percentile) to an energy-density field u_total in J/m^3.
 */
export const SolarEnergyCalibration = z.object({
  schema_version: z.literal("solar_energy_calibration/1"),
  version: z.string().min(1),
  instrument: z.string().min(1),
  wavelength_A: z.number().positive(),
  units: UnitSystemSI.default(SI_UNITS),
  normalization: z.object({
    input: z.string().min(1),
    map_scale_percentile: z.number().min(0).max(100).optional(),
    map_value_range: z.tuple([z.number(), z.number()]).optional(),
    notes: z.string().optional(),
  }),
  u_total_scale_Jm3: z.number().positive(),
  u_exponent: z.number().positive().default(1),
  u_floor_Jm3: z.number().nonnegative().default(0),
  u_cap_Jm3: z.number().positive().optional(),
  coherence_energy_scale_Jm3: z.number().positive().default(1),
  metadata: z.record(z.any()).optional(),
});

export type TSolarEnergyCalibration = z.infer<typeof SolarEnergyCalibration>;
