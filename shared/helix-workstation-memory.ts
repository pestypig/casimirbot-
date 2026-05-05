export const HELIX_WORKSTATION_MEMORY_SCHEMA = "helix.workstation_memory.v1" as const;

export type HelixWorkstationMemoryClass =
  | "surface_session_only"
  | "thread_observation"
  | "profile_memory_candidate";

export type HelixWorkstationMemorySnapshot = {
  schema: typeof HELIX_WORKSTATION_MEMORY_SCHEMA;
  memory_class: "surface_session_only";
  storage: "sessionStorage";
  panel_scroll_keys: string[];
  draft_keys: string[];
  context_injection: "never_by_default";
  user_visible: true;
};
