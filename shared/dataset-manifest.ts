import { z } from "zod";
import { SI_UNITS, UnitSystemSI } from "./unit-system";

/**
 * Dataset manifest contract (repeatable runs)
 *
 * This is a lightweight, versioned format intended for CI reproducibility:
 * - declares inputs (inline or referenced),
 * - declares expected hashes and/or numeric tolerances.
 */

export const NumericTolerance = z.object({
  abs: z.number().nonnegative().optional(),
  rel: z.number().nonnegative().optional(),
});

export const ExpectedNumeric = z.object({
  value: z.number(),
  tol: NumericTolerance.default({}),
});

export const ExpectedHashes = z.object({
  inputs_hash: z.string().min(8).optional(),
  features_hash: z.string().min(8).optional(),
});

export const DatasetManifestEntry = z.object({
  id: z.string().min(1),
  pipeline: z.string().min(1),
  input: z.unknown(),
  expected: z
    .object({
      hashes: ExpectedHashes.optional(),
      numeric: z.record(ExpectedNumeric).optional(),
    })
    .optional(),
});

export type TDatasetManifestEntry = z.infer<typeof DatasetManifestEntry>;

export const DatasetManifest = z.object({
  schema_version: z.literal("dataset_manifest/1"),
  kind: z.literal("dataset_manifest"),
  created_at: z.string().datetime(),
  units: UnitSystemSI.default(SI_UNITS),
  name: z.string().optional(),
  description: z.string().optional(),
  entries: z.array(DatasetManifestEntry).min(1),
});

export type TDatasetManifest = z.infer<typeof DatasetManifest>;

