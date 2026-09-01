import { Router, type Request, type Response } from "express";
import {
  HELIX_AGENT_CONNECTION_STATUS_SCHEMA,
  HELIX_AGENT_CLIENT_PROFILES,
  helixAgentClientProfileIdSchema,
  helixAgentConnectionStatusSchema,
  type HelixAgentClientProfileId,
} from "@shared/helix-agent-client-profile";
import { buildHelixAgentClientReadiness } from "@shared/helix-agent-client-readiness";
import type { HelixLocalSupervisorPresence } from "@shared/helix-local-supervisor-coordination";
import {
  helixAgentAccountLinkStore,
  type HelixAgentAccountBindingProjection,
  type HelixAgentAccountLinkStore,
} from "../services/helix-account/agent-account-link-store";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";

export const HELIX_AGENT_CONNECTION_ERROR_SCHEMA =
  "helix.agent_connection_error.v1" as const;

type SessionRecord = {
  session_id: string;
  profile: { profile_id: string };
};

type BindingStore = Pick<HelixAgentAccountLinkStore, "listBindings">;
type PresenceStore = {
  serviceInstanceRef: string;
  listPresence(): HelixLocalSupervisorPresence[];
};

export type AgentConnectionsRouterDependencies = {
  bindingStore?: BindingStore;
  coordinationStore: PresenceStore;
  resolveSession?: (sessionId?: string | null) => Promise<SessionRecord | null>;
};

const setPrivateHeaders = (res: Response): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
};

const fixedError = (
  res: Response,
  status: number,
  error: "session_required" | "invalid_client_profile" | "internal_error",
): Response => {
  const messages = {
    session_required: "Sign in to inspect AI app connection readiness.",
    invalid_client_profile: "Choose a supported AI app profile.",
    internal_error: "AI app connection readiness is temporarily unavailable.",
  } as const;
  setPrivateHeaders(res);
  return res.status(status).json({
    schema: HELIX_AGENT_CONNECTION_ERROR_SCHEMA,
    ok: false,
    error,
    message: messages[error],
    credential_included: false,
    oauth_subject_included: false,
    raw_claims_included: false,
  });
};

const newestActiveBinding = (
  bindings: HelixAgentAccountBindingProjection[],
): HelixAgentAccountBindingProjection | null =>
  bindings
    .filter((binding: HelixAgentAccountBindingProjection) => binding.status === "active")
    .sort((
      left: HelixAgentAccountBindingProjection,
      right: HelixAgentAccountBindingProjection,
    ) => Date.parse(right.updated_at) - Date.parse(left.updated_at))[0] ?? null;

const newestOwnedPresence = (input: {
  entries: HelixLocalSupervisorPresence[];
  profileId: string;
  serviceInstanceRef: string;
  authorizationActive: boolean;
}): HelixLocalSupervisorPresence | null => {
  if (!input.authorizationActive) return null;
  return input.entries
    .filter((entry: HelixLocalSupervisorPresence) =>
      entry.active &&
      entry.service_instance_ref === input.serviceInstanceRef &&
      entry.authenticated_profile_ref === input.profileId &&
      Boolean(entry.authenticated_mcp_client_ref) &&
      Boolean(entry.client_session_ref) &&
      Boolean(entry.conversation_thread_ref))
    .sort((
      left: HelixLocalSupervisorPresence,
      right: HelixLocalSupervisorPresence,
    ) => Date.parse(right.observed_at) - Date.parse(left.observed_at))[0] ?? null;
};

