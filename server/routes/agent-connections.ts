import express, { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  HELIX_AGENT_CONNECTION_STATUS_SCHEMA,
  HELIX_AGENT_CLIENT_PROFILES,
  helixAgentClientProfileIdSchema,
  helixAgentConnectionStatusSchema,
  type HelixAgentClientProfileId,
} from "@shared/helix-agent-client-profile";
import {
  buildHelixAgentClientReadiness,
  type HelixAgentClientReadiness,
} from "@shared/helix-agent-client-readiness";
import type { HelixLocalSupervisorPresence } from "@shared/helix-local-supervisor-coordination";
import {
  helixAgentAccountLinkStore,
  type HelixAgentAccountBindingProjection,
  type HelixAgentAccountLinkStore,
} from "../services/helix-account/agent-account-link-store";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  HelixReasoningTaskBindingError,
  type HelixReasoningTaskBindingStore,
} from "../services/local-supervisor/reasoning-task-binding-store";

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
  reasoningBindingStore?: Pick<
    HelixReasoningTaskBindingStore,
    "issueClaim" | "dispatch" | "revoke" | "inspect" | "inspectEvent"
  >;
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

export const continuationReadinessForPresence = (input: {
  presence: HelixLocalSupervisorPresence | null;
  profileContinuationMode: "polling" | "monitor_only";
}): HelixAgentClientReadiness["continuation_readiness"] => {
  if (!input.presence) return "unavailable";
  const requestedLevel =
    input.presence.thread_observability_bridge?.requested_level ??
    "tool_activity_only";
  if (requestedLevel === "tool_activity_only") return "unavailable";
  if (requestedLevel === "checkpoint_publish") return "monitor_only";
  return input.profileContinuationMode;
};

