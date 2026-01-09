import { z } from "zod";
import { CurvatureUnit, CurvatureUnitInput } from "./essence-physics";
import { EssenceEnvelope } from "./essence-schema";
import { InformationBoundary } from "./information-boundary";

export const CurvatureRidgeTrackingConfig = z.preprocess((value) => {
  if (!value || typeof value !== "object") return value;
  const raw = value as Record<string, unknown>;
  return {
    drive_hz: raw.drive_hz ?? raw.driveHz,
    max_link_distance_m:
      raw.max_link_distance_m ?? raw.linkMaxMeters ?? raw.maxLinkDistanceM,
    track_window: raw.track_window ?? raw.trackWindow,
  };
}, z.object({
  drive_hz: z.number().positive().optional(),
  max_link_distance_m: z.number().positive().optional(),
  track_window: z.number().int().min(1).optional(),
}));

export type TCurvatureRidgeTrackingConfig = z.infer<
  typeof CurvatureRidgeTrackingConfig
>;

export const CurvatureDiagnosticsRunInput = CurvatureUnitInput.and(
  z.object({
    ridge_tracking: CurvatureRidgeTrackingConfig.optional(),
  }),
);

export type TCurvatureDiagnosticsRunInput = z.infer<
  typeof CurvatureDiagnosticsRunInput
>;

export const CurvatureDiagnosticsHashes = z.object({
  input_hash: z.string().min(8),
  energy_hash: z.string().min(8),
  manifest_hash: z.string().min(8).optional(),
  potential_hash: z.string().min(8),
  ridge_hash: z.string().min(8),
  ridge_tracking_hash: z.string().min(8).optional(),
  merkle_root_hash: z.string().min(8),
});

export type TCurvatureDiagnosticsHashes = z.infer<typeof CurvatureDiagnosticsHashes>;

export const CurvatureDiagnosticsRecord = z.object({
  schema_version: z.literal("curvature_diagnostics/1"),
  created_at: z.string().datetime(),
  essence_id: z.string().min(1),
  envelope: EssenceEnvelope.optional(),
  information_boundary: InformationBoundary,
  hashes: CurvatureDiagnosticsHashes,
  ridge_tracking: CurvatureRidgeTrackingConfig.optional(),
  result: CurvatureUnit,
});

export type TCurvatureDiagnosticsRecord = z.infer<typeof CurvatureDiagnosticsRecord>;
