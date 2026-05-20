import type { LiveScenarioKind } from "../../../shared/helix-live-scenario-evidence.ts";
import type { MinecraftRouteObjectiveState } from "../../../shared/helix-minecraft-route-objective.ts";
import type { MinecraftRouteDriftEvent } from "../../../shared/helix-minecraft-route-drift.ts";
import type { DotOperatorReferral } from "../../../shared/helix-operator-referral.ts";
import type { AskEvidencePack } from "./live-scenario-ask-allowlist.ts";
import { buildAskEvidencePackFromAllowlist } from "./live-scenario-ask-allowlist.ts";
import type { AskTurnSink } from "./ask-turn-sink.ts";
import { buildEndReturnRouteRehearsal, type MinecraftRoutePoint, type MinecraftRouteRehearsal } from "./minecraft-end-return-route-builder.ts";
import { monitorRouteDrift, type PlayerLocationSample } from "./minecraft-route-drift-monitor.ts";
import { extractMinecraftRouteIntent } from "./minecraft-route-intent-extractor.ts";
import { createMinecraftDiscordActorBinding, type MinecraftDiscordActorBinding } from "./minecraft-session-actor-binding.ts";
import { buildRouteAssistOperatorReferral } from "./operator-referral-builder.ts";

export type LiveScenarioEvent =
  | {
      kind: "transcript";
      transcript_id: string;
      thread_id: string;
      room_id: string;
      world_id: string;
      text: string;
      transcript_mode: "ambient" | "direct_address" | "manual";
      direct_address_detected?: boolean;
      actor_binding?: MinecraftDiscordActorBinding | null;
    }
  | {
      kind: "minecraft_route_context";
      current_position: MinecraftRoutePoint;
      gateway_candidate?: MinecraftRoutePoint | null;
      bridge_overlay_observed?: boolean;
      ender_pearl_known_available?: boolean | null;
      respawn_location_known?: boolean;
      evidence_refs?: string[];
    }
  | {
      kind: "minecraft_location_sample";
      sample: PlayerLocationSample;
    }
  | {
      kind: "policy_approval";
      may_create_ask_turn: boolean;
      reason: "direct_address" | "manual_user_request" | "policy_approved_interjection";
      evidence_refs?: string[];
    };

export type LiveScenarioLoopResult = {
  objective?: MinecraftRouteObjectiveState | null;
  rehearsal?: MinecraftRouteRehearsal | null;
  drift?: MinecraftRouteDriftEvent | null;
  referral?: DotOperatorReferral | null;
  ask_pack: AskEvidencePack;
  direct_address_candidate: boolean;
};

export function runLiveScenarioLoop(input: {
  scenario_kind: LiveScenarioKind;
  events: LiveScenarioEvent[];
  askTurnSink: AskTurnSink;
  now: string;
}): LiveScenarioLoopResult {
  if (input.scenario_kind !== "minecraft_route_monitor") {
    return {
      ask_pack: buildAskEvidencePackFromAllowlist({ items: [], now: input.now }),
      direct_address_candidate: false,
    };
  }

  const fallbackBinding = createMinecraftDiscordActorBinding({
    binding_id: "loop_default_binding",
    room_id: "room",
    thread_id: "thread",
    minecraft_actor_id: "player",
    confidence: 0.9,
    source: "manual_link",
  });

  let threadId = "thread";
  let objective: MinecraftRouteObjectiveState | null = null;
  let directAddressCandidate = false;
  let routeContext: Extract<LiveScenarioEvent, { kind: "minecraft_route_context" }> | null = null;
  const samples: PlayerLocationSample[] = [];
  let pendingPolicyApproval:
    | Extract<LiveScenarioEvent, { kind: "policy_approval" }>
    | null = null;

  for (const event of input.events) {
    if (event.kind === "transcript") {
      threadId = event.thread_id;
      const extracted = extractMinecraftRouteIntent({
        room_id: event.room_id,
        world_id: event.world_id,
        transcript_id: event.transcript_id,
        transcript_text: event.text,
        transcript_mode: event.transcript_mode,
        direct_address_detected: event.direct_address_detected,
        actor_binding: event.actor_binding ?? fallbackBinding,
        ts: input.now,
      });

      if (extracted) {
        objective = extracted;
        directAddressCandidate = extracted.intent_status === "direct_request";
      }
    } else if (event.kind === "minecraft_route_context") {
      routeContext = event;
    } else if (event.kind === "minecraft_location_sample") {
      samples.push(event.sample);
    } else if (event.kind === "policy_approval") {
      pendingPolicyApproval = event;
    }
  }

  let rehearsal: MinecraftRouteRehearsal | null = null;
  if (objective && routeContext) {
    rehearsal = buildEndReturnRouteRehearsal({
      objective,
      current_position: routeContext.current_position,
      gateway_candidate: routeContext.gateway_candidate,
      bridge_overlay_observed: routeContext.bridge_overlay_observed ?? false,
      ender_pearl_known_available: routeContext.ender_pearl_known_available ?? null,
      respawn_location_known: routeContext.respawn_location_known ?? false,
      evidence_refs: routeContext.evidence_refs ?? [],
      ts: input.now,
    });
  }

  const drift = objective && rehearsal ? monitorRouteDrift({ objective, rehearsal, samples, now: input.now }) : null;
  const referral =
    objective && rehearsal && drift
      ? buildRouteAssistOperatorReferral({
          thread_id: threadId,
          objective,
          rehearsal,
          drift,
          salience_decision_id: "loop_salience",
        })
      : null;

  if (
    pendingPolicyApproval?.may_create_ask_turn &&
    directAddressCandidate &&
    objective
  ) {
    input.askTurnSink.createAskTurn({
      request_id: `ask_turn:${objective.objective_id}`,
      thread_id: threadId,
      reason: pendingPolicyApproval.reason,
      evidence_refs: pendingPolicyApproval.evidence_refs ?? [objective.objective_id],
      created_at: input.now,
    });
  }

  const askPack = buildAskEvidencePackFromAllowlist({
    items: [objective, rehearsal, drift].filter(Boolean),
    now: input.now,
  });

  return {
    objective,
    rehearsal,
    drift,
    referral,
    ask_pack: askPack,
    direct_address_candidate: directAddressCandidate,
  };
}
