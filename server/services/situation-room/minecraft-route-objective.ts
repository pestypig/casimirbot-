import crypto from "node:crypto";
import {
  HELIX_MINECRAFT_ROUTE_OBJECTIVE_SCHEMA,
  type HelixMinecraftRouteObjective,
  type HelixMinecraftRouteObjectiveIntent,
} from "@shared/helix-minecraft-evidence";

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

export function buildMinecraftRouteObjective(input: {
  roomId: string;
  worldId: string;
  actorLabel?: string | null;
  intentLabel: HelixMinecraftRouteObjectiveIntent;
  source?: HelixMinecraftRouteObjective["source"];
  transcriptMode?: HelixMinecraftRouteObjective["transcript_mode"];
  directAddressDetected?: boolean;
  confidence?: number;
  evidenceRefs?: string[];
  ts: string;
}): HelixMinecraftRouteObjective {
  const transcriptMode = input.transcriptMode ?? "ambient";
  const directAddressDetected = input.directAddressDetected ?? transcriptMode === "direct_address";
  return {
    schema: HELIX_MINECRAFT_ROUTE_OBJECTIVE_SCHEMA,
    objective_id: `minecraft_route_objective:${hashShort([
      input.roomId,
      input.worldId,
      input.intentLabel,
      transcriptMode,
      input.ts,
    ], 18)}`,
    room_id: input.roomId,
    world_id: input.worldId,
    actor_label: input.actorLabel ?? null,
    evidence_layer: "transcript_intent",
    evidence_trust: "player_transcript",
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    intent_label: input.intentLabel,
    source: input.source ?? "voice_intent",
    authority: "none",
    requires_external_evidence: input.source === "model_hypothesis",
    transcript_mode: transcriptMode,
    creates_ask_turn: false,
    turn_triggered: false,
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    direct_address_detected: directAddressDetected,
    salience_candidate: directAddressDetected,
    target_chain: input.intentLabel === "return_home_from_end"
      ? [
          {
            label: "nearest return End gateway",
            dimension: "minecraft:the_end",
            target_type: "end_gateway",
            evidence_layer: "seed_forecast",
            confidence: 0.42,
          },
          {
            label: "End exit portal",
            dimension: "minecraft:the_end",
            x: 0,
            y: null,
            z: 0,
            target_type: "exit_portal",
            evidence_layer: "observed_current_world",
            confidence: 0.66,
          },
          {
            label: "player respawn or home",
            dimension: "minecraft:overworld",
            target_type: "respawn_location",
            evidence_layer: "transcript_intent",
            confidence: 0.48,
          },
        ]
      : [{
          label: input.intentLabel,
          dimension: "minecraft:overworld",
          target_type: "unknown",
          evidence_layer: "transcript_intent",
          confidence: input.confidence ?? 0.5,
        }],
    confidence: input.confidence ?? 0.55,
    missing_evidence: input.intentLabel === "return_home_from_end"
      ? [
          "No observed return End gateway confirmation.",
          "No respawn or home waypoint sample attached to this objective.",
        ]
      : ["No concrete waypoint coordinates attached to this objective."],
    missing_evidence_codes: input.intentLabel === "return_home_from_end"
      ? ["gateway_unconfirmed", "server_observation_missing"]
      : ["requires_manual_action"],
    evidence_refs: input.evidenceRefs ?? [],
    raw_user_text_included: false,
    derived_by_deterministic_reducer: true,
    model_invoked: false,
    ts: input.ts,
  };
}
