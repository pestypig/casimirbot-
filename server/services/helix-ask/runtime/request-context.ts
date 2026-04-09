import crypto from "node:crypto";
import {
  appendConversationHistoryEvent,
  type HelixConversationHistoryEventInput,
} from "../conversation-history";
import {
  appendHelixThreadEvent,
  appendHelixThreadItemEvent,
  appendHelixTurnEvent,
  getHelixThreadRequests,
} from "../../helix-thread/ledger";
import {
  buildHelixThreadState,
  buildHelixTurnState,
} from "../../helix-thread/reducer";
import {
  forkHelixThread,
  getActiveHelixThreadForSession,
  readHelixThread,
  resumeHelixThread,
  setActiveHelixThreadForSession,
} from "../../helix-thread/registry";
import type {
  HelixThreadAnswerSurfaceMode,
  HelixThreadClaimLink,
  HelixThreadItemType,
  HelixThreadMemoryCitation,
  HelixThreadRequestKind,
  HelixThreadRoute,
  HelixTurnKind,
} from "../../helix-thread/types";

export type HelixAskDualHistoryEventInput = HelixConversationHistoryEventInput & {
  thread_id?: string | null;
  answer_surface_mode?: HelixThreadAnswerSurfaceMode | null;
  memory_citation?: HelixThreadMemoryCitation | null;
};

export const normalizeHelixThreadAnswerSurfaceMode = (
  value: unknown,
): HelixThreadAnswerSurfaceMode | null =>
  value === "conversational" ||
  value === "structured_report" ||
  value === "fail_closed"
    ? value
    : null;

export const appendHelixAskDualHistoryEvent = (
  input: HelixAskDualHistoryEventInput,
): ReturnType<typeof appendConversationHistoryEvent> => {
  try {
    appendHelixThreadEvent({
      thread_id: input.thread_id,
      route: input.route,
      event_type: input.event_type,
      turn_id: input.turn_id,
      session_id: input.session_id,
      trace_id: input.trace_id,
      user_text: input.user_text,
      assistant_text: input.assistant_text,
      classifier_result: input.classifier_result,
      route_reason: input.route_reason,
      brief_status: input.brief_status,
      final_gate_outcome: input.final_gate_outcome,
      fail_reason: input.fail_reason,
      answer_surface_mode: normalizeHelixThreadAnswerSurfaceMode(
        input.answer_surface_mode,
      ),
      memory_citation: input.memory_citation ?? null,
      meta: input.meta,
      event_id: input.event_id,
      ts: input.ts,
    });
  } catch {
    // Keep legacy history as the compatibility floor during the Phase 1 shadow cutover.
  }
  return appendConversationHistoryEvent({
    route: input.route,
    event_type: input.event_type,
    turn_id: input.turn_id,
    session_id: input.session_id,
    trace_id: input.trace_id,
    user_text: input.user_text,
    assistant_text: input.assistant_text,
    classifier_result: input.classifier_result,
    route_reason: input.route_reason,
    brief_status: input.brief_status,
    final_gate_outcome: input.final_gate_outcome,
    fail_reason: input.fail_reason,
    meta: input.meta,
    event_id: input.event_id,
    ts: input.ts,
  });
};

export type HelixThreadRouteContext = {
  threadId: string;
  turnId: string;
  createdNewThread: boolean;
  createdNewTurn: boolean;
  forkedFromThreadId?: string | null;
  resumedRequestId?: string | null;
  steeringApplied: boolean;
  lifecycleEventType: "thread_started" | "thread_resumed" | "thread_forked";
  turnKind: HelixTurnKind;
};

export type HelixThreadRouteResolutionError = {
  code:
    | "active_turn_not_steerable"
    | "active_turn_mismatch"
    | "no_active_turn";
  turn_kind?: HelixTurnKind;
  expected_turn_id?: string;
  active_turn_id?: string;
};

export const resolveHelixAskConversationTurnId = (args: {
  explicitTurnId?: string | null;
  traceId?: string | null;
  prefix: "ask" | "conversation";
}): string => {
  const explicitTurnId = String(args.explicitTurnId ?? "").trim();
  if (explicitTurnId) return explicitTurnId.slice(0, 128);
  const traceId = String(args.traceId ?? "").trim();
  if (traceId) return traceId.slice(0, 128);
  return `${args.prefix}:${crypto.randomUUID()}`.slice(0, 128);
};

export const clipHelixThreadPreview = (
  value: unknown,
  limit = 140,
): string | null => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

