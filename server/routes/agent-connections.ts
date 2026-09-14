import express, { Router, type Request, type Response } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { DurableReasoningBindingAccess } from "../services/local-supervisor/durable-reasoning-binding-access";
import type { DurableSteeringRepository } from "../services/local-supervisor/durable-steering-repository";
import type { PairingDeliveryService } from "../services/local-supervisor/pairing-delivery-service";
import { PairingTransitionService } from "../services/local-supervisor/pairing-transition-service";
import { projectPairingLedgerRow } from "../services/local-supervisor/pairing-ledger-contract";
import { PairingInvitationService, PairingInvitationError } from "../services/local-supervisor/pairing-invitation-service";
import { createNativePairingLedgerRepository, PairingStorageError, type PairingLedgerRepository } from "../services/local-supervisor/pairing-ledger-repository";
import { installedSecurityStore } from "../services/helix-account/installed-security-store";
import { isPairingEnvironmentEligible } from "../services/local-supervisor/pairing-environment-eligibility";
import { resolvePairingAccountIssuer } from "../services/local-supervisor/pairing-account-authority";
import { createPairingDestinationRegistrationStore, PairingDestinationRegistrationError, type PairingDestinationRegistrationStore } from "../services/local-supervisor/pairing-destination-registration";
import { dispatchExactChatSteering, steeringDispatchSchema } from "../services/local-supervisor/exact-chat-steering-dispatch";
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
import { helixEnvironmentSessionRequestSchema, helixEnvironmentSessionSelectionSchema } from "@shared/helix-environment-session-request";
import { readyUpEnvironmentSession } from "../services/environment-connectors/session/ready-up-session";
import { prepareBrowserEnvironmentSession } from "../services/environment-connectors/session/prepare-browser-session";
import { EnvironmentSessionPreparationError } from "../services/environment-connectors/session/preparation-error";
import { preparationIntentsFor } from "../services/environment-connectors/session/preparation-intent-runtime";
import { PreparationIntentError, type EnvironmentSessionPreparationIntentStore } from "../services/environment-connectors/session/preparation-intent-store";
import { isEnvironmentDurableGoalError } from "../services/environment-connectors/goals/durable-goal-store";
import { isRoomEnvironmentSubjectError } from "../services/environment-connectors/subjects/subject-binding-store";
import { isEnvironmentActionAuthorityError } from "../services/environment-connectors/actions/authority-store";
import { readSharedRealtimeRoomMembership } from "../services/helix-ask/realtime-room/room-store";
import { resolveReasoningRunAssociation } from "../services/local-supervisor/reasoning-run-association";
import {
  helixAgentAccountLinkStore,
  type HelixAgentAccountBindingProjection,
  type HelixAgentAccountLinkStore,
} from "../services/helix-account/agent-account-link-store";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  HelixReasoningTaskBindingError,
  HelixReasoningTaskBindingStore,
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
  // Trusted server adapter only. Never selected by a request header or env flag.
  pairingDeliveryService?: PairingDeliveryService<SessionRecord>;
  durableSteeringRepository?: DurableSteeringRepository;
  destinationRegistrationStore?: Pick<PairingDestinationRegistrationStore, "listOwned" | "resolveOwned">;
  pairingLedgerRepository?: PairingLedgerRepository;
  readPairingDeviceTrust?: typeof installedSecurityStore.inspectFullHarnessTrust;
  validatePairingEnvironment?: typeof isPairingEnvironmentEligible;
  bindingStore?: BindingStore;
  coordinationStore: PresenceStore;
  reasoningBindingStore?: Pick<
    HelixReasoningTaskBindingStore,
    "issueClaim" | "dispatch" | "revoke" | "inspect" | "inspectEvent" | "inspectCurrent" | "inspectLatest" | "readForChatDisplay"
  >;
  resolveSession?: (sessionId?: string | null) => Promise<SessionRecord | null>;
  resolveRunAssociation?: typeof resolveReasoningRunAssociation;
  preparationBindingStore?: Pick<HelixReasoningTaskBindingStore,
    "resolveOwnedPreparationTarget" | "verifyTaskAssociation">;
  prepareEnvironmentSession?: typeof readyUpEnvironmentSession;
  prepareBrowserSession?: typeof prepareBrowserEnvironmentSession;
  preparationIntentStore?: Pick<EnvironmentSessionPreparationIntentStore, "request">;
  readPreparationMembership?: typeof readSharedRealtimeRoomMembership;
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
  const resolveRunAssociation = dependencies.resolveRunAssociation ?? resolveReasoningRunAssociation;

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
        verified_run_association: presence && !authorizationChangedAfterPresence
          ? await resolveRunAssociation(presence) : null,
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
    run_verification_ref: z.string().trim().min(3).max(320).optional(),
    expires_in_seconds: z.number().int().min(30).max(300).optional(),
  }).strict();

  const resolveBrowserIdentity = async (req: Request): Promise<SessionRecord> => {
    const session = await resolveSession(readHelixSessionCookie(req.headers.cookie));
    if (!session) throw new HelixReasoningTaskBindingError("session_required", 401);
    return session;
  };
  const reasoningFailure = (res: Response, error: unknown): void => {
    setPrivateHeaders(res);
    if (error instanceof HelixReasoningTaskBindingError || error instanceof PairingDestinationRegistrationError || error instanceof PairingInvitationError || error instanceof PairingStorageError) {
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

  const durableBrowserAccess = (session: SessionRecord, store: HelixReasoningTaskBindingStore) => {
    return new DurableReasoningBindingAccess(store, async destination => {
      const profileId = session.profile.profile_id;
      const deviceId = process.env.HELIX_DESKTOP_DEVICE_ID?.trim();
      const opaque = (prefix: string, value: string) => `${prefix}:${crypto.createHash("sha256").update(value).digest("hex")}`;
      if (destination.profileId !== profileId || !deviceId || destination.installationId !== opaque("installation", deviceId)) {
        throw new HelixReasoningTaskBindingError("pairing_device_identity_mismatch", 403);
      }
      const trust = await (dependencies.readPairingDeviceTrust ?? installedSecurityStore.inspectFullHarnessTrust.bind(installedSecurityStore))({ profileId, deviceId });
      if (!trust.trusted) throw new HelixReasoningTaskBindingError("pairing_device_trust_required", 403);
      const linked = await bindingStore.listBindings({ session: { sessionId: session.session_id, profileId } });
      if (!await resolvePairingAccountIssuer({ destination, profileId, deviceId, bindings: linked.bindings,
        delegatedAccountSessionId: trust.delegated_account_session_id, resolveSession })) {
        throw new HelixReasoningTaskBindingError("pairing_account_link_required", 403);
      }
    }, async () => dependencies.pairingLedgerRepository ?? await createNativePairingLedgerRepository(),
    undefined, dependencies.durableSteeringRepository ? async () => dependencies.durableSteeringRepository! : undefined);
  };
  const browserReasoningAccess = (session: SessionRecord) => {
    const store = dependencies.reasoningBindingStore;
    if (!store) throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
    return store instanceof HelixReasoningTaskBindingStore ? durableBrowserAccess(session, store) : store;
  };

  router.get("/session/agent-connections/reasoning-destinations", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      const store = dependencies.destinationRegistrationStore ?? await createPairingDestinationRegistrationStore();
      const destinations = await store.listOwned(session.profile.profile_id);
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, destinations, automatic_delivery_available: Boolean(dependencies.pairingDeliveryService),
        execution_authority: false, answer_authority: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.get("/session/agent-connections/reasoning-invitations/:requestId", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      const requestId = z.string().min(3).max(120).parse(req.params.requestId);
      const owner = session.profile.profile_id;
      const repository = dependencies.pairingLedgerRepository ?? await createNativePairingLedgerRepository();
      await repository.confirmDurability();
      const digest = crypto.createHash("sha256").update(JSON.stringify([owner, requestId])).digest("hex");
      const row = await repository.readByRequest(owner, digest);
      setPrivateHeaders(res);
      // Reconciliation reveals only an existing owner's status. It does not
      // issue/copy a secret, refresh registration or renew approved authority.
      res.status(200).json({ ok: true, pairing: row ? projectPairingLedgerRow(row, owner, new Date()) : null,
        execution_authority: false, answer_authority: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.get("/session/agent-connections/reasoning-pairings/:id", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      const id = z.string().min(3).max(320).parse(req.params.id);
      const repository = dependencies.pairingLedgerRepository ?? await createNativePairingLedgerRepository();
      await repository.confirmDurability();
      const row = await repository.read(session.profile.profile_id, id);
      if (!row) throw new HelixReasoningTaskBindingError("pairing_not_found", 404);
      const pairing = projectPairingLedgerRow(row, session.profile.profile_id, new Date());
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, pairing, runtime_binding_active: pairing.state === "accepted" ? null : false,
        execution_authority: false, answer_authority: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.post("/session/agent-connections/reasoning-invitations/:requestId/cancel", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      z.object({}).strict().parse(req.body ?? {});
      const requestId = z.string().min(3).max(120).parse(req.params.requestId);
      const repository = dependencies.pairingLedgerRepository ?? await createNativePairingLedgerRepository();
      const transitions = new PairingTransitionService(repository, {
        destination: async () => { throw new Error("pairing_destination_required"); },
        humanOwner: async () => session.profile.profile_id,
      });
      const result = await transitions.cancelRequest(session, requestId);
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, request_id: requestId, ...result,
        execution_authority: false, answer_authority: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.post("/session/agent-connections/reasoning-pairings/:id/revoke", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      z.object({}).strict().parse(req.body ?? {});
      const id = z.string().min(3).max(320).parse(req.params.id);
      const repository = dependencies.pairingLedgerRepository ?? await createNativePairingLedgerRepository();
      if (!await repository.read(session.profile.profile_id, id)) {
        throw new HelixReasoningTaskBindingError("pairing_not_found", 404);
      }
      // Revocation remains available to the owner even after device trust or the
      // account link expires. It reduces authority and cannot renew a grant.
      const transitions = new PairingTransitionService(repository, {
        destination: async () => { throw new Error("pairing_destination_required"); },
        humanOwner: async () => session.profile.profile_id,
      });
      const pairing = await transitions.revoke(session, id);
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, pairing, runtime_binding_active: false,
        execution_authority: false, answer_authority: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.post("/session/agent-connections/reasoning-invitations", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      const registrations = dependencies.destinationRegistrationStore ?? await createPairingDestinationRegistrationStore();
      const repository = dependencies.pairingLedgerRepository ?? await createNativePairingLedgerRepository();
      const invitations = new PairingInvitationService(repository, async (_credential: SessionRecord, selection) => {
        const resolveApproval = async () => {
          const profileId = session.profile.profile_id;
          const registered = await registrations.resolveOwned(profileId, selection.registrationId);
          const destination = registered.destination;
          const opaque = (prefix: string, value: string) => `${prefix}:${crypto.createHash("sha256").update(value).digest("hex")}`;
          const deviceId = process.env.HELIX_DESKTOP_DEVICE_ID?.trim();
          if (!deviceId || destination.installationId !== opaque("installation", deviceId)) {
            throw new HelixReasoningTaskBindingError("pairing_device_identity_mismatch", 403);
          }
          const trust = await (dependencies.readPairingDeviceTrust ?? installedSecurityStore.inspectFullHarnessTrust.bind(installedSecurityStore))({ profileId, deviceId });
          if (!trust.trusted) throw new HelixReasoningTaskBindingError("pairing_device_trust_required", 403);
          const authorization = await bindingStore.listBindings({ session: { sessionId: session.session_id, profileId } });
          const accountIssuer = await resolvePairingAccountIssuer({ destination, profileId, deviceId,
            bindings: authorization.bindings, delegatedAccountSessionId: trust.delegated_account_session_id,
            resolveSession });
          if (!accountIssuer) throw new HelixReasoningTaskBindingError("pairing_account_link_required", 403);
          if (selection.environment) {
            const membership = await (dependencies.readPreparationMembership ?? readSharedRealtimeRoomMembership)({
              profileId, roomId: selection.environment.roomId });
            if (!membership || membership.roomStatus === "closed" ||
              !await (dependencies.validatePairingEnvironment ?? isPairingEnvironmentEligible)({ profileId,
                issuer: accountIssuer, roomId: selection.environment.roomId, runId: selection.environment.runId,
                participantId: membership.participantId })) {
              throw new HelixReasoningTaskBindingError("pairing_environment_unavailable", 409);
            }
          }
          return { approval: { destination, chatId: selection.chatId, environment: selection.environment,
            ...(selection.invitationDelivery ? { invitationDelivery: selection.invitationDelivery } : {}),
            scope: "exact_chat_steering" as const, policyRevision: selection.replacement ? 2 as const : 1 as const,
            ...(selection.replacement ? { replacement: selection.replacement } : {}),
            invitationSeconds: selection.invitationSeconds, pairingSeconds: selection.pairingSeconds },
            consentReceiptId: opaque("pairing_consent", JSON.stringify([profileId, selection.requestId])) };
        };
        const reviewed = await resolveApproval();
        if (selection.invitationDelivery !== "automatic") return reviewed;
        if (!dependencies.pairingDeliveryService) throw new PairingInvitationError("pairing_delivery_provider_unavailable", 503);
        await dependencies.pairingDeliveryService.verifyDestination(session, reviewed.approval.destination);
        // Provider I/O cannot freeze device, account, registration or run authority.
        const current = await resolveApproval();
        if (JSON.stringify(current.approval) !== JSON.stringify(reviewed.approval)) {
          throw new PairingInvitationError("pairing_approval_scope_mismatch");
        }
        return current;
      });
      const issued = await invitations.issue(session, req.body);
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, ...issued, execution_authority: false, answer_authority: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.get("/session/agent-connections/reasoning-deliveries", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      const query = z.object({ after: z.string().min(3).max(320).optional() }).strict().parse(req.query);
      if (!dependencies.pairingDeliveryService) throw new PairingInvitationError("pairing_delivery_provider_unavailable", 503);
      const candidates = await dependencies.pairingDeliveryService.discoverPending(session, query.after ?? null);
      setPrivateHeaders(res);
      res.json({ ok: true, ...candidates, execution_authority: false, answer_authority: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.post("/session/agent-connections/reasoning-deliveries/:pairingId", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      z.object({}).strict().parse(req.body ?? {});
      const id = z.string().min(3).max(320).parse(req.params.pairingId);
      if (!dependencies.pairingDeliveryService) throw new PairingInvitationError("pairing_delivery_provider_unavailable", 503);
      const delivery = await dependencies.pairingDeliveryService.deliver(session, id);
      setPrivateHeaders(res);
      res.json({ ok: true, delivery, execution_authority: false, answer_authority: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.post("/session/agent-connections/environment-session/prepare-request", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      const body = z.object({ request_id: z.string().trim().min(1).max(120),
        client_session_ref: z.string().trim().min(1).max(320),
        client_continuation_ref: z.string().trim().min(1).max(320),
        helix_conversation_id: z.string().trim().min(1).max(320),
        room_id: z.string().trim().min(1).max(320),
        requested_duration_seconds: z.number().int().min(60).max(604800),
      }).strict().parse(req.body);
      const authorization = await bindingStore.listBindings({ session: {
        sessionId: session.session_id, profileId: session.profile.profile_id } });
      if (!newestActiveBinding(authorization.bindings)) throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
      const intent = await (dependencies.preparationIntentStore ?? preparationIntentsFor(dependencies.coordinationStore)).request({
        requestId: body.request_id, profileRef: session.profile.profile_id,
        clientSessionRef: body.client_session_ref, continuationRef: body.client_continuation_ref,
        helixConversationId: body.helix_conversation_id, roomId: body.room_id,
        requestedDurationSeconds: body.requested_duration_seconds,
      });
      setPrivateHeaders(res);
      res.status(202).json({ ok: true, intent, ready: false, task_binding_authority: false,
        execution_authority: false, answer_authority: false, terminal_eligible: false });
    } catch (error) {
      if (error instanceof PreparationIntentError) {
        setPrivateHeaders(res);
        res.status(409).json({ ok: false, error: error.message, ready: false,
          execution_authority: false, answer_authority: false, terminal_eligible: false });
      } else reasoningFailure(res, error);
    }
  });

  router.post("/session/agent-connections/environment-session/ready-up", async (req, res) => {
    try {
      const session = await resolveBrowserIdentity(req);
      // Browser actor and external target are deliberately different identities.
      // Reject caller-supplied provider identity; derive it internally only.
      const browserSelection = helixEnvironmentSessionSelectionSchema;
      const body = z.union([browserSelection,
        helixEnvironmentSessionRequestSchema.omit({ client_continuation_ref: true })]).parse(req.body);
      const preparationStore = dependencies.preparationBindingStore;
      if (!preparationStore) throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      const targetStore = preparationStore instanceof HelixReasoningTaskBindingStore
        ? durableBrowserAccess(session, preparationStore) : preparationStore;
      const authorization = await bindingStore.listBindings({ session: {
        sessionId: session.session_id, profileId: session.profile.profile_id,
      } });
      if (!newestActiveBinding(authorization.bindings)) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
      }
      if ("request_id" in body) {
        const receipt = await (dependencies.prepareBrowserSession ?? prepareBrowserEnvironmentSession)({
          sessionId: session.session_id, profileRef: session.profile.profile_id,
          bindingId: body.reasoning_binding_id, bindingEpoch: body.binding_epoch,
          helixConversationId: body.helix_conversation_id, missionId: body.mission_id,
          runId: body.run_id, requestId: body.request_id,
          goalBootstrap: body.goal_bootstrap,
        }, targetStore, dependencies.coordinationStore.listPresence());
        setPrivateHeaders(res);
        res.status(200).json({ ok: true, ...receipt, requested_by: "authenticated_browser_owner",
          execution_authority: false, answer_authority: false, terminal_eligible: false });
        return;
      }
      const target = await targetStore.resolveOwnedPreparationTarget({
        profileRef: session.profile.profile_id, bindingId: body.reasoning_binding_id,
        bindingEpoch: body.binding_epoch, helixConversationId: body.helix_conversation_id,
        missionId: body.mission_id, runId: body.run_id,
      });
      const membership = await (dependencies.readPreparationMembership ?? readSharedRealtimeRoomMembership)({
        profileId: session.profile.profile_id, roomId: body.room_id,
      });
      if (!membership || membership.roomStatus === "closed") {
        throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 403);
      }
      const receipt = await (dependencies.prepareEnvironmentSession ?? readyUpEnvironmentSession)({
        binding: target,
        context: { profileId: session.profile.profile_id, participantId: membership.participantId,
          roomId: body.room_id, runId: body.run_id, goalId: body.goal_id,
          expectedRevision: body.expected_revision, turnId: body.turn_id,
          probeRequestId: body.probe_request_id, priorTurnId: body.prior_turn_id },
        environmentBindingId: body.environment_binding_id, sourceId: body.source_id,
        worldId: body.world_id, subjectBindingId: body.subject_binding_id,
        actionAuthorityId: body.action_authority_id,
      }, targetStore);
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, ...receipt, requested_by: "authenticated_browser_owner",
        execution_authority: false, answer_authority: false, terminal_eligible: false });
    } catch (error) {
      // Environment recovery failures must not masquerade as broken task
      // binding. Expose typed codes only, never backend messages or identities.
      if (error instanceof EnvironmentSessionPreparationError) {
        setPrivateHeaders(res);
        res.status(error.status).json(error.projection);
      } else if (isEnvironmentDurableGoalError(error) || isRoomEnvironmentSubjectError(error) ||
          isEnvironmentActionAuthorityError(error)) {
        setPrivateHeaders(res);
        res.status(error.statusCode).json({ schema: "helix.environment_session_error.v1", ok: false,
          error: error.code, execution_authority: false, answer_authority: false,
          assistant_answer: false, terminal_eligible: false, credential_included: false });
      } else { reasoningFailure(res, error); }
    }
  });

  router.post("/session/agent-connections/reasoning-bindings/claims", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      const body = claimIssueSchema.parse(req.body);
      if (body.run_id || body.run_verification_ref) {
        const authorization = await bindingStore.listBindings({
          session: { sessionId: session.session_id, profileId: session.profile.profile_id },
        });
        if (!newestActiveBinding(authorization.bindings)) {
          throw new HelixReasoningTaskBindingError("reasoning_binding_run_association_stale", 409);
        }
        const target = dependencies.coordinationStore.listPresence().find(entry =>
          entry.active && entry.service_instance_ref === dependencies.coordinationStore.serviceInstanceRef &&
          entry.authenticated_profile_ref === session.profile.profile_id &&
          entry.client_session_ref === body.client_session_ref);
        const association = target ? await resolveRunAssociation(target) : null;
        if (!association || association.run_id !== body.run_id ||
            association.verification_ref !== body.run_verification_ref || body.mission_id) {
          throw new HelixReasoningTaskBindingError("reasoning_binding_run_association_stale", 409);
        }
      }
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
      const event = await browserReasoningAccess(session).dispatch({
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
      const access = browserReasoningAccess(session);
      const { binding, event } = access instanceof DurableReasoningBindingAccess
        ? await access.dispatchExactPrompt(session.profile.profile_id, req.body)
        : dispatchExactChatSteering(session.profile.profile_id, req.body, access);
      setPrivateHeaders(res);
      res.status(202).json({ ok: true, binding, event });
    } catch (error) {
      reasoningFailure(res, error);
    }
  });

  router.get("/session/agent-connections/reasoning-bindings/:bindingId/chat-prompts", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      const session = await resolveBrowserIdentity(req);
      const query = z.object({ binding_epoch: z.coerce.number().int().positive(),
        helix_conversation_id: z.string().trim().min(3).max(320),
        run_id: z.string().trim().min(1).max(320).optional(),
        after_cursor: z.coerce.number().int().nonnegative().default(0),
      }).strict().parse(req.query);
      const deliveries = await browserReasoningAccess(session).readForChatDisplay({
        profileRef: session.profile.profile_id, bindingId: req.params.bindingId,
        bindingEpoch: query.binding_epoch, helixConversationId: query.helix_conversation_id,
        runId: query.run_id ?? null, afterCursor: query.after_cursor,
      });
      setPrivateHeaders(res);
      res.status(200).json({ ok: true, deliveries, display_only: true,
        provider_pickup_confirmed: false, answer_authority: false, terminal_eligible: false });
    } catch (error) { reasoningFailure(res, error); }
  });

  router.post("/session/agent-connections/reasoning-bindings/:bindingId/revoke", async (req, res) => {
    try {
      if (!dependencies.reasoningBindingStore) {
        throw new HelixReasoningTaskBindingError("reasoning_binding_unavailable", 503);
      }
      const session = await resolveBrowserIdentity(req);
      z.object({}).strict().parse(req.body ?? {});
      const target = {
        profileRef: session.profile.profile_id,
        bindingId: req.params.bindingId,
      };
      const access = browserReasoningAccess(session);
      const binding = access instanceof DurableReasoningBindingAccess
        ? await access.revokeOwned(target, async () => session.profile.profile_id)
        : access.revoke(target);
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
      const event = await browserReasoningAccess(session).inspectEvent({
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
        ? await browserReasoningAccess(session).inspectCurrent({
            profileRef: session.profile.profile_id,
            helixConversationId: query.helix_conversation_id,
          })
        : await browserReasoningAccess(session).inspectLatest({
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
      const binding = await browserReasoningAccess(session).inspect({
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
