import crypto from "node:crypto";
import {
  getHelixThreadSessionMemory,
  recordHelixThreadCarryForward,
} from "../../helix-thread/carry-forward";
import {
  appendHelixThreadLifecycleEvent,
  appendHelixThreadServerRequestEvent,
  appendHelixTurnEvent,
} from "../../helix-thread/ledger";
import { buildHelixThreadCitationView } from "../../helix-thread/reducer";
import { updateHelixThreadRecord } from "../../helix-thread/registry";
import type {
  HelixThreadClaimLink,
  HelixThreadMemoryCitation,
  HelixThreadRequestKind,
} from "../../helix-thread/types";
import {
  appendHelixAskDualHistoryEvent,
  appendHelixThreadCompletedItemLifecycle,
  clipHelixThreadPreview,
  createHelixThreadRequestId,
  normalizeHelixThreadAnswerSurfaceMode,
  resolveHelixAskConversationTurnId,
  resolveHelixThreadNeedsInputFromPayload,
  resolveHelixThreadRouteContext,
  type HelixThreadRouteContext,
} from "./request-context";
import { applyHelixAskSuccessSurface } from "../surface/ask-answer-surface";

type HelixAskRuntimeRequest = Record<string, unknown> & {
  sessionId?: string | null;
  traceId?: string | null;
  threadId?: string | null;
  turnId?: string | null;
  question?: string | null;
  prompt?: string | null;
  context?: string | null;
  sourceQuestion?: string | null;
  sourceLanguage?: string | null;
  languageDetected?: string | null;
  languageConfidence?: number | null;
  codeMixed?: boolean;
  responseLanguage?: string | null;
  preferredResponseLanguage?: string | null;
  pivotConfidence?: number | null;
  translated?: boolean;
  interpreter?: Record<string, unknown> | null;
  interpreterStatus?: string | null;
  interpreterError?: string | null;
  multilangConfirm?: boolean;
  lang_schema_version?: string | null;
  interpreter_schema_version?: string | null;
  dryRun?: boolean;
  mode?: string | null;
};

type HelixAskRequestMetadata = {
  session_id?: string | null;
  trace_id?: string | null;
  turn_id?: string | null;
  thread_id?: string | null;
  source_language?: string | null;
  language_detected?: string | null;
  language_confidence?: number | null;
  code_mixed?: boolean;
  pivot_confidence?: number | null;
  translated?: boolean;
  lang_schema_version?: string | null;
  response_language?: string | null;
};

export type HelixAskRuntimeHandlerDeps = {
  sessionMemoryEnabled: boolean;
  interpreterActive: boolean;
  interpreterSchemaVersion: string;
  langSchemaVersion: string;
  hasExplicitResponseLanguageOverride: (request: HelixAskRuntimeRequest) => boolean;
  resolveSessionPinnedResponseLanguage: (args: {
    request: HelixAskRuntimeRequest;
    sessionMemory: Record<string, unknown> | null;
  }) => string | null;
  resolveDetectedResponseLanguageCandidate: (args: {
    sourceLanguage?: string | null;
    languageDetected?: string | null;
  }) => string | null;
  inferLanguageFromScript: (value: string) => string | null;
  normalizeLanguageTag: (value: unknown) => string | null;
  resolveHelixAskInterpreterResolution: (args: Record<string, unknown>) => Promise<{
    artifact: Record<string, unknown> | null;
    status: string | null;
    error: string | null;
  }>;
  resolveHelixAskResponseLanguage: (request: HelixAskRuntimeRequest) => string;
  shouldApplyInterpreterDispatchState: (args: Record<string, unknown>) => boolean;
  clampNumber: (value: number, min: number, max: number) => number;
  isEnglishLikeLanguage: (value: string) => boolean;
  shouldForceInterpreterFailClosed: (args: Record<string, unknown>) => boolean;
  buildLocalizedConfirmPrompt: (args: {
    responseLanguage: string;
    sourceLanguage?: string | null;
    concept?: string | null;
  }) => string | null;
  buildClassifierResultForAsk: (args: {
    request: HelixAskRuntimeRequest;
    payload: Record<string, unknown> | null;
  }) => unknown;
  resolveRouteReasonForAsk: (args: {
    request: HelixAskRuntimeRequest;
    payload: Record<string, unknown> | null;
  }) => string;
  resolveFinalGateOutcomeForAsk: (args: {
    status: number;
    payload: Record<string, unknown> | null;
  }) => string | null;
  extractResponseTextForHistory: (payload: Record<string, unknown> | null) => string | null;
  coerceDebugString: (value: unknown) => string | null;
  buildRequestMetadata: (request: HelixAskRuntimeRequest) => HelixAskRequestMetadata;
  resolveMultilangRollout: (args: {
    sessionId?: string | null;
    traceId?: string | null;
    fallbackSeed?: string;
  }) => HelixAskMultilangRolloutSummary;
  resolveDispatchState: (request: HelixAskRuntimeRequest) => string | null;
};

