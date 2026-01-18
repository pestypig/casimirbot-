import { z } from "zod";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import {
  CurvatureKMetrics,
  CurvatureRidgeSummary,
  Float32RasterSource,
  Grid2D,
  GridFrame2D,
  UFieldChannelManifest,
} from "./essence-physics";
import { UFieldComponents } from "./u-field";
import { SI_UNITS, UnitSystemSI } from "./unit-system";

export const SolarSurfaceUField = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("solar_surface_u_field/1"),
  kind: z.literal("solar_surface_u_field"),
  units: UnitSystemSI.default(SI_UNITS),
  grid: Grid2D,
  frame: GridFrame2D,
  timestamp_iso: z.string().datetime(),
  source: z
    .object({
      dataset: z.string().optional(),
      instrument: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  disk_mask: Float32RasterSource.optional(),
  manifest: UFieldChannelManifest,
  manifest_hash: z.string().min(8).optional(),
  components: UFieldComponents,
  notes: z.string().optional(),
});

export type TSolarSurfaceUField = z.infer<typeof SolarSurfaceUField>;

export const SolarSurfaceFrameMetrics = z.object({
  k_metrics: CurvatureKMetrics,
  ridge_summary: CurvatureRidgeSummary,
  residual_rms: z.number().nonnegative(),
  ridge_hazard: z.number().min(0).max(1),
  fragmentation_rate: z.number().nonnegative().optional(),
});

export type TSolarSurfaceFrameMetrics = z.infer<typeof SolarSurfaceFrameMetrics>;

export const SolarSurfaceFrame = z.object({
  id: z.string().min(1),
  timestamp_iso: z.string().datetime(),
  t_s: z.number().optional(),
  metrics: SolarSurfaceFrameMetrics,
});

export type TSolarSurfaceFrame = z.infer<typeof SolarSurfaceFrame>;

export const SolarSurfacePhaseLockScanPoint = z.object({
  frequency_hz: z.number().positive(),
  k3: z.number().min(0).max(1),
});

export const SolarSurfacePhaseLockBandwidth = z.object({
  low_hz: z.number().nonnegative(),
  high_hz: z.number().nonnegative(),
  width_hz: z.number().nonnegative(),
  threshold: z.number().min(0).max(1),
});

export const SolarSurfacePhaseSlipEvent = z.object({
  id: z.string().min(1),
  frame_id: z.string().optional(),
  timestamp_iso: z.string().datetime(),
  t_s: z.number().optional(),
  coherence: z.number().min(0).max(1),
  delta: z.number(),
});

export const SolarSurfacePhaseLockReport = z.object({
  scan: z.array(SolarSurfacePhaseLockScanPoint),
  f_star_hz: z.number().positive().optional(),
  k3_star: z.number().min(0).max(1).optional(),
  bandwidth_hz: SolarSurfacePhaseLockBandwidth.optional(),
  phase_slips: z.array(SolarSurfacePhaseSlipEvent),
});

export type TSolarSurfacePhaseLockReport = z.infer<
  typeof SolarSurfacePhaseLockReport
>;

export const SolarSurfaceEvent = z.object({
  id: z.string().min(1),
  source: z.enum(["HEK", "GOES", "manual"]),
  event_type: z.enum(["flare", "sunquake", "eruption", "other"]),
  start_iso: z.string().datetime(),
  peak_iso: z.string().datetime().optional(),
  end_iso: z.string().datetime().optional(),
  magnitude: z.string().optional(),
  notes: z.string().optional(),
});

export type TSolarSurfaceEvent = z.infer<typeof SolarSurfaceEvent>;

export const SolarSurfaceEventCorrelation = z.object({
  phase_slip_id: z.string().min(1),
  event_id: z.string().min(1),
  delta_s: z.number(),
});

export const SolarSurfaceEventTimeline = z.object({
  events: z.array(SolarSurfaceEvent),
  phase_slips: z.array(SolarSurfacePhaseSlipEvent),
  correlations: z.array(SolarSurfaceEventCorrelation),
  notes: z.string().optional(),
});

export type TSolarSurfaceEventTimeline = z.infer<
  typeof SolarSurfaceEventTimeline
>;

export const SolarSurfaceCoherenceReport = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("solar_surface_coherence/1"),
  kind: z.literal("solar_surface_coherence"),
  generated_at_iso: z.string().datetime(),
  frames: z.array(SolarSurfaceFrame).min(1),
  phase_lock: SolarSurfacePhaseLockReport.optional(),
  event_timeline: SolarSurfaceEventTimeline.optional(),
  u_field_inputs_hash: z.string().min(8).optional(),
});

export type TSolarSurfaceCoherenceReport = z.infer<
  typeof SolarSurfaceCoherenceReport
>;
