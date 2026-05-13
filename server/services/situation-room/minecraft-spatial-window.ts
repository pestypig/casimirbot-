import crypto from "node:crypto";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  HELIX_MINECRAFT_SPATIAL_EVENT_SCHEMA,
  type HelixMinecraftSpatialEvent,
  type HelixMinecraftSpatialEventType,
} from "@shared/helix-minecraft-spatial-event";
import {
  HELIX_MINECRAFT_SPATIAL_EPISODE_SCHEMA,
  type HelixMinecraftSpatialEpisode,
} from "@shared/helix-minecraft-spatial-episode";
import { recognizeMinecraftBuildPatterns } from "./minecraft-build-pattern-recognizer";

type SpatialWindow = {
  key: string;
  roomId: string;
  worldId: string;
  actorKey: string;
  events: HelixMinecraftSpatialEvent[];
  latestEpisode: HelixMinecraftSpatialEpisode | null;
};

export type MinecraftSpatialIngestResult = {
  spatial_event: HelixMinecraftSpatialEvent | null;
  spatial_episode: HelixMinecraftSpatialEpisode | null;
};

const spatialWindows = new Map<string, SpatialWindow>();
const latestEpisodesByRoom = new Map<string, HelixMinecraftSpatialEpisode>();

const SPATIAL_WINDOW_MAX_EVENTS = 250;
const SPATIAL_WINDOW_MS = 180_000;

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
};

const readString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const readFace = (...values: unknown[]): HelixMinecraftSpatialEvent["block"] extends infer Block
  ? Block extends { face?: infer Face }
    ? Face
    : never
  : never => {
  const value = readString(...values);
  return value === "north" ||
    value === "south" ||
    value === "east" ||
    value === "west" ||
    value === "up" ||
    value === "down"
    ? value
    : null;
};

const mapEventType = (eventType: string): HelixMinecraftSpatialEventType | null => {
  const normalized = eventType.trim().toLowerCase();
  if (["block_broken", "block_break", "block_mined", "block_dig", "block_dug"].includes(normalized)) return "block_broken";
  if (["block_placed", "block_place"].includes(normalized)) return "block_placed";
  if (["item_used", "player_item_used"].includes(normalized)) return "item_used";
  if (["item_dropped"].includes(normalized)) return "item_dropped";
  if (["bucket_empty", "bucket_emptied"].includes(normalized)) return "bucket_empty";
  if (["bucket_fill", "bucket_filled"].includes(normalized)) return "bucket_fill";
  if (["fluid_changed", "fluid_update"].includes(normalized)) return "fluid_changed";
  if (["player_location_sample", "location_sample", "player_moved"].includes(normalized)) return "player_location_sample";
  if (["surface_transition"].includes(normalized)) return "surface_transition";
  if (["light_level_sample"].includes(normalized)) return "light_level_sample";
  if (["hostile_nearby", "mob_nearby"].includes(normalized)) return "hostile_nearby";
  if (["creeper_fuse_started"].includes(normalized)) return "creeper_fuse_started";
  if (["explosion_imminent"].includes(normalized)) return "explosion_imminent";
  return null;
};

const hasOwnNumber = (record: Record<string, unknown> | null, key: string): boolean =>
  typeof record?.[key] === "number" && Number.isFinite(record[key]);

const isEditSpatialType = (eventType: HelixMinecraftSpatialEventType): boolean =>
  eventType === "block_broken" ||
  eventType === "block_placed" ||
  eventType === "bucket_empty" ||
  eventType === "bucket_fill" ||
  eventType === "fluid_changed";

const isIntegerBlockLocation = (x: number, y: number, z: number): boolean =>
  Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z);