export const createHelixThreadItemId = (prefix = "item"): string =>
  `${prefix}:${crypto.randomUUID()}`.slice(0, 160);

export const createHelixThreadRequestId = (prefix = "req"): string =>
  `${prefix}:${crypto.randomUUID()}`.slice(0, 160);

export const isHelixTurnKindSteerable = (
  turnKind: HelixTurnKind | null | undefined,
): boolean => turnKind !== "review" && turnKind !== "compact";

export const appendHelixThreadCompletedItemLifecycle = (args: {
  threadId: string;
  turnId: string;
  route: HelixThreadRoute;
  sessionId?: string | null;
  traceId?: string | null;
  turnKind?: HelixTurnKind | null;
  itemId?: string | null;
  itemType: HelixThreadItemType;
  itemStream?: "plan" | "answer" | "tool" | "observation" | null;
  text?: string | null;
  userText?: string | null;
  assistantText?: string | null;
  observationRef?: Record<string, unknown> | null;
  sourceItemIds?: string[] | null;
  claimLinks?: HelixThreadClaimLink[] | null;
  meta?: Record<string, unknown> | null;
}): string => {
  const itemId = args.itemId?.trim() || createHelixThreadItemId(args.itemType);
  appendHelixThreadItemEvent({
    thread_id: args.threadId,
    route: args.route,
    event_type: "item_started",
    turn_id: args.turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    turn_kind: args.turnKind ?? null,
    item_id: itemId,
    item_type: args.itemType,
    item_status: "in_progress",
    item_stream: args.itemStream ?? null,
    user_text: args.itemType === "userMessage" ? args.userText ?? args.text ?? null : null,
    assistant_text: args.itemType === "answer" ? args.assistantText ?? args.text ?? null : null,
    observation_ref: args.observationRef ?? null,
    meta: args.meta ?? null,
  });
  if (args.text) {
    appendHelixThreadItemEvent({
      thread_id: args.threadId,
      route: args.route,
      event_type: "item_delta",
      turn_id: args.turnId,
      session_id: args.sessionId ?? null,
      trace_id: args.traceId ?? null,
      turn_kind: args.turnKind ?? null,
      item_id: itemId,
      item_type: args.itemType,
      item_status: "in_progress",
      item_stream: args.itemStream ?? null,
      delta_text: args.text,
      observation_ref: args.observationRef ?? null,
      meta: args.meta ?? null,
    });
  }
  appendHelixThreadItemEvent({
    thread_id: args.threadId,
    route: args.route,
    event_type: "item_completed",
    turn_id: args.turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    turn_kind: args.turnKind ?? null,
    item_id: itemId,
    item_type: args.itemType,
    item_status: "completed",
    item_stream: args.itemStream ?? null,
    user_text: args.itemType === "userMessage" ? args.userText ?? args.text ?? null : null,
    assistant_text: args.itemType === "answer" ? args.assistantText ?? args.text ?? null : null,
    observation_ref: args.observationRef ?? null,
    source_item_ids: args.sourceItemIds ?? null,
    claim_links: args.claimLinks ?? null,
    meta: args.meta ?? null,
  });
  return itemId;
};

export const buildHelixThreadRequestQuestionsFromText = (
  value: unknown,
): Array<{ id: string; text: string }> => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const question = text.endsWith("?") ? text : `${text.replace(/[.]+$/g, "")}?`;
  return [{ id: "clarify", text: question.slice(0, 320) }];
};

export const resolveHelixThreadNeedsInputFromPayload = (
  payload: Record<string, unknown> | null,
): {
  needsInput: boolean;
  requestKind: HelixThreadRequestKind;
  requestQuestions: Array<{ id: string; text: string }>;
} => {
  const debug =
    payload?.debug && typeof payload.debug === "object"
      ? (payload.debug as Record<string, unknown>)
      : null;
  const existingNeedsInput = payload?.needs_input === true;
  const topLevelAgentStopReason =
    typeof payload?.agent_stop_reason === "string"
      ? payload.agent_stop_reason.trim()
      : "";
  const agentStopReason =
    typeof debug?.agent_stop_reason === "string" ? debug.agent_stop_reason.trim() : "";
  const controllerStopReason =
    typeof debug?.controller_stop_reason === "string"
      ? debug.controller_stop_reason.trim()
      : "";
  const clarifyTriggered = debug?.clarify_triggered === true;
  const failReason =
    typeof payload?.fail_reason === "string" ? payload.fail_reason.trim() : "";
  const needsInput =
    existingNeedsInput ||
    topLevelAgentStopReason === "user_clarify_required" ||
    agentStopReason === "user_clarify_required" ||
    controllerStopReason === "user_clarify_required" ||
    clarifyTriggered ||
    failReason === "PROMPT_CONTRACT_REQUIRED_INPUT_MISSING";
  return {
    needsInput,
    requestKind: "request_user_input",
    requestQuestions: buildHelixThreadRequestQuestionsFromText(
      payload?.text ?? payload?.answer,
    ),
  };
};

