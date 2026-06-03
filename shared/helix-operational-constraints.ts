export const HELIX_TURN_OPERATIONAL_CONSTRAINTS_SCHEMA =
  "helix.turn_operational_constraints.v1" as const;

export const HELIX_OPERATIONAL_CAPABILITY_TRACE_SCHEMA =
  "helix.operational_capability_trace.v1" as const;

export const HELIX_OPERATIONAL_SATISFACTION_EVALUATION_SCHEMA =
  "helix.operational_satisfaction_evaluation.v1" as const;

export type HelixOperationalFallbackEquivalencePolicy =
  | "not_applicable"
  | "diagnostic_only"
  | "equivalent_if_same_surface";

export type HelixOperationalConstraintPacket = {
  schema: typeof HELIX_TURN_OPERATIONAL_CONSTRAINTS_SCHEMA;
  turn_id: string;

  requested_surface: string | null;
  required_surface: string | null;

  forbidden_tools: string[];
  forbidden_tool_families: string[];

  allowed_fallback_surfaces: string[];
  fallback_equivalence_policy: HelixOperationalFallbackEquivalencePolicy;

  local_term_bindings: Array<{
    term: string;
    meaning: string;
    reason: string;
  }>;

  operator_constraints: string[];
  surface_satisfaction_required: boolean;

  assistant_answer: false;
  raw_content_included: false;
};

export type HelixOperationalCapabilityTrace = {
  schema: typeof HELIX_OPERATIONAL_CAPABILITY_TRACE_SCHEMA;
  turn_id: string;

  model_proposed_capability: string | null;
  policy_admitted_capability: string | null;
  executed_capability: string | null;

  rejected_capability: {
    capability: string;
    reason: string;
  } | null;

  fallback_capability: string | null;
  fallback_authority_scope:
    | "not_used"
    | "diagnostic_only"
    | "terminal_equivalent";

  assistant_answer: false;
  raw_content_included: false;
};

export type HelixOperationalSatisfactionEvaluation = {
  schema: typeof HELIX_OPERATIONAL_SATISFACTION_EVALUATION_SCHEMA;
  turn_id: string;

  requested_surface: string | null;
  required_surface: string | null;
  executed_surface: string | null;

  requested_surface_satisfied: boolean;
  forbidden_tool_avoided: boolean;
  fallback_used: boolean;
  fallback_equivalent: boolean;
  remaining_surface_blocker: string | null;

  next_decision: "allow_terminal" | "continue" | "request_user_input" | "fail_closed";
  evidence_refs: string[];

  assistant_answer: false;
  raw_content_included: false;
};