type HelixAskResponderLike = {
  send: (status: number, payload: unknown) => void;
};

type HelixAskStrictFailLedger = {
  entries: unknown;
  histogram: unknown;
  histogram_artifact: unknown;
};

type HelixAskMultilangRolloutSummary = {
  stage: string;
  active: boolean;
  shadow: boolean;
  canaryHit: boolean;
  activePercent: number;
  promotionFrozen: boolean;
};

type HelixAskMultilangRuntimeSnapshot = {
  stage: string;
  killSwitch: boolean;
  consecutive15mBreaches: number;
  freezePromotionUntilMs?: number | null;
  lastRollbackReason?: string | null;
};

type HelixAskMetricsRecorder = {
  recordHelixAskMultilangTranslation: (value: boolean) => void;
  recordHelixAskMultilangLanguageMatch: (value: boolean) => void;
  recordHelixAskMultilangFallback: (value: boolean) => void;
  recordHelixAskMultilangCanonicalTerm: (value: boolean) => void;
  observeHelixAskMultilangAddedLatency: (value: number) => void;
};

export type HelixAskRouteExecutionDeps = HelixAskRuntimeHandlerDeps & {
  buildStrictFailLedger: (args: {
    strictEnabled: boolean;
    payload: unknown;
  }) => HelixAskStrictFailLedger | null;
  buildMemoryCitation: (args: {
    evidenceRefs: unknown;
    rolloutIds: string[];
  }) => HelixThreadMemoryCitation | null;
  extractResponseEvidenceRefs: (payload: Record<string, unknown>) => unknown;
  extractMemoryCitationRolloutIds: (args: {
    payload: Record<string, unknown>;
    requestMetadata: HelixAskRequestMetadata;
    turnId: string;
  }) => string[];
  normalizeErrorEnvelope: (
    status: number,
    payload: unknown,
    requestMetadata: HelixAskRequestMetadata,
    startedAtMs: number,
  ) => Record<string, unknown>;
  outputContractVersion: string;
  multilangRuntimeState: HelixAskMultilangRuntimeSnapshot;
  multilangPromotionSlo: number;
  multilangRollback15mSlo: number;
  multilangRollback24hSlo: number;
  metrics: HelixAskMetricsRecorder;
  recordMultilangObservation: (entry: {
    tsMs: number;
    translationMiss: boolean;
    languageMismatch: boolean;
    fallbackUsed: boolean;
    addedLatencyMs: number;
    canonicalTermCorruption: boolean;
  }) => void;
  recordFailure: (payload: unknown) => void;
  recordSuccess: () => void;
  classifyTimeoutFailClass: (message: string) => string | null;
  canonicalTermPreservationRatio: (sourceText: string, pivotText: string) => number;
  withTimeout: <T>(promise: Promise<T>, timeoutMs: number, label: string) => Promise<T>;
};

export type HelixAskPreparedRequestResult =
  | {
      ok: true;
      sessionId?: string;
      requestData: HelixAskRuntimeRequest;
      requestQuestionSeed: string;
      requestSourceSeed: string;
    }
  | {
      ok: false;
      status: number;
      payload: Record<string, unknown>;
    };

export type HelixAskRouteContextResult =
  | {
      ok: true;
      requestData: HelixAskRuntimeRequest;
      requestMetadata: HelixAskRequestMetadata;
      threadContext: HelixThreadRouteContext;
      threadId: string;
      turnId: string;
      multilangRollout: HelixAskMultilangRolloutSummary;
      dispatchState: string | null;
      includeMultilangMetadata: boolean;
    }
  | {
      ok: false;
      status: number;
      payload: Record<string, unknown>;
    };