export const cloneHelixThreadVisibleHistoryIntoFork = (args: {
  sourceThreadId: string;
  targetThreadId: string;
  route: HelixThreadRoute;
  sessionId?: string | null;
  traceId?: string | null;
}): void => {
  const sourceState = buildHelixThreadState({ threadId: args.sourceThreadId });
  for (const turn of sourceState.turns) {
    const projectedTurnId = `fork:${turn.turn_id}`.slice(0, 128);
    appendHelixTurnEvent({
      thread_id: args.targetThreadId,
      route: args.route,
      event_type: "turn_started",
      turn_id: projectedTurnId,
      session_id: args.sessionId ?? sourceState.session_id ?? null,
      trace_id: args.traceId ?? null,
      turn_kind: turn.turn_kind ?? (turn.route === "/ask" ? "ask" : "conversation_turn"),
      thread_status: "active",
      meta: {
        source_thread_id: args.sourceThreadId,
        source_turn_id: turn.turn_id,
        fork_projection: true,
      },
    });
    if (turn.user_text) {
      appendHelixThreadCompletedItemLifecycle({
        threadId: args.targetThreadId,
        turnId: projectedTurnId,
        route: args.route,
        sessionId: args.sessionId ?? sourceState.session_id ?? null,
        traceId: args.traceId ?? null,
        turnKind: turn.turn_kind ?? (turn.route === "/ask" ? "ask" : "conversation_turn"),
        itemType: "userMessage",
        text: turn.user_text,
        userText: turn.user_text,
        meta: {
          source_thread_id: args.sourceThreadId,
          source_turn_id: turn.turn_id,
          fork_projection: true,
        },
      });
    }
    if (turn.assistant_text && turn.status === "completed") {
      appendHelixThreadCompletedItemLifecycle({
        threadId: args.targetThreadId,
        turnId: projectedTurnId,
        route: args.route,
        sessionId: args.sessionId ?? sourceState.session_id ?? null,
        traceId: args.traceId ?? null,
        turnKind: turn.turn_kind ?? (turn.route === "/ask" ? "ask" : "conversation_turn"),
        itemType: "answer",
        itemStream: "answer",
        text: turn.assistant_text,
        assistantText: turn.assistant_text,
        meta: {
          source_thread_id: args.sourceThreadId,
          source_turn_id: turn.turn_id,
          fork_projection: true,
        },
      });
    }
    appendHelixTurnEvent({
      thread_id: args.targetThreadId,
      route: args.route,
      event_type:
        turn.status === "failed"
          ? "turn_failed"
          : turn.status === "interrupted" || turn.status === "in_progress"
            ? "turn_interrupted"
            : "turn_completed",
      turn_id: projectedTurnId,
      session_id: args.sessionId ?? sourceState.session_id ?? null,
      trace_id: args.traceId ?? null,
      turn_kind: turn.turn_kind ?? (turn.route === "/ask" ? "ask" : "conversation_turn"),
      thread_status:
        turn.status === "failed"
          ? "failed"
          : turn.status === "interrupted" || turn.status === "in_progress"
            ? "interrupted"
            : "idle",
      user_text: turn.user_text ?? null,
      assistant_text: turn.status === "completed" ? turn.assistant_text ?? null : null,
      meta: {
        source_thread_id: args.sourceThreadId,
        source_turn_id: turn.turn_id,
        fork_projection: true,
      },
    });
  }
};

