import crypto from "node:crypto";
import {
  buildRecentTurnsFromConversationHistory,
} from "../conversation-history";
import {
  getHelixThreadSessionMemory,
  recordHelixThreadCarryForward,
} from "../../helix-thread/carry-forward";
import {
  appendHelixThreadLifecycleEvent,
  appendHelixThreadServerRequestEvent,
  appendHelixTurnEvent,
} from "../../helix-thread/ledger";
import { buildRecentTurnsFromHelixThread } from "../../helix-thread/reducer";
import { updateHelixThreadRecord } from "../../helix-thread/registry";
import {
  appendHelixAskDualHistoryEvent,
  appendHelixThreadCompletedItemLifecycle,
  clipHelixThreadPreview,
  resolveHelixThreadRouteContext,
} from "./request-context";

type ConversationClassifierResult = {
  mode: string;
  confidence: number;
  dispatch_hint: boolean;
  clarify_needed: boolean;
  reason: string;
  source?: string;
};

type ConversationRouteDecision = {
  classification: ConversationClassifierResult;
  routeReasonCode: string;
  explorationTurn: boolean;
  clarifierPolicy: string;
  explorationPacket?: Record<string, unknown> | null;
};

export type HelixConversationTurnHandlerRequest = {
  personaId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
  threadId?: string | null;
  threadForkFromId?: string | null;
  turnId?: string | null;
  expectedTurnId?: string | null;
  steerActiveTurn?: boolean;
  resumeRequestId?: string | null;
  transcript: string;
  recentTurns?: string[] | null;
  sourceLanguage?: string | null;
  languageDetected?: string | null;
  languageConfidence?: number | null;
  codeMixed?: boolean;
  responseLanguage?: string | null;
  preferredResponseLanguage?: string | null;
  interpreter?: Record<string, unknown> | null;
  interpreterStatus?: string | null;
  interpreterError?: string | null;
  multilangConfirm?: boolean;
  pivotConfidence?: number | null;
  translated?: boolean;
  lang_schema_version?: string | null;
  interpreter_schema_version?: string | null;
};

type ConversationLogArgs = {
  tool: "conversation.classified" | "conversation.brief_ready" | "conversation.dispatch_hint";
  detail: string;
  message: string;
  ok: boolean;
  meta?: Record<string, unknown>;
  startedAtMs?: number;
  error?: string;
};

export type HelixConversationTurnHandlerDeps = {
  conversationRecentTurnsLimit: number;
  conversationClassifierMaxTokens: number;
  conversationBriefMaxTokens: number;
  sessionMemoryEnabled: boolean;
  interpreterActive: boolean;
  pivotConfidenceBlockMin: number;
  pivotConfidenceAutoMin: number;
  languageConfidenceMin: number;
  langSchemaVersion: string;
  interpreterSchemaVersion: string;
  getConversationModel: () => string;
  normalizeLanguageTag: (value: unknown) => string | null;
  inferLanguageFromScript: (value: string) => string | null;
  clampNumber: (value: number, min: number, max: number) => number;
  resolveDetectedResponseLanguageCandidate: (args: {
    sourceLanguage?: string | null;
    languageDetected?: string | null;
  }) => string | null;
  resolveHelixAskInterpreterResolution: (args: Record<string, unknown>) => Promise<{
    artifact: any;
    status: string | null;
    error: string | null;
  }>;
  shouldApplyInterpreterDispatchState: (args: Record<string, unknown>) => boolean;
  shouldForceInterpreterFailClosed: (args: Record<string, unknown>) => boolean;
  buildLocalizedConfirmPrompt: (args: {
    responseLanguage: string;
    sourceLanguage?: string | null;
    concept?: string | null;
  }) => string | null;
  buildConversationClassifierPrompt: (args: {
    transcript: string;
    recentTurns: string[];
  }) => string;
  parseConversationClassifierResult: (raw: string) => ConversationClassifierResult | null;
  inferConversationModeHeuristic: (transcript: string) => string;
  inferConversationDispatchHintHeuristic: (transcript: string, mode: string) => boolean;
  buildConversationFallbackBrief: (args: {
    transcript: string;
    mode: string;
    dispatchHint: boolean;
  }) => string;
  normalizeConversationRouteDecision: (args: {
    transcript: string;
    classification: ConversationClassifierResult;
  }) => ConversationRouteDecision;
  llmLocalHandler: (payload: Record<string, unknown>, context: Record<string, unknown>) => Promise<unknown>;
  buildConversationBriefPrompt: (args: Record<string, unknown>) => string;
  buildConversationBriefRepairPrompt: (args: Record<string, unknown>) => string;
  parseConversationBriefResult: (raw: string) => string | null;
  sanitizeConversationBriefText: (text: string) => string;
  isConversationBriefPolicyCompliant: (text: string, mode: string) => boolean;
  clipConversationText: (value: string, maxChars?: number) => string;
  appendToolLog: (entry: Record<string, unknown>) => void;
  stableJsonStringify: (value: unknown) => string;
  sha256Hex: (value: string) => string;
};