export const prepareHelixAskRouteRequest = async (args: {
  request: HelixAskRuntimeRequest;
  deps: HelixAskRuntimeHandlerDeps;
}): Promise<HelixAskPreparedRequestResult> => {
  const { deps } = args;
  const sessionId = args.request.sessionId?.trim() || undefined;
  const askSessionMemory =
    deps.sessionMemoryEnabled && sessionId ? getHelixThreadSessionMemory(sessionId) : null;
  const requestData: HelixAskRuntimeRequest = { ...args.request };
  requestData.traceId =
    typeof requestData.traceId === "string" && requestData.traceId.trim()
      ? requestData.traceId.trim().slice(0, 128)
      : (`ask:${crypto.randomUUID()}`).slice(0, 128);
  requestData.turnId = resolveHelixAskConversationTurnId({
    explicitTurnId: requestData.turnId,
    traceId: requestData.traceId,
    prefix: "ask",
  });
  const explicitResponseLanguageOverride = deps.hasExplicitResponseLanguageOverride(requestData);
  const sessionPinnedResponseLanguage = deps.resolveSessionPinnedResponseLanguage({
    request: requestData,
    sessionMemory: askSessionMemory as Record<string, unknown> | null,
  });
  if (!explicitResponseLanguageOverride && sessionPinnedResponseLanguage && !requestData.preferredResponseLanguage) {
    requestData.preferredResponseLanguage = sessionPinnedResponseLanguage;
  }
  const autoPinnedResponseLanguageCandidate = deps.resolveDetectedResponseLanguageCandidate({
    sourceLanguage: requestData.sourceLanguage,
    languageDetected: requestData.languageDetected,
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
    requestData.preferredResponseLanguage = autoPinnedResponseLanguageCandidate;
  }
  const requestQuestionSeed =
    (typeof requestData.question === "string" && requestData.question.trim()) ||
    (typeof requestData.prompt === "string" && requestData.prompt.trim()) ||
    "";
  const requestSourceSeed =
    (typeof requestData.sourceQuestion === "string" && requestData.sourceQuestion.trim()) ||
    requestQuestionSeed;
  const requestScriptLanguage = deps.inferLanguageFromScript(requestSourceSeed || requestQuestionSeed);
  if (!deps.normalizeLanguageTag(requestData.sourceLanguage ?? null) && requestScriptLanguage) {
    requestData.sourceLanguage = requestScriptLanguage;
  }
  if (!deps.normalizeLanguageTag(requestData.languageDetected ?? null) && requestScriptLanguage) {
    requestData.languageDetected = requestScriptLanguage;
  }
  const interpreterResolution = await deps.resolveHelixAskInterpreterResolution({
    sourceText: requestSourceSeed,
    sourceLanguage:
      deps.normalizeLanguageTag(requestData.sourceLanguage ?? null) ??
      deps.normalizeLanguageTag(requestData.languageDetected ?? null),
    codeMixed: requestData.codeMixed === true,
    pivotText: requestQuestionSeed,
    responseLanguage: deps.resolveHelixAskResponseLanguage(requestData),
    providedArtifact: requestData.interpreter ?? null,
    providedStatus: requestData.interpreterStatus ?? null,
    providedError: requestData.interpreterError ?? null,
  });
  const interpreterArtifact = interpreterResolution.artifact;
  const interpreterStatus = interpreterResolution.status;
  const interpreterError = interpreterResolution.error;
  const interpreterDispatchEligible = deps.shouldApplyInterpreterDispatchState({
    artifact: interpreterArtifact,
    status: interpreterStatus,
    sourceLanguage: requestData.sourceLanguage ?? null,
    languageDetected: requestData.languageDetected ?? null,
    codeMixed: requestData.codeMixed === true,
    sourceText: requestSourceSeed || requestQuestionSeed,
  });
  if (interpreterArtifact) {
    requestData.interpreter = interpreterArtifact;
    requestData.interpreter_schema_version =
      requestData.interpreter_schema_version ?? deps.interpreterSchemaVersion;
    requestData.interpreterStatus = interpreterStatus ?? undefined;
    requestData.interpreterError = interpreterError ?? undefined;
    const interpreterSourceText = String(interpreterArtifact.source_text ?? "").trim();
    if (!requestData.sourceQuestion?.trim() && interpreterSourceText) {
      requestData.sourceQuestion = interpreterSourceText;
    }
    if (!requestData.sourceLanguage?.trim()) {
      const interpreterSourceLanguage = deps.normalizeLanguageTag(
        interpreterArtifact.source_language ?? null,
      );
      if (interpreterSourceLanguage && interpreterSourceLanguage !== "unknown") {
        requestData.sourceLanguage = interpreterSourceLanguage;
      }
    }
    if (requestData.codeMixed === undefined) {
      requestData.codeMixed = interpreterArtifact.code_mixed === true;
    }
    if (deps.interpreterActive && interpreterDispatchEligible) {
      const pivotText = String(
        (interpreterArtifact.selected_pivot as { text?: unknown } | undefined)?.text ?? "",
      ).trim();
      if (pivotText) {
        requestData.question = pivotText;
      }
      const pivotConfidence = Number(
        (interpreterArtifact.selected_pivot as { confidence?: unknown } | undefined)?.confidence,
      );
      if (Number.isFinite(pivotConfidence)) {
        requestData.pivotConfidence = deps.clampNumber(pivotConfidence, 0, 1);
      }
      if (
        !requestData.translated &&
        requestData.sourceLanguage &&
        !deps.isEnglishLikeLanguage(requestData.sourceLanguage)
      ) {
        requestData.translated = true;
      }
    }
  } else if (interpreterStatus || interpreterError) {
    requestData.interpreterStatus = interpreterStatus ?? undefined;
    requestData.interpreterError = interpreterError ?? undefined;
  }
  const interpreterStatusForceBlock = deps.shouldForceInterpreterFailClosed({
    artifact: interpreterArtifact,
    status: interpreterStatus,
    error: interpreterError,
    sourceLanguage:
      deps.normalizeLanguageTag(requestData.sourceLanguage ?? null) ??
      deps.normalizeLanguageTag(requestData.languageDetected ?? null) ??
      deps.normalizeLanguageTag(interpreterArtifact?.source_language ?? null),
    codeMixed: requestData.codeMixed === true || interpreterArtifact?.code_mixed === true,
    sourceText: requestSourceSeed || requestQuestionSeed,
  });
  const interpreterDispatchState =
    interpreterDispatchEligible
      ? interpreterArtifact?.dispatch_state === "blocked"
        ? "confirm"
        : interpreterArtifact?.dispatch_state ?? null
      : interpreterStatusForceBlock
        ? "blocked"
        : null;
  const interpreterDispatchBlocked = interpreterDispatchState === "blocked";
  const interpreterDispatchConfirm =
    interpreterDispatchState === "confirm" && requestData.multilangConfirm !== true;
  if (interpreterDispatchBlocked || interpreterDispatchConfirm) {
    const failReason = interpreterStatusForceBlock
      ? "HELIX_INTERPRETER_STATUS_BLOCKED"
      : interpreterDispatchBlocked
        ? "HELIX_INTERPRETER_DISPATCH_BLOCKED"
        : "HELIX_INTERPRETER_CONFIRM_REQUIRED";
    const interpreterConfirmPrompt =
      String(interpreterArtifact?.confirm_prompt ?? "").trim() ||
      deps.buildLocalizedConfirmPrompt({
        responseLanguage: deps.resolveHelixAskResponseLanguage(requestData),
        sourceLanguage:
          deps.normalizeLanguageTag(requestData.sourceLanguage ?? null) ??
          deps.normalizeLanguageTag(requestData.languageDetected ?? null),
        concept: requestSourceSeed || requestQuestionSeed || null,
      }) ||
      null;
    return {
      ok: false,
      status: 200,
      payload: {
        ok: false,
        turn_id: requestData.turnId,
        trace_id: requestData.traceId,
        error: interpreterDispatchBlocked
          ? "multilang_dispatch_blocked"
          : "multilang_confirmation_required",
        message: interpreterStatusForceBlock
          ? "Interpreter confidence is unavailable; confirmation is required before retrieval continues."
          : interpreterDispatchBlocked
            ? "Translation confidence is too low to dispatch retrieval safely."
            : interpreterConfirmPrompt,
        fail_reason: failReason,
        fail_class: "multilang_confidence_gate",
        needs_confirmation: interpreterDispatchConfirm,
        dispatch_state: interpreterDispatchState,
        source_language: requestData.sourceLanguage ?? null,
        language_detected:
          deps.normalizeLanguageTag(requestData.languageDetected ?? null) ??
          deps.normalizeLanguageTag(requestData.sourceLanguage ?? null) ??
          null,
        language_confidence:
          typeof requestData.languageConfidence === "number" ? requestData.languageConfidence : null,
        pivot_confidence:
          typeof requestData.pivotConfidence === "number" ? requestData.pivotConfidence : null,
        code_mixed: requestData.codeMixed === true,
        response_language: deps.resolveHelixAskResponseLanguage(requestData),
        lang_schema_version: requestData.lang_schema_version ?? deps.langSchemaVersion,
        interpreter_schema_version:
          requestData.interpreter_schema_version ??
          (interpreterArtifact ? deps.interpreterSchemaVersion : null),
        interpreter_status: interpreterStatus,
        interpreter_confidence:
          interpreterArtifact
            ? deps.clampNumber(
                Number(
                  (interpreterArtifact.selected_pivot as { confidence?: unknown } | undefined)
                    ?.confidence,
                ),
                0,
                1,
              )
            : null,
        interpreter_dispatch_state: interpreterDispatchState,
        interpreter_confirm_prompt: interpreterConfirmPrompt,
        interpreter_term_ids: Array.isArray(interpreterArtifact?.term_ids)
          ? interpreterArtifact.term_ids
          : [],
        interpreter_concept_ids: Array.isArray(interpreterArtifact?.concept_ids)
          ? interpreterArtifact.concept_ids
          : [],
        interpreter_error: interpreterError,
      },
    };
  }
  return {
    ok: true,
    sessionId,
    requestData,
    requestQuestionSeed,
    requestSourceSeed,
  };
};

export const resolveHelixAskRouteContext = (args: {
  requestData: HelixAskRuntimeRequest;
  deps: HelixAskRuntimeHandlerDeps;
}): HelixAskRouteContextResult => {
  const { requestData, deps } = args;
  const requestMetadata = deps.buildRequestMetadata(requestData);
  const askTurnIdSeed =
    requestMetadata.turn_id ??
    resolveHelixAskConversationTurnId({
      explicitTurnId: requestData.turnId,
      traceId: requestMetadata.trace_id,
      prefix: "ask",
    });
  const threadContext = resolveHelixThreadRouteContext({
    route: "/ask",
    sessionId: requestMetadata.session_id,
    explicitThreadId: requestData.threadId ?? requestMetadata.thread_id ?? null,
    threadForkFromId:
      typeof requestData.threadForkFromId === "string" ? requestData.threadForkFromId : null,
    explicitTurnId: askTurnIdSeed,
    expectedTurnId:
      typeof requestData.expectedTurnId === "string" ? requestData.expectedTurnId : null,
    steerActiveTurn: requestData.steerActiveTurn === true,
    resumeRequestId:
      typeof requestData.resumeRequestId === "string" ? requestData.resumeRequestId : null,
    traceId: requestMetadata.trace_id,
    titlePreview: requestData.question ?? requestData.prompt ?? null,
    turnKind: "ask",
  });
  if ("code" in threadContext) {
    return {
      ok: false,
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
  const turnId = threadContext.turnId;
  const threadId = threadContext.threadId;
  requestMetadata.thread_id = threadId;
  requestMetadata.turn_id = turnId;
  requestData.threadId = threadId;
  requestData.turnId = turnId;
  const multilangRollout = deps.resolveMultilangRollout({
    sessionId: requestMetadata.session_id,
    traceId: requestMetadata.trace_id,
    fallbackSeed:
      (typeof requestData.question === "string" ? requestData.question : null) ??
      (typeof requestData.prompt === "string" ? requestData.prompt : null) ??
      undefined,
  });
  const dispatchState = deps.resolveDispatchState(requestData);
  const includeMultilangMetadata = Boolean(
    requestData.lang_schema_version ||
      requestData.sourceQuestion ||
      requestData.sourceLanguage ||
      requestData.languageDetected ||
      requestData.responseLanguage ||
      requestData.preferredResponseLanguage ||
      requestData.codeMixed === true ||
      typeof requestData.languageConfidence === "number" ||
      typeof requestData.pivotConfidence === "number" ||
      requestData.translated === true ||
      Boolean(requestData.interpreter)
  );
  return {
    ok: true,
    requestData,
    requestMetadata,
    threadContext,
    threadId,
    turnId,
    multilangRollout,
    dispatchState,
    includeMultilangMetadata,
  };
};

export const beginHelixAskThreadExecution = (args: {
  requestData: HelixAskRuntimeRequest;
  requestMetadata: HelixAskRequestMetadata;
  requestQuestionSeed: string;
  threadId: string;
  turnId: string;
  threadContext: HelixThreadRouteContext;
  deps: HelixAskRuntimeHandlerDeps;
}): void => {
  const {
    requestData,
    requestMetadata,
    requestQuestionSeed,
    threadId,
    turnId,
    threadContext,
    deps,
  } = args;
  appendHelixThreadLifecycleEvent({
    thread_id: threadId,
    route: "/ask",
    event_type: threadContext.lifecycleEventType,
    turn_id: turnId,
    session_id: requestMetadata.session_id,
    trace_id: requestMetadata.trace_id,
    thread_status: "active",
    turn_kind: "ask",
    meta: {
      forked_from_thread_id: threadContext.forkedFromThreadId ?? null,
      steering_applied: threadContext.steeringApplied,
    },
  });
  updateHelixThreadRecord({
    threadId,
    patch: {
      session_id: requestMetadata.session_id,
      status: "active",
      latest_turn_id: turnId,
      active_turn_id: turnId,
      title_preview: clipHelixThreadPreview(requestData.question ?? requestData.prompt ?? ""),
      metadata: {
        last_route: "/ask",
      },
    },
  });
  if (threadContext.createdNewTurn) {
    appendHelixTurnEvent({
      thread_id: threadId,
      route: "/ask",
      event_type: "turn_started",
      turn_id: turnId,
      session_id: requestMetadata.session_id,
      trace_id: requestMetadata.trace_id,
      turn_kind: "ask",
      thread_status: "active",
      user_text: requestQuestionSeed || requestData.context || null,
    });
  }
  if (threadContext.resumedRequestId) {
    appendHelixThreadServerRequestEvent({
      thread_id: threadId,
      route: "/ask",
      event_type: "server_request_resolved",
      turn_id: turnId,
      session_id: requestMetadata.session_id,
      trace_id: requestMetadata.trace_id,
      turn_kind: "ask",
      request_id: threadContext.resumedRequestId,
      request_kind: "request_user_input",
      item_status: "completed",
      request_payload: {
        question: requestData.question ?? requestData.prompt ?? null,
      },
    });
  }
  appendHelixThreadCompletedItemLifecycle({
    threadId,
    turnId,
    route: "/ask",
    sessionId: requestMetadata.session_id,
    traceId: requestMetadata.trace_id,
    turnKind: "ask",
    itemType: "userMessage",
    text: requestQuestionSeed || requestData.context || null,
    userText: requestQuestionSeed || requestData.context || null,
    meta: {
      steering_applied: threadContext.steeringApplied,
      resume_request_id: threadContext.resumedRequestId ?? null,
    },
  });
  appendHelixAskDualHistoryEvent({
    thread_id: threadId,
    route: "/ask",
    event_type: "ask_started",
    turn_id: turnId,
    session_id: requestMetadata.session_id,
    trace_id: requestMetadata.trace_id,
    user_text: requestQuestionSeed || requestData.context || null,
    classifier_result: deps.buildClassifierResultForAsk({
      request: requestData,
      payload: null,
    }),
    route_reason: `mode:${requestData.mode ?? "read"}`,
    brief_status: "pending",
    final_gate_outcome: "in_progress",
    meta: {
      dry_run: requestData.dryRun === true,
      response_language: requestMetadata.response_language,
    },
  });
};

export const finalizeHelixAskThreadExecution = (args: {
  status: number;
  normalizedPayload: unknown;
  requestData: HelixAskRuntimeRequest;
  requestMetadata: HelixAskRequestMetadata;
  requestQuestionSeed: string;
  threadId: string;
  turnId: string;
  deps: HelixAskRuntimeHandlerDeps;
}): void => {
  const {
    status,
    normalizedPayload,
    requestData,
    requestMetadata,
    requestQuestionSeed,
    threadId,
    turnId,
    deps,
  } = args;
  const payloadRecord =
    normalizedPayload && typeof normalizedPayload === "object"
      ? (normalizedPayload as Record<string, unknown>)
      : null;
  const needsInputState =
    status < 400
      ? resolveHelixThreadNeedsInputFromPayload(payloadRecord)
      : {
          needsInput: false,
          requestKind: "request_user_input" as HelixThreadRequestKind,
          requestQuestions: [] as Array<{ id: string; text: string }>,
        };
  let requestId: string | null =
    typeof payloadRecord?.request_id === "string" && payloadRecord.request_id.trim()
      ? payloadRecord.request_id.trim()
      : null;
  if (payloadRecord && needsInputState.needsInput) {
    if (!requestId) {
      requestId = createHelixThreadRequestId("request_input");
      payloadRecord.request_id = requestId;
    }
    if (payloadRecord.needs_input === undefined) {
      payloadRecord.needs_input = true;
    }
    if (payloadRecord.request_questions === undefined) {
      payloadRecord.request_questions = needsInputState.requestQuestions;
    }
  }
  const eventType =
    status < 400
      ? payloadRecord?.needs_input === true
        ? "ask_interrupted"
        : "ask_completed"
      : payloadRecord?.error === "helix_ask_interrupted" ||
          payloadRecord?.fail_reason === "helix_ask_interrupted"
        ? "ask_interrupted"
        : "ask_failed";
  const assistantText = status < 400 ? deps.extractResponseTextForHistory(payloadRecord) : null;
  const observationItemIds: string[] = [];
  if (status < 400 && payloadRecord?.memory_citation && typeof payloadRecord.memory_citation === "object") {
    const citation = payloadRecord.memory_citation as HelixThreadMemoryCitation;
    for (const entry of citation.entries ?? []) {
      const itemId = appendHelixThreadCompletedItemLifecycle({
        threadId,
        turnId,
        route: "/ask",
        sessionId: requestMetadata.session_id,
        traceId: requestMetadata.trace_id,
        turnKind: "ask",
        itemType: "toolObservation",
        itemStream: "observation",
        text: entry.note ?? entry.path,
        observationRef: {
          path: entry.path,
          line_start: entry.line_start,
          line_end: entry.line_end,
          note: entry.note,
        },
      });
      observationItemIds.push(itemId);
    }
  }
  const payloadDebug =
    payloadRecord?.debug && typeof payloadRecord.debug === "object"
      ? (payloadRecord.debug as Record<string, unknown>)
      : null;
  const planSummary =
    deps.coerceDebugString(payloadDebug?.policy_prompt_family) ??
    deps.coerceDebugString(payloadDebug?.intent_strategy) ??
    deps.coerceDebugString(payloadDebug?.synthesis_reason);
  if (planSummary) {
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId,
      route: "/ask",
      sessionId: requestMetadata.session_id,
      traceId: requestMetadata.trace_id,
      turnKind: "ask",
      itemType: "plan",
      itemStream: "plan",
      text: planSummary,
    });
    appendHelixTurnEvent({
      thread_id: threadId,
      route: "/ask",
      event_type: "turn_plan_updated",
      turn_id: turnId,
      session_id: requestMetadata.session_id,
      trace_id: requestMetadata.trace_id,
      turn_kind: "ask",
      brief_status: planSummary,
      meta: {
        plan_summary: planSummary,
      },
    });
  }
  const finalGateOutcome = deps.resolveFinalGateOutcomeForAsk({
    status,
    payload: payloadRecord,
  });
  appendHelixThreadCompletedItemLifecycle({
    threadId,
    turnId,
    route: "/ask",
    sessionId: requestMetadata.session_id,
    traceId: requestMetadata.trace_id,
    turnKind: "ask",
    itemType: "validation",
    text: finalGateOutcome ?? null,
    meta: {
      http_status: status,
      objective_finalize_gate_mode: payloadDebug?.objective_finalize_gate_mode ?? null,
      final_mode_gate_consistency_blocked:
        payloadDebug?.final_mode_gate_consistency_blocked === true,
    },
  });
  if (assistantText) {
    const claimLinks: HelixThreadClaimLink[] =
      observationItemIds.length > 0
        ? [
            {
              claim_id: `answer:${turnId}`,
              source_item_ids: observationItemIds.slice(),
            },
          ]
        : [];
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId,
      route: "/ask",
      sessionId: requestMetadata.session_id,
      traceId: requestMetadata.trace_id,
      turnKind: "ask",
      itemType: "answer",
      itemStream: "answer",
      text: assistantText,
      assistantText,
      sourceItemIds: observationItemIds,
      claimLinks,
    });
  }
  if (needsInputState.needsInput && requestId) {
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId,
      route: "/ask",
      sessionId: requestMetadata.session_id,
      traceId: requestMetadata.trace_id,
      turnKind: "ask",
      itemType: "requestUserInput",
      text: needsInputState.requestQuestions.map((entry) => entry.text).join(" "),
      meta: {
        request_id: requestId,
      },
    });
    appendHelixThreadServerRequestEvent({
      thread_id: threadId,
      route: "/ask",
      event_type: "server_request_created",
      turn_id: turnId,
      session_id: requestMetadata.session_id,
      trace_id: requestMetadata.trace_id,
      turn_kind: "ask",
      request_id: requestId,
      request_kind: needsInputState.requestKind,
      request_payload: {
        questions: needsInputState.requestQuestions,
      },
    });
  }
  if (status < 400 && payloadRecord) {
    const derivedCitation = buildHelixThreadCitationView({
      threadId,
      turnId,
    })?.memory_citation;
    if (derivedCitation) {
      payloadRecord.memory_citation = derivedCitation;
    }
  }
  appendHelixAskDualHistoryEvent({
    thread_id: threadId,
    route: "/ask",
    event_type: eventType,
    turn_id: turnId,
    session_id: requestMetadata.session_id,
    trace_id: requestMetadata.trace_id,
    user_text: requestQuestionSeed || requestData.context || null,
    assistant_text: assistantText,
    classifier_result: deps.buildClassifierResultForAsk({
      request: requestData,
      payload: payloadRecord,
    }),
    route_reason: deps.resolveRouteReasonForAsk({
      request: requestData,
      payload: payloadRecord,
    }),
    brief_status: status < 400 ? "final_answer_ready" : "none",
    final_gate_outcome: finalGateOutcome,
    fail_reason:
      typeof payloadRecord?.fail_reason === "string"
        ? payloadRecord.fail_reason
        : typeof payloadRecord?.error === "string"
          ? payloadRecord.error
          : undefined,
    meta: {
      http_status: status,
      has_memory_citation: Boolean(payloadRecord?.memory_citation),
      request_id: requestId,
      needs_input: payloadRecord?.needs_input === true,
    },
    answer_surface_mode: normalizeHelixThreadAnswerSurfaceMode(
      payloadRecord?.answer_surface_mode,
    ),
    memory_citation:
      (payloadRecord?.memory_citation as HelixThreadMemoryCitation | null | undefined) ?? null,
  });
  appendHelixTurnEvent({
    thread_id: threadId,
    route: "/ask",
    event_type:
      eventType === "ask_completed"
        ? "turn_completed"
        : eventType === "ask_interrupted"
          ? "turn_interrupted"
          : "turn_failed",
    turn_id: turnId,
    session_id: requestMetadata.session_id,
    trace_id: requestMetadata.trace_id,
    turn_kind: "ask",
    thread_status:
      eventType === "ask_completed"
        ? "idle"
        : eventType === "ask_interrupted"
          ? "interrupted"
          : "failed",
    user_text: requestQuestionSeed || requestData.context || null,
    assistant_text: assistantText,
    final_gate_outcome: finalGateOutcome,
    fail_reason:
      typeof payloadRecord?.fail_reason === "string"
        ? payloadRecord.fail_reason
        : typeof payloadRecord?.error === "string"
          ? payloadRecord.error
          : null,
  });
  updateHelixThreadRecord({
    threadId,
    patch: {
      session_id: requestMetadata.session_id,
      status:
        eventType === "ask_completed"
          ? "idle"
          : eventType === "ask_interrupted"
            ? "interrupted"
            : "failed",
      latest_turn_id: turnId,
      active_turn_id: eventType === "ask_interrupted" ? turnId : null,
      title_preview: clipHelixThreadPreview(requestQuestionSeed || requestData.context || ""),
      metadata: {
        last_route: "/ask",
        last_request_id: requestId,
      },
    },
  });
};

