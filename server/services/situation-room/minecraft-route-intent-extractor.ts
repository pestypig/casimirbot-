import {
  createMinecraftRouteObjective,
  type MinecraftRouteObjectiveState,
} from "../../../shared/helix-minecraft-route-objective.ts";
import { makeId } from "../../../shared/helix-minecraft-evidence.ts";
import type { MinecraftDiscordActorBinding } from "./minecraft-session-actor-binding.ts";
import { hasUsableActorBinding } from "./minecraft-session-actor-binding.ts";

export type TranscriptIntentInput = {
  room_id: string;
  world_id: string;
  transcript_id: string;
  transcript_text: string;
  transcript_mode: "ambient" | "direct_address" | "manual";
  direct_address_detected?: boolean;
  actor_binding?: MinecraftDiscordActorBinding | null;
  ts: string;
};

const RETURN_HOME_RE = /\b(get|go|head|return|back)\b.*\b(home|base|spawn)\b|\bneed\b.*\bhome\b/i;
const GATEWAY_RE = /\b(gateway|portal)\b/i;
const END_RE = /\b(end|end city|outer end)\b/i;

export function extractMinecraftRouteIntent(
  input: TranscriptIntentInput,
): MinecraftRouteObjectiveState | null {
  const text = input.transcript_text;
  const wantsHome = RETURN_HOME_RE.test(text);
  const mentionsGateway = GATEWAY_RE.test(text);
  const mentionsEnd = END_RE.test(text);

  if (!wantsHome && !(mentionsGateway && mentionsEnd)) {
    return null;
  }

  const directRequest =
    input.transcript_mode === "direct_address" || input.direct_address_detected === true;
  const bindingUsable = hasUsableActorBinding(input.actor_binding);

  return createMinecraftRouteObjective({
    objective_id: makeId("route_objective", input.transcript_id),
    room_id: input.room_id,
    world_id: input.world_id,
    actor_id: bindingUsable ? input.actor_binding.minecraft_actor_id : null,
    actor_label: bindingUsable ? input.actor_binding.minecraft_actor_label ?? null : null,
    intent_label: "return_home_from_end",
    intent_status: directRequest ? "direct_request" : "hypothesized",
    lifecycle: bindingUsable ? "active" : "pending_identity",
    created_from: directRequest ? "direct_address" : "ambient_voice_intent",
    target_chain: [
      {
        label_code: "return_end_gateway_candidate",
        dimension: "minecraft:the_end",
        target_type: "end_gateway",
        evidence_layer: "transcript_intent",
        confidence: mentionsGateway ? 0.74 : 0.56,
      },
      {
        label_code: "end_exit_portal",
        dimension: "minecraft:the_end",
        target_type: "exit_portal",
        evidence_layer: "model_hypothesis",
        confidence: 0.7,
      },
      {
        label_code: "respawn_or_home",
        dimension: "minecraft:overworld",
        target_type: "respawn_location",
        evidence_layer: "transcript_intent",
        confidence: wantsHome ? 0.72 : 0.5,
      },
    ],
    confidence: wantsHome && mentionsEnd ? 0.76 : 0.62,
    evidence_refs: [input.transcript_id],
    raw_user_text_included: false,
    model_invoked_by_helix: false,
    updated_at: input.ts,
  });
}
