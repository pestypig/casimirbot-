import crypto from "node:crypto";
import {
  HELIX_SITUATION_EPISODE_NARRATION_SCHEMA,
  HELIX_SITUATION_EPISODE_SCHEMA,
  HELIX_SITUATION_PREDICTION_SCHEMA,
  type SituationEpisode,
  type SituationEpisodeNarration,
  type SituationEpisodeType,
  type SituationPrediction,
} from "@shared/helix-situation-episode";
import type { HelixWorldEvent } from "@shared/helix-world-event";

const DEFAULT_WINDOW_MS = 12_000;

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const eventId = (event: HelixWorldEvent): string =>
  event.evidence_refs?.[0] ??
  `world-event:${event.world_id}:${event.event_type}:${event.ts}:${
    event.actor_id ?? event.actor_label ?? "world"
  }`;

const readString = (value: unknown, keys: string[]): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const next = record[key];
    if (typeof next === "string" && next.trim()) return next.trim();
  }
  return null;
};

const readNumber = (value: unknown, keys: string[]): number | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const next = record[key];
    if (typeof next === "number" && Number.isFinite(next)) return next;
  }
  return null;
};

const minecraftLabel = (value: string | null): string | null =>
  value ? value.replace(/^minecraft:/, "").replace(/_/g, " ") : null;

const itemName = (event: HelixWorldEvent): string | null =>
  minecraftLabel(readString(event.inventory_delta, ["item", "item_id", "name"]));

const blockName = (event: HelixWorldEvent): string | null =>
  minecraftLabel(readString(event.meta, ["block", "block_id"]));

const isInventoryEvent = (event: HelixWorldEvent): boolean =>
  event.event_type === "item_acquired" ||
  event.event_type === "item_dropped" ||
  event.event_type === "item_drop" ||
  event.event_type === "item_used" ||
  event.event_type === "projectile_launched" ||
  Boolean(event.inventory_delta);

const isCombatEvent = (event: HelixWorldEvent): boolean =>
  event.event_type === "player_damage" ||
  event.event_type === "damage_taken" ||
  event.event_type === "player_death" ||
  event.event_type === "hostile_nearby" ||
  event.event_type === "mob_nearby" ||
  event.event_type === "creeper_fuse_started" ||
  event.event_type === "explosion_imminent";

const isLocationEvent = (event: HelixWorldEvent): boolean =>
  event.event_type === "player_location_sample" ||
  event.event_type === "player_location_changed" ||
  event.event_type === "dimension_changed" ||
  Boolean(event.location);

const compactLocation = (event: HelixWorldEvent): Record<string, unknown> | null =>
  event.location ? { ...event.location, ts: event.ts } : null;

const compactInventory = (event: HelixWorldEvent): Record<string, unknown> => ({
  event_type: event.event_type,
  item: itemName(event) ?? blockName(event),
  inventory_delta: event.inventory_delta ?? null,
  evidence_refs: event.evidence_refs ?? [],
  ts: event.ts,
});

const compactCombat = (event: HelixWorldEvent): Record<string, unknown> => ({
  event_type: event.event_type,
  health_delta: event.health_delta ?? null,
  meta: event.meta ?? null,
  text: event.text ?? null,
  evidence_refs: event.evidence_refs ?? [],
  ts: event.ts,
});

const hasSurfaceTransition = (events: HelixWorldEvent[]): boolean => {
  const yValues = events
    .map((event: HelixWorldEvent) => readNumber(event.location, ["y"]))
    .filter((value: number | null): value is number => value !== null);
  if (yValues.length < 2) return false;
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  return (minY < 64 && maxY >= 64) || maxY - minY >= 6;
};

const classifyEpisodeType = (events: HelixWorldEvent[]): SituationEpisodeType | null => {
  if (events.some((event: HelixWorldEvent) => event.event_type === "player_death")) {
    return "death_event";
  }
  if (events.some(isCombatEvent)) return "combat_risk";
  if (
    events.some((event: HelixWorldEvent) => event.event_type === "objective_blocked") ||
    events.some((event: HelixWorldEvent) => readString(event.objective_delta, ["status"]) === "blocked")
  ) {
    return "goal_blocked";
  }
  if (
    events.some((event: HelixWorldEvent) => readString(event.objective_delta, ["status"]) === "completed") ||
    events.some((event: HelixWorldEvent) => event.event_type === "advancement_unlocked")
  ) {
    return "goal_progress";
  }
  if (
    events.some((event: HelixWorldEvent) => event.event_type === "block_broken") &&
    events.some((event: HelixWorldEvent) => event.event_type === "item_acquired")
  ) {
    return "resource_gathering";
  }
  if (events.some(isInventoryEvent)) return "inventory_change";
  if (hasSurfaceTransition(events)) return "movement_transition";
  return null;
};

