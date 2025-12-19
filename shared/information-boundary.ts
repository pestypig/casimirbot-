import { z } from "zod";

export const InformationBoundaryMode = z.enum(["observables", "labels", "mixed"]);
export type TInformationBoundaryMode = z.infer<typeof InformationBoundaryMode>;

/**
 * Information Boundary Contract (derived artifacts)
 * - Versioned, lightweight audit object carried by any derived artifact.
 * - Hashes are conventionally formatted as `sha256:<hex>`.
 */
export const InformationBoundary = z
  .object({
    schema_version: z.literal("ib/1"),
    data_cutoff_iso: z.string().datetime(),
    inputs_hash: z.string().min(8),
    features_hash: z.string().min(8).optional(),
    mode: InformationBoundaryMode,
    labels_used_as_features: z.boolean(),
    event_features_included: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "observables" && value.labels_used_as_features) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "labels_used_as_features must be false when mode='observables'",
        path: ["labels_used_as_features"],
      });
    }
    if (value.mode === "observables" && value.event_features_included) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "event_features_included must be false when mode='observables'",
        path: ["event_features_included"],
      });
    }
  });

export type TInformationBoundary = z.infer<typeof InformationBoundary>;

// v1 alias (explicit name used by Gate 0 contract freeze).
export const InformationBoundaryV1 = InformationBoundary;
export type TInformationBoundaryV1 = TInformationBoundary;