export const resolveHelixThreadRouteContext = (args: {
  route: HelixThreadRoute;
  sessionId?: string | null;
  explicitThreadId?: string | null;
  threadForkFromId?: string | null;
  explicitTurnId?: string | null;
  expectedTurnId?: string | null;
  steerActiveTurn?: boolean;
  resumeRequestId?: string | null;
  traceId?: string | null;
  titlePreview?: string | null;
  turnKind: HelixTurnKind;
}): HelixThreadRouteContext | HelixThreadRouteResolutionError => {
  const sessionId = String(args.sessionId ?? "").trim() || null;
  const explicitThreadId = String(args.explicitThreadId ?? "").trim() || null;
  const forkFromThreadId = String(args.threadForkFromId ?? "").trim() || null;
  const expectedTurnId = String(args.expectedTurnId ?? "").trim() || null;
  const explicitTurnId = String(args.explicitTurnId ?? "").trim() || null;
  const resumeRequestId = String(args.resumeRequestId ?? "").trim() || null;
  const steerActiveTurn = args.steerActiveTurn === true;
  let threadId = explicitThreadId;
  let createdNewThread = false;
  let lifecycleEventType: HelixThreadRouteContext["lifecycleEventType"] =
    "thread_resumed";
  let forkedFromThreadId: string | null = null;

  if (forkFromThreadId) {
    const forked = forkHelixThread({
      sourceThreadId: forkFromThreadId,
      sessionId,
      titlePreview: args.titlePreview ?? null,
    });
    threadId = forked.thread_id;
    createdNewThread = true;
    lifecycleEventType = "thread_forked";
    forkedFromThreadId = forkFromThreadId;
    cloneHelixThreadVisibleHistoryIntoFork({
      sourceThreadId: forkFromThreadId,
      targetThreadId: threadId,
      route: args.route,
      sessionId,
      traceId: args.traceId ?? null,
    });
  } else {
    const existingThread =
      (explicitThreadId && readHelixThread({ threadId: explicitThreadId })) ||
      (sessionId
        ? (() => {
            const activeThreadId = getActiveHelixThreadForSession(sessionId);
            return activeThreadId
              ? readHelixThread({ threadId: activeThreadId })
              : null;
          })()
        : null);
    const resumed = resumeHelixThread({
      threadId: explicitThreadId,
      sessionId,
      titlePreview: args.titlePreview ?? null,
    });
    threadId = resumed.thread_id;
    createdNewThread = !existingThread;
    lifecycleEventType = createdNewThread ? "thread_started" : "thread_resumed";
  }

  let turnId =
    explicitTurnId ||
    resolveHelixAskConversationTurnId({
      explicitTurnId: explicitTurnId ?? undefined,
      traceId: args.traceId ?? undefined,
      prefix: args.turnKind === "ask" ? "ask" : "conversation",
    });
  let createdNewTurn = true;
  let steeringApplied = false;

  const activeThreadRecord = readHelixThread({ threadId });
  const activeTurnId = activeThreadRecord?.active_turn_id ?? null;
  const activeTurnState =
    activeTurnId ? buildHelixTurnState({ threadId, turnId: activeTurnId }) : null;
  const unresolvedRequest =
    resumeRequestId && threadId
      ? getHelixThreadRequests({ threadId, unresolvedOnly: true }).find(
          (entry) => entry.request_id === resumeRequestId,
        ) ?? null
      : null;

  if (steerActiveTurn) {
    if (!activeTurnId || !activeTurnState) {
      return {
        code: "no_active_turn",
        expected_turn_id: expectedTurnId ?? undefined,
      };
    }
    if (expectedTurnId && expectedTurnId !== activeTurnId) {
      return {
        code: "active_turn_mismatch",
        expected_turn_id: expectedTurnId,
        active_turn_id: activeTurnId,
      };
    }
    if (!isHelixTurnKindSteerable(activeTurnState.turn_kind ?? null)) {
      return {
        code: "active_turn_not_steerable",
        turn_kind: activeTurnState.turn_kind ?? undefined,
        expected_turn_id: expectedTurnId ?? undefined,
        active_turn_id: activeTurnId,
      };
    }
    turnId = activeTurnId;
    createdNewTurn = false;
    steeringApplied = true;
  } else if (resumeRequestId && unresolvedRequest) {
    const resumeTurnState = buildHelixTurnState({
      threadId,
      turnId: unresolvedRequest.turn_id,
    });
    if (
      resumeTurnState &&
      (!expectedTurnId || expectedTurnId === unresolvedRequest.turn_id) &&
      resumeTurnState.status !== "completed" &&
      resumeTurnState.status !== "failed"
    ) {
      turnId = unresolvedRequest.turn_id;
      createdNewTurn = false;
      steeringApplied = true;
    }
  }

  if (sessionId) {
    setActiveHelixThreadForSession(sessionId, threadId);
  }

  return {
    threadId,
    turnId,
    createdNewThread,
    createdNewTurn,
    forkedFromThreadId,
    resumedRequestId: resumeRequestId,
    steeringApplied,
    lifecycleEventType,
    turnKind: args.turnKind,
  };
};
