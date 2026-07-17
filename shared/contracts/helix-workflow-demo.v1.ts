export const HELIX_WORKFLOW_DEMO_SCHEMA = "helix.workflow_demo.v1" as const;
export const HELIX_WORKFLOW_DEMO_SESSION_SCHEMA = "helix.workflow_demo_session.v1" as const;
export const HELIX_WORKFLOW_QTE_SCHEMA = "helix.workflow_qte.v1" as const;
export const HELIX_WORKFLOW_QTE_DISPATCH_SCHEMA = "helix.workflow_qte_dispatch.v1" as const;
export const HELIX_WORKFLOW_DEMO_CONTEXT_SCHEMA = "helix.workflow_demo_context.v1" as const;
export const HELIX_WORKFLOW_DEMO_DEBUG_SCHEMA = "helix.workflow_demo_debug.v1" as const;
export const HELIX_WORKFLOW_DEMO_DEBUG_EVENT_SCHEMA = "helix.workflow_demo_debug_event.v1" as const;

export const RESEARCH_PAPER_TO_PROPOSAL_DEMO_ID = "research-paper-to-proposal" as const;

export type HelixWorkflowDemoId = typeof RESEARCH_PAPER_TO_PROPOSAL_DEMO_ID;

export type ResearchPaperToProposalStepId =
  | "paper_lookup"
  | "pdf_page_render"
  | "ocr_math_candidate"
  | "exact_row_promotion"
  | "graph_reflection"
  | "provenance_audit"
  | "proposal_handoff";

export type HelixWorkflowDemoStepState = "completed" | "current" | "locked";

export type HelixWorkflowDemoContextSourceKind = "current_chat" | "custom";
export type HelixWorkflowDemoContextConfidence = "high" | "medium" | "operator";

export type HelixWorkflowDemoContextBindingV1 = {
  schema: typeof HELIX_WORKFLOW_DEMO_CONTEXT_SCHEMA;
  bindingId: string;
  sourceKind: HelixWorkflowDemoContextSourceKind;
  objective: string;
  objectiveHash: string;
  sourceSessionId: string | null;
  sourceMessageId: string | null;
  sourceTraceId: string | null;
  sourceMessageAt: string | null;
  confidence: HelixWorkflowDemoContextConfidence;
  confirmedByOperator: true;
  boundAt: string;
};

export type HelixWorkflowDemoEvidenceV1 = {
  schema: "helix.workflow_demo_evidence.v1";
  paperRefs: string[];
  renderedPageRefs: string[];
  ocrMathCandidateRefs: string[];
  promotedEquationRefs: string[];
  graphReflectionRefs: string[];
  provenanceAuditRefs: string[];
  proposalReceiptRefs: string[];
};

export type HelixWorkflowDemoStepV1 = {
  id: ResearchPaperToProposalStepId;
  title: string;
  shortLabel: string;
  description: string;
  prompt: string;
};

export type HelixWorkflowDemoDefinitionV1 = {
  schema: typeof HELIX_WORKFLOW_DEMO_SCHEMA;
  id: HelixWorkflowDemoId;
  title: string;
  description: string;
  steps: readonly HelixWorkflowDemoStepV1[];
};

export type HelixWorkflowQteDispatchV1 = {
  schema: typeof HELIX_WORKFLOW_QTE_DISPATCH_SCHEMA;
  runId: string;
  stepId: ResearchPaperToProposalStepId;
  sourceSessionId: string;
  insertedPromptHash: string;
  submittedPromptHash: string | null;
  submittedTurnId: string | null;
  insertedAt: string;
  submittedAt: string | null;
};

export type HelixWorkflowDemoStepRetryV1 = {
  schema: "helix.workflow_demo_step_retry.v1";
  stepId: "ocr_math_candidate";
  reason: "no_ocr_or_latex_candidate";
  attemptCount: number;
  triedPageNumbers: number[];
  latestPageNumber: number | null;
  pageCount: number | null;
  sourceId: string | null;
  artifactRefs: string[];
  sourceTurnId: string | null;
  observedAt: string;
};

export type HelixWorkflowDemoSessionV1 = {
  schema: typeof HELIX_WORKFLOW_DEMO_SESSION_SCHEMA;
  runId: string;
  demoId: HelixWorkflowDemoId;
  status: "active" | "paused" | "completed";
  startedAt: string;
  updatedAt: string;
  evidence: HelixWorkflowDemoEvidenceV1;
  dismissedStepId: ResearchPaperToProposalStepId | null;
  /** Optional for persisted v1 sessions created before context binding existed. */
  contextBinding?: HelixWorkflowDemoContextBindingV1 | null;
  /** Chat that owns evidence admission for this run. Optional for legacy persisted sessions. */
  originSessionId?: string | null;
  /** The editable QTE prompt currently awaiting a causally linked Ask turn. */
  pendingQteDispatch?: HelixWorkflowQteDispatchV1 | null;
  /** Retryable typed observations are not completion evidence and stay isolated here. */
  stepRetry?: HelixWorkflowDemoStepRetryV1 | null;
};

