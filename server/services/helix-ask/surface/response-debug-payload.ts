export type HelixAskTraceEvent = {
  ts: string;
  tool: string;
  stage: string;
  detail?: string;
  ok?: boolean;
  durationMs?: number;
  text?: string;
  meta?: Record<string, unknown>;
};

export type HelixAskTraceSummary = {
  stage: string;
  detail?: string;
  ok?: boolean;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

type MutableDebugPayload = Record<string, unknown> | null | undefined;

export type HelixAskFastQualityDecision = {
  stage: string;
  decision?: "allow" | "skip" | "deadline";
  action?: string;
  reason: string;
  elapsedMs?: number;
  remainingMs?: number;
  elapsed_ms?: number;
  remaining_ms?: number;
  deadline_ms?: number;
  minimumMs?: number;
  timeoutMs?: number;
  stageRemainingMs?: number;
};

type OverflowRetryHistoryEntry = {
  label: string;
  steps: string[];
  attempts: number;
};

export const buildTraceSummary = (
  events: HelixAskTraceEvent[],
  limit = 12,
): HelixAskTraceSummary[] => {
  if (!events.length) return [];
  return events
    .filter((entry) => {
      const fn = (entry.meta as { fn?: unknown } | undefined)?.fn;
      return (
        typeof entry.durationMs === "number" &&
        Number.isFinite(entry.durationMs) &&
        entry.durationMs > 0 &&
        typeof fn === "string" &&
        fn.trim().length > 0
      );
    })
    .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
    .slice(0, limit)
    .map((entry) => ({
      stage: entry.stage,
      detail: entry.detail,
      ok: entry.ok,
      durationMs: entry.durationMs,
      meta: entry.meta,
    }));
};

export const attachTraceSummaryDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  traceEvents: HelixAskTraceEvent[];
  attachReasoningSidebarToDebug?: (args: {
    debugRecord: Record<string, unknown>;
    traceEvents: HelixAskTraceEvent[];
  }) => void;
}): void => {
  if (!args.debugPayload) return;
  args.debugPayload.live_events = args.traceEvents;
  args.debugPayload.trace_events = args.traceEvents;
  args.debugPayload.trace_summary = buildTraceSummary(args.traceEvents);
  args.attachReasoningSidebarToDebug?.({
    debugRecord: args.debugPayload,
    traceEvents: args.traceEvents,
  });
};

export const attachFinalTraceDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  captureLiveHistory: boolean;
  traceEvents: HelixAskTraceEvent[];
  buildEventStableFields: (args: {
    retrievalRoute: string;
    fallbackDecision: string;
    contractRendererPath: string;
    gateOutcomes: {
      evidence_gate_ok: boolean;
      claim_gate_ok: boolean;
      doc_slot_gate_ok: boolean;
    };
  }) => unknown;
  hashStableJson: (value: unknown) => string;
  attachReasoningSidebarToDebug: (args: {
    debugRecord: Record<string, unknown>;
    traceEvents: HelixAskTraceEvent[];
  }) => void;
  retrievalRoute: string;
  fallbackDecision: string;
  contractRendererPath: string;
  gateOutcomes: {
    evidence_gate_ok: boolean;
    claim_gate_ok: boolean;
    doc_slot_gate_ok: boolean;
  };
}): void => {
  if (!args.debugPayload || !args.captureLiveHistory) return;
  attachTraceSummaryDebugPayload({
    debugPayload: args.debugPayload,
    traceEvents: args.traceEvents,
    attachReasoningSidebarToDebug: args.attachReasoningSidebarToDebug,
  });
  const stableEventFields = args.buildEventStableFields({
    retrievalRoute: args.retrievalRoute,
    fallbackDecision: args.fallbackDecision,
    contractRendererPath: args.contractRendererPath,
    gateOutcomes: args.gateOutcomes,
  });
  args.debugPayload.event_stable_fields = stableEventFields;
  args.debugPayload.event_journal = {
    version: "quake_frame_loop_v1",
    replay_parity: true,
    deterministic: true,
    event_count: args.traceEvents.length,
    event_hash: args.hashStableJson(args.traceEvents),
    stable_fields: stableEventFields,
  };
};

