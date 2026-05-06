import type { BrickFieldBundle } from "./extract-brick-fields.js";
import { requireChannel } from "./extract-brick-fields.js";

export interface RegionProfile {
  region: "hull" | "wall" | "exterior_shell";
  voxelCount: number;
  meanRicci4Abs: number;
}

export function extractRegionProfiles(bundle: BrickFieldBundle, wallSigma = 24): RegionProfile[] {
  const hullSdf = requireChannel(bundle, "hull_sdf");
  const ricci4 = requireChannel(bundle, "ricci4");
  const buckets: Record<RegionProfile["region"], { n: number; sum: number }> = {
    hull: { n: 0, sum: 0 },
    wall: { n: 0, sum: 0 },
    exterior_shell: { n: 0, sum: 0 },
  };
  for (let i = 0; i < hullSdf.length; i += 1) {
    const sdf = hullSdf[i] ?? 0;
    const region = sdf < -wallSigma ? "hull" : Math.abs(sdf) <= wallSigma ? "wall" : sdf <= 3 * wallSigma ? "exterior_shell" : null;
    if (!region) continue;
    buckets[region].n += 1;
    buckets[region].sum += Math.abs(ricci4[i] ?? 0);
  }
  return (["hull", "wall", "exterior_shell"] as const).map((region) => ({
    region,
    voxelCount: buckets[region].n,
    meanRicci4Abs: buckets[region].sum / Math.max(1, buckets[region].n),
  }));
}