const normalizeSpatialEvent = (event: HelixWorldEvent): HelixMinecraftSpatialEvent | null => {
  const location = readRecord(event.location);
  const meta = readRecord(event.meta);
  const spatialType = mapEventType(event.event_type);
  if (!location || !spatialType) return null;
  const x = readNumber(location.x, location.block_x, meta?.x, meta?.block_x);
  const y = readNumber(location.y, location.block_y, meta?.y, meta?.block_y);
  const z = readNumber(location.z, location.block_z, meta?.z, meta?.block_z);
  if (x === null || y === null || z === null) return null;
  const hasExplicitBlockLocation =
    hasOwnNumber(location, "block_x") ||
    hasOwnNumber(location, "block_y") ||
    hasOwnNumber(location, "block_z") ||
    hasOwnNumber(meta, "block_x") ||
    hasOwnNumber(meta, "block_y") ||
    hasOwnNumber(meta, "block_z");
  if (isEditSpatialType(spatialType) && !hasExplicitBlockLocation && !isIntegerBlockLocation(x, y, z)) {
    return null;
  }
  const blockRecord = readRecord(meta?.block) ?? readRecord((event as unknown as Record<string, unknown>).block);
  const poseRecord = readRecord(meta?.player_pose) ?? readRecord(meta?.pose);
  const environmentRecord = readRecord(meta?.environment);
  const nearbyFluids = Array.isArray(environmentRecord?.nearby_fluids)
    ? environmentRecord.nearby_fluids
        .map((entry) => readRecord(entry))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .map((entry) => ({
          type: String(entry.type ?? "").includes("water") ? ("water" as const) : ("lava" as const),
          distance: readNumber(entry.distance) ?? 0,
        }))
    : meta?.lava_nearby === true
      ? [{ type: "lava" as const, distance: readNumber(meta.lava_distance) ?? 1 }]
      : [];
  const nearbyHostiles = Array.isArray(environmentRecord?.nearby_hostiles)
    ? environmentRecord.nearby_hostiles
        .map((entry) => readRecord(entry))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .map((entry) => ({
          type: readString(entry.type, entry.entity_type) ?? "hostile",
          distance: readNumber(entry.distance) ?? 0,
        }))
    : [];
  return {
    schema: HELIX_MINECRAFT_SPATIAL_EVENT_SCHEMA,
    event_id: `minecraft_spatial_event:${hashShort([event.world_id, event.ts, event.event_type, event.location, event.evidence_refs], 18)}`,
    room_id: event.room_id,
    world_id: event.world_id,
    source_id: event.source_id ?? `minecraft:${event.world_id}`,
    actor_id: event.actor_id ?? null,
    actor_label: event.actor_label ?? null,
    event_type: spatialType,
    dimension: readString(location.dimension, meta?.dimension) ?? "minecraft:overworld",
    location: { x, y, z },
    block: {
      before: readString(blockRecord?.before, meta?.block_before, meta?.before, meta?.old_block, meta?.block_type) ?? null,
      after: readString(blockRecord?.after, meta?.block_after, meta?.after, meta?.new_block) ?? null,
      target: readString(blockRecord?.target, meta?.target_block, meta?.target, meta?.block, meta?.block_type) ?? null,
      face: readFace(blockRecord?.face, meta?.face),
    },
    player_pose: {
      yaw: readNumber(poseRecord?.yaw, meta?.yaw),
      pitch: readNumber(poseRecord?.pitch, meta?.pitch),
      facing: readString(poseRecord?.facing, meta?.facing),
    },
    environment: {
      light_level: readNumber(environmentRecord?.light_level, meta?.light_level),
      biome: readString(environmentRecord?.biome, meta?.biome),
      nearby_fluids: nearbyFluids,
      nearby_hostiles: nearbyHostiles,
    },
    inventory_delta: event.inventory_delta ?? null,
    evidence_refs: event.evidence_refs.length > 0 ? event.evidence_refs : [`minecraft:${event.world_id}:${event.ts}:${event.event_type}`],
    ts: event.ts,
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
  };
};

const getWindowKey = (event: HelixMinecraftSpatialEvent): string =>
  `${event.room_id}:${event.world_id}:${event.actor_id ?? event.actor_label ?? "world"}:${event.dimension}`;

const getOrCreateWindow = (event: HelixMinecraftSpatialEvent): SpatialWindow => {
  const key = getWindowKey(event);
  const existing = spatialWindows.get(key);
  if (existing) return existing;
  const next: SpatialWindow = {
    key,
    roomId: event.room_id,
    worldId: event.world_id,
    actorKey: event.actor_id ?? event.actor_label ?? "world",
    events: [],
    latestEpisode: null,
  };
  spatialWindows.set(key, next);
  return next;
};

const compactWindow = (window: SpatialWindow, nowTs: string): void => {
  const nowMs = Number.isFinite(Date.parse(nowTs)) ? Date.parse(nowTs) : Date.now();
  window.events = window.events
    .filter((event) => {
      const tsMs = Date.parse(event.ts);
      return !Number.isFinite(tsMs) || nowMs - tsMs <= SPATIAL_WINDOW_MS;
    })
    .slice(-SPATIAL_WINDOW_MAX_EVENTS);
};

const dominantDirection = (first: HelixMinecraftSpatialEvent, last: HelixMinecraftSpatialEvent): string | null => {
  const dx = last.location.x - first.location.x;
  const dz = last.location.z - first.location.z;
  if (Math.abs(dx) < 1 && Math.abs(dz) < 1) return null;
  if (Math.abs(dx) >= Math.abs(dz)) return dx >= 0 ? "east" : "west";
  return dz >= 0 ? "south" : "north";
};

