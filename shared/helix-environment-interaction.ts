import { z } from "zod";

export const HELIX_ENVIRONMENT_INTERACTION_CONFIG_SCHEMA =
  "helix.environment_interaction.config.v1" as const;
export const HELIX_ENVIRONMENT_INTERACTION_REQUEST_SCHEMA =
  "helix.environment_interaction.request.v1" as const;
export const HELIX_ENVIRONMENT_INTERACTION_RECEIPT_SCHEMA =
  "helix.environment_interaction.receipt.v1" as const;

const identifier = z.string().trim().min(1).max(320);

export const helixEnvironmentInteractionConfigSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_INTERACTION_CONFIG_SCHEMA),
    endpoint: z.string().url().max(2_000),
    bearer_token: z.string().trim().min(32).max(512),
    interaction_credential_id: identifier,
    action_authority_id: identifier,
    environment_binding_id: identifier,
    room_id: identifier,
    participant_id: identifier,
    subject_binding_id: identifier,
    subject_native_id: identifier,
    source_id: identifier,
    world_id: identifier,
    connector_installation_id: identifier,
    expires_at: z.string().datetime(),
    scopes: z.array(z.enum(["ask.submit", "ask.cancel", "ask.status"])).min(1),
  })
  .strict();

export const helixEnvironmentInteractionRequestSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_INTERACTION_REQUEST_SCHEMA),
    request_id: identifier,
    idempotency_key: z.string().trim().min(8).max(240),
    prompt: z.string().trim().min(1).max(20_000),
    connector_installation_id: identifier,
    subject_native_id: identifier,
    world_id: identifier,
  })
  .strict();

export type HelixEnvironmentInteractionConfig = z.infer<
  typeof helixEnvironmentInteractionConfigSchema
>;
export type HelixEnvironmentInteractionRequest = z.infer<
  typeof helixEnvironmentInteractionRequestSchema
>;

export type HelixEnvironmentInteractionReceipt = {
  schema: typeof HELIX_ENVIRONMENT_INTERACTION_RECEIPT_SCHEMA;
  ok: boolean;
  request_id: string;
  turn_id: string | null;
  room_id: string;
  participant_id: string;
  final_status: string;
  terminal_artifact_kind: string | null;
  terminal_authority_ok: boolean;
  text: string | null;
  error: string | null;
  retryable: boolean;
  idempotency_replayed: boolean;
  credential_included: false;
  assistant_answer: false;
  raw_content_included: false;
};
