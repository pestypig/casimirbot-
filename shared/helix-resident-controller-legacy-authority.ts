import { z } from "zod";

export const HELIX_LEGACY_AUTHORITY_INVENTORY_SCHEMA =
  "helix.legacy_authority.inventory_entry.v1" as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);

export const helixLegacyAuthorityInventoryEntrySchema = z
  .object({
    schema: z.literal(HELIX_LEGACY_AUTHORITY_INVENTORY_SCHEMA),
    inventory_id: identifierSchema,
    source_path: z.string().trim().min(1).max(1_000),
    classification: z.enum([
      "canonical_reuse",
      "adapt",
      "quarantine",
      "delete",
    ]),
    allowed_context_role: z.enum([
      "canonical_contract",
      "advisory_overwatch",
      "immutable_evidence",
      "none",
    ]),
    execution_authority: z.literal(false),
    answer_authority: z.literal(false),
    controller_selection_authority: z.literal(false),
    current_design_authority: z.boolean(),
    generated_projection: z.boolean(),
    receipt_only: z.boolean(),
    live_reachability_verified: z.boolean(),
    replacement_contract_ref: identifierSchema.nullable(),
    deletion_authorized: z.literal(false),
  })
  .strict()
  .superRefine((entry, context) => {
    if (
      ["quarantine", "delete"].includes(entry.classification) &&
      entry.allowed_context_role !== "none"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowed_context_role"],
        message: "Quarantined or deletion-candidate code cannot enter active context.",
      });
    }
    if (
      (entry.generated_projection || entry.receipt_only) &&
      entry.current_design_authority
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["current_design_authority"],
        message: "Generated and receipt-only surfaces cannot be current design authority.",
      });
    }
  });

export type HelixLegacyAuthorityInventoryEntry = z.infer<
  typeof helixLegacyAuthorityInventoryEntrySchema
>;

const entry = (
  value: Omit<HelixLegacyAuthorityInventoryEntry, "schema" | "deletion_authorized">,
) =>
  helixLegacyAuthorityInventoryEntrySchema.parse({
    schema: HELIX_LEGACY_AUTHORITY_INVENTORY_SCHEMA,
    ...value,
    deletion_authorized: false,
  });

export const HELIX_RESIDENT_CONTROLLER_LEGACY_AUTHORITY_INVENTORY = [
  entry({
    inventory_id: "legacy:event-normalizer",
    source_path: "server/services/mission-overwatch/event-normalizer.ts",
    classification: "adapt",
    allowed_context_role: "advisory_overwatch",
    execution_authority: false,
    answer_authority: false,
    controller_selection_authority: false,
    current_design_authority: false,
    generated_projection: false,
    receipt_only: false,
    live_reachability_verified: true,
    replacement_contract_ref: "helix.resident_controller.event.v1",
  }),
  entry({
    inventory_id: "legacy:salience",
    source_path: "server/services/mission-overwatch/salience.ts",
    classification: "adapt",
    allowed_context_role: "advisory_overwatch",
    execution_authority: false,
    answer_authority: false,
    controller_selection_authority: false,
    current_design_authority: false,
    generated_projection: false,
    receipt_only: false,
    live_reachability_verified: true,
    replacement_contract_ref: "helix.resident_controller.event.v1",
  }),
  entry({
    inventory_id: "legacy:dottie-orchestrator",
    source_path: "server/services/mission-overwatch/dottie-orchestrator.ts",
    classification: "quarantine",
    allowed_context_role: "none",
    execution_authority: false,
    answer_authority: false,
    controller_selection_authority: false,
    current_design_authority: false,
    generated_projection: false,
    receipt_only: false,
    live_reachability_verified: false,
    replacement_contract_ref: null,
  }),
  entry({
    inventory_id: "legacy:generated-code-lattice",
    source_path: "server/_generated/code-lattice.json",
    classification: "quarantine",
    allowed_context_role: "none",
    execution_authority: false,
    answer_authority: false,
    controller_selection_authority: false,
    current_design_authority: false,
    generated_projection: true,
    receipt_only: false,
    live_reachability_verified: false,
    replacement_contract_ref: null,
  }),
] as const;

export const isHelixResidentControllerContextEligible = (
  entryValue: HelixLegacyAuthorityInventoryEntry,
) => {
  const parsed = helixLegacyAuthorityInventoryEntrySchema.parse(entryValue);
  return (
    parsed.allowed_context_role !== "none" &&
    !parsed.generated_projection &&
    !parsed.receipt_only &&
    parsed.classification !== "quarantine" &&
    parsed.classification !== "delete"
  );
};
