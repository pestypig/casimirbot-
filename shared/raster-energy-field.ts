import { z } from "zod";
import { Float32RasterB64, Grid2D, type TFloat32RasterB64 } from "./essence-physics";
import { SI_UNITS, UnitSystemSI } from "./unit-system";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";

/**
 * Canonical raster energy-field contract (2D, SI).
 *
 * Intended as a common interchange format for:
 * - solar adapters (e.g., AIA intensity -> u_total),
 * - lab/simulation adapters (e.g., MHD snapshots -> u_total),
 * - and downstream curvature-unit solvers.
 */

export const RasterEnergyField2D = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("raster_energy_field/1"),
  kind: z.literal("raster_energy_field"),
  // Require feature hashing for stored/returned derived fields.
  features_hash: z.string().min(8),

  units: UnitSystemSI.default(SI_UNITS),
  grid: Grid2D,
  timestamp_iso: z.string().datetime(),

  components: z.object({
    u_total_Jm3: Float32RasterB64,
    u_B_Jm3: Float32RasterB64.optional(),
    u_E_Jm3: Float32RasterB64.optional(),
    u_thermal_Jm3: Float32RasterB64.optional(),
  }),

  meta: z.record(z.any()).optional(),
});

export type TRasterEnergyField2D = z.infer<typeof RasterEnergyField2D>;
