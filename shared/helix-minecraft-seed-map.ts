import type { HelixEnvironmentSensorScope } from "./helix-environment-sensor-scope";
import type {
  HelixMinecraftAskContextPolicy,
  HelixMinecraftEvidenceLayer,
  HelixMinecraftEvidenceTrust,
  HelixMinecraftInstructionAuthority,
} from "./helix-minecraft-evidence";

export const HELIX_MINECRAFT_SEED_MAP_QUERY_SCHEMA =
  "helix.minecraft_seed_map_query.v1" as const;

export const HELIX_MINECRAFT_SEED_MAP_CLAIM_SCHEMA =
  "helix.minecraft_seed_map_claim.v1" as const;

export const HELIX_MINECRAFT_SEED_MAP_RESULT_SCHEMA =
  "helix.minecraft_seed_map_result.v1" as const;

export type HelixMinecraftEdition = "java" | "bedrock";

export type HelixMinecraftSeedMapClaimKind =
  | "biome"
  | "structure_candidate"
  | "end_gateway_candidate"
  | "spawn_candidate"
  | "slime_chunk"
  | "terrain_feature_candidate";

export type HelixMinecraftSeedMapSource =
  | "seed_worldgen"
  | "observed_world_event"
  | "hybrid_seed_observed";

export type HelixMinecraftSeedMapPosition = {
  x: number;
  z: number;
  y?: number | null;
};

export type HelixMinecraftSeedMapChunk = {
  x: number;
  z: number;
};

export type HelixMinecraftSeedMapQuery = {
  schema: typeof HELIX_MINECRAFT_SEED_MAP_QUERY_SCHEMA;
  query_id: string;
  room_id: string;
  world_id: string;
  seed: string;
  minecraft_version: string;
  edition: HelixMinecraftEdition;
  dimension: string;
  center: { x: number; z: number };
  radius_chunks: number;
  worldgen_flags: string[];
  selected_target_label?: string | null;
  evidence_refs: string[];
  evidence_trust: "seed_forecast";
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  raw_user_text_included: false;
  derived_by_deterministic_reducer: true;
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  ts: string;
  deterministic: true;
  model_invoked: false;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
};

export type HelixMinecraftSeedMapClaim = {
  schema: typeof HELIX_MINECRAFT_SEED_MAP_CLAIM_SCHEMA;
  claim_id: string;
  query_id: string;
  room_id: string;
  world_id: string;
  evidence_layer: "seed_forecast";
  evidence_trust: "seed_forecast";
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  kind: HelixMinecraftSeedMapClaimKind;
  dimension: string;
  position: HelixMinecraftSeedMapPosition;
  chunk?: HelixMinecraftSeedMapChunk | null;
  label: string;
  confidence: number;
  seed: string;
  minecraft_version: string;
  edition: HelixMinecraftEdition;
  source: HelixMinecraftSeedMapSource;
  sensor_scope: HelixEnvironmentSensorScope;
  limitations: string[];
  may_support_recommendation: false;
  evidence_refs: string[];
  raw_user_text_included: false;
  derived_by_deterministic_reducer: true;
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  ts: string;
  deterministic: true;
  model_invoked: false;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
};

export type HelixMinecraftSeedMapResult = {
  schema: typeof HELIX_MINECRAFT_SEED_MAP_RESULT_SCHEMA;
  result_id: string;
  query: HelixMinecraftSeedMapQuery;
  claims: HelixMinecraftSeedMapClaim[];
  provider_id: string;
  provider_kind: "fixture" | "native_adapter" | "worker_adapter";
  limitations: string[];
  evidence_trust: HelixMinecraftEvidenceTrust;
  instruction_authority: HelixMinecraftInstructionAuthority;
  ask_context_policy: HelixMinecraftAskContextPolicy;
  evidence_layer: HelixMinecraftEvidenceLayer;
  raw_user_text_included: false;
  derived_by_deterministic_reducer: true;
  creates_ask_turn: false;
  turn_triggered: false;
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  deterministic: true;
  model_invoked: false;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
};