export const executeHelixAskRouteFlow = async (args: {
  askStartedAtMs: number;
  requestTimeoutMs: number;
  requestData: HelixAskRuntimeRequest;
  requestMetadata: HelixAskRequestMetadata;
  requestQuestionSeed: string;
  threadId: string;
  turnId: string;
  threadContext: HelixThreadRouteContext;
  includeMultilangMetadata: boolean;
  dispatchState: string | null;
  multilangRollout: HelixAskMultilangRolloutSummary;
  keepAlive: HelixAskResponderLike;
  strictProvenance: boolean;
  executeAsk: (responder: HelixAskResponderLike) => Promise<void>;
  deps: HelixAskRouteExecutionDeps;
}): Promise<void> => {
  const {
    askStartedAtMs,
    requestTimeoutMs,
    requestData,
    requestMetadata,
    requestQuestionSeed,
    threadId,
    turnId,
    threadContext,
    includeMultilangMetadata,
    dispatchState,
    multilangRollout,
    keepAlive,
    strictProvenance,
    executeAsk,
    deps,
  } = args;
  beginHelixAskThreadExecution({
    requestData,
    requestMetadata,
    requestQuestionSeed,
    threadId,
    turnId,
    threadContext,
    deps,
  });
  let askHistoryFinalized = false;
  const safeSend = (status: number, payload: unknown): void => {
    const strictFailLedger = deps.buildStrictFailLedger({
      strictEnabled: strictProvenance,
      payload,
    });
    if (payload && typeof payload === "object") {
      const typedPayload = payload as Record<string, unknown>;
      if (typedPayload.turn_id === undefined) {
        typedPayload.turn_id = turnId;
      }
      if (typedPayload.thread_id === undefined) {
        typedPayload.thread_id = threadId;
      }
    }
    if (strictFailLedger && payload && typeof payload === "object") {
      const typedPayload = payload as Record<string, unknown>;
      typedPayload.strict_fail_reason_ledger = strictFailLedger.entries;
      typedPayload.strict_fail_reason_histogram = strictFailLedger.histogram;
      typedPayload.strict_fail_reason_histogram_artifact = strictFailLedger.histogram_artifact;
      const typedDebug =
        typedPayload.debug && typeof typedPayload.debug === "object"
          ? (typedPayload.debug as Record<string, unknown>)
          : null;
      if (typedDebug) {
        typedDebug.strict_fail_reason_ledger = strictFailLedger.entries;
        typedDebug.strict_fail_reason_histogram = strictFailLedger.histogram;
        typedDebug.strict_fail_reason_histogram_artifact = strictFailLedger.histogram_artifact;
      }
    }
    if (status < 400 && payload && typeof payload === "object") {
      applyHelixAskSuccessSurface({
        payload: payload as Record<string, unknown>,
        requestMetadata,
        requestData,
        includeMultilangMetadata,
        dispatchState,
        multilangRollout,
        threadId,
        turnId,
        outputContractVersion: deps.outputContractVersion,
        interpreterSchemaVersion: deps.interpreterSchemaVersion,
        buildMemoryCitation: deps.buildMemoryCitation,
        extractResponseEvidenceRefs: deps.extractResponseEvidenceRefs,
        extractMemoryCitationRolloutIds: deps.extractMemoryCitationRolloutIds,
        clampNumber: deps.clampNumber,
        normalizeLanguageTag: deps.normalizeLanguageTag,
        isEnglishLikeLanguage: deps.isEnglishLikeLanguage,
        canonicalTermPreservationRatio: deps.canonicalTermPreservationRatio,
        metrics: deps.metrics,
        multilangRuntimeState: deps.multilangRuntimeState,
        multilangPromotionSlo: deps.multilangPromotionSlo,
        multilangRollback15mSlo: deps.multilangRollback15mSlo,
        multilangRollback24hSlo: deps.multilangRollback24hSlo,
        recordMultilangObservation: deps.recordMultilangObservation,
      });
    }

    const normalizedPayload =
      status >= 400
        ? deps.normalizeErrorEnvelope(status, payload, requestMetadata, askStartedAtMs)
        : (payload as Record<string, unknown>);
    if (!askHistoryFinalized) {
      askHistoryFinalized = true;
      finalizeHelixAskThreadExecution({
        status,
        normalizedPayload,
        requestData,
        requestMetadata,
        requestQuestionSeed,
        threadId,
        turnId,
        deps,
      });
    }
    if (status >= 500) {
      deps.recordFailure(payload);
    } else if (status < 400) {
      deps.recordSuccess();
    }
    keepAlive.send(status, normalizedPayload);
  };

  try {
    await deps.withTimeout(
      executeAsk({ send: safeSend }),
      requestTimeoutMs,
      "helix_ask_request",
    );
  } catch (error) {
    deps.recordFailure(error);
    const message = error instanceof Error ? error.message : String(error);
    safeSend(500, {
      ok: false,
      error: "helix_ask_unhandled",
      message,
      status: 500,
      fail_reason: message,
      fail_class: deps.classifyTimeoutFailClass(message) ?? "infra_fail",
    });
  }
};
