import { z } from "zod";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import { Float32RasterB64, Grid2D } from "./essence-physics";
import { SI_UNITS, UnitSystemSI } from "./unit-system";

export const TokamakRzFrame = z.object({
  kind: z.literal("rz-plane"),
  r_min_m: z.number(),
  r_max_m: z.number(),
  z_min_m: z.number(),
  z_max_m: z.number(),
  axis_order: z.tuple([z.literal("r"), z.literal("z")]).default(["r", "z"]),
  notes: z.string().optional(),
});

export type TTokamakRzFrame = z.infer<typeof TokamakRzFrame>;

export const TokamakChannelKey = z.enum(["u_deltaB_Jm3", "u_gradp", "u_J", "u_rad"]);
export type TTokamakChannelKey = z.infer<typeof TokamakChannelKey>;

export const TokamakChannelNormalization = z.object({
  method: z.enum(["none", "scale_offset"]).default("none"),
  scale: z.number().optional(),
  offset: z.number().optional(),
  clamp: z.tuple([z.number(), z.number()]).optional(),
  notes: z.string().optional(),
});

export type TTokamakChannelNormalization = z.infer<typeof TokamakChannelNormalization>;

export const TokamakChannelManifestEntry = z.object({
  key: TokamakChannelKey,
  weight: z.number(),
  normalization: TokamakChannelNormalization.default({ method: "none" }),
  units: z.string().optional(),
  notes: z.string().optional(),
});

export type TTokamakChannelManifestEntry = z.infer<typeof TokamakChannelManifestEntry>;

export const TokamakChannelManifest = z.object({
  schema_version: z.literal("tokamak_channel_manifest/1"),
  version: z.string().min(1),
  device_id: z.string().optional(),
  channels: z.array(TokamakChannelManifestEntry).min(1),
  total_policy: z
    .object({
      method: z.literal("weighted-sum"),
      normalize_weights: z.boolean().default(false),
    })
    .default({ method: "weighted-sum", normalize_weights: false }),
  notes: z.string().optional(),
});

export type TTokamakChannelManifest = z.infer<typeof TokamakChannelManifest>;

export const TokamakChannelFields = z.object({
  u_deltaB_Jm3: Float32RasterB64.optional(),
  u_gradp: Float32RasterB64.optional(),
  u_J: Float32RasterB64.optional(),
  u_rad: Float32RasterB64.optional(),
});

export type TTokamakChannelFields = z.infer<typeof TokamakChannelFields>;

export const TokamakEquilibriumFields = z.object({
  b_eq_T: Float32RasterB64.optional(),
  p_eq_Pa: Float32RasterB64.optional(),
  psi_N: Float32RasterB64.optional(),
});

export type TTokamakEquilibriumFields = z.infer<typeof TokamakEquilibriumFields>;

export const TokamakPerturbationFields = z.object({
  b_T: Float32RasterB64.optional(),
  delta_b_T: Float32RasterB64.optional(),
  p_Pa: Float32RasterB64.optional(),
  j_A_m2: Float32RasterB64.optional(),
  rad_W_m3: Float32RasterB64.optional(),
});

export type TTokamakPerturbationFields = z.infer<typeof TokamakPerturbationFields>;

export const TokamakRzSnapshotInput = z
  .object({
    schema_version: z.literal("tokamak_rz_snapshot/1"),
    device_id: z.string().optional(),
    shot_id: z.string().optional(),
    timestamp_iso: z.string().datetime(),
    data_cutoff_iso: z.string().datetime().optional(),
    units: UnitSystemSI.default(SI_UNITS),
    grid: Grid2D,
    frame: TokamakRzFrame,
    separatrix_mask: Float32RasterB64,
    equilibrium: TokamakEquilibriumFields.optional(),
    perturbations: TokamakPerturbationFields,
    manifest: TokamakChannelManifest,
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const perturb = value.perturbations;
    const hasPerturb = Object.values(perturb).some((entry) => Boolean(entry));
    if (!hasPerturb) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one perturbation field for tokamak_rz_snapshot.",
        path: ["perturbations"],
      });
    }
  });

export type TTokamakRzSnapshotInput = z.infer<typeof TokamakRzSnapshotInput>;

export const TokamakRzEnergyInput = z
  .object({
    schema_version: z.literal("tokamak_rz_input/1"),
    device_id: z.string().optional(),
    shot_id: z.string().optional(),
    timestamp_iso: z.string().datetime(),
    data_cutoff_iso: z.string().datetime().optional(),
    units: UnitSystemSI.default(SI_UNITS),
    grid: Grid2D,
    frame: TokamakRzFrame,
    separatrix_mask: Float32RasterB64,
    channels: TokamakChannelFields,
    manifest: TokamakChannelManifest,
  })
  .superRefine((value, ctx) => {
    const hasChannel = Object.values(value.channels).some((entry) => Boolean(entry));
    if (!hasChannel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one channel for tokamak_rz_input.",
        path: ["channels"],
      });
    }
  });

export type TTokamakRzEnergyInput = z.infer<typeof TokamakRzEnergyInput>;

export const TokamakRzEnergyField2D = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("tokamak_rz_energy_field/1"),
  kind: z.literal("tokamak_rz_energy_field"),
  units: UnitSystemSI.default(SI_UNITS),
  grid: Grid2D,
  frame: TokamakRzFrame,
  timestamp_iso: z.string().datetime(),
  device_id: z.string().optional(),
  shot_id: z.string().optional(),
  separatrix_mask: Float32RasterB64,
  manifest: TokamakChannelManifest,
  manifest_hash: z.string().min(8),
  components: TokamakChannelFields.extend({
    u_total_Jm3: Float32RasterB64,
  }),
});

export type TTokamakRzEnergyField2D = z.infer<typeof TokamakRzEnergyField2D>;
