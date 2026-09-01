import { z } from "zod";

export const HELIX_AGENT_CLIENT_READINESS_SCHEMA =
  "helix.agent_client_readiness.v1" as const;

export const HELIX_NO_AGENT_CAPABILITIES = [
  "account",
  "connection_status",
  "manual_connector_controls",
  "run_history",
  "evidence",
  "revocation",
  "emergency_stop",
] as const;

const providerApplicationSchema = z.enum([
  "available",
  "unavailable",
  "unknown",
]);
const clientAuthorizationSchema = z.enum([
  "active",
  "expired",
  "revoked",
  "missing",
]);
const clientPresenceSchema = z.enum(["online", "offline", "unknown"]);
const catalogSyncSchema = z.enum([
  "current",
  "refreshing",
  "stale",
  "unsupported",
]);
const threadAttachmentSchema = z.enum([
  "attached",
  "not_attached",
  "stale",
  "unsupported",
]);
const continuationReadinessSchema = z.enum([
  "ready",
  "monitor_only",
  "polling",
  "unavailable",
]);
const environmentReadinessSchema = z.enum([
  "ready",
  "degraded",
  "offline",
  "not_selected",
]);

export const helixAgentClientReadinessSchema = z.object({
  schema: z.literal(HELIX_AGENT_CLIENT_READINESS_SCHEMA),
  mode: z.enum(["no_agent", "external_agent"]),
  status: z.enum(["no_agent", "ready", "degraded", "action_required"]),
  agent_selected: z.boolean(),
  agent_ready: z.boolean(),
  manual_harness_ready: z.literal(true),
  provider_application: providerApplicationSchema,
  client_authorization: clientAuthorizationSchema,
  client_presence: clientPresenceSchema,
  catalog_sync: catalogSyncSchema,
  thread_attachment: threadAttachmentSchema,
  continuation_readiness: continuationReadinessSchema,
  environment_readiness: environmentReadinessSchema,
  headline: z.string().trim().min(1).max(240),
  recovery_action: z.enum([
    "none",
    "choose_agent_app",
    "install_or_open_agent_app",
    "reconnect_agent",
    "open_agent_app",
    "refresh_tools",
    "choose_task",
    "reattach_task",
    "reconnect_environment",
  ]),
  available_without_agent: z.array(z.enum(HELIX_NO_AGENT_CAPABILITIES))
    .length(HELIX_NO_AGENT_CAPABILITIES.length),
  credential_included: z.literal(false),
  provider_thread_content_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  content_role: z.literal("readiness_projection_not_assistant_answer"),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixAgentClientReadiness = z.infer<
  typeof helixAgentClientReadinessSchema
>;

type ReadinessAxes = Pick<
  HelixAgentClientReadiness,
  | "provider_application"
  | "client_authorization"
  | "client_presence"
  | "catalog_sync"
  | "thread_attachment"
  | "continuation_readiness"
  | "environment_readiness"
>;

export type BuildHelixAgentClientReadinessInput = ReadinessAxes & {
  agentSelected: boolean;
};

const baseProjection = (input: BuildHelixAgentClientReadinessInput) => ({
  schema: HELIX_AGENT_CLIENT_READINESS_SCHEMA,
  agent_selected: input.agentSelected,
  manual_harness_ready: true as const,
  provider_application: input.provider_application,
  client_authorization: input.client_authorization,
  client_presence: input.client_presence,
  catalog_sync: input.catalog_sync,
  thread_attachment: input.thread_attachment,
  continuation_readiness: input.continuation_readiness,
  environment_readiness: input.environment_readiness,
  available_without_agent: [...HELIX_NO_AGENT_CAPABILITIES],
  credential_included: false as const,
  provider_thread_content_included: false as const,
  hidden_reasoning_included: false as const,
  content_role: "readiness_projection_not_assistant_answer" as const,
  answer_authority: false as const,
  terminal_eligible: false as const,
});

export const buildHelixAgentClientReadiness = (
  input: BuildHelixAgentClientReadinessInput,
): HelixAgentClientReadiness => {
  const base = baseProjection(input);
  if (!input.agentSelected) {
    return helixAgentClientReadinessSchema.parse({
      ...base,
      mode: "no_agent",
      status: "no_agent",
      agent_ready: false,
      headline: "CasimirBot is ready for manual use; no AI app is connected.",
      recovery_action: "choose_agent_app",
    });
  }
  if (input.provider_application !== "available") {
    return helixAgentClientReadinessSchema.parse({
      ...base,
      mode: "external_agent",
      status: "action_required",
      agent_ready: false,
      headline: "The selected AI app is not available on this device.",
      recovery_action: "install_or_open_agent_app",
    });
  }
  if (input.client_authorization !== "active") {
    return helixAgentClientReadinessSchema.parse({
      ...base,
      mode: "external_agent",
      status: "action_required",
      agent_ready: false,
      headline: "The AI app needs permission to use CasimirBot.",
      recovery_action: "reconnect_agent",
    });
  }
  if (input.client_presence !== "online") {
    return helixAgentClientReadinessSchema.parse({
      ...base,
      mode: "external_agent",
      status: "degraded",
      agent_ready: false,
      headline: "The AI app is connected but is not currently online.",
      recovery_action: "open_agent_app",
    });
  }
  if (input.catalog_sync !== "current") {
    return helixAgentClientReadinessSchema.parse({
      ...base,
      mode: "external_agent",
      status: "degraded",
      agent_ready: false,
      headline: "The AI app needs to refresh its CasimirBot tools.",
      recovery_action: "refresh_tools",
    });
  }
  if (input.thread_attachment === "stale") {
    return helixAgentClientReadinessSchema.parse({
      ...base,
      mode: "external_agent",
      status: "degraded",
      agent_ready: false,
      headline: "The previously attached AI task is no longer current.",
      recovery_action: "reattach_task",
    });
  }
  if (
    input.continuation_readiness === "ready" &&
    input.thread_attachment !== "attached"
  ) {
    return helixAgentClientReadinessSchema.parse({
      ...base,
      mode: "external_agent",
      status: "degraded",
      agent_ready: false,
      headline: "Choose the AI task that should receive steering requests.",
      recovery_action: "choose_task",
    });
  }
  if (["offline", "degraded"].includes(input.environment_readiness)) {
    return helixAgentClientReadinessSchema.parse({
      ...base,
      mode: "external_agent",
      status: "degraded",
      agent_ready: true,
      headline: "The AI app is ready, but the selected environment needs attention.",
      recovery_action: "reconnect_environment",
    });
  }
  return helixAgentClientReadinessSchema.parse({
    ...base,
    mode: "external_agent",
    status: "ready",
    agent_ready: true,
    headline: input.environment_readiness === "not_selected"
      ? "The AI app is ready; no environment is selected."
      : "The AI app and selected environment are ready.",
    recovery_action: "none",
  });
};
