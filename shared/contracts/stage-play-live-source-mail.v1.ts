export const STAGE_PLAY_LIVE_SOURCE_MAIL_ITEM_SCHEMA = "stage_play_live_source_mail_item/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA = "stage_play_live_source_mail_read_result/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_DECISION_SCHEMA = "stage_play_live_source_mail_decision/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_JOB_STATE_SCHEMA = "stage_play_live_source_job_state/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_SCHEMA = "stage_play_live_source_watch_job_policy/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_TRANSCRIPT_ENTRY_SCHEMA = "stage_play_live_source_mail_transcript_entry/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_CONTEXT_PACK_SCHEMA = "stage_play_live_source_mail_context_pack/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_VOICE_DELIVERY_RECEIPT_SCHEMA = "stage_play_live_source_voice_delivery_receipt/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_NARRATIVE_STATE_SCHEMA = "stage_play_live_source_narrative_state/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_IMMERSION_STATE_SCHEMA = "stage_play_live_source_immersion_state/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_PREDICTION_VALIDATION_SCHEMA =
  "stage_play_live_source_prediction_validation/v1" as const;
export const STAGE_PLAY_MICRO_REASONER_PROMPT_SCHEMA = "stage_play_micro_reasoner_prompt/v1" as const;
export const STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_SCHEMA = "stage_play_micro_reasoner_prompt_preset/v1" as const;
export const STAGE_PLAY_MICRO_REASONER_RUN_SCHEMA = "stage_play_micro_reasoner_run/v1" as const;
export const STAGE_PLAY_MICRO_REASONER_PROMPT_DELEGATION_RESULT_SCHEMA =
  "stage_play_micro_reasoner_prompt_delegation_result/v1" as const;
export const STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_DRAFT_SCHEMA =
  "stage_play_micro_reasoner_prompt_preset_draft/v1" as const;
export const STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA = "stage_play_processed_mail_packet/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_LOOP_REFLECTION_SCHEMA =
  "stage_play_live_source_mail_loop_reflection/v1" as const;
export const LIVE_SOURCE_CAUSAL_TRACE_SCHEMA = "live_source_causal_trace/v1" as const;
export const LIVE_SOURCE_TURN_PHASE_RESOLUTION_SCHEMA = "live_source_turn_phase_resolution/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA =
  "stage_play_live_source_watch_job_policy_config_result/v1" as const;

export type StagePlayLiveSourceMailSourceKindV1 =
  | "visual_frame"
  | "audio_transcript"
  | "minecraft_world_event"
  | "screen_summary"
  | "manual_feed"
  | "custom";

export type StagePlayLiveSourceMailStatusV1 =
  | "unread"
  | "delivered_to_ask"
  | "read"
  | "decision_recorded"
  | "superseded"
  | "failed";

export type StagePlayMailDecisionV1 =
  | "wait_for_next_summary"
  | "record_interpretation"
  | "draft_text_answer"
  | "request_voice_callout"
  | "request_more_evidence"
  | "request_stage_play_checkpoint"
  | "fail_closed";

export type StagePlayLiveSourceInterpretationModeV1 =
  | "latest_scene_answer"
  | "batch_interpretation"
  | "salience_watch"
  | "prediction_watch"
  | "voice_commentary_watch"
  | "voice_callout_watch";

export type StagePlayLiveSourceMailProcessingModeV1 =
  | "latest_only"
  | "chronological_batch"
  | "micro_batch"
  | "per_mail"
  | "salience_window";

export type StagePlayLiveSourceOutputCadenceV1 =
  | "every_batch"
  | "only_salient"
  | "voice_only_salient"
  | "manual_only";

export type StagePlayNextLoopStateV1 =
  | "armed_for_next_summary"
  | "continue_with_unread_mail"
  | "paused_by_user"
  | "blocked_missing_source"
  | "blocked_voice_policy"
  | "blocked_tool_error"
  | "ended";

export type LiveSourceTurnPhaseV1 =
  | "configure_interpreter_profile"
  | "configure_watch_job"
  | "apply_visual_observer_profile"
  | "query_micro_reasoner_deck"
  | "reflect_mail_loop"
  | "read_processed_mail"
  | "process_mail_fallback"
  | "record_decision"
  | "request_voice_after_decision"
  | "terminal_checkpoint"
  | "queue_continuation"
  | "blocked_or_missing_args";

export type LiveSourceTurnCanonicalGoalV1 =
  | "configure_interpreter_profile"
  | "configure_watch_job"
  | "apply_visual_observer_profile"
  | "processed_mail_interpretation"
  | "processed_mail_voice_decision"
  | "processed_mail_checkpoint"
  | "live_source_status";

export type LiveSourceWakeRouteMetadataV1 = {
  invocationKind: "stage_play_mail_wake";
  wakeRequestId: string;
  mailboxThreadId: string;
  sourceTarget: "live_source_mailbox";
  requiredCanonicalGoal:
    | "processed_mail_interpretation"
    | "processed_mail_voice_decision"
    | "processed_mail_checkpoint";
  requiredPhase?: LiveSourceTurnPhaseV1 | "read_mailbox" | string;
  allowedCapabilities?: string[];
  forbiddenCapabilities?: string[];
  evidenceRefs?: string[];
};

