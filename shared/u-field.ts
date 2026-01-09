import { z } from "zod";

import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";
import { Float32RasterSource, Grid2D, UFieldChannelManifest } from "./essence-physics";
import { SI_UNITS, UnitSystemSI } from "./unit-system";

export const UFieldRzFrame = z
  .object({
    kind: z.literal("rz-plane"),
    r_min_m: z.number(),
    r_max_m: z.number(),
    z_min_m: z.number(),
    z_max_m: z.number(),
    axis_order: z.tuple([z.literal("r"), z.literal("z")]).default(["r", "z"]),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.r_max_m <= value.r_min_m) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "r_max_m must be greater than r_min_m",
        path: ["r_max_m"],
      });
    }
    if (value.z_max_m <= value.z_min_m) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "z_max_m must be greater than z_min_m",
        path: ["z_max_m"],
      });
    }
  });

export type TUFieldRzFrame = z.infer<typeof UFieldRzFrame>;

export const UFieldComponents = z
  .object({
    u_total_Jm3: Float32RasterSource,
  })
  .catchall(Float32RasterSource);

export type TUFieldComponents = z.infer<typeof UFieldComponents>;

export const UField2D = DerivedArtifactInformationBoundaryAudit.extend({
  schema_version: z.literal("u_field/1"),
  kind: z.literal("u_field"),
  units: UnitSystemSI.default(SI_UNITS),
  grid: Grid2D,
  frame: UFieldRzFrame,
  timestamp_iso: z.string().datetime(),
  device_id: z.string().optional(),
  shot_id: z.string().optional(),
  separatrix_mask: Float32RasterSource,
  manifest: UFieldChannelManifest,
  manifest_hash: z.string().min(8).optional(),
  components: UFieldComponents,
  notes: z.string().optional(),
}).superRefine((value, ctx) => {
  const manifestKeys = value.manifest.channels.map((channel) => channel.key);
  const manifestKeySet = new Set(manifestKeys);
  if (manifestKeySet.size !== manifestKeys.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Channel manifest keys must be unique.",
      path: ["manifest", "channels"],
    });
  }

  const componentKeys = Object.keys(value.components).filter(
    (key) => key !== "u_total_Jm3",
  );

  if (componentKeys.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide at least one channel field in components.",
      path: ["components"],
    });
  }

  for (const key of manifestKeys) {
    if (!componentKeys.includes(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing channel field for manifest key: ${key}`,
        path: ["components", key],
      });
    }
  }

  for (const key of componentKeys) {
    if (!manifestKeySet.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Channel field is not listed in manifest: ${key}`,
        path: ["components", key],
      });
    }
  }
});

export type TUField2D = z.infer<typeof UField2D>;