const buildEpisode = (window: SpatialWindow): HelixMinecraftSpatialEpisode | null => {
  const events = window.events.slice().sort((a, b) => a.ts.localeCompare(b.ts) || a.event_id.localeCompare(b.event_id));
  const editEvents = events.filter((event) =>
    event.event_type === "block_broken" ||
    event.event_type === "block_placed" ||
    event.event_type === "bucket_empty" ||
    event.event_type === "bucket_fill" ||
    event.event_type === "fluid_changed",
  );
  if (editEvents.length < 4) return window.latestEpisode;
  const xs = editEvents.map((event) => event.location.x);
  const ys = editEvents.map((event) => event.location.y);
  const zs = editEvents.map((event) => event.location.z);
  const boundingBox = {
    min: { x: Math.min(...xs), y: Math.min(...ys), z: Math.min(...zs) },
    max: { x: Math.max(...xs), y: Math.max(...ys), z: Math.max(...zs) },
  };
  const first = editEvents[0];
  const last = editEvents.at(-1)!;
  const verticalChange = last.location.y - first.location.y;
  const hypotheses = recognizeMinecraftBuildPatterns({
    events,
    boundingBox,
    verticalChange,
    dominantDirection: dominantDirection(first, last),
  });
  const lowLight = events.some((event) => typeof event.environment?.light_level === "number" && event.environment.light_level < 8);
  const lavaNearby = events.some((event) => event.environment?.nearby_fluids?.some((fluid) => fluid.type === "lava"));
  const hostilesNearby = events.some((event) => event.environment?.nearby_hostiles && event.environment.nearby_hostiles.length > 0);
  const riskNotes = [
    lowLight ? "Lighting or mob-spawn risk may be relevant in the current underground path." : "",
    lavaNearby ? "Lava proximity may help lighting but creates burn/fall risk." : "",
    hostilesNearby ? "Hostile proximity was observed near the spatial episode." : "",
  ].filter(Boolean);
  const knownUnknowns = [
    hypotheses.some((hypothesis) => hypothesis.structure_type === "parallel_trench") &&
    !hypotheses.some((hypothesis) => hypothesis.structure_type === "lava_lighting_channel")
      ? "No lava placement or bucket-empty event has been observed yet."
      : "",
    "Raw block logs stay in Situation Room Debug; Ask receives only this compact spatial episode.",
  ].filter(Boolean);
  const episode: HelixMinecraftSpatialEpisode = {
    schema: HELIX_MINECRAFT_SPATIAL_EPISODE_SCHEMA,
    episode_id: `minecraft_spatial_episode:${hashShort([window.key, first.ts, last.ts, hypotheses.map((entry) => entry.hypothesis_id)], 18)}`,
    room_id: window.roomId,
    world_id: window.worldId,
    actor_label: last.actor_label ?? first.actor_label ?? null,
    from_ts: first.ts,
    to_ts: last.ts,
    bounding_box: boundingBox,
    edit_count: editEvents.length,
    movement_count: events.filter((event) => event.event_type === "player_location_sample").length,
    dominant_direction: dominantDirection(first, last),
    vertical_change: verticalChange,
    structure_hypotheses: hypotheses,
    risk_notes: riskNotes,
    known_unknowns: knownUnknowns,
    evidence_refs: Array.from(new Set(editEvents.flatMap((event) => event.evidence_refs))).slice(-48),
    deterministic: true,
    model_invoked: false,
  };
  window.latestEpisode = episode;
  latestEpisodesByRoom.set(window.roomId, episode);
  return episode;
};

export function ingestMinecraftSpatialWorldEvent(event: HelixWorldEvent): MinecraftSpatialIngestResult {
  const spatialEvent = normalizeSpatialEvent(event);
  if (!spatialEvent) return { spatial_event: null, spatial_episode: null };
  const window = getOrCreateWindow(spatialEvent);
  window.events.push(spatialEvent);
  window.events.sort((a, b) => a.ts.localeCompare(b.ts) || a.event_id.localeCompare(b.event_id));
  compactWindow(window, spatialEvent.ts);
  return {
    spatial_event: spatialEvent,
    spatial_episode: buildEpisode(window),
  };
}

export function getLatestMinecraftSpatialEpisodeForRoom(roomId: string): HelixMinecraftSpatialEpisode | null {
  return latestEpisodesByRoom.get(roomId) ?? null;
}

export function listLatestMinecraftSpatialEpisodes(): HelixMinecraftSpatialEpisode[] {
  return Array.from(latestEpisodesByRoom.values());
}

export function resetMinecraftSpatialWindows(): void {
  spatialWindows.clear();
  latestEpisodesByRoom.clear();
}
