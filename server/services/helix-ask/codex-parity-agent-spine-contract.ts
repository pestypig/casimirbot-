export const CODEX_PARITY_AGENT_SPINE_RAIL_TABLE_SCHEMA = "helix.codex_parity_agent_spine_rail_table.v1" as const;

export const CODEX_PARITY_AGENT_SPINE_CLASSES = [
  "complete",
  "tool_surface_missing",
  "explicit_capability_demoted",
  "tool_admission_rejected",
  "selected_not_executed",
  "observation_missing",
  "observation_not_reentered",
  "goal_contract_mismatch",
  "terminal_product_not_allowed",
  "terminal_authority_mismatch",
  "visible_projection_mismatch",
  "debug_mirror_stale",
  "provider_config_missing",
] as const;

export type CodexParityAgentSpineClass = (typeof CODEX_PARITY_AGENT_SPINE_CLASSES)[number];

export const CODEX_PARITY_AGENT_SPINE_REENTRY_STATUSES = [
  "reentered",
  "not_reentered",
  "no_observation",
] as const;

export type CodexParityAgentSpineReentryStatus = (typeof CODEX_PARITY_AGENT_SPINE_REENTRY_STATUSES)[number];

export const CODEX_PARITY_AGENT_SPINE_RAIL_STATUSES = [
  "complete",
  "broken",
  "fail_closed",
] as const;

export type CodexParityAgentSpineRailStatus = (typeof CODEX_PARITY_AGENT_SPINE_RAIL_STATUSES)[number];

export const CODEX_PARITY_AGENT_SPINE_FIRST_BROKEN_RAILS = [
  "route_admission",
  "capability_execution",
  "observation_artifact",
  "evidence_reentry",
  "support_backed_draft",
  "terminal_materialization",
  "terminal_authority",
  "visible_projection",
  "config",
] as const;

export type CodexParityAgentSpineFirstBrokenRail =
  (typeof CODEX_PARITY_AGENT_SPINE_FIRST_BROKEN_RAILS)[number];

export const CODEX_PARITY_AGENT_SPINE_REPAIR_TARGETS = [
  "intent_arbitration",
  "agent_step_selection",
  "tool_admission",
  "tool_execution",
  "tool_family_contract",
  "observation_materializer",
  "reentry_gate",
  "repo_retrieval_repair_policy",
  "draft_builder",
  "terminal_materializer",
  "terminal_authority",
  "presenter_boundary",
  "operator_config",
] as const;

export type CodexParityAgentSpineRepairTarget = (typeof CODEX_PARITY_AGENT_SPINE_REPAIR_TARGETS)[number];

export const CODEX_PARITY_AGENT_SPINE_RAIL_FAILURE_CODES = [
  "explicit_capability_not_selected",
  "wrong_capability_executed",
  "route_family_mismatch",
  "tool_admission_drift",
  "tool_execution_rejected",
  "required_observation_missing",
  "observation_missing",
  "observation_not_reentered",
  "reentry_step_not_executed",
  "weak_evidence_repair_loop",
  "support_refs_missing",
  "terminal_product_mismatch",
  "terminal_not_materialized",
  "terminal_authority_missing",
  "terminal_projection_mismatch",
  "debug_mirror_stale",
  "config_missing",
] as const;

export type CodexParityAgentSpineRailFailureCode =
  (typeof CODEX_PARITY_AGENT_SPINE_RAIL_FAILURE_CODES)[number];

export const CODEX_PARITY_AGENT_SPINE_STRING_OR_NULL_FIELDS = [
  "prompt",
  "requested_capability",
  "selected_capability",
  "admitted_capability",
  "admission_proof_source",
  "executed_capability",
  "observation_kind",
  "observation_ref",
  "goal_satisfaction",
  "required_terminal_kind",
  "selected_terminal_kind",
  "terminal_authority_proof_source",
  "visible_terminal_kind",
  "visible_projection_source",
  "first_broken_rail",
  "repair_target",
  "rail_failure_code",
] as const;