export const createAgentConnectionsRouter = (
  dependencies: AgentConnectionsRouterDependencies,
): Router => {
  const router = Router();
  const bindingStore = dependencies.bindingStore ?? helixAgentAccountLinkStore;
  const resolveSession = dependencies.resolveSession ?? getAccountSessionById;

  router.get("/session/agent-connections/readiness", async (req: Request, res: Response) => {
    try {
      const parsedProfile = helixAgentClientProfileIdSchema.safeParse(
        req.query.client_profile,
      );
      if (!parsedProfile.success) {
        fixedError(res, 400, "invalid_client_profile");
        return;
      }
      const cookieSessionId = readHelixSessionCookie(req.headers.cookie);
      if (!cookieSessionId) {
        fixedError(res, 401, "session_required");
        return;
      }
      const session = await resolveSession(cookieSessionId);
      if (!session) {
        fixedError(res, 401, "session_required");
        return;
      }
      const profileId = session.profile.profile_id;
      const bindingReceipt = await bindingStore.listBindings({
        session: { sessionId: session.session_id, profileId },
      });
      const activeBinding = newestActiveBinding(bindingReceipt.bindings);
      const presence = newestOwnedPresence({
        entries: dependencies.coordinationStore.listPresence(),
        profileId,
        serviceInstanceRef: dependencies.coordinationStore.serviceInstanceRef,
        authorizationActive: Boolean(activeBinding),
      });
      const selectedProfile: HelixAgentClientProfileId = parsedProfile.data;
      const clientProfile = HELIX_AGENT_CLIENT_PROFILES[selectedProfile];
      const authorizationChangedAfterPresence = Boolean(
        activeBinding && presence &&
        Date.parse(activeBinding.updated_at) > Date.parse(presence.observed_at),
      );
      const bridgeDeclaration = presence?.thread_observability_bridge;
      const checkpointPolicy = bridgeDeclaration?.checkpoint_publication ?? null;
      const readiness = buildHelixAgentClientReadiness({
        agentSelected: true,
        // The server proves an authenticated MCP client, not its brand. The
        // trusted native host or guided client step may refine this axis.
        provider_application: presence ? "available" : "unknown",
        client_authorization: activeBinding ? "active" : "missing",
        client_presence: presence ? "online" : "offline",
        catalog_sync: presence && !authorizationChangedAfterPresence
          ? "current"
          : "stale",
        thread_attachment: presence
          ? authorizationChangedAfterPresence ? "stale" : "attached"
          : "not_attached",
        continuation_readiness: clientProfile.continuation_mode,
        environment_readiness: "not_selected",
      });
      const projection = helixAgentConnectionStatusSchema.parse({
        schema: HELIX_AGENT_CONNECTION_STATUS_SCHEMA,
        selected_client_profile: selectedProfile,
        selected_profile_is_preference_only: true,
        client_kind_verified: false,
        authenticated_profile_ref: profileId,
        service_instance_ref: dependencies.coordinationStore.serviceInstanceRef,
        oauth_binding_ref: activeBinding?.binding_ref ?? null,
        authenticated_mcp_client_ref: presence?.authenticated_mcp_client_ref ?? null,
        client_session_ref: presence?.client_session_ref ?? null,
        conversation_thread_ref: presence?.conversation_thread_ref ?? null,
        proof_basis: presence ? "authenticated_presence_tool" : "none",
        observed_at: presence?.observed_at ?? null,
        heartbeat_expires_at: presence?.heartbeat_expires_at ?? null,
        authorization_changed_after_presence: authorizationChangedAfterPresence,
        catalog_reenumeration_required: authorizationChangedAfterPresence,
        catalog_recovery: authorizationChangedAfterPresence
          ? "reconnect_and_refresh"
          : "none",
        thread_observability_bridge: {
          negotiated_level:
            bridgeDeclaration?.requested_level ?? "tool_activity_only",
          declaration_basis: bridgeDeclaration
            ? "authenticated_client_declaration"
            : "profile_default",
          checkpoint_publication_status: checkpointPolicy
            ? "negotiated_no_checkpoint_observed"
            : "not_requested",
          checkpoint_freshness_window_seconds:
            checkpointPolicy?.freshness_window_seconds ?? null,
          checkpoint_retention: checkpointPolicy?.retention ?? "none",
          checkpoint_revocation: checkpointPolicy?.revocation ?? "not_applicable",
          provider_thread_content_included: false,
          hidden_reasoning_included: false,
          activity_completeness_claimed: false,
        },
        readiness,
        readiness_schema: readiness.schema,
        credential_included: false,
        oauth_subject_included: false,
        raw_claims_included: false,
        provider_thread_content_included: false,
        hidden_reasoning_included: false,
        environment_authority: false,
        mutation_authority: false,
        answer_authority: false,
        terminal_eligible: false,
      });
      setPrivateHeaders(res);
      res.status(200).json(projection);
    } catch {
      fixedError(res, 500, "internal_error");
    }
  });

  return router;
};