export type HelixConversationTurnHandlerResult = {
  status: number;
  payload: Record<string, unknown>;
};

export const executeHelixConversationTurn = async (args: {
  request: HelixConversationTurnHandlerRequest;
  personaId: string;
  tenantId?: string | null;
  deps: HelixConversationTurnHandlerDeps;
}): Promise<HelixConversationTurnHandlerResult> => {
  const { request, personaId, tenantId, deps } = args;
  const sessionId = request.sessionId?.trim() || undefined;
  const traceId = (request.traceId?.trim() || `conversation:${crypto.randomUUID()}`).slice(0, 128);
  const threadContext = resolveHelixThreadRouteContext({
    route: "/ask/conversation-turn",
    sessionId,
    explicitThreadId: request.threadId ?? null,
    threadForkFromId: request.threadForkFromId ?? null,
    explicitTurnId: request.turnId ?? null,
    expectedTurnId: request.expectedTurnId ?? null,
    steerActiveTurn: request.steerActiveTurn === true,
    resumeRequestId: request.resumeRequestId ?? null,
    traceId,
    titlePreview: request.transcript,
    turnKind: "conversation_turn",
  });
  if ("code" in threadContext) {
    return {
      status: 409,
      payload: {
        ok: false,
        code: threadContext.code,
        turn_kind: threadContext.turn_kind,
        expected_turn_id: threadContext.expected_turn_id,
        active_turn_id: threadContext.active_turn_id,
      },
    };
  }

  const threadId = threadContext.threadId;
  const turnId = threadContext.turnId;
  const transcript = request.transcript.trim();
  const providedRecentTurns = Array.isArray(request.recentTurns)
    ? request.recentTurns.map((entry) => entry.trim()).filter(Boolean).slice(-deps.conversationRecentTurnsLimit)
    : null;
  const recentTurns =
    providedRecentTurns ??
    (() => {
      const threadRecentTurns = buildRecentTurnsFromHelixThread({
        threadId,
        sessionId,
        limit: deps.conversationRecentTurnsLimit,
        excludeTurnId: turnId,
      });
      if (threadRecentTurns.length > 0) {
        return threadRecentTurns;
      }
      return buildRecentTurnsFromConversationHistory({
        sessionId,
        limit: deps.conversationRecentTurnsLimit,
        excludeTurnId: turnId,
      });
    })();
  const model = deps.getConversationModel();
  const requestStartedAt = Date.now();
  let sourceLanguage = deps.normalizeLanguageTag(request.sourceLanguage ?? null) ?? null;
  let languageDetected =
    deps.normalizeLanguageTag(request.languageDetected ?? null) ??
    sourceLanguage;
  const scriptInferredLanguage = deps.inferLanguageFromScript(transcript);
  if (!sourceLanguage && scriptInferredLanguage) {
    sourceLanguage = scriptInferredLanguage;
  }
  if (!languageDetected && scriptInferredLanguage) {
    languageDetected = scriptInferredLanguage;
  }
  const languageConfidence =
    typeof request.languageConfidence === "number" && Number.isFinite(request.languageConfidence)
      ? deps.clampNumber(request.languageConfidence, 0, 1)
      : null;
  const codeMixed = request.codeMixed === true;
  const explicitResponseLanguageOverride =
    deps.normalizeLanguageTag(request.responseLanguage ?? null) ??
    deps.normalizeLanguageTag(request.preferredResponseLanguage ?? null);
  const conversationSessionMemory =
    deps.sessionMemoryEnabled && sessionId ? getHelixThreadSessionMemory(sessionId) : null;
  const sessionPinnedResponseLanguage =
    explicitResponseLanguageOverride
      ? null
      : deps.normalizeLanguageTag(conversationSessionMemory?.userPrefs?.preferredResponseLanguage ?? null);
  const autoPinnedResponseLanguageCandidate = deps.resolveDetectedResponseLanguageCandidate({
    sourceLanguage,
    languageDetected,
  });
  if (
    deps.sessionMemoryEnabled &&
    sessionId &&
    !explicitResponseLanguageOverride &&
    autoPinnedResponseLanguageCandidate &&
    autoPinnedResponseLanguageCandidate !== sessionPinnedResponseLanguage
  ) {
    recordHelixThreadCarryForward({
      sessionId,
      userPrefs: {
        preferredResponseLanguage: autoPinnedResponseLanguageCandidate,
      },
    });
  }
  const responseLanguage =
    deps.normalizeLanguageTag(
      explicitResponseLanguageOverride ??
        sessionPinnedResponseLanguage ??
        autoPinnedResponseLanguageCandidate ??
        "en",
    ) ?? "en";
  const interpreterResolution = await deps.resolveHelixAskInterpreterResolution({
    sourceText: transcript,
    sourceLanguage: sourceLanguage ?? languageDetected,
    codeMixed,
    pivotText: transcript,
    responseLanguage,
    providedArtifact: request.interpreter ?? null,
    providedStatus: request.interpreterStatus ?? null,
    providedError: request.interpreterError ?? null,
  });
  const interpreterArtifact = interpreterResolution.artifact;
  const interpreterStatus = interpreterResolution.status;
  const interpreterError = interpreterResolution.error;
  const interpreterDispatchEligible = deps.shouldApplyInterpreterDispatchState({
    artifact: interpreterArtifact,
    status: interpreterStatus,
    sourceLanguage: sourceLanguage ?? null,
    languageDetected: languageDetected ?? null,
    codeMixed,
    sourceText: transcript,
  });
  const interpreterConfidence =
    interpreterArtifact && Number.isFinite(interpreterArtifact.selected_pivot.confidence)
      ? deps.clampNumber(interpreterArtifact.selected_pivot.confidence, 0, 1)
      : null;
  const interpreterStatusForceBlock = deps.shouldForceInterpreterFailClosed({
    artifact: interpreterArtifact,
    status: interpreterStatus,
    error: interpreterError,
    sourceLanguage: sourceLanguage ?? languageDetected,
    codeMixed,
    sourceText: transcript,
  });
  const routingTranscript =
    deps.interpreterActive &&
    interpreterDispatchEligible &&
    interpreterArtifact?.selected_pivot.text.trim()
      ? interpreterArtifact.selected_pivot.text.trim()
      : transcript;

  appendHelixThreadLifecycleEvent({
    thread_id: threadId,
    route: "/ask/conversation-turn",
    event_type: threadContext.lifecycleEventType,
    turn_id: turnId,
    session_id: sessionId ?? null,
    trace_id: traceId,
    thread_status: "active",
    turn_kind: "conversation_turn",
    meta: {
      forked_from_thread_id: threadContext.forkedFromThreadId ?? null,
      steering_applied: threadContext.steeringApplied,
    },
  });
  updateHelixThreadRecord({
    threadId,
    patch: {
      session_id: sessionId ?? null,
      status: "active",
      latest_turn_id: turnId,
      active_turn_id: turnId,
      title_preview: clipHelixThreadPreview(transcript),
      metadata: {
        last_route: "/ask/conversation-turn",
      },
    },
  });
  if (threadContext.createdNewTurn) {
    appendHelixTurnEvent({
      thread_id: threadId,
      route: "/ask/conversation-turn",
      event_type: "turn_started",
      turn_id: turnId,
      session_id: sessionId ?? null,
      trace_id: traceId,
      turn_kind: "conversation_turn",
      thread_status: "active",
      user_text: transcript,
    });
  }
  if (threadContext.resumedRequestId) {
    appendHelixThreadServerRequestEvent({
      thread_id: threadId,
      route: "/ask/conversation-turn",
      event_type: "server_request_resolved",
      turn_id: turnId,
      session_id: sessionId ?? null,
      trace_id: traceId,
      turn_kind: "conversation_turn",
      request_id: threadContext.resumedRequestId,
      request_kind: "request_user_input",
      item_status: "completed",
      request_payload: {
        transcript,
      },
    });
  }
  appendHelixThreadCompletedItemLifecycle({
    threadId,
    turnId,
    route: "/ask/conversation-turn",
    sessionId: sessionId ?? null,
    traceId,
    turnKind: "conversation_turn",
    itemType: "userMessage",
    text: transcript,
    userText: transcript,
    meta: {
      steering_applied: threadContext.steeringApplied,
      resume_request_id: threadContext.resumedRequestId ?? null,
    },
  });
  appendHelixAskDualHistoryEvent({
    thread_id: threadId,
    route: "/ask/conversation-turn",
    event_type: "conversation_turn_started",
    turn_id: turnId,
    session_id: sessionId ?? null,
    trace_id: traceId,
    user_text: transcript,
    route_reason: providedRecentTurns ? "recent_turns:request" : "recent_turns:history",
    brief_status:
      providedRecentTurns !== null
        ? "request_provided"
        : recentTurns.length > 0
          ? "history_seeded"
          : "history_empty",
    meta: {
      recent_turn_count: recentTurns.length,
      recent_turn_seed_source: providedRecentTurns !== null ? "request" : "history",
    },
  });
  const appendConversationLog = (entry: ConversationLogArgs): void => {
    const now = Date.now();
    const payloadHash = deps.sha256Hex(
      deps.stableJsonStringify({
        transcript,
        detail: entry.detail,
        message: entry.message,
        meta: entry.meta ?? {},
      }),
    );
    deps.appendToolLog({
      tool: entry.tool,
      version: "v1",
      paramsHash: payloadHash,
      durationMs: Math.max(0, now - (entry.startedAtMs ?? requestStartedAt)),
      tenantId: tenantId ?? undefined,
      sessionId,
      traceId,
      stage: "conversation_turn",
      detail: entry.detail,
      message: entry.message,
      meta: entry.meta,
      ok: entry.ok,
      error: entry.error,
    });
  };

  let classifierSource: "llm" | "fallback" = "llm";
  let classifierFailReason: string | null = null;
  let classification: ConversationClassifierResult;
  const classifyStartedAt = Date.now();
  const classifierPrompt = deps.buildConversationClassifierPrompt({
    transcript: routingTranscript,
    recentTurns,
  });
  try {
    const classifierResult = await deps.llmLocalHandler(
      {
        prompt: classifierPrompt,
        max_tokens: deps.conversationClassifierMaxTokens,
        temperature: 0.1,
        stop: ["\n\n"],
        model,
        metadata: { kind: "helix.conversation.classifier" },
      },
      {
        sessionId,
        traceId: `${traceId}:classify`,
        personaId,
        tenantId: tenantId ?? undefined,
      },
    );
    const rawClassifier = String((classifierResult as { text?: unknown })?.text ?? "");
    const parsedClassifier = deps.parseConversationClassifierResult(rawClassifier);
    if (parsedClassifier) {
      classification = parsedClassifier;
    } else {
      classifierSource = "fallback";
      classifierFailReason = "conversation_classifier_parse_fallback";
      const fallbackMode = deps.inferConversationModeHeuristic(routingTranscript);
      const fallbackDispatch = deps.inferConversationDispatchHintHeuristic(
        routingTranscript,
        fallbackMode,
      );
      classification = {
        mode: fallbackMode,
        confidence: fallbackMode === "clarify" ? 0.28 : 0.46,
        dispatch_hint: fallbackDispatch,
        clarify_needed: fallbackMode === "clarify",
        reason: "Deterministic fallback classifier.",
      };
    }
  } catch {
    classifierSource = "fallback";
    classifierFailReason = "conversation_classifier_model_fallback";
    const fallbackMode = deps.inferConversationModeHeuristic(routingTranscript);
    const fallbackDispatch = deps.inferConversationDispatchHintHeuristic(
      routingTranscript,
      fallbackMode,
    );
    classification = {
      mode: fallbackMode,
      confidence: fallbackMode === "clarify" ? 0.24 : 0.42,
      dispatch_hint: fallbackDispatch,
      clarify_needed: fallbackMode === "clarify",
      reason: "Classifier unavailable, deterministic fallback applied.",
    };
  }
  const routeDecision = deps.normalizeConversationRouteDecision({
    transcript: routingTranscript,
    classification,
  });
  classification = routeDecision.classification;
  appendConversationLog({
    tool: "conversation.classified",
    detail: classification.mode,
    message: classification.reason,
    ok: classifierSource === "llm",
    startedAtMs: classifyStartedAt,
    error: classifierFailReason ?? undefined,
    meta: {
      confidence: classification.confidence,
      dispatch_hint: classification.dispatch_hint,
      clarify_needed: classification.clarify_needed,
      source: classifierSource,
      route_reason_code: routeDecision.routeReasonCode,
      exploration_turn: routeDecision.explorationTurn,
    },
  });
  appendHelixAskDualHistoryEvent({
    thread_id: threadId,
    route: "/ask/conversation-turn",
    event_type: "conversation_turn_classified",
    turn_id: turnId,
    session_id: sessionId ?? null,
    trace_id: traceId,
    classifier_result: {
      ...classification,
      source: classifierSource,
    },
    route_reason: routeDecision.routeReasonCode,
    meta: {
      exploration_turn: routeDecision.explorationTurn,
      clarifier_policy: routeDecision.clarifierPolicy,
    },
  });
  appendHelixThreadCompletedItemLifecycle({
    threadId,
    turnId,
    route: "/ask/conversation-turn",
    sessionId: sessionId ?? null,
    traceId,
    turnKind: "conversation_turn",
    itemType: "classification",
    text: classification.reason,
    meta: {
      mode: classification.mode,
      confidence: classification.confidence,
      dispatch_hint: classification.dispatch_hint,
      clarify_needed: classification.clarify_needed,
      route_reason_code: routeDecision.routeReasonCode,
      source: classifierSource,
    },
  });

  let briefSource: "llm" | "fallback" | "none" = "none";
  let briefFailReason: string | null = null;
  let briefText = "";
  let briefRepairAttempted = false;
  let briefRepairSucceeded = false;
  let rawBrief = "";
  const briefStartedAt = Date.now();
  const briefPrompt = deps.buildConversationBriefPrompt({
    transcript: routingTranscript,
    classification,
    routeReasonCode: routeDecision.routeReasonCode,
    recentTurns,
    responseLanguage,
  });
  try {
    const briefResult = await deps.llmLocalHandler(
      {
        prompt: briefPrompt,
        max_tokens: deps.conversationBriefMaxTokens,
        temperature: 0.35,
        model,
        metadata: { kind: "helix.conversation.brief" },
      },
      {
        sessionId,
        traceId: `${traceId}:brief`,
        personaId,
        tenantId: tenantId ?? undefined,
      },
    );
    rawBrief = String((briefResult as { text?: unknown })?.text ?? "");
    const parsedBrief = deps.parseConversationBriefResult(rawBrief);
    if (parsedBrief && parsedBrief.trim()) {
      const sanitizedBrief = deps.sanitizeConversationBriefText(parsedBrief);
      if (deps.isConversationBriefPolicyCompliant(sanitizedBrief, classification.mode)) {
        briefText = sanitizedBrief;
        briefSource = "llm";
      } else {
        briefFailReason = "conversation_brief_policy_none";
      }
    } else {
      briefFailReason = "conversation_brief_parse_none";
    }
  } catch {
    briefFailReason = "conversation_brief_model_none";
  }
  if (briefSource !== "llm" && classifierSource === "llm") {
    briefRepairAttempted = true;
    const briefRepairPrompt = deps.buildConversationBriefRepairPrompt({
      transcript: routingTranscript,
      classification,
      routeReasonCode: routeDecision.routeReasonCode,
      recentTurns,
      priorRawBrief: rawBrief,
      failureReason: briefFailReason,
      responseLanguage,
    });
    try {
      const repairResult = await deps.llmLocalHandler(
        {
          prompt: briefRepairPrompt,
          max_tokens: deps.conversationBriefMaxTokens,
          temperature: 0.15,
          model,
          metadata: { kind: "helix.conversation.brief.repair" },
        },
        {
          sessionId,
          traceId: `${traceId}:brief:repair`,
          personaId,
          tenantId: tenantId ?? undefined,
        },
      );
      const repairRaw = String((repairResult as { text?: unknown })?.text ?? "");
      const repairParsed = deps.parseConversationBriefResult(repairRaw);
      if (repairParsed && repairParsed.trim()) {
        const sanitizedRepair = deps.sanitizeConversationBriefText(repairParsed);
        if (deps.isConversationBriefPolicyCompliant(sanitizedRepair, classification.mode)) {
          briefText = sanitizedRepair;
          briefSource = "llm";
          briefFailReason = null;
          briefRepairSucceeded = true;
        }
      }
    } catch {
      // Keep original fail reason and return none when repair is unavailable.
    }
  }
  briefText = deps.sanitizeConversationBriefText(briefText);
  if (!briefText && classifierSource === "fallback") {
    const fallbackBrief = deps.sanitizeConversationBriefText(
      deps.buildConversationFallbackBrief({
        transcript: routingTranscript,
        mode: classification.mode,
        dispatchHint: classification.dispatch_hint,
      }),
    );
    if (
      fallbackBrief &&
      (classification.mode === "clarify" ||
        deps.isConversationBriefPolicyCompliant(fallbackBrief, classification.mode))
    ) {
      briefText = fallbackBrief;
      briefSource = "fallback";
    }
  }
  if (!briefText) {
    briefSource = "none";
  }
  appendConversationLog({
    tool: "conversation.brief_ready",
    detail: classification.mode,
    message: deps.clipConversationText(briefText, 220),
    ok: briefSource === "llm",
    startedAtMs: briefStartedAt,
    error: briefFailReason ?? undefined,
    meta: {
      source: briefSource,
      text_length: briefText.length,
      repair_attempted: briefRepairAttempted,
      repair_succeeded: briefRepairSucceeded,
    },
  });
  appendHelixAskDualHistoryEvent({
    thread_id: threadId,
    route: "/ask/conversation-turn",
    event_type: "conversation_turn_brief_ready",
    turn_id: turnId,
    session_id: sessionId ?? null,
    trace_id: traceId,
    assistant_text: briefText || null,
    classifier_result: {
      ...classification,
      source: classifierSource,
    },
    route_reason: routeDecision.routeReasonCode,
    brief_status: briefSource === "llm" ? "ready" : briefSource === "fallback" ? "fallback" : "none",
    fail_reason: briefFailReason ?? undefined,
    meta: {
      repair_attempted: briefRepairAttempted,
      repair_succeeded: briefRepairSucceeded,
    },
  });
  appendHelixThreadCompletedItemLifecycle({
    threadId,
    turnId,
    route: "/ask/conversation-turn",
    sessionId: sessionId ?? null,
    traceId,
    turnKind: "conversation_turn",
    itemType: "brief",
    text: briefText || null,
    assistantText: briefText || null,
    meta: {
      source: briefSource,
      fail_reason: briefFailReason,
      repair_attempted: briefRepairAttempted,
      repair_succeeded: briefRepairSucceeded,
    },
  });
  const dispatchHint = Boolean(classification.dispatch_hint);
  const dispatchReason = routeDecision.routeReasonCode;
  const pivotConfidence =
    deps.interpreterActive && interpreterDispatchEligible && interpreterConfidence !== null
      ? interpreterConfidence
      : typeof request.pivotConfidence === "number" && Number.isFinite(request.pivotConfidence)
        ? deps.clampNumber(request.pivotConfidence, 0, 1)
        : null;
  let conversationDispatchState: "auto" | "confirm" | "blocked" = "auto";
  if (interpreterStatusForceBlock) {
    conversationDispatchState = "blocked";
  } else if (deps.interpreterActive && interpreterDispatchEligible && interpreterArtifact) {
    conversationDispatchState = interpreterArtifact.dispatch_state;
  } else {
    if (pivotConfidence !== null) {
      if (pivotConfidence < deps.pivotConfidenceBlockMin) {
        conversationDispatchState = "blocked";
      } else if (pivotConfidence < deps.pivotConfidenceAutoMin) {
        conversationDispatchState = "confirm";
      }
    }
    if (
      conversationDispatchState === "auto" &&
      languageConfidence !== null &&
      languageConfidence < deps.languageConfidenceMin
    ) {
      conversationDispatchState = "confirm";
    }
  }
  const dispatchBlocked = conversationDispatchState === "blocked";
  const needsConfirmation =
    dispatchBlocked || (conversationDispatchState === "confirm" && request.multilangConfirm !== true);
  const interpreterConfirmPrompt =
    interpreterArtifact?.confirm_prompt ??
    (needsConfirmation
      ? deps.buildLocalizedConfirmPrompt({
          responseLanguage,
          sourceLanguage: sourceLanguage ?? languageDetected,
          concept: transcript,
        })
      : null);
  appendConversationLog({
    tool: "conversation.dispatch_hint",
    detail: dispatchHint ? "dispatch" : "suppress",
    message: dispatchReason,
    ok: true,
    meta: {
      mode: classification.mode,
      dispatch_hint: dispatchHint,
      source: classifierSource,
      route_reason_code: routeDecision.routeReasonCode,
      exploration_turn: routeDecision.explorationTurn,
    },
  });

  const failReason =
    (interpreterStatusForceBlock ? "HELIX_INTERPRETER_STATUS_BLOCKED" : null) ??
    classifierFailReason ??
    briefFailReason;
  const conversationFinalGateOutcome =
    conversationDispatchState === "blocked"
      ? "dispatch_blocked"
      : needsConfirmation
        ? "confirmation_required"
        : routeDecision.routeReasonCode;
  appendHelixAskDualHistoryEvent({
    thread_id: threadId,
    route: "/ask/conversation-turn",
    event_type: "conversation_turn_completed",
    turn_id: turnId,
    session_id: sessionId ?? null,
    trace_id: traceId,
    user_text: transcript,
    assistant_text: briefText || null,
    classifier_result: {
      ...classification,
      source: classifierSource,
    },
    route_reason: routeDecision.routeReasonCode,
    brief_status: briefSource === "llm" ? "ready" : briefSource === "fallback" ? "fallback" : "none",
    final_gate_outcome: conversationFinalGateOutcome,
    fail_reason: failReason ?? undefined,
    meta: {
      dispatch_state: conversationDispatchState,
      needs_confirmation: needsConfirmation,
      exploration_turn: routeDecision.explorationTurn,
    },
  });
  appendHelixTurnEvent({
    thread_id: threadId,
    route: "/ask/conversation-turn",
    event_type: "turn_completed",
    turn_id: turnId,
    session_id: sessionId ?? null,
    trace_id: traceId,
    turn_kind: "conversation_turn",
    thread_status: "idle",
    user_text: transcript,
    assistant_text: briefText || null,
    final_gate_outcome: conversationFinalGateOutcome,
    fail_reason: failReason ?? null,
  });
  updateHelixThreadRecord({
    threadId,
    patch: {
      session_id: sessionId ?? null,
      status: "idle",
      latest_turn_id: turnId,
      active_turn_id: null,
      title_preview: clipHelixThreadPreview(transcript),
      metadata: {
        last_route: "/ask/conversation-turn",
        recent_turn_seed_source: providedRecentTurns !== null ? "request" : "history",
      },
    },
  });
  return {
    status: 200,
    payload: {
      ok: true,
      thread_id: threadId,
      turn_id: turnId,
      traceId,
      sessionId: sessionId ?? null,
      transcript,
      source_language: sourceLanguage,
      language_detected: languageDetected,
      language_confidence: languageConfidence,
      code_mixed: codeMixed,
      pivot_confidence: pivotConfidence,
      response_language: responseLanguage,
      dispatch_state: conversationDispatchState,
      needs_confirmation: needsConfirmation,
      lang_schema_version: request.lang_schema_version ?? deps.langSchemaVersion,
      translated: request.translated ?? false,
      interpreter_schema_version:
        request.interpreter_schema_version ??
        (interpreterArtifact ? deps.interpreterSchemaVersion : null),
      interpreter_status: interpreterStatus,
      interpreter_confidence: interpreterConfidence,
      interpreter_dispatch_state: interpreterDispatchEligible
        ? interpreterArtifact?.dispatch_state ?? null
        : null,
      interpreter_confirm_prompt: interpreterConfirmPrompt,
      interpreter_term_ids: interpreterArtifact?.term_ids ?? [],
      interpreter_concept_ids: interpreterArtifact?.concept_ids ?? [],
      interpreter_error: interpreterError,
      classification: {
        ...classification,
        source: classifierSource,
      },
      brief: {
        text: briefText,
        source: briefSource,
      },
      dispatch: {
        dispatch_hint: needsConfirmation ? false : dispatchHint,
        reason:
          dispatchBlocked
            ? "suppressed:multilang_dispatch_blocked"
            : needsConfirmation
              ? "suppressed:multilang_confirmation_required"
              : dispatchReason,
      },
      route_reason_code: routeDecision.routeReasonCode,
      exploration_turn: routeDecision.explorationTurn,
      clarifier_policy: routeDecision.clarifierPolicy,
      exploration_packet: routeDecision.explorationPacket,
      fail_reason: failReason,
      durationMs: Math.max(0, Date.now() - requestStartedAt),
    },
  };
};
