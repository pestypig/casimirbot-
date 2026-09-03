import {
  Router,
  json,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import {
  HELIX_ROOM_ENVIRONMENTS_RECEIPT_SCHEMA,
  helixRoomEnvironmentOwnerBindingRequestSchema,
  helixRoomEnvironmentSelfBindingRequestSchema,
  type HelixRoomEnvironmentsReceipt,
} from "@shared/helix-environment-subject";
import {
  HELIX_ENVIRONMENT_COMMAND_AUTHORITY_RECEIPT_SCHEMA,
  helixEnvironmentCommandAuthoritySettingsSchema,
  helixEnvironmentCommandMemberGrantRequestSchema,
  type HelixEnvironmentCommandAuthorityReceipt,
} from "@shared/helix-environment-command";
import {
  HELIX_ENVIRONMENT_ACTION_AUTHORITY_RECEIPT_SCHEMA,
  helixEnvironmentActionAuthoritySettingsSchema,
  type HelixEnvironmentActionAuthorityReceipt,
} from "@shared/helix-environment-action";
import {
  assignRoomEnvironmentSubject,
  bindOwnRoomEnvironmentSubject,
  isRoomEnvironmentSubjectError,
  listRoomEnvironmentProjections,
  revokeOwnRoomEnvironmentSubject,
} from "../../services/environment-connectors/subjects";
import {
  configureEnvironmentCommandAuthority,
  configureEnvironmentCommandMemberGrant,
  emergencyStopEnvironmentCommandAuthority,
  isEnvironmentCommandBrokerError,
  isEnvironmentCommandAuthorityError,
  issueEnvironmentCommandConnectorCredential,
  readEnvironmentCommandAuthority,
} from "../../services/environment-connectors/commands";
import {
  configureEnvironmentActionAuthority,
  emergencyStopEnvironmentActionAuthority,
  isEnvironmentActionAuthorityError,
  isEnvironmentActionBrokerError,
  issueEnvironmentActionConnectorCredential,
  readEnvironmentActionAuthorities,
  readEnvironmentActionConnectorReadiness,
  requestEnvironmentActionWorkflowControl,
} from "../../services/environment-connectors/actions";
import { resolveCasimirPublicBaseUrl } from "../../services/public-base-url";
import {
  isSharedRealtimeRoomDomainError,
} from "../../services/helix-ask/realtime-room/room-store";
import {
  sendSharedRealtimeRoomEnvironmentSubjectContextIfBound,
} from "../../services/helix-ask/realtime-room/participant-context";
import {
  readMembership,
  requireOwner,
  requireSharedRoomAccount,
} from "./http-context";
import {
  FirstPartyCookieBoundary,
  FirstPartyCookieBoundaryError,
} from "../../middleware/first-party-cookie-boundary";
import {
  helixEnvironmentDurableGoalAppendRequestSchema,
  helixEnvironmentDurableGoalCreateRequestSchema,
  helixEnvironmentDurableGoalParticipantGrantSchema,
} from "@shared/helix-environment-durable-goal";
import {
  environmentDurableGoalStore,
  isEnvironmentDurableGoalError,
} from "../../services/environment-connectors/goals";
import { environmentMonitorStore } from "../../services/environment-connectors/monitoring/environment-monitor-store";

const environmentCookieBoundary = new FirstPartyCookieBoundary({
  codePrefix: "room_environment_cookie",
  ipMax: Number(process.env.HELIX_ROOM_ENVIRONMENT_IP_RATE_LIMIT ?? "300"),
  accountMax: Number(
    process.env.HELIX_ROOM_ENVIRONMENT_ACCOUNT_RATE_LIMIT ?? "240",
  ),
});

const receipt = (
  input: Omit<
    HelixRoomEnvironmentsReceipt,
    | "schema"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
    | "raw_content_included"
  >,
): HelixRoomEnvironmentsReceipt => ({
  schema: HELIX_ROOM_ENVIRONMENTS_RECEIPT_SCHEMA,
  ...input,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const commandReceipt = (
  input: Omit<
    HelixEnvironmentCommandAuthorityReceipt,
    | "schema"
    | "command_credential_included"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
    | "raw_content_included"
  >,
): HelixEnvironmentCommandAuthorityReceipt => ({
  schema: HELIX_ENVIRONMENT_COMMAND_AUTHORITY_RECEIPT_SCHEMA,
  ...input,
  command_credential_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const actionReceipt = (
  input: Omit<
    HelixEnvironmentActionAuthorityReceipt,
    | "schema"
    | "action_credential_included"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
    | "raw_content_included"
  >,
): HelixEnvironmentActionAuthorityReceipt => ({
  schema: HELIX_ENVIRONMENT_ACTION_AUTHORITY_RECEIPT_SCHEMA,
  ...input,
  action_credential_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const sendError = (res: Response, error: unknown): void => {
  if (isEnvironmentDurableGoalError(error)) {
    res.status(error.statusCode).json({
      schema: "helix.environment_durable_goal_receipt.v1",
      ok: false,
      error: error.code,
      message: error.message,
      evidence_refs: error.evidenceRefs,
      goal: null,
      content_role: "environment_durable_goal_receipt_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    return;
  }
  if (error instanceof FirstPartyCookieBoundaryError) {
    res.status(error.statusCode).json(receipt({
      ok: false,
      error: error.code,
      message: error.message,
      binding: null,
    }));
    return;
  }
  if (isRoomEnvironmentSubjectError(error)) {
    res.status(error.statusCode).json(receipt({
      ok: false,
      error: error.code,
      message: error.message,
      binding: null,
    }));
    return;
  }
  if (isEnvironmentCommandAuthorityError(error)) {
    res.status(error.statusCode).json(commandReceipt({
      ok: false,
      error: error.code,
      message: error.message,
      authority: null,
      member_grant: null,
    }));
    return;
  }
  if (isEnvironmentCommandBrokerError(error)) {
    res.status(error.statusCode).json({
      schema: "helix.environment_command.connector_credential_receipt.v1",
      ok: false,
      error: error.code,
      message: error.message,
      command_config: null,
      token_value_shown_once: false,
      secret_stored_raw: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    return;
  }
  if (isEnvironmentActionAuthorityError(error)) {
    res.status(error.statusCode).json(actionReceipt({
      ok: false,
      error: error.code,
      message: error.message,
      authority: null,
    }));
    return;
  }
  if (isEnvironmentActionBrokerError(error)) {
    res.status(error.statusCode).json({
      schema: "helix.environment_action.connector_credential_receipt.v1",
      ok: false,
      error: error.code,
      message: error.message,
      action_config: null,
      token_value_shown_once: false,
      secret_stored_raw: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    return;
  }
  if (isSharedRealtimeRoomDomainError(error)) {
    res.status(error.statusCode).json(receipt({
      ok: false,
      error: error.code,
      message: error.message,
      binding: null,
    }));
    return;
  }
  console.warn(
    "[room-environments] request failed",
    error instanceof Error ? error.message : "unknown",
  );
  res.status(503).json(receipt({
    ok: false,
    error: "room_environments_unavailable",
    message: "Room environments are temporarily unavailable.",
    binding: null,
  }));
};

const environmentRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => (req: Request, res: Response, next: NextFunction): void => {
  void handler(req, res, next).catch((error: unknown) => sendError(res, error));
};

export const sharedRealtimeRoomEnvironmentRouter = Router();

sharedRealtimeRoomEnvironmentRouter.use(
  "/realtime/rooms/:roomId/environments",
  environmentCookieBoundary.noStore,
  environmentCookieBoundary.enforceIpRateLimit,
  environmentCookieBoundary.enforceSameOrigin,
  json({ limit: "16kb" }),
);

sharedRealtimeRoomEnvironmentRouter.get(
  "/realtime/rooms/:roomId/environments",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const environments = await listRoomEnvironmentProjections({
      roomId: req.params.roomId,
      profileId: account.profileId,
    });
    res.json(receipt({
      ok: true,
      error: null,
      message: "Room environments listed.",
      environments,
      binding: null,
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.get(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/subjects",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const environments = await listRoomEnvironmentProjections({
      roomId: req.params.roomId,
      profileId: account.profileId,
    });
    const environment = environments.find(
      (candidate) =>
        candidate.environment_binding_id === req.params.environmentBindingId,
    );
    if (!environment) {
      res.status(404).json(receipt({
        ok: false,
        error: "environment_not_found",
        message: "Room environment not found.",
        binding: null,
      }));
      return;
    }
    res.json(receipt({
      ok: true,
      error: null,
      message: "Environment subjects listed.",
      environments: [environment],
      binding: environment.self_subject_binding,
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.put(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/me",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const parsed = helixRoomEnvironmentSelfBindingRequestSchema.safeParse(
      req.body ?? {},
    );
    if (!parsed.success) {
      res.status(400).json(receipt({
        ok: false,
        error: "subject_binding_invalid",
        message: "A valid environment subject reference is required.",
        binding: null,
      }));
      return;
    }
    const binding = await bindOwnRoomEnvironmentSubject({
      roomId: req.params.roomId,
      profileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
      subjectRef: parsed.data.subject_ref,
    });
    void sendSharedRealtimeRoomEnvironmentSubjectContextIfBound({
      roomId: req.params.roomId,
      reason: "identity_changed",
    });
    res.json(receipt({
      ok: true,
      error: null,
      message: `Your room identity is now ${binding.subject_label} in this environment.`,
      binding,
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.get(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/command-authority",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const result = await readEnvironmentCommandAuthority({
      roomId: req.params.roomId,
      profileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
    });
    res.json(commandReceipt({
      ok: true,
      error: null,
      message: result.authority
        ? "Environment command authority loaded."
        : "Environment command authority is not configured.",
      authority: result.authority,
      member_grant: result.memberGrant,
      member_grants: result.memberGrants,
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.put(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/command-authority",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const parsed = helixEnvironmentCommandAuthoritySettingsSchema.safeParse(
      req.body ?? {},
    );
    if (!parsed.success) {
      res.status(400).json(commandReceipt({
        ok: false,
        error: "command_authority_invalid",
        message: "A valid command profile and autonomy policy are required.",
        authority: null,
        member_grant: null,
      }));
      return;
    }
    const result = await configureEnvironmentCommandAuthority({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
      authorityProfile: parsed.data.authority_profile,
      autonomyMode: parsed.data.autonomy_mode,
      approvedCategories: parsed.data.approved_categories,
      expiresAt: parsed.data.expires_at,
    });
    res.json(commandReceipt({
      ok: true,
      error: null,
      message: `Environment command profile set to ${result.authority.authority_profile}.`,
      authority: result.authority,
      member_grant: result.ownerGrant,
      member_grants: [result.ownerGrant],
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.delete(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/command-authority",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const authority = await emergencyStopEnvironmentCommandAuthority({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
    });
    res.json(commandReceipt({
      ok: true,
      error: null,
      message: "Environment command authority stopped and pending commands canceled.",
      authority,
      member_grant: null,
      member_grants: [],
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.post(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/action-authorities/:actionAuthorityId/controls",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const parsed = z.object({
      workflow_id: z.string().trim().min(1).max(320),
      control_kind: z.enum(["status", "resume", "cancel"]),
      reason: z.string().trim().min(1).max(1_000),
    }).strict().safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        schema: "helix.environment_action.control_request_receipt.v1",
        ok: false,
        error: "action_control_invalid",
        message: "An exact workflow, control kind, and reason are required.",
        control_request: null,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
      return;
    }
    const controlRequest = await requestEnvironmentActionWorkflowControl({
      roomId: req.params.roomId,
      profileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
      actionAuthorityId: req.params.actionAuthorityId,
      workflowId: parsed.data.workflow_id,
      controlKind: parsed.data.control_kind,
      reason: parsed.data.reason,
    });
    res.json({
      schema: "helix.environment_action.control_request_receipt.v1",
      ok: true,
      error: null,
      message: "Player workflow control queued for the separately paired client.",
      control_request: controlRequest,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

sharedRealtimeRoomEnvironmentRouter.get(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/action-authorities",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const authorities = await readEnvironmentActionAuthorities({
      roomId: req.params.roomId,
      profileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
    });
    const connectorReadiness = await readEnvironmentActionConnectorReadiness({
      roomId: req.params.roomId,
      profileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
    });
    res.json(actionReceipt({
      ok: true,
      error: null,
      message: authorities.length > 0
        ? "Player-action authorities loaded."
        : "No player-action authority is configured.",
      authority: authorities[0] ?? null,
      authorities,
      connector_readiness: connectorReadiness,
    }));
  }),
);

const durableGoalReceipt = (goal: unknown) => ({
  schema: "helix.environment_durable_goal_receipt.v1",
  ok: true,
  error: null,
  message: "Durable environment goal state loaded as nonterminal evidence.",
  goal,
  content_role: "environment_durable_goal_receipt_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const playReadinessRequestSchema = z.object({
  objective_text: z.string().trim().min(1).max(1_000),
}).strict();

sharedRealtimeRoomEnvironmentRouter.post(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/play-readiness",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const membership = await readMembership(req.params.roomId, account);
    const parsed = playReadinessRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        schema: "helix.minecraft.play_readiness.v1",
        ok: false,
        error: "minecraft_play_objective_invalid",
        durable_goal_ready: false,
        semantic_monitor_ready: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });
      return;
    }
    const environments = await listRoomEnvironmentProjections({
      roomId: req.params.roomId,
      profileId: account.profileId,
    });
    const environment = environments.find(
      (entry) => entry.environment_binding_id === req.params.environmentBindingId,
    );
    if (!environment || environment.connection_status !== "active") {
      res.status(404).json({
        schema: "helix.minecraft.play_readiness.v1",
        ok: false,
        error: "minecraft_play_environment_not_current",
        durable_goal_ready: false,
        semantic_monitor_ready: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });
      return;
    }
    const goals = await environmentDurableGoalStore.listForRoom({
      roomId: req.params.roomId,
      profileId: account.profileId,
      participantId: membership.participantId,
      sourceId: environment.source_id,
      worldId: environment.world_id,
      roomSourceBindingId: environment.room_source_binding_id,
      limit: 8,
    });
    const objectiveText = parsed.data.objective_text.trim();
    const goal = goals.find(
      (entry) =>
        entry.objective.objective_text.trim() === objectiveText &&
        !["completed", "canceled"].includes(entry.status),
    ) ?? null;
    const monitors = goal
      ? await environmentMonitorStore.listForEnvironment({
          profileId: account.profileId,
          roomId: req.params.roomId,
          environmentBindingId: environment.environment_binding_id,
          sourceId: environment.source_id,
          worldId: environment.world_id,
          subjectRef: goal.identity.subject_binding_id,
          limit: 16,
        })
      : [];
    const monitor = goal
      ? monitors.find(
          (entry) =>
            entry.status === "active" &&
            entry.identity.goal_id === goal.goal_id &&
            entry.identity.producer_epoch_ref === goal.identity.producer_epoch_ref &&
            entry.identity.policy_revision === goal.identity.authority_policy_version,
        ) ?? null
      : null;
    res.json({
      schema: "helix.minecraft.play_readiness.v1",
      ok: true,
      error: null,
      durable_goal_ready: Boolean(goal),
      semantic_monitor_ready: Boolean(monitor),
      goal_id: goal?.goal_id ?? null,
      monitor_id: monitor?.monitor_id ?? null,
      message: monitor
        ? "The exact objective has a current durable goal and active semantic monitor."
        : goal
          ? "The exact objective has a current durable goal; its active semantic monitor is not yet verified."
          : "The exact objective does not yet have a current durable goal.",
      content_role: "minecraft_play_readiness_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

sharedRealtimeRoomEnvironmentRouter.post(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/durable-goals",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const membership = await readMembership(req.params.roomId, account);
    const parsed = helixEnvironmentDurableGoalCreateRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        ...durableGoalReceipt(null),
        ok: false,
        error: "durable_goal_event_invalid",
        message: "A valid authority, player, turn, objective, and milestone contract are required.",
      });
      return;
    }
    const goal = await environmentDurableGoalStore.create({
      ownerProfileId: account.profileId,
      roomId: req.params.roomId,
      participantId: membership.participantId,
      environmentBindingId: req.params.environmentBindingId,
      subjectNativeId: parsed.data.subject_native_id,
      actionAuthorityId: parsed.data.action_authority_id,
      runId: parsed.data.run_id ?? null,
      turnId: parsed.data.turn_id,
      objective: parsed.data.objective,
    });
    res.status(201).json(durableGoalReceipt(goal));
  }),
);

sharedRealtimeRoomEnvironmentRouter.get(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/durable-goals/:goalId",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const membership = await readMembership(req.params.roomId, account);
    const goal = await environmentDurableGoalStore.inspect({
      goalId: req.params.goalId,
      profileId: account.profileId,
      participantId: membership.participantId,
    });
    if (
      goal.identity.room_id !== req.params.roomId ||
      goal.identity.environment_binding_id !== req.params.environmentBindingId
    ) {
      res.status(404).json({
        ...durableGoalReceipt(null),
        ok: false,
        error: "durable_goal_not_found",
        message: "The durable environment goal was not found in this room environment.",
      });
      return;
    }
    res.json(durableGoalReceipt(goal));
  }),
);

sharedRealtimeRoomEnvironmentRouter.post(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/durable-goals/:goalId/events",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const membership = await readMembership(req.params.roomId, account);
    const parsed = helixEnvironmentDurableGoalAppendRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        ...durableGoalReceipt(null),
        ok: false,
        error: "durable_goal_event_invalid",
        message: "A valid expected revision, typed event, evidence set, and turn identity are required.",
      });
      return;
    }
    const goal = await environmentDurableGoalStore.append({
      ownerProfileId: account.profileId,
      roomId: req.params.roomId,
      participantId: membership.participantId,
      environmentBindingId: req.params.environmentBindingId,
      subjectNativeId: parsed.data.subject_native_id,
      actionAuthorityId: parsed.data.action_authority_id,
      runId: parsed.data.run_id ?? null,
      turnId: parsed.data.turn_id,
      goalId: req.params.goalId,
      expectedRevision: parsed.data.expected_revision,
      payload: parsed.data.payload,
      evidenceRefs: parsed.data.evidence_refs,
    });
    res.json(durableGoalReceipt(goal));
  }),
);

sharedRealtimeRoomEnvironmentRouter.put(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/durable-goals/:goalId/participants/:participantId",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    await readMembership(req.params.roomId, account);
    const parsed = helixEnvironmentDurableGoalParticipantGrantSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ ...durableGoalReceipt(null), ok: false, error: "durable_goal_event_invalid", message: "A read and/or steer continuation scope is required." });
      return;
    }
    const grant = await environmentDurableGoalStore.grantParticipant({
      goalId: req.params.goalId,
      ownerProfileId: account.profileId,
      participantId: req.params.participantId,
      scopes: parsed.data.scopes,
    });
    res.json({ ...durableGoalReceipt(null), message: "Durable goal continuation grant updated.", continuation_grant: grant });
  }),
);

sharedRealtimeRoomEnvironmentRouter.delete(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/durable-goals/:goalId/participants/:participantId",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    await readMembership(req.params.roomId, account);
    const grant = await environmentDurableGoalStore.revokeParticipant({
      goalId: req.params.goalId,
      ownerProfileId: account.profileId,
      participantId: req.params.participantId,
    });
    res.json({ ...durableGoalReceipt(null), message: "Durable goal continuation grant revoked.", continuation_grant: grant });
  }),
);

sharedRealtimeRoomEnvironmentRouter.put(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/action-authorities",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const parsed = helixEnvironmentActionAuthoritySettingsSchema.safeParse(
      req.body ?? {},
    );
    if (!parsed.success) {
      res.status(400).json(actionReceipt({
        ok: false,
        error: "action_authority_invalid",
        message: "A valid player, action adapter, capability set, and autonomy policy are required.",
        authority: null,
      }));
      return;
    }
    const authority = await configureEnvironmentActionAuthority({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
      participantId: parsed.data.participant_id,
      domainAdapter: parsed.data.domain_adapter,
      allowedCapabilityIds: parsed.data.allowed_capability_ids,
      autonomyMode: parsed.data.autonomy_mode,
      manualOverridePolicy: parsed.data.manual_override_policy,
      expiresAt: parsed.data.expires_at,
    });
    res.json(actionReceipt({
      ok: true,
      error: null,
      message: "Player-action authority configured; pair the client companion separately before use.",
      authority,
      authorities: [authority],
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.post(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/action-authorities/:actionAuthorityId/credential",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const parsed = z.object({
      ttl_ms: z.number().int().min(60_000).max(7 * 24 * 60 * 60_000).optional(),
    }).strict().safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        schema: "helix.environment_action.connector_credential_receipt.v1",
        ok: false,
        error: "action_credential_invalid",
        message: "Player-action credential lifetime is invalid.",
        action_config: null,
        token_value_shown_once: false,
        secret_stored_raw: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
      return;
    }
    const config = await issueEnvironmentActionConnectorCredential({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      actionAuthorityId: req.params.actionAuthorityId,
      publicBaseUrl: resolveCasimirPublicBaseUrl(),
      ttlMs: parsed.data.ttl_ms,
    });
    res.json({
      schema: "helix.environment_action.connector_credential_receipt.v1",
      ok: true,
      error: null,
      message:
        "Separate player-action credential created. Install it only in the paired Fabric client companion; only its hash is retained.",
      action_config: config,
      token_value_shown_once: true,
      secret_stored_raw: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

sharedRealtimeRoomEnvironmentRouter.delete(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/action-authorities/:actionAuthorityId",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const stopped = await emergencyStopEnvironmentActionAuthority({
      roomId: req.params.roomId,
      profileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
      actionAuthorityId: req.params.actionAuthorityId,
      reason: "The room operator activated player-action emergency stop.",
    });
    res.json(actionReceipt({
      ok: true,
      error: null,
      message: "Emergency stop queued; ordinary player actions are suspended immediately.",
      authority: stopped.authority,
      authorities: [stopped.authority],
      emergency_control_request: stopped.controlRequest,
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.post(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/command-credential",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const parsed = z
      .object({
        ttl_ms: z.number().int().min(60_000).max(7 * 24 * 60 * 60 * 1_000).optional(),
      })
      .strict()
      .safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        schema: "helix.environment_command.connector_credential_receipt.v1",
        ok: false,
        error: "command_credential_invalid",
        message: "Command credential lifetime is invalid.",
        command_config: null,
        token_value_shown_once: false,
        secret_stored_raw: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
      return;
    }
    const config = await issueEnvironmentCommandConnectorCredential({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
      publicBaseUrl: resolveCasimirPublicBaseUrl(),
      ttlMs: parsed.data.ttl_ms,
    });
    res.json({
      schema: "helix.environment_command.connector_credential_receipt.v1",
      ok: true,
      error: null,
      message:
        "Separate command credential created. Install it in the bound connector now; only its hash is retained.",
      command_config: config,
      token_value_shown_once: true,
      secret_stored_raw: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

sharedRealtimeRoomEnvironmentRouter.put(
  [
    "/realtime/rooms/:roomId/environments/:environmentBindingId/participants/:participantId/command-grant",
    // Compatibility for workstation bundles loaded before the canonical
    // member-grant path correction. New clients use the route above.
    "/realtime/rooms/:roomId/environments/:environmentBindingId/command-authority/participants/:participantId/command-grant",
  ],
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const parsed = helixEnvironmentCommandMemberGrantRequestSchema.safeParse(
      req.body ?? {},
    );
    if (!parsed.success) {
      res.status(400).json(commandReceipt({
        ok: false,
        error: "command_grant_invalid",
        message: "A valid room member command grant is required.",
        authority: null,
        member_grant: null,
      }));
      return;
    }
    const memberGrant = await configureEnvironmentCommandMemberGrant({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
      participantId: req.params.participantId,
      maxAuthorityProfile: parsed.data.max_authority_profile,
      autonomyOverride: parsed.data.autonomy_override,
      expiresAt: parsed.data.expires_at,
    });
    const current = await readEnvironmentCommandAuthority({
      roomId: req.params.roomId,
      profileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
    });
    res.json(commandReceipt({
      ok: true,
      error: null,
      message: "Room member command grant updated.",
      authority: current.authority,
      member_grant: memberGrant,
      member_grants: current.memberGrants,
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.delete(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/me",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    await revokeOwnRoomEnvironmentSubject({
      roomId: req.params.roomId,
      profileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
    });
    void sendSharedRealtimeRoomEnvironmentSubjectContextIfBound({
      roomId: req.params.roomId,
      reason: "identity_changed",
    });
    res.json(receipt({
      ok: true,
      error: null,
      message: "Your environment identity selection was removed.",
      binding: null,
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.put(
  "/realtime/rooms/:roomId/environments/:environmentBindingId/participants/:participantId/subject",
  environmentRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    environmentCookieBoundary.enforceAccountRateLimit(res, account.profileId);
    const membership = await readMembership(req.params.roomId, account);
    requireOwner(membership);
    const parsed = helixRoomEnvironmentOwnerBindingRequestSchema.safeParse(
      req.body ?? {},
    );
    if (!parsed.success) {
      res.status(400).json(receipt({
        ok: false,
        error: "subject_binding_invalid",
        message: "A valid environment subject reference is required.",
        binding: null,
      }));
      return;
    }
    const binding = await assignRoomEnvironmentSubject({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      environmentBindingId: req.params.environmentBindingId,
      participantId: req.params.participantId,
      subjectRef: parsed.data.subject_ref,
    });
    void sendSharedRealtimeRoomEnvironmentSubjectContextIfBound({
      roomId: req.params.roomId,
      reason: "identity_changed",
    });
    res.json(receipt({
      ok: true,
      error: null,
      message: "The room member environment identity was assigned.",
      binding,
    }));
  }),
);

sharedRealtimeRoomEnvironmentRouter.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    sendError(res, error);
  },
);
