import type { HelixToolOutputRole } from "./helix-terminal-authority";

export const HELIX_COMMITTED_ASK_ROUTE_SCHEMA =
  "helix.committed_ask_route.v1" as const;

export type HelixCommittedAskRouteStrength = "hard" | "soft" | "unknown";

export type HelixCommittedAskRoute = {
  schema: typeof HELIX_COMMITTED_ASK_ROUTE_SCHEMA;
  turn_id: string;
  commit_id: string;
  prompt_hash: string;
  committed_at_stage: "post_prompt_source_arbitration";

  prompt_intent: {
    primary_intent_kind: string;
    secondary_intent_kinds: string[];
    interpretation_ref?: string;
    arbitration_ref?: string;
  };

  route: {
    selected_route: string;
    source_target: string;
    target_kind: string;
    strength: HelixCommittedAskRouteStrength;
    source_identity?: string | null;
    route_reason: string;
    stale_metadata_policy: "ignore_unless_matches_commit";
  };

  canonical_goal: {
    goal_kind: string;
    required_terminal_kind: string;
    allowed_terminal_artifact_kinds: string[];
    forbidden_terminal_artifact_kinds: string[];
  };

  capability_policy: {
    allowed_tool_families: string[];
    suppressed_tool_families: string[];
    required_capability_families: string[];
    mutating_families_allowed: boolean;
  };

  suppression: {
    contextual_tool_mentions: Array<{
      text: string;
      verb_or_cue: string;
      reason: string;
    }>;
    negative_constraints: string[];
    suppressed_families: string[];
    firewall_required: true;
  };

  terminal_product: {
    terminal_authority_required: true;
    evidence_reentry_required: boolean;
    followup_reasoning_required: boolean;
    required_terminal_product: string;
  };

  transitions: Array<{
    from: string;
    to: string;
    reason: string;
    allowed: boolean;
    compatibility_check: string;
  }>;

  compatibility: {
    source_goal_capability_terminal_compatible: boolean;
    stale_metadata_ignored: boolean;
    shortcut_firewall_applied: boolean;
    violations: string[];
  };

  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCommittedAskRouteCompatibilityResult = {
  schema: "helix.committed_ask_route_compatibility.v1";
  turn_id: string;
  compatible: boolean;
  violations: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCommittedAskRouteToolAdmissionResult = {
  schema: "helix.committed_ask_route_tool_admission.v1";
  turn_id: string;
  capability_id: string;
  inferred_family: string;
  allowed: boolean;
  reason: string;
  from_shortcut: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRouteEvidenceAuthorityTool = {
  capability_id: string;
  family: string;
  reason: string;
  admission_ref?: string;
};

export type HelixRouteEvidenceAuthority = {
  schema: "helix.route_evidence_authority.v1";
  turn_id: string;
  route_proposal_authority: {
    semantic_route_proposal_source: "agent_runtime" | null;
    classifier_hints: "hint_only";
    prompt_derived_gateway_requests: "policy_admission_fallback";
    boundary: "runtime_decides_steps_helix_validates_admission";
  };
  candidate_tools: HelixRouteEvidenceAuthorityTool[];
  admitted_tools: HelixRouteEvidenceAuthorityTool[];
  rejected_tools: HelixRouteEvidenceAuthorityTool[];
  supporting_evidence_refs: string[];
  allowed_terminal_artifact_kinds: string[];
  forbidden_terminal_artifact_kinds: string[];
  required_terminal_kind: string | null;
  allowed_terminal_output_roles: HelixToolOutputRole[];
  required_terminal_output_role: HelixToolOutputRole | null;
  terminal_product_allowed: boolean;
  current_turn_only: boolean;
  assistant_answer: false;
  raw_content_included: false;
};
