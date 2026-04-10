type MutableDebugPayload = Record<string, unknown>;

const toBoundedRatio = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Number((numerator / denominator).toFixed(4));
};

export const applyObjectiveTraceDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  objectiveReasoningTrace: unknown[];
  objectiveTelemetryUsed: Record<string, unknown>;
  stepTranscripts: unknown[];
  llmStepCount: number;
  expectedLlmStepCount: number;
  transcriptCompleteCount: number;
  routingSalvageApplied: boolean;
  routingSalvageReason: string | null;
  routingSalvageRetrievalAddedCount: number;
}): void => {
  args.debugPayload.objective_reasoning_trace = args.objectiveReasoningTrace.slice(0, 12);
  args.debugPayload.objective_telemetry_used = args.objectiveTelemetryUsed;
  args.debugPayload.objective_step_transcripts = args.stepTranscripts;
  args.debugPayload.objective_step_transcript_count = args.stepTranscripts.length;
  args.debugPayload.objective_step_llm_call_count = args.llmStepCount;
  args.debugPayload.per_step_llm_call_rate = toBoundedRatio(
    args.llmStepCount,
    args.expectedLlmStepCount,
  );
  args.debugPayload.transcript_completeness_rate = toBoundedRatio(
    args.transcriptCompleteCount,
    args.stepTranscripts.length,
  );
  args.debugPayload.routing_salvage_applied = args.routingSalvageApplied;
  args.debugPayload.routing_salvage_reason = args.routingSalvageReason;
  args.debugPayload.routing_salvage_retrieval_added_count = args.routingSalvageRetrievalAddedCount;
};
