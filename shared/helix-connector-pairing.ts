import { z } from "zod";
import type { HelixEnvironmentCommandConnectorConfig } from "./helix-environment-command";
import type { HelixEnvironmentActionConnectorConfig } from "./helix-environment-action";
import type { HelixEnvironmentInteractionConfig } from "./helix-environment-interaction";
import type { HelixRoomSourcePluginConfig } from "./helix-room-source-ingress";

export const HELIX_CONNECTOR_PAIRING_SCHEMA =
  "helix.connector_pairing.v1" as const;
export const HELIX_CONNECTOR_PAIRING_RECEIPT_SCHEMA =
  "helix.connector_pairing_receipt.v1" as const;
export const HELIX_CONNECTOR_PAIRING_REDEMPTION_SCHEMA =
  "helix.connector_pairing_redemption.v1" as const;
export const HELIX_CONNECTOR_PAIRING_UNPAIR_RECEIPT_SCHEMA =
  "helix.connector_pairing_unpair_receipt.v1" as const;

export const HELIX_CONNECTOR_PAIRING_CODE_TTL_MS = 10 * 60 * 1_000;
export const HELIX_CONNECTOR_PAIRING_REPLAY_TTL_MS = 2 * 60 * 1_000;
export const HELIX_CONNECTOR_PAIRING_CODE_PATTERN =
  /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);

export const helixConnectorPairingPurposeSchema = z.enum([
  "create",
  "rotate",
]);

export const helixConnectorPairingStatusSchema = z.enum([
  "pending",
  "redeemed",
  "expired",
  "revoked",
]);

export const helixConnectorPairingCreateRequestSchema = z
  .object({
    purpose: helixConnectorPairingPurposeSchema.default("create"),
    binding_id: identifierSchema.optional(),
    world_id: identifierSchema.optional(),
    domain_adapter: identifierSchema,
    source_label: z.string().trim().min(1).max(160).optional(),
    command_credential_requested: z.boolean().default(false),
    action_credential_requested: z.boolean().default(false),
    action_authority_id: identifierSchema.optional(),
    credential_ttl_ms: z
      .number()
      .int()
      .positive()
      .max(30 * 24 * 60 * 60 * 1_000)
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.purpose === "rotate" && !value.binding_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["binding_id"],
        message: "Rotation pairing requires an existing binding_id.",
      });
    }
    if (value.purpose === "create" && value.binding_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["binding_id"],
        message: "Creation pairing cannot replace an existing binding_id.",
      });
    }
    if (value.command_credential_requested && value.purpose !== "rotate") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["command_credential_requested"],
        message: "Command access can be paired only to an existing source binding.",
      });
    }
    if (value.action_credential_requested && value.purpose !== "rotate") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action_credential_requested"],
        message: "Player-action access can be paired only to an existing source binding.",
      });
    }
    if (value.action_credential_requested && !value.action_authority_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action_authority_id"],
        message: "Player-action pairing requires an exact player authority.",
      });
    }
    if (!value.action_credential_requested && value.action_authority_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action_authority_id"],
        message: "An action authority may be supplied only for player-action pairing.",
      });
    }
    if (value.command_credential_requested && value.action_credential_requested) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action_credential_requested"],
        message: "Server-command and player-action credentials must be paired separately.",
      });
    }
    if (
      value.command_credential_requested &&
      value.domain_adapter !== "minecraft.fabric_mod.v1"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["domain_adapter"],
        message: "In-game command pairing currently requires the Fabric adapter.",
      });
    }
  });

export const helixConnectorPairingRedeemRequestSchema = z
  .object({
    pairing_code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(HELIX_CONNECTOR_PAIRING_CODE_PATTERN),
    redemption_nonce: z.string().trim().min(32).max(160),
    domain_adapter: identifierSchema,
    connector_kind: identifierSchema,
    connector_version: z.string().trim().min(1).max(80),
  })
  .strict();

export const helixConnectorUnpairRequestSchema = z
  .object({
    binding_id: identifierSchema,
  })
  .strict();

export type HelixConnectorPairingPurpose = z.infer<
  typeof helixConnectorPairingPurposeSchema
>;
export type HelixConnectorPairingStatus = z.infer<
  typeof helixConnectorPairingStatusSchema
>;

export type HelixConnectorPairing = {
  schema: typeof HELIX_CONNECTOR_PAIRING_SCHEMA;
  pairing_id: string;
  room_id: string;
  binding_id: string;
  purpose: HelixConnectorPairingPurpose;
  domain_adapter: string;
  world_id: string;
  source_label: string;
  command_credential_requested: boolean;
  action_credential_requested: boolean;
  action_authority_id: string | null;
  status: HelixConnectorPairingStatus;
  expires_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  code_included: false;
  credential_included: false;
  content_role: "connector_pairing_control_not_assistant_answer";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixConnectorPairingReceipt = {
  schema: typeof HELIX_CONNECTOR_PAIRING_RECEIPT_SCHEMA;
  ok: boolean;
  error: string | null;
  message: string;
  pairing: HelixConnectorPairing | null;
  pairings?: HelixConnectorPairing[];
  pairing_code?: string | null;
  pairing_command?: string | null;
  pairing_code_shown_once: boolean;
  credential_included: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixConnectorPairingRedemptionReceipt = {
  schema: typeof HELIX_CONNECTOR_PAIRING_REDEMPTION_SCHEMA;
  ok: boolean;
  error: string | null;
  message: string;
  pairing_id: string | null;
  binding_id: string | null;
  plugin_config:
    | (HelixRoomSourcePluginConfig & { pairing_endpoint: string })
    | {
        pairing_mode: "command_only";
        pairing_endpoint: string;
        source_id: string;
        room_id: string;
        world_id: string;
        domain_adapter: string;
        command: HelixEnvironmentCommandConnectorConfig;
      }
    | {
        pairing_mode: "action_only";
        pairing_endpoint: string;
        source_id: string;
        room_id: string;
        world_id: string;
        domain_adapter: string;
        action: HelixEnvironmentActionConnectorConfig;
        interaction: HelixEnvironmentInteractionConfig;
      }
    | null;
  replayed: boolean;
  credential_included: boolean;
  credential_shown_once: boolean;
  secret_stored_raw: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixConnectorUnpairReceipt = {
  schema: typeof HELIX_CONNECTOR_PAIRING_UNPAIR_RECEIPT_SCHEMA;
  ok: boolean;
  error: string | null;
  message: string;
  binding_id: string | null;
  status: "revoked" | null;
  credential_included: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