export type HelixWorkflowQteV1 = {
  schema: typeof HELIX_WORKFLOW_QTE_SCHEMA;
  demoId: HelixWorkflowDemoId;
  runId: string;
  stepId: ResearchPaperToProposalStepId;
  title: string;
  reason: string;
  prompt: string;
  contextBindingId: string;
  contextSourceKind: HelixWorkflowDemoContextSourceKind;
  autoSubmit: false;
  assistantAnswer: false;
  terminalEligible: false;
};

export type HelixWorkflowDemoDebugEventKind =
  | "session_started"
  | "session_paused"
  | "session_resumed"
  | "session_reset"
  | "workflow_context_bound"
  | "workflow_chat_pinned"
  | "workflow_evidence_observed"
  | "workflow_evidence_rejected"
  | "workflow_step_advanced"
  | "workflow_completed"
  | "qte_suggested"
  | "qte_dismissed"
  | "qte_restored"
  | "qte_prompt_inserted"
  | "qte_prompt_submitted";

export type HelixWorkflowDemoDebugEventV1 = {
  schema: typeof HELIX_WORKFLOW_DEMO_DEBUG_EVENT_SCHEMA;
  event_id: string;
  event_kind: HelixWorkflowDemoDebugEventKind;
  at: string;
  demo_id: HelixWorkflowDemoId;
  run_id: string;
  source_observation_key: string | null;
  source_payload_schema: string | null;
  source_client_reply_id: string | null;
  source_turn_id: string | null;
  source_trace_id: string | null;
  source_reply_created_at_ms: number | null;
  amends_debug_for_turn_id: string | null;
  before_step_id: ResearchPaperToProposalStepId | null;
  after_step_id: ResearchPaperToProposalStepId | null;
  completed_step_count_before: number | null;
  completed_step_count_after: number | null;
  observed_artifact_refs: string[];
  new_artifact_refs: string[];
  qte_step_id: ResearchPaperToProposalStepId | null;
  prompt_hash: string | null;
  prompt_length: number | null;
  prompt_edited: boolean | null;
  reason: string | null;
  context_binding_id: string | null;
  context_source_kind: HelixWorkflowDemoContextSourceKind | null;
  context_source_session_id: string | null;
  context_source_message_id: string | null;
  context_source_trace_id: string | null;
  context_objective_hash: string | null;
  context_confidence: HelixWorkflowDemoContextConfidence | null;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixWorkflowDemoDebugTargetV1 = {
  client_reply_id: string | null;
  turn_id: string | null;
  trace_id: string | null;
  reply_created_at_ms: number | null;
};

export type HelixWorkflowDemoDebugContextBindingV1 = Omit<
  HelixWorkflowDemoContextBindingV1,
  "objective"
> & {
  objective_included: false;
};

export type HelixWorkflowDemoDebugSessionV1 = Omit<
  HelixWorkflowDemoSessionV1,
  "contextBinding"
> & {
  contextBinding?: HelixWorkflowDemoDebugContextBindingV1 | null;
};

export type HelixWorkflowDemoDebugExportV1 = {
  schema: typeof HELIX_WORKFLOW_DEMO_DEBUG_SCHEMA;
  exported_at: string;
  target_reply: HelixWorkflowDemoDebugTargetV1;
  session: HelixWorkflowDemoDebugSessionV1 | null;
  current_turn_events: HelixWorkflowDemoDebugEventV1[];
  post_final_amendments: HelixWorkflowDemoDebugEventV1[];
  run_event_tail: HelixWorkflowDemoDebugEventV1[];
  observed_artifact_refs: string[];
  current_turn_event_count: number;
  run_event_count: number;
  runtime_goal_lane_attached: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const createEmptyHelixWorkflowDemoEvidence = (): HelixWorkflowDemoEvidenceV1 => ({
  schema: "helix.workflow_demo_evidence.v1",
  paperRefs: [],
  renderedPageRefs: [],
  ocrMathCandidateRefs: [],
  promotedEquationRefs: [],
  graphReflectionRefs: [],
  provenanceAuditRefs: [],
  proposalReceiptRefs: [],
});
