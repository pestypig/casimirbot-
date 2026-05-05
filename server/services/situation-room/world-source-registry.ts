import type { HelixWorldEvent } from "@shared/helix-world-event";

export type WorldSourceSeen = {
  room_id: string;
  source_id: string;
  world_id: string;
  actor_ids: string[];
  latest_actor_id?: string | null;
  latest_actor_label?: string | null;
  latest_event_type: string;
  latest_ts: string;
  event_count: number;
  latest_debug?: {
    append_decision: "appended" | "not_appended";
    append_reason: string;
    salience_class: string;
    binding_id?: string | null;
    thread_id?: string | null;
    dedupe_key?: string | null;
    item_id?: string | null;
    batch_id?: string | null;
    turn_id?: string | null;
  } | null;
};

const sourceRegistry = new Map<string, WorldSourceSeen>();

const sourceKey = (input: { room_id: string; source_id?: string | null; world_id: string }): string =>
  `${input.room_id}:${input.source_id ?? `minecraft:${input.world_id}`}:${input.world_id}`;

export function recordWorldSourceSeen(event: HelixWorldEvent): WorldSourceSeen {
  const sourceId = event.source_id ?? `minecraft:${event.world_id}`;
  const key = sourceKey({ room_id: event.room_id, source_id: sourceId, world_id: event.world_id });
  const existing = sourceRegistry.get(key);
  const actorIds = new Set(existing?.actor_ids ?? []);
  if (event.actor_id) actorIds.add(event.actor_id);
  const next: WorldSourceSeen = {
    room_id: event.room_id,
    source_id: sourceId,
    world_id: event.world_id,
    actor_ids: Array.from(actorIds).slice(-24),
    latest_actor_id: event.actor_id ?? null,
    latest_actor_label: event.actor_label ?? null,
    latest_event_type: event.event_type,
    latest_ts: event.ts,
    event_count: (existing?.event_count ?? 0) + 1,
    latest_debug: existing?.latest_debug ?? null,
  };
  sourceRegistry.set(key, next);
  return next;
}

export function updateWorldSourceDebug(
  event: HelixWorldEvent,
  debug: NonNullable<WorldSourceSeen["latest_debug"]>,
): void {
  const sourceId = event.source_id ?? `minecraft:${event.world_id}`;
  const key = sourceKey({ room_id: event.room_id, source_id: sourceId, world_id: event.world_id });
  const existing = sourceRegistry.get(key);
  if (!existing) return;
  sourceRegistry.set(key, {
    ...existing,
    latest_debug: debug,
  });
}

export function listWorldSourcesSeen(): WorldSourceSeen[] {
  return Array.from(sourceRegistry.values()).sort((a: WorldSourceSeen, b: WorldSourceSeen) =>
    b.latest_ts.localeCompare(a.latest_ts),
  );
}

export function resetWorldSourceRegistry(): void {
  sourceRegistry.clear();
}
