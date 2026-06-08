export const STAGE_PLAY_LIVE_SOURCE_MEMORY_CONSOLIDATION_SCHEMA =
  "stage_play_live_source_memory_consolidation/v1" as const;

export type StagePlayLiveSourceMemoryConsolidationV1 = {
  artifactId: "stage_play_live_source_memory_consolidation";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MEMORY_CONSOLIDATION_SCHEMA;
  consolidationId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceIds: string[];
  consolidatedRunningStory: string;
  sourcePatterns: string[];
  currentObjective: string;
  openQuestions: string[];
  stalePredictions: string[];
  policyRelevantMemories: string[];
  processedMailBatchCount: number;
  contextPressureScore: number;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMemoryConsolidationQuietWindowV1 = {
  schema: "stage_play_live_source_memory_consolidation_quiet_window/v1";
  quiet: boolean;
  reason:
    | "quiet_window_ready"
    | "urgent_mail_present"
    | "active_user_prompt_present"
    | "insufficient_processed_mail_batches"
    | "context_pressure_below_threshold"
    | "memory_consolidation_already_queued_or_running";
  processedMailBatchCount: number;
  contextPressureScore: number;
  thresholds: {
    processedMailBatchThreshold: number;
    contextPressureThreshold: number;
  };
  evidenceRefs: string[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
