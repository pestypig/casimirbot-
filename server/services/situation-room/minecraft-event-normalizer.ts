import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  HELIX_SITUATION_EVENT_SIGNAL_SCHEMA,
  type SituationEventSignal,
} from "@shared/helix-situation-standby";

export type MinecraftRiskHint = "low_health" | "hostile_nearby" | "lava_nearby" | null;
export type MinecraftGoalHint = "collect_item" | "reach_location" | "survive" | "build" | null;
export type MinecraftSourceHealthHint = "disconnected" | "connected" | null;

export type MinecraftEventHints = {
  risk_hint: MinecraftRiskHint;
  goal_hint: MinecraftGoalHint;
  source_health_hint: MinecraftSourceHealthHint;
};

const readNumberField = (value: unknown, keys: string[]): number | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const next = record[key];
    if (typeof next === "number" && Number.isFinite(next)) return next;
  }
  return null;
};

const readBooleanMeta = (event: HelixWorldEvent, key: string): boolean =>
  Boolean(event.meta && typeof event.meta === "object" && event.meta[key] === true);

export const getMinecraftEventHints = (event: HelixWorldEvent): MinecraftEventHints => {
  const currentHealth = readNumberField(event.health_delta, [
    "current_health",
    "current",
    "health",
  ]);
  const hostileNearby = readBooleanMeta(event, "hostile_nearby") || event.event_type === "mob_nearby";
  const lavaNearby = readBooleanMeta(event, "lava_nearby");
  const risk_hint: MinecraftRiskHint =
    currentHealth !== null && currentHealth <= 6
      ? "low_health"
      : hostileNearby
        ? "hostile_nearby"
        : lavaNearby
          ? "lava_nearby"
          : null;

  const objective = event.objective_delta ?? {};
  const hasObjective =
    objective &&
    typeof objective === "object" &&
    !Array.isArray(objective) &&
    Object.keys(objective as Record<string, unknown>).length > 0;
  const goal_hint: MinecraftGoalHint =
    event.event_type === "item_acquired" || hasObjective
      ? "collect_item"
      : event.event_type === "dimension_changed" ||
          event.event_type === "player_location_changed" ||
          event.event_type === "objective_marker"
        ? "reach_location"
        : event.event_type === "player_damage" ||
            event.event_type === "damage_taken" ||
            event.event_type === "player_death"
          ? "survive"
          : event.event_type === "block_placed"
            ? "build"
            : null;

  const source_health_hint: MinecraftSourceHealthHint =
    event.event_type === "source_disconnected"
      ? "disconnected"
      : event.event_type === "source_connected" || event.event_type === "bridge_ping"
        ? "connected"
        : null;

  return {
    risk_hint,
    goal_hint,
    source_health_hint,
  };
};

export const normalizeMinecraftWorldEventToSignal = (args: {
  event: HelixWorldEvent;
  signalId: string;
  graphId?: string | null;
}): SituationEventSignal => {
  const { event, signalId, graphId } = args;
  const hints = getMinecraftEventHints(event);
  return {
    schema: HELIX_SITUATION_EVENT_SIGNAL_SCHEMA,
    signal_id: signalId,
    room_id: event.room_id,
    graph_id: graphId ?? null,
    source_id: event.source_id ?? null,
    source: "minecraft_event",
    event_type: event.event_type,
    ts: event.ts,
    text: event.text ?? null,
    actor: event.actor_label ?? event.actor_id ?? null,
    speaker_id: null,
    world_entity_id: event.actor_id ?? null,
    location: event.location ?? null,
    evidence_refs: event.evidence_refs,
    meta: {
      minecraft: {
        world_id: event.world_id,
        inventory_delta: event.inventory_delta ?? null,
        health_delta: event.health_delta ?? null,
        objective_delta: event.objective_delta ?? null,
        entities: event.entities ?? null,
        meta: event.meta ?? null,
      },
      ...hints,
    },
  };
};