export const createAgentConnectionsRouter = (
  dependencies: AgentConnectionsRouterDependencies,
): Router => {
  const router = Router();
  // This router is mounted at /api/account beside profile storage and other
  // account APIs. Scope its deliberately small parser to its own route family
  // so it cannot pre-consume or reject larger, independently governed account
  // payloads before their route-specific parser runs.
  router.use(
    "/session/agent-connections",
    express.json({ limit: "16kb" }),
  );
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
        continuation_readiness: continuationReadinessForPresence({
          presence,
          profileContinuationMode: clientProfile.continuation_mode,
        }),
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

  const claimIssueSchema = z.object({
    client_session_ref: z.string().trim().min(3).max(320),
    helix_conversation_id: z.string().trim().min(3).max(320),
    mission_id: z.string().trim().min(3).max(320).nullable().optional(),
    run_id: z.string().trim().min(3).max(320).nullable().optional(),
    expires_in_seconds: z.number().int().min(30).max(300).optional(),
  }).strict();
  const steeringDispatchSchema = z.object({
    reasoning_binding_id: z.string().trim().min(3).max(320),
    binding_epoch: z.number().int().positive(),
    client_event_ref: z.string().trim().min(3).max(320),
    origin: z.enum(["typed", "gpt_live_finalized"]),
    instruction_text: z.string().trim().min(1).max(4_000),
    expires_in_seconds: z.number().int().min(30).max(3_600).optional(),
  }).strict();
  const currentSteeringDispatchSchema = steeringDispatchSchema.omit({
    reasoning_binding_id: true,
    binding_epoch: true,
  }).extend({
    helix_conversation_id: z.string().trim().min(3).max(320).optional(),
  });

  const resolveBrowserIdentity = async (req: Request): Promise<SessionRecord> => {
    const session = await resolveSession(readHelixSessionCookie(req.headers.cookie));
    if (!session) throw new HelixReasoningTaskBindingError("session_required", 401);
    return session;
  };
  const reasoningFailure = (res: Response, error: unknown): void => {
    setPrivateHeaders(res);
    if (error instanceof HelixReasoningTaskBindingError) {
      res.status(error.status).json({
        schema: "helix.reasoning_task_binding_error.v1",
        ok: false,
        error: error.code,
        credential_included: false,
        provider_thread_content_included: false,
        hidden_reasoning_included: false,
        answer_authority: false,
        terminal_eligible: false,
      });
      return;
    }
    res.status(error instanceof z.ZodError ? 400 : 503).json({
      schema: "helix.reasoning_task_binding_error.v1",
      ok: false,
      error: error instanceof z.ZodError
        ? "reasoning_binding_invalid_request"
        : "reasoning_binding_unavailable",
      credential_included: false,
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      answer_authority: false,
      terminal_eligible: false,
    });
  };

  router.post("/session/agent-connections/reasoning-bindings/claims", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      const body = claimIssueSchema.parse(req.body);
      const result = dependencies.reasoningBindingStore.issueClaim({
        profileRef: session.profile.profile_id,
        clientSessionRef: body.client_session_ref,
        helixConversationId: body.helix_conversation_id,
        missionId: body.mission_id,
        runId: body.run_id,
        expiresInSeconds: body.expires_in_seconds,
      });
      setPrivateHeaders(res);
      res.status(201).json({ ok: true, ...result });
    } catch (error) {
      reasoningFailure(res, error);
    }
  });

  router.post("/session/agent-connections/reasoning-bindings/steering", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      const body = steeringDispatchSchema.parse(req.body);
      const event = dependencies.reasoningBindingStore.dispatch({
        profileRef: session.profile.profile_id,
        bindingId: body.reasoning_binding_id,
        bindingEpoch: body.binding_epoch,
        clientEventRef: body.client_event_ref,
        origin: body.origin,
        instructionText: body.instruction_text,
        expiresInSeconds: body.expires_in_seconds,
      });
      setPrivateHeaders(res);
      res.status(202).json({ ok: true, event });
    } catch (error) {
      reasoningFailure(res, error);
    }
  });

  router.post("/session/agent-connections/reasoning-bindings/steering/current", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      const body = currentSteeringDispatchSchema.parse(req.body);
      const binding = body.helix_conversation_id
        ? dependencies.reasoningBindingStore.inspectCurrent({
            profileRef: session.profile.profile_id,
            helixConversationId: body.helix_conversation_id,
          })
        : dependencies.reasoningBindingStore.inspectLatest({
            profileRef: session.profile.profile_id,
          });
      const event = dependencies.reasoningBindingStore.dispatch({
        profileRef: session.profile.profile_id,
        bindingId: binding.reasoning_binding_id,
        bindingEpoch: binding.binding_epoch,
        clientEventRef: body.client_event_ref,
        origin: body.origin,
        instructionText: body.instruction_text,
        expiresInSeconds: body.expires_in_seconds,
      });
      setPrivateHeaders(res);
      res.status(202).json({ ok: true, binding, event });
    } catch (error) {
      reasoningFailure(res, error);
    }
  });

  router.post("/session/agent-connections/reasoning-bindings/:bindingId/revoke", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      const binding = dependencies.reasoningBindingStore.revoke({
        profileRef: session.profile.profile_id,
        bindingId: req.params.bindingId,
      });
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, binding });
    } catch (error) {
      reasoningFailure(res, error);
    }
  });

  router.get("/session/agent-connections/reasoning-bindings/:bindingId/steering/:eventRef", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      const query = z.object({
        binding_epoch: z.coerce.number().int().positive(),
      }).strict().parse(req.query);
      const event = dependencies.reasoningBindingStore.inspectEvent({
        profileRef: session.profile.profile_id,
        bindingId: req.params.bindingId,
        bindingEpoch: query.binding_epoch,
        eventRef: req.params.eventRef,
      });
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, event });
    } catch (error) {
      reasoningFailure(res, error);
    }
  });

  router.get("/session/agent-connections/reasoning-bindings/current", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      const query = z.object({
        helix_conversation_id: z.string().trim().min(1).max(256).optional(),
      }).strict().parse(req.query);
      const binding = query.helix_conversation_id
        ? dependencies.reasoningBindingStore.inspectCurrent({
            profileRef: session.profile.profile_id,
            helixConversationId: query.helix_conversation_id,
          })
        : dependencies.reasoningBindingStore.inspectLatest({
            profileRef: session.profile.profile_id,
          });
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, binding });
    } catch (error) {
      reasoningFailure(res, error);
    }
  });

  router.get("/session/agent-connections/reasoning-bindings/:bindingId", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      const binding = dependencies.reasoningBindingStore.inspect({
        profileRef: session.profile.profile_id,
        bindingId: req.params.bindingId,
      });
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, binding });
    } catch (error) {
      reasoningFailure(res, error);
    }
  });

  return router;
};
