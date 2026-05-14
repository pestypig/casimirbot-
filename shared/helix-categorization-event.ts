export const HELIX_CATEGORIZATION_EVENT_SCHEMA = "helix.categorization_event.v1" as const;

export type HelixCategorizationSourceFamily =
  | "minecraft"
  | "calculator"
  | "physics_simulation"
  | "discord_voice"
  | "browser_transcript"
  | "workstation_notes"
  | "ideology"
  | "live_environment"
  | "unknown";

export type HelixCategorizationCategory =
  | "risk"
  | "goal_progress"
  | "goal_blocked"
  | "equation_result"
  | "stability_window"
  | "resource_update"
  | "argument_claim"
  | "evidence"
  | "context_reference"
  | "motive_framework"
  | "minecraft_spatial_pattern"
  | "structure_hypothesis"
  | "entity_context"
  | "containment_context"
  | "item_flow_context"
  | "dense_entity_cluster"
  | "contained_entity_cluster"
  | "repeated_item_flow"
  | "missing_evidence_note"
  | "hazard_context"
  | "unknown";

export type HelixCategorizationEvent = {
  schema: typeof HELIX_CATEGORIZATION_EVENT_SCHEMA;
  event_id: string;
  thread_id: string;
  source_event_id: string;
  source_family: HelixCategorizationSourceFamily;
  category: HelixCategorizationCategory;
  summary: string;
  confidence: number;
  evidence_refs: string[];
  deterministic: boolean;
  model_invoked: boolean;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
