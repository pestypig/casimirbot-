type MutableDebugPayload = Record<string, unknown> | null | undefined;

export const attachFinalTraceDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  captureLiveHistory: boolean;
  traceEvents: Record<string, unknown>[];
  buildTraceSummary: (events: Record<string, unknown>[]) => unknown;
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
    traceEvents: Record<string, unknown>[];
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
  args.debugPayload.live_events = args.traceEvents;
  args.debugPayload.trace_events = args.traceEvents;
  args.debugPayload.trace_summary = args.buildTraceSummary(args.traceEvents);
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
  args.attachReasoningSidebarToDebug({
    debugRecord: args.debugPayload,
    traceEvents: args.traceEvents,
  });
};

export const attachOverflowRetryDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  overflowHistory: Array<{ label: string; steps: string[]; attempts: number }>;
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
