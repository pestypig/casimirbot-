import { z } from "zod";

export const HELIX_LOCAL_SUPERVISOR_STATUS_SCHEMA =
  "helix.local_supervisor_status.v1" as const;

export const helixLocalSupervisorStatusSchema = z.object({
  schema: z.literal(HELIX_LOCAL_SUPERVISOR_STATUS_SCHEMA),
  service_instance_ref: z.string().regex(/^service_instance:[a-f0-9]{32}$/u),
  workspace_ref: z.string().regex(/^workspace:[a-f0-9]{64}$/u),
  started_at: z.string().datetime({ offset: true }),
  ready: z.boolean(),
  supervisor_mode: z.enum([
    "desktop_single_instance",
    "external_keyed_launcher",
    "external_process",
  ]),
  one_instance_enforced: z.boolean(),
  attach_supported: z.literal(true),
  client_isolation_dimensions: z.tuple([
    z.literal("account_session"),
    z.literal("oauth_client"),
    z.literal("conversation_thread"),
    z.literal("room_participant"),
    z.literal("run_turn"),
    z.literal("environment_source_epoch"),
    z.literal("execution_lease"),
  ]),
  concurrent_read_admission: z.literal("grant_scoped"),
  mutation_admission: z.literal("serialized_execution_lease"),
  credential_included: z.literal(false),
  private_endpoint_included: z.literal(false),
  workspace_path_included: z.literal(false),
  process_identity_included: z.literal(false),
  account_identity_included: z.literal(false),
  content_role: z.literal("local_supervisor_status_not_authority"),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixLocalSupervisorStatus = z.infer<
  typeof helixLocalSupervisorStatusSchema
>;