export const attachOverflowRetryDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  overflowHistory: OverflowRetryHistoryEntry[];
}): void => {
  if (!args.debugPayload || args.overflowHistory.length === 0) return;
  const steps = args.overflowHistory.flatMap((entry) => entry.steps);
  args.debugPayload.overflow_retry_applied = true;
  args.debugPayload.overflow_retry_steps = Array.from(new Set(steps));
  args.debugPayload.overflow_retry_labels = args.overflowHistory.map((entry) => entry.label);
  args.debugPayload.overflow_retry_attempts = args.overflowHistory.reduce(
    (sum, entry) => sum + entry.attempts,
    0,
  );
};

export const applyShortCircuitDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  shouldShortCircuitAnswer: boolean;
  shortCircuitReason: string;
  bypassShortCircuit: boolean;
  isStage05HardFailForcedRule: boolean;
}): void => {
  if (!args.debugPayload || !args.shouldShortCircuitAnswer) return;
  args.debugPayload.llm_short_circuit_rule = "fallback_answer_short_circuit_v1";
  args.debugPayload.llm_short_circuit_reason = args.shortCircuitReason;
  args.debugPayload.llm_short_circuit_bypassed = args.bypassShortCircuit;
  if (!args.isStage05HardFailForcedRule) return;
  args.debugPayload.stage05_hard_fail_invariant_ok = !args.bypassShortCircuit;
  args.debugPayload.stage05_hard_fail_short_circuit = !args.bypassShortCircuit;
};

export const applyForcedShortCircuitAnswerDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  answerShortSentences: number;
  answerShortTokens: number;
  blocked: boolean;
  stopReason?: string | null;
}): void => {
  if (!args.debugPayload) return;
  args.debugPayload.answer_short_sentences = args.answerShortSentences;
  args.debugPayload.answer_short_tokens = args.answerShortTokens;
  args.debugPayload.answer_stream_mode = "final_only_forced_short_circuit";
  if (!args.blocked) return;
  args.debugPayload.answer_blocked = true;
  args.debugPayload.answer_stop_reason = args.stopReason ?? "Fail-closed";
};

export const applyFastQualityDecisionSummary = (args: {
  debugPayload: MutableDebugPayload;
  fastQualityMode: boolean;
  fastQualityDecisions: HelixAskFastQualityDecision[];
}): void => {
  if (!args.debugPayload || !args.fastQualityMode) return;
  const decisions = args.fastQualityDecisions.slice();
  args.debugPayload.fast_quality_decisions = decisions;
  args.debugPayload.fast_quality_deadline_misses = decisions
    .filter((entry) => entry.decision === "deadline")
    .map((entry) => `${entry.stage}:${entry.reason}`);
};

export const attachFastPathResponseDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  forcedFinalText: string;
  answerPath: string[];
  qualityFloorReasons: string[];
  captureLiveHistory: boolean;
  traceEvents: HelixAskTraceEvent[];
  overflowHistory: OverflowRetryHistoryEntry[];
  fastQualityMode: boolean;
  fastQualityDecisions: HelixAskFastQualityDecision[];
  attachReasoningSidebarToDebug?: (args: {
    debugRecord: Record<string, unknown>;
    traceEvents: HelixAskTraceEvent[];
  }) => void;
  clipText: (text: string, maxChars: number) => string;
  answerPreviewChars: number;
}): void => {
  if (!args.debugPayload) return;
  args.debugPayload.answer_after_fallback = args.clipText(
    args.forcedFinalText,
    args.answerPreviewChars,
  );
  args.debugPayload.answer_final_text = args.clipText(
    args.forcedFinalText,
    args.answerPreviewChars,
  );
  args.debugPayload.answer_path = args.answerPath;
  args.debugPayload.answer_extension_available = false;
  args.debugPayload.micro_pass = false;
  args.debugPayload.micro_pass_enabled = false;
  if (args.qualityFloorReasons.length > 0) {
    args.debugPayload.answer_quality_floor_applied = true;
    args.debugPayload.answer_quality_floor_reasons = args.qualityFloorReasons;
  }
  if (args.captureLiveHistory) {
    attachTraceSummaryDebugPayload({
      debugPayload: args.debugPayload,
      traceEvents: args.traceEvents,
      attachReasoningSidebarToDebug: args.attachReasoningSidebarToDebug,
    });
  }
  attachOverflowRetryDebugPayload({
    debugPayload: args.debugPayload,
    overflowHistory: args.overflowHistory,
  });
  applyFastQualityDecisionSummary({
    debugPayload: args.debugPayload,
    fastQualityMode: args.fastQualityMode,
    fastQualityDecisions: args.fastQualityDecisions,
  });
};

export const attachFinalResponseObservabilityDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  captureLiveHistory: boolean;
  traceEvents: HelixAskTraceEvent[];
  buildEventStableFields: (args: {
    retrievalRoute: string;
    fallbackDecision: string;
    contractRendererPath: string;
    gateOutcomes: {
      evidence_gate_ok: boolean;
      claim_gate_ok: boolean;
      doc_slot_gate_ok: boolean;
    };
  }) => unknown;
  hashStableJson: (value: unknown) => string;
  attachReasoningSidebarToDebug: (args: {
    debugRecord: Record<string, unknown>;
    traceEvents: HelixAskTraceEvent[];
  }) => void;
  retrievalRoute: string;
  fallbackDecision: string;
  contractRendererPath: string;
  gateOutcomes: {
    evidence_gate_ok: boolean;
    claim_gate_ok: boolean;
    doc_slot_gate_ok: boolean;
  };
  overflowHistory: OverflowRetryHistoryEntry[];
  fastQualityMode: boolean;
  fastQualityDecisions: HelixAskFastQualityDecision[];
  attachStageTiming: (debugPayload: Record<string, unknown>, key: string, durationMs: number) => void;
}): void => {
  if (!args.debugPayload) return;
  attachFinalTraceDebugPayload({
    debugPayload: args.debugPayload,
    captureLiveHistory: args.captureLiveHistory,
    traceEvents: args.traceEvents,
    buildEventStableFields: args.buildEventStableFields,
    hashStableJson: args.hashStableJson,
    attachReasoningSidebarToDebug: args.attachReasoningSidebarToDebug,
    retrievalRoute: args.retrievalRoute,
    fallbackDecision: args.fallbackDecision,
    contractRendererPath: args.contractRendererPath,
    gateOutcomes: args.gateOutcomes,
  });
  attachOverflowRetryDebugPayload({
    debugPayload: args.debugPayload,
    overflowHistory: args.overflowHistory,
  });
  applyFastQualityDecisionSummary({
    debugPayload: args.debugPayload,
    fastQualityMode: args.fastQualityMode,
    fastQualityDecisions: args.fastQualityDecisions,
  });
  const timeline = Array.isArray(args.debugPayload.timeline)
    ? (args.debugPayload.timeline as Array<Record<string, unknown>>)
    : [];
  for (const entry of timeline) {
    const stageKey = String(entry?.stage ?? entry?.name ?? "").trim();
    const durationMs = Number(entry?.duration_ms ?? entry?.ms ?? 0);
    if (!stageKey) continue;
    args.attachStageTiming(args.debugPayload, stageKey, durationMs);
  }
  if (!args.debugPayload.helix_ask_fail_reason) {
    args.debugPayload.helix_ask_fail_reason = null;
    args.debugPayload.helix_ask_fail_class = null;
  }
};

export const buildFinalResponsePayload = <TResult extends Record<string, unknown>>(args: {
  result: TResult;
  debugPayload: MutableDebugPayload;
  finalText: string;
  attachContextCapsuleToResult: (target: TResult, finalTextRaw?: string) => void;
}): TResult | (TResult & { debug: Record<string, unknown> }) => {
  const responsePayload = args.debugPayload
    ? ({ ...args.result, debug: args.debugPayload } as TResult & { debug: Record<string, unknown> })
    : args.result;
  args.attachContextCapsuleToResult(responsePayload as TResult, args.finalText);
  return responsePayload;
};
