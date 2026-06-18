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
