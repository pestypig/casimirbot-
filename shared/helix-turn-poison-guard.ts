export const HELIX_TURN_POISON_AUDIT_SCHEMA = "helix.turn_poison_audit.v1" as const;
export const HELIX_TERMINAL_AUTHORITY_SCHEMA = "helix.turn_terminal_authority.v1" as const;
export const HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA = "helix.artifact_role_authority.v1" as const;

export type HelixArtifactRole =
  | "source_event"
  | "tool_observation"
  | "validation"
  | "synthetic_evidence"
  | "subgoal_evaluation"
  | "request_user_input"
  | "user_steering"
  | "interpreted_event"
  | "profile_archive"
  | "ui_projection"
  | "assistant_answer";

export type HelixContextForm =
  | "none"
  | "compact_ref_only"
  | "compact_summary"
  | "steering_claim_with_evidence"
  | "assistant_text";

export type HelixTruthStatus =
  | "not_truth_claim"
  | "deterministic_observation"
  | "synthetic_claim"
  | "user_claim"
  | "model_backed_answer";

export type HelixArtifactRoleAuthority = {
  schema: typeof HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA;
  role: HelixArtifactRole;
  can_be_assistant_answer: boolean;
  can_enter_model_context: boolean;
  can_enter_debug_context: boolean;
  context_form: HelixContextForm;
  truth_status: HelixTruthStatus;
};

export type HelixPoisonViolationKind =
  | "deterministic_as_answer"
  | "raw_content_in_context"
  | "missing_terminal_authority"
  | "client_fallback_overrode_terminal"
  | "assistant_history_contains_projection"
  | "steering_promoted_to_truth"
  | "clarification_question_as_answer"
  | "missing_deterministic_content_role";

export type HelixPoisonAuditViolation = {
  kind: HelixPoisonViolationKind;
  item_id?: string | null;
  summary: string;
};

export type HelixTerminalAuthority = {
  schema: typeof HELIX_TERMINAL_AUTHORITY_SCHEMA;
  thread_id: string;
  turn_id?: string | null;
  route: "/ask" | "/ask/conversation-turn" | "/ask/turn" | "/ask/turn/stream" | string;
  terminal_kind:
    | "answer"
    | "request_user_input"
    | "workspace_action_receipt"
    | "situation_context_pack"
    | "live_answer_environment"
    | "tool_evaluation"
    | "failure";
  final_answer_source: string;
  terminal_artifact_kind: string;
  terminal_item_id?: string | null;
  terminal_text_hash: string;
  terminal_text_preview: string;
  server_authoritative: true;
  created_at: string;
};

export type HelixPoisonAuditResult = {
  schema: typeof HELIX_TURN_POISON_AUDIT_SCHEMA;
  audit_id: string;
  thread_id: string;
  turn_id?: string | null;
  ok: boolean;
  violations: HelixPoisonAuditViolation[];
  terminal_authority?: {
    final_answer_source: string;
    terminal_artifact_kind: string;
    server_terminal_text_hash: string;
    client_visible_text_hash?: string | null;
  } | null;
  artifact_role_counts: Record<HelixArtifactRole, number>;
  assistant_history_projection_count: number;
  created_at: string;
};

export const HELIX_ITEM_ROLE_AUTHORITY: Record<HelixArtifactRole, HelixArtifactRoleAuthority> = {
  source_event: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "source_event",
    can_be_assistant_answer: false,
    can_enter_model_context: false,
    can_enter_debug_context: true,
    context_form: "none",
    truth_status: "deterministic_observation",
  },
  tool_observation: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "tool_observation",
    can_be_assistant_answer: false,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "compact_ref_only",
    truth_status: "deterministic_observation",
  },
  validation: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "validation",
    can_be_assistant_answer: false,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "compact_summary",
    truth_status: "synthetic_claim",
  },
  synthetic_evidence: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "synthetic_evidence",
    can_be_assistant_answer: false,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "compact_ref_only",
    truth_status: "synthetic_claim",
  },
  subgoal_evaluation: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "subgoal_evaluation",
    can_be_assistant_answer: false,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "compact_summary",
    truth_status: "synthetic_claim",
  },
  request_user_input: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "request_user_input",
    can_be_assistant_answer: false,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "compact_summary",
    truth_status: "not_truth_claim",
  },
  user_steering: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "user_steering",
    can_be_assistant_answer: false,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "steering_claim_with_evidence",
    truth_status: "user_claim",
  },
  interpreted_event: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "interpreted_event",
    can_be_assistant_answer: false,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "compact_summary",
    truth_status: "synthetic_claim",
  },
  profile_archive: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "profile_archive",
    can_be_assistant_answer: false,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "compact_ref_only",
    truth_status: "synthetic_claim",
  },
  ui_projection: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "ui_projection",
    can_be_assistant_answer: false,
    can_enter_model_context: false,
    can_enter_debug_context: true,
    context_form: "none",
    truth_status: "not_truth_claim",
  },
  assistant_answer: {
    schema: HELIX_ARTIFACT_ROLE_AUTHORITY_SCHEMA,
    role: "assistant_answer",
    can_be_assistant_answer: true,
    can_enter_model_context: true,
    can_enter_debug_context: true,
    context_form: "assistant_text",
    truth_status: "model_backed_answer",
  },
};
