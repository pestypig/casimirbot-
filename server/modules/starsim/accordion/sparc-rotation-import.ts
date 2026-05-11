import { readFileSync } from "node:fs";
import { z } from "zod";
import type { StarSimRotationCurveInputPoint } from "../../../../shared/starsim-galactic-rotation-controls";

export const sparcRotationImportSchema = z.object({
  schemaVersion: z.literal("starsim-sparc-rotation-import.v1"),
  galaxyId: z.string().min(1),
  points: z.array(
    z.object({
      radius_kpc: z.number().nonnegative(),
      observedVelocity_km_s: z.number().nonnegative(),
      baryonicVelocity_km_s: z.number().nonnegative(),
      nfwVelocity_km_s: z.number().nonnegative().optional(),
      burkertVelocity_km_s: z.number().nonnegative().optional(),
      mondVelocity_km_s: z.number().nonnegative().optional(),
    }),
  ).min(1),
});

export function loadSparcRotationImport(path: string): {
  galaxyId: string;
  points: StarSimRotationCurveInputPoint[];
} {
  const payload = sparcRotationImportSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  return {
    galaxyId: payload.galaxyId,
    points: payload.points.map((point) => ({
      radius_kpc: point.radius_kpc,
      observedVelocity_km_s: point.observedVelocity_km_s,
      baryonicVelocity_km_s: point.baryonicVelocity_km_s,
      modelVelocities: {
        dark_matter_halo_nfw: point.nfwVelocity_km_s,
        dark_matter_halo_burkert: point.burkertVelocity_km_s,
        mond_low_acceleration: point.mondVelocity_km_s,
        empirical_sparc_reference: point.observedVelocity_km_s,
      },
    })),
  };
}
