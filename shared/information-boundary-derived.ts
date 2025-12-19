import { z } from "zod";
import { InformationBoundary, type TInformationBoundary } from "./information-boundary";

/**
 * Information-boundary contract v1 (derived artifacts)
 *
 * Any derived record that may be stored/logged/returned should carry:
 * - `information_boundary` (full audit object)
 * - plus a shallow copy of the most queried fields for indexing/debugging:
 *   `{ data_cutoff_iso, inputs_hash, features_hash? }`
 */

export const DerivedArtifactInformationBoundaryAudit = z
  .object({
    data_cutoff_iso: z.string().datetime(),
    inputs_hash: z.string().min(8),
    features_hash: z.string().min(8).optional(),
    information_boundary: InformationBoundary,
  });

export const DerivedArtifactInformationBoundaryAuditStrict = DerivedArtifactInformationBoundaryAudit.superRefine(
  (value, ctx) => {
    if (value.data_cutoff_iso !== value.information_boundary.data_cutoff_iso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "data_cutoff_iso must match information_boundary.data_cutoff_iso",
        path: ["data_cutoff_iso"],
      });
    }
    if (value.inputs_hash !== value.information_boundary.inputs_hash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "inputs_hash must match information_boundary.inputs_hash",
        path: ["inputs_hash"],
      });
    }
    if ((value.features_hash ?? undefined) !== (value.information_boundary.features_hash ?? undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "features_hash must match information_boundary.features_hash",
        path: ["features_hash"],
      });
    }
  },
);

export type TDerivedArtifactInformationBoundaryAudit = z.infer<typeof DerivedArtifactInformationBoundaryAudit>;

export type TInformationBoundaryAuditFields = Pick<TInformationBoundary, "data_cutoff_iso" | "inputs_hash" | "features_hash">;

export function withDerivedArtifactInformationBoundary<T extends Record<string, unknown>>(
  artifact: T,
  informationBoundary: TInformationBoundary,
): T & TDerivedArtifactInformationBoundaryAudit {
  return {
    ...artifact,
    data_cutoff_iso: informationBoundary.data_cutoff_iso,
    inputs_hash: informationBoundary.inputs_hash,
    features_hash: informationBoundary.features_hash,
    information_boundary: informationBoundary,
  };
}

export function assertDerivedArtifactInformationBoundaryAudit(
  value: unknown,
  hint = "derived artifact",
): asserts value is TDerivedArtifactInformationBoundaryAudit {
  try {
    DerivedArtifactInformationBoundaryAuditStrict.parse(value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`information_boundary_contract_failed:${hint}: ${message}`);
  }
}