export type LiveSourceTurnPhaseResolutionV1 = {
  artifactId: "live_source_turn_phase_resolution";
  schemaVersion: typeof LIVE_SOURCE_TURN_PHASE_RESOLUTION_SCHEMA;
  phase: LiveSourceTurnPhaseV1;
  reason: string;
  canonicalGoal: LiveSourceTurnCanonicalGoalV1;
  allowedTools: string[];
  fallbackTools: string[];
  forbiddenTools: string[];
  requiredEvidence: string[];
  completionEvidence: string[];
  nextPhase: LiveSourceTurnPhaseV1 | null;
  phaseLock: {
    locked: boolean;
    reason?: string | null;
  };
  evidenceRefs: string[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_policy";
};

export type LiveSourceCausalTraceV1 = {
  schemaVersion: typeof LIVE_SOURCE_CAUSAL_TRACE_SCHEMA;
  traceId: string;
  cycleId: string;
  parentRefs: string[];
  causedBy: string[];
  producedRefs: string[];
  sourceIds: string[];
  jobId?: string | null;
  policyId?: string | null;
  profileId?: string | null;
  askTurnId?: string | null;
  evidenceRefs: string[];
};

export type StagePlayLiveSourceMailLoopReflectionRelationV1 =
  | "captured_as_mail"
  | "processed_into_packet"
  | "reasoned_by_microdeck"
  | "validated_prediction"
  | "updated_current_state"
  | "projected_to_live_answer"
  | "recorded_decision"
  | "eligible_for_terminal_context"
  | "excluded_from_answer_context";

export type StagePlayLiveSourceMailLoopReflectionV1 = {
  artifactId: "stage_play_live_source_mail_loop_reflection";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_LOOP_REFLECTION_SCHEMA;
  reflectionId: string;
  threadId: string;
  askThreadId?: string | null;
  mailboxThreadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  jobRefs: string[];
  policyRefs: string[];
  profileRefs: string[];
  inspectionWindow: {
    mailIds: string[];
    processedPacketRefs: string[];
    microReasonerRunRefs: string[];
    currentStateRef?: string | null;
    loopHealthRef?: string | null;
    stagePlayGraphRef?: string | null;
    liveAnswerProjectionRefs: string[];
    decisionRefs: string[];
    voiceReceiptRefs: string[];
  };
  causalGraph: Array<{
    fromRef: string;
    toRef: string;
    relation: StagePlayLiveSourceMailLoopReflectionRelationV1;
    note: string;
  }>;
  stageSummaries: {
    sourceCapture: string[];
    processedMail: string[];
    microDeck: string[];
    stagePlayProjection: string[];
    liveAnswerReadiness: string[];
    terminalReadiness: string[];
  };
  whatEnteredAnswerContext: string[];
  whatDidNotEnterAnswerContext: string[];
  missingEvidence: string[];
  limitations: string[];
  whatAskCanSafelySay: string[];
  nextUsefulTool?: string | null;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};

export type StagePlayLiveSourceMailItemV1 = {
  artifactId: "stage_play_live_source_mail_item";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_ITEM_SCHEMA;
  mailId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId: string;
  sourceKind: StagePlayLiveSourceMailSourceKindV1;
  sourceRefs: {
    sourceId: string;
    frameRef?: string | null;
    evidenceRef?: string | null;
    observationRef?: string | null;
  };
  summary: {
    text: string;
    preview: string;
    confidence?: number | null;
    analysisState?: "analysis_ready" | "pending" | "failed" | "unknown";
  };
  priorContext: {
    previousMailId?: string | null;
    previousEvidenceRef?: string | null;
    previousSummaryPreview?: string | null;
  };
  objective?: {
    objectiveId?: string | null;
    text?: string | null;
  };
  hints: {
    deterministicChangeHint?:
      | "first_summary"
      | "summary_changed"
      | "summary_similar"
      | "source_stale"
      | "source_recovered"
      | "unknown";
    elapsedMsSincePrevious?: number | null;
    sourceFreshness?: "fresh" | "stale" | "missing" | "unknown";
  };
  status: StagePlayLiveSourceMailStatusV1;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceVoicePolicyV1 = {
  voiceEnabled: boolean;
  requiresConfirmation: boolean;
  allowedNow: boolean;
  reason?: string | null;
};

export type StagePlayLiveSourceMailReadResultV1 = {
  artifactId: "stage_play_live_source_mail_read_result";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA;
  readId: string;
  threadId: string;
  askThreadId?: string | null;
  mailboxThreadId?: string | null;
  mailboxThreadResolution?: Record<string, unknown> | null;
  roomId?: string | null;
  environmentId?: string | null;
  items: StagePlayLiveSourceMailItemV1[];
  activeObjective?: string | null;
  priorDecisionRefs: string[];
  priorAnswerObservationRefs: string[];
  voicePolicy: StagePlayLiveSourceVoicePolicyV1;
  suggestedDecisionOptions: StagePlayMailDecisionV1[];
  readWindow?: {
    sourceId?: string | null;
    sourceKind?: StagePlayLiveSourceMailSourceKindV1 | string | null;
    requestedLimit: number;
    effectiveLimit: number;
    sameSourceBatch: boolean;
    unreadBeforeRead: number;
    remainingUnreadCount: number;
    retainedUnreadMailIds: string[];
  };
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailDecisionV1 = {
  artifactId: "stage_play_live_source_mail_decision";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_DECISION_SCHEMA;
  decisionId: string;
  mailIds: string[];
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  decision: StagePlayMailDecisionV1;
  rationalePreview: string;
  textAnswerDraft?: {
    text: string;
    terminalEligible: boolean;
  } | null;
  voiceCalloutDraft?: {
    text: string;
    voiceEligible: boolean;
    requiresConfirmation: boolean;
  } | null;
  voicePolicy?: StagePlayLiveSourceVoicePolicyV1 | null;
  requestedTool?: {
    toolName: string;
    args: Record<string, unknown>;
  } | null;
  nextLoopState: StagePlayNextLoopStateV1;
  nextExpectedSourceKind?: StagePlayLiveSourceMailSourceKindV1 | string | null;
  nextExpectedAfterMs?: number | null;
  mailboxCursor?: string | null;
  activeJobId?: string | null;
  narrativeStateRef?: string | null;
  narrativeStateId?: string | null;
  interpreterProfileRef?: string | null;
  profileComparisonRefs?: string[];
  matchedCriteria?: string[];
  suppressedCriteria?: string[];
  observedFacts?: string[];
  inferredMeaning?: string[];
  mailCoverage: StagePlayLiveSourceMailCoverageV1;
  rearmReason?: string | null;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  modelReviewed: boolean;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailCoverageV1 = {
  readMailIds: string[];
  interpretedMailIds: string[];
  compressedMailIds: string[];
  skippedMailIds: string[];
  mode: StagePlayLiveSourceMailProcessingModeV1;
  reason: string;
};

export type StagePlayLiveSourceImmersionActivityV1 =
  | "unknown"
  | "interior_base"
  | "inventory_management"
  | "outdoor_exploration"
  | "combat_or_damage"
  | "mining_or_cave"
  | "building_or_crafting"
  | "scene_transition";

export type StagePlayLiveSourceImmersionSalienceLevelV1 =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export type StagePlayLiveSourceImmersionPredictionValidationResultV1 =
  | "supported"
  | "partially_supported"
  | "contradicted"
  | "unresolved"
  | "no_prior_prediction";

export type StagePlayLiveSourcePredictionValidationRecommendedNextV1 =
  | "wait_for_next_summary"
  | "record_interpretation"
  | "draft_text_answer"
  | "request_voice_callout"
  | "request_more_evidence"
  | "request_stage_play_checkpoint";

export type StagePlayLiveSourcePredictionValidationV1 = {
  artifactId: "stage_play_live_source_prediction_validation";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_PREDICTION_VALIDATION_SCHEMA;
  validationId: string;
  jobId: string;
  priorPredictionId?: string | null;
  newMailIds: string[];
  result: StagePlayLiveSourceImmersionPredictionValidationResultV1;
  supportedSignals: string[];
  contradictedSignals: string[];
  newSignals: string[];
  salienceHint: StagePlayLiveSourceImmersionSalienceLevelV1;
  recommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
};

export type StagePlayMicroReasonerRoleV1 =
  | "claim_extractor"
  | "observation_classifier"
  | "effort_estimator"
  | "axiom_extractor"
  | "hypothesis_generator"
  | "profile_comparator"
  | "delta_extractor"
  | "prediction_validator"
  | "salience_scorer"
  | "hypothesis_arbiter"
  | "prompt_router"
  | "packet_composer"
  | "decision_selector"
  | "voice_callout_drafter";

export type StagePlayMicroReasonerPromptV1 = {
  artifactId: "stage_play_micro_reasoner_prompt";
  schemaVersion: typeof STAGE_PLAY_MICRO_REASONER_PROMPT_SCHEMA;
  promptId: string;
  title: string;
  role: StagePlayMicroReasonerRoleV1;
  version: number;
  active: boolean;
  template: string;
  inputSchemaName: string;
  outputSchemaName: string;
  modelPreference: "deterministic" | "small_fast_llm" | "main_llm" | "auto";
  maxInputItems: number;
  maxOutputTokens?: number | null;
  linkedNoteId?: string | null;
  presetIds?: string[];
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_policy";
};

export type StagePlayMicroReasonerDeckRunPlanV1 =
  | "full_baseline"
  | "baseline_plus_prompted"
  | "minimal_prompted_arbiter"
  | "prompt_delegation_router"
  | "custom";

export type StagePlayMicroReasonerWakeCoalescingPolicyV1 = {
  coalescePendingSameSource: boolean;
  supersedeOnlyBeforeAskTurn: true;
  preserveSupersededRefs: true;
};

export type StagePlayMicroReasonerPromptDelegationCandidateV1 = {
  candidateId: "candidate_a" | "candidate_b" | "candidate_c" | string;
  title: string;
  promptText: string;
};

export type StagePlayMicroReasonerPromptDelegationRouterV1 = {
  candidates: StagePlayMicroReasonerPromptDelegationCandidateV1[];
  confidenceThreshold: number;
  escalationMode: "suggest_only" | "handoff_to_helix_ask" | "handoff_only_if_confident";
  allowNone: boolean;
};

export type StagePlayMicroReasonerWakePromptContractV1 = {
  contractId: string;
  title: string;
  promptText: string;
  attachOnlyWhenWakeBound: true;
  includeSourceSummary: boolean;
  includeEvidenceRefs: boolean;
};

export type StagePlayMicroReasonerPromptPresetV1 = {
  artifactId: "stage_play_micro_reasoner_prompt_preset";
  schemaVersion: typeof STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_SCHEMA;
  presetId: string;
  title: string;
  description: string;
  domain:
    | "generic"
    | "minecraft_gameplay"
    | "calculator_stream"
    | "science_visual"
    | "browser_workflow"
    | "custom";
  sourceKinds: StagePlayLiveSourceMailItemV1["sourceKind"][];
  sourceIds: string[];
  rolePromptIds: Partial<Record<StagePlayMicroReasonerRoleV1, string>>;
  promptedRoles: StagePlayMicroReasonerRoleV1[];
  deckRunPlan: StagePlayMicroReasonerDeckRunPlanV1;
  baselineRoles?: StagePlayMicroReasonerRoleV1[];
  delegationRouter?: StagePlayMicroReasonerPromptDelegationRouterV1 | null;
  wakePromptContract?: StagePlayMicroReasonerWakePromptContractV1 | null;
  wakeCoalescingPolicy?: StagePlayMicroReasonerWakeCoalescingPolicyV1;
  outputPolicy: "watch_officer" | "tool_call_candidate" | "voice_candidate" | "ask_prompt_delegation" | "record_only";
  active: boolean;
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_policy";
};

export type StagePlayMicroReasonerDeckTraceV1 = {
  presetId: string;
  presetTitle: string;
  domain: StagePlayMicroReasonerPromptPresetV1["domain"];
  outputPolicy: StagePlayMicroReasonerPromptPresetV1["outputPolicy"];
  promptedRoles: StagePlayMicroReasonerRoleV1[];
  baselineRoles?: StagePlayMicroReasonerRoleV1[];
  rolePromptIds: Partial<Record<StagePlayMicroReasonerRoleV1, string>>;
  sourceId: string;
  appliedAt: string;
  deckRunPlan: StagePlayMicroReasonerDeckRunPlanV1;
  wakeCoalescingPolicy?: StagePlayMicroReasonerWakeCoalescingPolicyV1;
  presetUpdatedAt?: string | null;
};

export type StagePlayMicroReasonerPromptDelegationResultV1 = {
  artifactId: "stage_play_micro_reasoner_prompt_delegation_result";
  schema: typeof STAGE_PLAY_MICRO_REASONER_PROMPT_DELEGATION_RESULT_SCHEMA;
  schemaVersion: typeof STAGE_PLAY_MICRO_REASONER_PROMPT_DELEGATION_RESULT_SCHEMA;
  delegationId: string;
  sourceId?: string | null;
  presetId?: string | null;
  presetTitle?: string | null;
  sourceSummary: string;
  candidates: StagePlayMicroReasonerPromptDelegationCandidateV1[];
  selectedCandidateId: string | null;
  selectedPromptText: string | null;
  confidence: number;
  confidenceLabel: "low" | "medium" | "high";
  threshold: number;
  shouldHandoffToHelixAsk: boolean;
  reason: string;
  rejectedCandidates: Array<{
    candidateId: string;
    reason: string;
    score: number;
  }>;
  helixAskHandoff: {
    prompt: string;
    sourceSummary: string;
    evidenceRefs: string[];
    selectedCandidateId: string;
    wakePromptContract?: StagePlayMicroReasonerWakePromptContractV1 | null;
    appendedPrompt?: string | null;
  } | null;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "micro_reasoner_evidence";
  ask_context_policy: "evidence_only";
};

export type StagePlayMicroReasonerPromptPresetDraftV1 = {
  artifactId: "stage_play_micro_reasoner_prompt_preset_draft";
  schema: typeof STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_DRAFT_SCHEMA;
  schemaVersion: typeof STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_DRAFT_SCHEMA;
  draftId: string;
  scenarioText: string;
  recommendedBasePresetId: string;
  recommendedBasePresetTitle: string;
  confidence: number;
  confidenceLabel: "low" | "medium" | "high";
  reason: string;
  alternatives: Array<{
    presetId: string;
    title: string;
    score: number;
    reason: string;
  }>;
  draft: {
    title: string;
    description: string;
    basePresetId: string;
    sourceKinds: StagePlayLiveSourceMailItemV1["sourceKind"][];
    candidatePrompts: StagePlayMicroReasonerPromptDelegationCandidateV1[];
    confidenceThreshold: number;
    escalationMode: StagePlayMicroReasonerPromptDelegationRouterV1["escalationMode"];
    allowNone: boolean;
    wakePromptContract?: StagePlayMicroReasonerWakePromptContractV1 | null;
  };
  missingInformation: string[];
  confirmationRequired: true;
  createToolCall: {
    toolName: "live_env.create_micro_reasoner_preset";
    args: {
      base_preset_id: string;
      title: string;
      description: string;
      source_ids: string[];
      candidate_prompts: StagePlayMicroReasonerPromptDelegationCandidateV1[];
      confidence_threshold: number;
      escalation_mode: StagePlayMicroReasonerPromptDelegationRouterV1["escalationMode"];
      allow_none: boolean;
      wake_prompt_contract?: StagePlayMicroReasonerWakePromptContractV1 | null;
    };
  };
  applyAfterCreateSuggested: boolean;
  sourceIds: string[];
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "micro_reasoner_evidence";
  ask_context_policy: "evidence_only";
};

export type StagePlayMicroReasonerRunV1 = {
  artifactId: "stage_play_micro_reasoner_run";
  schemaVersion: typeof STAGE_PLAY_MICRO_REASONER_RUN_SCHEMA;
  runId: string;
  promptId?: string | null;
  deckPresetId?: string | null;
  deckPresetTitle?: string | null;
  deckRunPlan?: StagePlayMicroReasonerDeckRunPlanV1 | null;
  role: StagePlayMicroReasonerRoleV1;
  jobId: string;
  sourceId: string;
  mailIds: string[];
  inputRefs: string[];
  outputRefs: string[];
  inputPreview: string;
  outputPreview: string;
  status: "queued" | "running" | "completed" | "failed" | "skipped";
  reasoningMode?: "micro_live_interval" | "deterministic_batch" | "ask_review";
  selectedDecision?: StagePlayLiveSourcePredictionValidationRecommendedNextV1 | null;
  salienceLevel?: StagePlayLiveSourceImmersionSalienceLevelV1 | null;
  voiceCandidate?: boolean | null;
  recommendedNextTool?: string | null;
  confidence?: "low" | "medium" | "high" | null;
  latencyBudgetMs?: number | null;
  tokenBudget?: number | null;
  missingEvidence?: string[];
  modelUsed?: string | null;
  latencyMs?: number | null;
  tokenEstimateIn?: number | null;
  tokenEstimateOut?: number | null;
  error?: string | null;
  startedAt: string;
  completedAt?: string | null;
  causalTrace?: LiveSourceCausalTraceV1;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence" | "micro_reasoner_evidence";
};

export type StagePlayProcessedMailPacketResolutionStateV1 =
  | "mail_received"
  | "summary_split"
  | "claims_extracted"
  | "profile_compared"
  | "immersion_state_updated"
  | "prediction_validated"
  | "processed_packet_ready"
  | "ask_decision_needed"
  | "ask_decision_recorded"
  | "voice_candidate_prepared"
  | "waiting_for_next_mail"
  | "deferred_for_pressure"
  | "compacted";

export type StagePlayEffortEstimateV1 = {
  currentEffort: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
  confidence: number;
  nextLikelyEfforts: string[];
};

export type StagePlayAxiomFrameV1 = {
  axioms: string[];
  missingAxioms: string[];
  predictionRelevantVariables: string[];
};

export type StagePlaySceneBeatHypothesisV1 = {
  label: string;
  prediction: string;
  confidence: number;
  validationSignals: string[];
  whatWouldContradictIt: string[];
};

export type StagePlayHypothesisArbiterV1 = {
  recommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
  wakeAsk: boolean;
  reason: string;
  confidence: "low" | "medium" | "high";
  selectedHypothesis?: string | null;
  voiceCandidate: boolean;
  calloutDraft?: string | null;
  missingEvidence: string[];
};

export type StagePlaySourceReceiptHandleV1 = {
  receiptId: string;
  sourceId: string;
  sourceKind: StagePlayLiveSourceMailSourceKindV1 | string;
  mailId: string;
  capturedAt: string;
  monotonicTimeMs?: number | null;
  evidenceRefs: string[];
  frameRef?: string | null;
  observationRef?: string | null;
};

export type StagePlayFrameReceiptHandleV1 = {
  receiptId: string;
  sourceId: string;
  sourceKind: StagePlayLiveSourceMailSourceKindV1 | string;
  capturedAt: string;
  monotonicTimeMs: number;
  frameIndex: number;
  hash: string;
  width?: number | null;
  height?: number | null;
  panelSessionId?: string | null;
  liveAnswerSessionId?: string | null;
  previousFrameId?: string | null;
  nextFrameId?: string | null;
  parentMailId: string;
  evidenceRefs: string[];
};

export type StagePlayFrameIntervalReceiptV1 = {
  intervalId: string;
  sourceId: string;
  sourceKind: StagePlayLiveSourceMailSourceKindV1 | string;
  startFrameId: string;
  endFrameId: string;
  startTimeMs: number;
  endTimeMs: number;
  strideMs?: number | null;
  keyFrameIds: string[];
  reasonCaptured: string;
  evidenceRefs: string[];
};

export type StagePlayImageLensProductV1 = {
  lensReceiptId: string;
  sourceFrameIds: string[];
  lensPreset:
    | "raw_thumbnail"
    | "contrast_sweep"
    | "motion_delta"
    | "object_track"
    | "semantic_mask"
    | "ocr_pass"
    | "affordance_map"
    | "occlusion_map"
    | "salience_heatmap"
    | "crop_zoom"
    | "belief_access_overlay"
    | string;
  parameters: Record<string, unknown>;
  modelId?: string | null;
  deterministic: boolean;
  outputArtifactIds: string[];
  derivedClaims: string[];
  uncertainty: number;
  rawFrameParentRefs: string[];
};

export type StagePlaySituationSliceV1 = {
  sliceId: string;
  timeMs: number;
  sources: {
    screen?: string | null;
    browser?: string | null;
    terminal?: string | null;
    audio?: string | null;
    game?: string | null;
    tool?: string | null;
    source?: string | null;
  };
  knownDeltas: string[];
  evidenceRefs: string[];
};

export type StagePlayFrameIntervalRequestV1 = {
  sourceId: string;
  around: string;
  beforeMs: number;
  afterMs: number;
  strideMs?: number | null;
  lensPresets: StagePlayImageLensProductV1["lensPreset"][];
};

export type StagePlayEvidenceLeadV1 = {
  leadId: string;
  question: string;
  whyItMatters: string;
  affectedPredictionIds: string[];
  neededSources: string[];
  suggestedFrameIntervals: StagePlayFrameIntervalRequestV1[];
  urgency: "low" | "medium" | "high";
  evidenceRefs: string[];
};

export type StagePlayPursuedLeadResultV1 = {
  leadId: string;
  verdict: "supported" | "contradicted" | "underdetermined" | "not_pursued";
  confidence: number;
  correctedClaim?: string | null;
  evidenceRefs: string[];
  frameIntervalRefs: string[];
  lensRefs: string[];
};

export type StagePlayActionPredictionBasisV1 =
  | "surface_cue"
  | "goal_object"
  | "belief_state"
  | "perceptual_access"
  | "tool_affordance"
  | "recovery_pattern"
  | "prediction_validation"
  | "salience";

export type StagePlayGoalBasedActionPredictionV1 = {
  predictionId: string;
  actorId: string;
  predictedAction: string;
  basis: StagePlayActionPredictionBasisV1[];
  worldStateClaims: string[];
  actorBeliefClaims: string[];
  decisiveUncertainties: string[];
  frameIntervalRefs: string[];
  lensRefs: string[];
  sourceSliceRefs: string[];
  confidence: number;
  disconfirmers: string[];
  recommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
  evidenceRefs: string[];
};

export type StagePlayProcessedMailEvidenceHandlesV1 = {
  sourceReceipts: StagePlaySourceReceiptHandleV1[];
  frameReceipts: StagePlayFrameReceiptHandleV1[];
  frameIntervals: StagePlayFrameIntervalReceiptV1[];
  lensProducts: StagePlayImageLensProductV1[];
  situationSlices: StagePlaySituationSliceV1[];
};

export type StagePlayProcessedMailPacketV1 = {
  artifactId: "stage_play_processed_mail_packet";
  schemaVersion: typeof STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA;
  packetId: string;
  jobId: string;
  sourceId: string;
  mailIds: string[];
  visualEvidenceRefs: string[];
  observedFacts: string[];
  inferredFacts: string[];
  uncertainties: string[];
  stableFactsUsed: string[];
  changedFacts: string[];
  sceneTags: string[];
  activityTags: string[];
  objectTags: string[];
  profileRef?: string | null;
  microReasonerDeck?: StagePlayMicroReasonerDeckTraceV1;
  matchedCriteria: string[];
  suppressedCriteria: string[];
  riskMatches: string[];
  opportunityMatches: string[];
  voiceCalloutMatches: string[];
  priorPredictionRef?: string | null;
  predictionValidation?: {
    result: StagePlayLiveSourceImmersionPredictionValidationResultV1;
    supportedSignals: string[];
    contradictedSignals: string[];
    newSignals: string[];
  } | null;
  salience: {
    level: StagePlayLiveSourceImmersionSalienceLevelV1;
    reasons: string[];
    voiceCandidate: boolean;
    calloutDraft?: string | null;
  };
  evidenceHandles?: StagePlayProcessedMailEvidenceHandlesV1;
  actionPredictions?: StagePlayGoalBasedActionPredictionV1[];
  unresolvedLeads?: StagePlayEvidenceLeadV1[];
  pursuedLeads?: StagePlayPursuedLeadResultV1[];
  effortEstimate?: StagePlayEffortEstimateV1 | null;
  axioms?: StagePlayAxiomFrameV1 | null;
  hypotheses?: StagePlaySceneBeatHypothesisV1[];
  arbiter?: StagePlayHypothesisArbiterV1 | null;
  recommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
  watchNext: string[];
  resolutionState: StagePlayProcessedMailPacketResolutionStateV1;
  microReasonerRunRefs: string[];
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
};

export type StagePlayLiveSourceImmersionStateV1 = {
  artifactId: "stage_play_live_source_immersion_state";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_IMMERSION_STATE_SCHEMA;
  immersionStateId: string;
  jobId: string;
  policyId?: string | null;
  profileId?: string | null;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  latestMailIds: string[];
  latestEvidenceRefs: string[];
  sourceIdentity: {
    label: string;
    confidence: number;
    stable: boolean;
  };
  stableFacts: string[];
  currentSceneFacts: string[];
  changedFacts: string[];
  uncertainties: string[];
  currentActivity: StagePlayLiveSourceImmersionActivityV1;
  salience: {
    level: StagePlayLiveSourceImmersionSalienceLevelV1;
    reasons: string[];
    voiceCandidate: boolean;
  };
  prediction: {
    predictionId: string;
    text: string;
    horizonMs: number;
    watchTargets: string[];
    validationSignals: string[];
    confidence: number;
  } | null;
  lastValidation?: {
    validationId: string;
    priorPredictionId: string;
    result: StagePlayLiveSourceImmersionPredictionValidationResultV1;
    evidenceSummary: string;
  } | null;
  staleness: {
    state: "current" | "stale_after_new_mail" | "superseded";
    staleAfterMailId?: string | null;
    supersededByStateId?: string | null;
  };
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceNarrativeStateV1 = {
  artifactId: "stage_play_live_source_narrative_state";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_NARRATIVE_STATE_SCHEMA;
  narrativeStateId: string;
  jobId: string;
  policyId?: string | null;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  priorNarrativeStateRef?: string | null;
  mailBatchRefs: string[];
  mailCoverage: StagePlayLiveSourceMailCoverageV1;
  sourceEvidenceRefs: string[];
  currentSceneSummary: string;
  runningStorySummary: string;
  interpretedSituation: {
    setting?: string | null;
    activeWindowOrScene?: string | null;
    entities: string[];
    objects: string[];
    activities: string[];
    userRelevantMeaning: string;
  };
  meaningfulChanges: string[];
  uncertainties: string[];
  watchNext: {
    targets: string[];
    reason: string;
  };
  prediction?: {
    text: string;
    horizon:
      | "next_mail"
      | "next_2_to_5_mail_batches"
      | "until_source_changes"
      | "unknown";
    confidence: number;
    validationSignals: string[];
  } | null;
  staleness: {
    state: "current" | "stale_after_new_mail" | "superseded";
    staleAfterMailId?: string | null;
    supersededByStateId?: string | null;
  };
  lastDecisionRef?: string | null;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailInterpretationPayloadV1 = {
  currentSceneSummary?: string;
  runningStorySummary?: string;
  setting?: string | null;
  activeWindowOrScene?: string | null;
  entities?: string[];
  objects?: string[];
  activities?: string[];
  userRelevantMeaning?: string;
  meaningfulChanges?: string[];
  uncertainties?: string[];
  watchNextTargets?: string[];
  watchNextReason?: string;
  predictionText?: string | null;
  predictionHorizon?: "next_mail" | "next_2_to_5_mail_batches" | "until_source_changes" | "unknown" | string | null;
  predictionConfidence?: number | null;
  validationSignals?: string[];
  mailCoverage?: StagePlayLiveSourceMailCoverageV1;
};

export type StagePlayLiveSourceVoiceDeliveryReceiptV1 = {
  artifactId: "stage_play_live_source_voice_delivery_receipt";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_VOICE_DELIVERY_RECEIPT_SCHEMA;
  receiptId: string;
  decisionId: string;
  mailIds: string[];
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  status:
    | "delivered"
    | "queued"
    | "confirmation_required"
    | "blocked_voice_disabled"
    | "blocked_voice_not_allowed"
    | "blocked_missing_callout_draft"
    | "blocked_missing_voice_tool"
    | "held_user_speaking"
    | "held_manual_prompt_active"
    | "merged_into_answer"
    | "stale_after_new_mail"
    | "dropped"
    | "failed";
  voiceCalloutDraft?: {
    text: string;
    voiceEligible: boolean;
    requiresConfirmation: boolean;
  } | null;
  voicePolicy: StagePlayLiveSourceVoicePolicyV1;
  requestedTool?: {
    toolName: string;
    args: Record<string, unknown>;
  } | null;
  delivery?: {
    provider?: string | null;
    artifactRef?: string | null;
    message?: string | null;
  } | null;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceJobStateV1 = {
  artifactId: "stage_play_live_source_job_state";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_JOB_STATE_SCHEMA;
  jobId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  objective?: string | null;
  watchJobPolicyRef?: string | null;
  status: "armed" | "checking" | "paused" | "blocked" | "ended";
  mailboxCursor?: string | null;
  lastMailId?: string | null;
  lastDecisionId?: string | null;
  nextLoopState: StagePlayNextLoopStateV1;
  nextWakePolicy: {
    sourceKind?: StagePlayLiveSourceMailSourceKindV1 | string | null;
    afterMs?: number | null;
    maxConsecutiveReads?: number | null;
  };
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceWatchJobPolicyV1 = {
  artifactId: "stage_play_live_source_watch_job_policy";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_SCHEMA;
  policyId: string;
  jobId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  objectiveText: string;
  decisionPolicyPrompt: string;
  interpretationMode?: StagePlayLiveSourceInterpretationModeV1;
  mailProcessingMode?: StagePlayLiveSourceMailProcessingModeV1;
  outputCadence?: StagePlayLiveSourceOutputCadenceV1;
  outputPolicy: {
    allowTextAnswer: boolean;
    allowVoiceCallout: boolean;
    voiceRequiresUrgency: boolean;
    confirmationRequired: boolean;
  };
  importanceCriteria: string[];
  suppressCriteria: string[];
  status: "armed" | "paused" | "ended" | "blocked";
  priorDecisionRefs: string[];
  priorAnswerRefs: string[];
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceWatchJobPolicyConfigResultV1 = {
  artifactId: "stage_play_live_source_watch_job_policy_config_result";
  schema: typeof STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA;
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA;
  policy: StagePlayLiveSourceWatchJobPolicyV1;
  jobState: StagePlayLiveSourceJobStateV1;
  transcriptRows: AskTurnTranscriptRowDraftV1[];
  policyCount: number;
  watchJobPolicyRef: string;
  watch_job_policy_ref: string;
  askThreadId?: string | null;
  ask_thread_id?: string | null;
  mailboxThreadId?: string | null;
  mailbox_thread_id?: string | null;
  mailboxThreadResolution?: Record<string, unknown> | null;
  mailbox_thread_resolution?: Record<string, unknown> | null;
  post_tool_model_step_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
  ask_context_policy: "evidence_only";
};

export type AskTurnTranscriptRowDraftV1 = {
  rowId: string;
  rowKind:
    | "mail_received"
    | "mail_wake_requested"
    | "mail_wake_deferred"
    | "mail_read_tool_call"
    | "mail_read_receipt"
    | "task_queued"
    | "task_deferred"
    | "task_running"
    | "task_completed"
    | "budget_state"
    | "processed_mail_read"
    | "processed_mail_goal_satisfied"
    | "decision_recorded"
    | "voice_candidate"
    | "voice_requested"
    | "voice_blocked"
    | "checkpoint_summary"
    | "continuation_scheduled"
    | "continuation_deferred"
    | "tool_budget_no_progress"
    | "prediction_check"
    | "narrative_projection"
    | "micro_reasoner_run"
    | "processed_mail_packet"
    | "agent_decision"
    | "interpretation"
    | "prediction"
    | "watch_next"
    | "narrative_state"
    | "interpretation_state"
    | "interpreter_profile"
    | "profile_comparison"
    | "profile_note_link"
    | "profile_compiled"
    | "requested_tool"
    | "wait_for_next_summary"
    | "text_answer"
    | "voice_callout_request"
    | "voice_tool_call"
    | "voice_receipt"
    | "voice_steering_received"
    | "voice_steering_queued"
    | "voice_steering_applied"
    | "voice_steering_deferred"
    | "voice_steering_rejected"
    | "voice_steering_cancel_requested"
    | "steering_ack_receipt"
    | "loop_state"
    | "blocked";
  title: string;
  body: string;
  source: {
    toolName?: string | null;
    artifactId?: string | null;
    artifactKind?: string | null;
  };
  evidenceRefs: string[];
  deckPresetId?: string | null;
  deckPresetTitle?: string | null;
  deckRunPlan?: StagePlayMicroReasonerDeckRunPlanV1 | string | null;
  packetIds?: string[];
  deckVerdict?: {
    recommendedNext: string;
    wakeAsk: boolean;
    voiceCandidate: boolean;
    reason: string;
  } | null;
  causalTrace?: LiveSourceCausalTraceV1;
  authority: "tool_evidence" | "model_decision_receipt" | "generated_prompt" | "model_synthesized_answer" | "blocked";
  assistantAnswer: boolean;
  terminalEligible: boolean;
  createdAt: string;
};

export type StagePlayLiveSourceMailTranscriptEntryV1 = {
  artifactId: "stage_play_live_source_mail_transcript_entry";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_TRANSCRIPT_ENTRY_SCHEMA;
  entryId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  wakeRequestId?: string | null;
  wakeResultId?: string | null;
  askTurnId?: string | null;
  decisionIds: string[];
  mailIds: string[];
  sourceIds: string[];
  deckPresetId?: string | null;
  deckPresetTitle?: string | null;
  deckRunPlan?: StagePlayMicroReasonerDeckRunPlanV1 | string | null;
  packetIds?: string[];
  deckVerdict?: {
    recommendedNext: string;
    wakeAsk: boolean;
    voiceCandidate: boolean;
    reason: string;
  } | null;
  sequence: number;
  row: AskTurnTranscriptRowDraftV1;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailContextPackV1 = {
  artifactId: "stage_play_live_source_mail_context_pack";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_CONTEXT_PACK_SCHEMA;
  contextPackId: string;
  threadId: string;
  askThreadId?: string | null;
  mailboxThreadId?: string | null;
  mailboxThreadResolution?: Record<string, unknown> | null;
  roomId?: string | null;
  environmentId?: string | null;
  includedReason:
    | "armed_watch_job"
    | "active_stage_play_environment"
    | "none";
  activeWatchJobs: Array<{
    jobId: string;
    policyId: string;
    objectiveText: string;
    decisionPolicyPrompt: string;
    interpretationMode?: StagePlayLiveSourceWatchJobPolicyV1["interpretationMode"] | null;
    mailProcessingMode?: StagePlayLiveSourceWatchJobPolicyV1["mailProcessingMode"] | null;
    outputCadence?: StagePlayLiveSourceWatchJobPolicyV1["outputCadence"] | null;
    sourceIds: string[];
    outputPolicy: StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"];
    importanceCriteria: string[];
    suppressCriteria: string[];
    status: StagePlayLiveSourceWatchJobPolicyV1["status"];
    updatedAt: string;
  }>;
  jobStates: Array<{
    jobId: string;
    sourceIds: string[];
    status: StagePlayLiveSourceJobStateV1["status"];
    mailboxCursor?: string | null;
    lastMailId?: string | null;
    lastDecisionId?: string | null;
    nextLoopState: StagePlayNextLoopStateV1;
    updatedAt: string;
  }>;
  latestMailItems: Array<{
    mailId: string;
    sourceId: string;
    sourceKind: StagePlayLiveSourceMailSourceKindV1 | string;
    status: StagePlayLiveSourceMailStatusV1;
    summaryPreview: string;
    confidence?: number | null;
    analysisState?: StagePlayLiveSourceMailItemV1["summary"]["analysisState"];
    evidenceRefs: string[];
    createdAt: string;
  }>;
  latestDecisions: Array<{
    decisionId: string;
    mailIds: string[];
    decision: StagePlayMailDecisionV1;
    rationalePreview: string;
    textAnswerDraft?: string | null;
    voiceCalloutDraft?: string | null;
    activeJobId?: string | null;
    narrativeStateRef?: string | null;
    mailboxCursor?: string | null;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  latestNarrativeStates?: Array<{
    narrativeStateId: string;
    jobId: string;
    policyId?: string | null;
    mailBatchRefs: string[];
    currentSceneSummary: string;
    runningStorySummary: string;
    userRelevantMeaning: string;
    meaningfulChanges: string[];
    watchNext: {
      targets: string[];
      reason: string;
    };
    prediction?: string | null;
    lastDecisionRef?: string | null;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  latestTextAnswerDrafts: Array<{
    decisionId: string;
    text: string;
    terminalEligible: boolean;
    createdAt: string;
  }>;
  latestVoiceCalloutDrafts: Array<{
    decisionId: string;
    text: string;
    voiceEligible: boolean;
    requiresConfirmation: boolean;
    createdAt: string;
  }>;
  currentMailboxCursor?: string | null;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
