import type {
  EvidenceLayer,
  EvidenceSafety,
} from "./helix-minecraft-evidence.ts";
import { toolEvidenceSafety } from "./helix-minecraft-evidence.ts";

export const HELIX_MINECRAFT_ROUTE_OBJECTIVE_SCHEMA =
  "helix.minecraft_route_objective.v1" as const;

export type MinecraftRouteIntentLabel =
  | "return_home_from_end"
  | "go_to_waypoint"
  | "find_gateway"
  | "return_to_spawn"
  | "custom";

export type MinecraftRouteObjectiveLifecycle =
  | "pending_identity"
  | "active"
  | "stale"
  | "superseded"
  | "cancelled"
  | "completed";

export type MinecraftRouteIntentStatus =
  | "hypothesized"
  | "confirmed"
  | "direct_request"
  | "completed"
  | "cancelled";

export type MinecraftRouteObjectiveSource =
  | "ambient_voice_intent"
  | "direct_address"
  | "manual_waypoint"
  | "server_event"
  | "operator"
  | "model_hypothesis";

export type MinecraftRouteTargetType =
  | "end_gateway"
  | "exit_portal"
  | "respawn_location"
  | "home_waypoint"
  | "waypoint"
  | "structure_candidate"
  | "portal_transition"
  | "unknown";

export type MinecraftRouteTarget = {
  label_code: string;
  dimension: string;
  x?: number | null;
  y?: number | null;
  z?: number | null;
  target_type: MinecraftRouteTargetType;
  evidence_layer: EvidenceLayer;
  confidence: number;
};

export type MinecraftRouteObjectiveState = EvidenceSafety & {
  schema: typeof HELIX_MINECRAFT_ROUTE_OBJECTIVE_SCHEMA;
  objective_id: string;
  room_id: string;
  world_id: string;
  actor_id?: string | null;
  actor_label?: string | null;
  intent_label: MinecraftRouteIntentLabel;
  intent_status: MinecraftRouteIntentStatus;
  lifecycle: MinecraftRouteObjectiveLifecycle;
  created_from: MinecraftRouteObjectiveSource;
  target_chain: MinecraftRouteTarget[];
  confidence: number;
  evidence_refs: string[];
  raw_user_text_included: false;
  model_invoked_by_helix: boolean;
  requires_external_evidence: boolean;
  updated_at: string;
};

export function createMinecraftRouteObjective(
  input: Omit<
    MinecraftRouteObjectiveState,
    | "schema"
    | keyof EvidenceSafety
    | "raw_user_text_included"
    | "requires_external_evidence"
  > & {
    lifecycle?: MinecraftRouteObjectiveLifecycle;
    requires_external_evidence?: boolean;
  },
): MinecraftRouteObjectiveState {
  const requiresExternalEvidence =
    input.requires_external_evidence ??
    input.created_from === "model_hypothesis" ??
    false;

  return {
    schema: HELIX_MINECRAFT_ROUTE_OBJECTIVE_SCHEMA,
    ...toolEvidenceSafety(),
    ...input,
    lifecycle: input.lifecycle ?? "active",
    raw_user_text_included: false,
    requires_external_evidence: requiresExternalEvidence,
  };
}