const buildSummarySeed = (events: HelixWorldEvent[], actorLabel: string): string => {
  const parts: string[] = [];
  const broken = events
    .filter((event: HelixWorldEvent) => event.event_type === "block_broken")
    .map(blockName)
    .find(Boolean);
  const acquired = events
    .filter((event: HelixWorldEvent) => event.event_type === "item_acquired")
    .map(itemName)
    .filter(Boolean) as string[];
  const dropped = events
    .filter((event: HelixWorldEvent) => event.event_type === "item_dropped" || event.event_type === "item_drop")
    .map(itemName)
    .find(Boolean);
  const used = events
    .filter((event: HelixWorldEvent) => event.event_type === "item_used" || event.event_type === "projectile_launched")
    .map(itemName)
    .find(Boolean);
  const death = events.find((event: HelixWorldEvent) => event.event_type === "player_death");
  const damage = events.find((event: HelixWorldEvent) => event.event_type === "player_damage" || event.event_type === "damage_taken");
  const precursor = events.find((event: HelixWorldEvent) =>
    event.event_type === "hostile_nearby" ||
    event.event_type === "mob_nearby" ||
    event.event_type === "creeper_fuse_started" ||
    event.event_type === "explosion_imminent",
  );

  if (broken) parts.push(`${actorLabel} dug ${broken}`);
  if (hasSurfaceTransition(events)) parts.push("surfaced into open air");
  if (acquired.includes("dirt") && !broken) parts.push(`${actorLabel} gathered dirt`);
  if (acquired.some((item: string) => item.includes("salmon"))) parts.push("handled salmon");
  if (dropped) parts.push(`dropped ${dropped}`);
  if (used) parts.push(`used ${used}`);
  if (precursor) parts.push("encountered a nearby threat");
  if (damage) {
    const health = readNumber(damage.health_delta, ["current_health", "current", "health"]);
    parts.push(health !== null ? `entered danger at ${health} health` : "took damage");
  }
  if (death) parts.push(death.text ?? `${actorLabel} died`);
  if (parts.length === 0) {
    const latest = events.at(-1);
    return `${actorLabel} produced ${latest?.event_type ?? "world"} activity.`;
  }
  return `${parts.join(", ")}.`;
};

const shouldEmitEpisode = (events: HelixWorldEvent[], episodeType: SituationEpisodeType | null): episodeType is SituationEpisodeType => {
  if (!episodeType) return false;
  if (events.every((event: HelixWorldEvent) => event.event_type === "player_location_sample")) {
    return false;
  }
  return true;
};

export function reduceSituationEpisodes(args: {
  roomId: string;
  graphId?: string | null;
  worldId?: string | null;
  events: HelixWorldEvent[];
  windowMs?: number;
}): SituationEpisode[] {
  const windowMs = args.windowMs ?? DEFAULT_WINDOW_MS;
  const ordered = args.events
    .slice()
    .sort((a: HelixWorldEvent, b: HelixWorldEvent) => a.ts.localeCompare(b.ts) || eventId(a).localeCompare(eventId(b)));
  const groups: HelixWorldEvent[][] = [];

  for (const event of ordered) {
    if (event.room_id !== args.roomId) continue;
    if (args.worldId && event.world_id !== args.worldId) continue;
    const actor = event.actor_id ?? event.actor_label ?? "world";
    const ts = Date.parse(event.ts);
    const lastGroup = groups.at(-1);
    const lastEvent = lastGroup?.at(-1);
    const sameActor = lastEvent && (lastEvent.actor_id ?? lastEvent.actor_label ?? "world") === actor;
    const closeTime =
      lastEvent && Number.isFinite(ts) && Math.abs(ts - Date.parse(lastEvent.ts)) <= windowMs;
    if (lastGroup && sameActor && closeTime) {
      lastGroup.push(event);
    } else {
      groups.push([event]);
    }
  }

  return groups
    .map((group: HelixWorldEvent[]) => {
      const episodeType = classifyEpisodeType(group);
      if (!shouldEmitEpisode(group, episodeType)) return null;
      const ids = group.map(eventId);
      const evidenceRefs = Array.from(new Set(group.flatMap((event: HelixWorldEvent) => event.evidence_refs ?? []))).sort();
      const first = group[0];
      const last = group.at(-1) ?? first;
      const actorLabel = first.actor_label ?? first.actor_id ?? "Player";
      const locations = group
        .map(compactLocation)
        .filter((entry: Record<string, unknown> | null): entry is Record<string, unknown> => Boolean(entry));
      const episode: SituationEpisode = {
        schema: HELIX_SITUATION_EPISODE_SCHEMA,
        episode_id: `episode:${args.roomId}:${hashShort([ids, first.ts, last.ts], 16)}`,
        room_id: args.roomId,
        world_id: args.worldId ?? first.world_id ?? null,
        graph_id: args.graphId ?? null,
        actor_id: first.actor_id ?? null,
        actor_label: first.actor_label ?? null,
        episode_type: episodeType,
        from_ts: first.ts,
        to_ts: last.ts,
        event_ids: ids,
        evidence_refs: evidenceRefs,
        summary_seed: buildSummarySeed(group, actorLabel),
        location_path: locations.length > 0 ? locations.slice(-12) : undefined,
        inventory_events: group.some(isInventoryEvent) ? group.filter(isInventoryEvent).map(compactInventory) : undefined,
        combat_events: group.some(isCombatEvent) ? group.filter(isCombatEvent).map(compactCombat) : undefined,
        meta: {
          deterministic_window_ms: windowMs,
          event_count: group.length,
          surface_transition: hasSurfaceTransition(group),
        },
      };
      return episode;
    })
    .filter((episode: SituationEpisode | null): episode is SituationEpisode => Boolean(episode));
}

export function narrateSituationEpisode(episode: SituationEpisode): SituationEpisodeNarration {
  const ts = episode.to_ts;
  return {
    schema: HELIX_SITUATION_EPISODE_NARRATION_SCHEMA,
    narration_id: `episode_narration:${episode.episode_id.split(":").slice(-1)[0]}`,
    episode_id: episode.episode_id,
    room_id: episode.room_id,
    world_id: episode.world_id ?? null,
    actor_label: episode.actor_label ?? null,
    text: episode.summary_seed,
    perspective: "third_person",
    confidence: episode.episode_type === "unknown" ? 0.45 : 0.78,
    source: "deterministic_dictionary",
    evidence_refs: episode.evidence_refs,
    ts,
  };
}

export function predictFromSituationEpisode(episode: SituationEpisode): SituationPrediction[] {
  const lower = episode.summary_seed.toLowerCase();
  let predictedGoal: string | null = null;
  let rationale = "";
  let status: SituationPrediction["status"] = "hypothesis";
  let confidence = 0.55;

  if (episode.episode_type === "combat_risk" || episode.episode_type === "death_event") {
    predictedGoal = episode.episode_type === "death_event" ? "recover and reorient after death" : "survive immediate danger";
    rationale = "The episode includes damage, death, or nearby threat evidence.";
    status = episode.episode_type === "death_event" ? "blocked" : "active";
    confidence = 0.82;
  } else if (lower.includes("salmon")) {
    predictedGoal = "manage inventory or food while exploring";
    rationale = "The episode includes salmon handling alongside movement or inventory changes.";
    status = "active";
    confidence = 0.62;
  } else if (lower.includes("dirt") || lower.includes("dug")) {
    predictedGoal = "gather blocks or navigate out of terrain";
    rationale = "The episode includes dirt/block gathering and movement context.";
    status = "active";
    confidence = 0.68;
  }

  if (!predictedGoal) return [];
  return [
    {
      schema: HELIX_SITUATION_PREDICTION_SCHEMA,
      prediction_id: `episode_prediction:${episode.episode_id.split(":").slice(-1)[0]}`,
      room_id: episode.room_id,
      episode_id: episode.episode_id,
      actor_label: episode.actor_label ?? null,
      predicted_goal: predictedGoal,
      rationale,
      confidence,
      status,
      evidence_refs: episode.evidence_refs,
      ts: episode.to_ts,
    },
  ];
}
