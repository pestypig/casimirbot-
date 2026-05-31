import crypto from "node:crypto";
import {
  HELIX_MINECRAFT_WORLD_DELTA_OVERLAY_SCHEMA,
  type HelixMinecraftWorldDeltaOverlay,
} from "@shared/helix-minecraft-evidence";
import type { HelixMinecraftSpatialEvent } from "@shared/helix-minecraft-spatial-event";

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const MAX_DELTAS_PER_CHUNK = 512;
const overlaysByChunk = new Map<string, HelixMinecraftWorldDeltaOverlay>();

const chunkFor = (position: { x: number; z: number }): { x: number; z: number } => ({
  x: Math.floor(position.x / 16),
  z: Math.floor(position.z / 16),
});

const overlayKey = (overlay: Pick<HelixMinecraftWorldDeltaOverlay, "room_id" | "world_id" | "dimension" | "chunk">): string =>
  `${overlay.room_id}:${overlay.world_id}:${overlay.dimension}:${overlay.chunk.x}:${overlay.chunk.z}`;

const persistedOverlayId = (overlay: Pick<HelixMinecraftWorldDeltaOverlay, "room_id" | "world_id" | "dimension" | "chunk">): string =>
  `minecraft_world_delta_overlay:${hashShort([overlay.room_id, overlay.world_id, overlay.dimension, overlay.chunk], 18)}`;

const traversalHintFor = (
  event: HelixMinecraftSpatialEvent,
): HelixMinecraftWorldDeltaOverlay["block_deltas"][number]["traversal_hint"] => {
  const after = (event.block?.after ?? event.block?.target ?? "").toLowerCase();
  if (after.includes("lava") || after.includes("fire") || after.includes("magma")) return "hazard_added";
  if (event.event_type === "block_placed") return "walkable_added";
  if (event.event_type === "block_broken") return "walkable_removed";
  if (event.event_type === "bucket_empty" || event.event_type === "fluid_changed") return "unknown";
  return "unknown";
};

export function reduceMinecraftWorldDeltaOverlay(
  spatialEvent?: HelixMinecraftSpatialEvent | null,
): HelixMinecraftWorldDeltaOverlay | null {
  if (!spatialEvent) return null;
  if (!["block_placed", "block_broken", "bucket_empty", "fluid_changed"].includes(spatialEvent.event_type)) {
    return null;
  }
  const after =
    spatialEvent.block?.after ??
    (spatialEvent.event_type === "block_broken" ? "minecraft:air" : spatialEvent.block?.target) ??
    "minecraft:unknown";
  return {
    schema: HELIX_MINECRAFT_WORLD_DELTA_OVERLAY_SCHEMA,
    overlay_id: `minecraft_world_delta_overlay:${hashShort([spatialEvent.event_id, spatialEvent.location], 18)}`,
    room_id: spatialEvent.room_id,
    world_id: spatialEvent.world_id,
    dimension: spatialEvent.dimension,
    evidence_layer: "persisted_block_delta_overlay",
    evidence_trust: "persisted_overlay",
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    chunk: chunkFor(spatialEvent.location),
    block_deltas: [{
      x: spatialEvent.location.x,
      y: spatialEvent.location.y,
      z: spatialEvent.location.z,
      before: spatialEvent.block?.before ?? null,
      after,
      actor_id: spatialEvent.actor_id ?? null,
      actor_label: spatialEvent.actor_label ?? null,
      ts: spatialEvent.ts,
      traversal_hint: traversalHintFor(spatialEvent),
    }],
    evidence_refs: spatialEvent.evidence_refs,
    creates_ask_turn: false,
    turn_triggered: false,
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    raw_user_text_included: false,
    derived_by_deterministic_reducer: true,
    model_invoked: false,
    ts: spatialEvent.ts,
  };
}

export function persistMinecraftWorldDeltaOverlay(
  overlay?: HelixMinecraftWorldDeltaOverlay | null,
): HelixMinecraftWorldDeltaOverlay | null {
  if (!overlay) return null;
  const key = overlayKey(overlay);
  const previous = overlaysByChunk.get(key);
  const blockDeltas = [
    ...(previous?.block_deltas ?? []),
    ...overlay.block_deltas,
  ]
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(-MAX_DELTAS_PER_CHUNK);
  const next: HelixMinecraftWorldDeltaOverlay = {
    ...overlay,
    overlay_id: persistedOverlayId(overlay),
    block_deltas: blockDeltas,
    evidence_refs: Array.from(new Set([
      ...(previous?.evidence_refs ?? []),
      ...overlay.evidence_refs,
    ])).slice(-MAX_DELTAS_PER_CHUNK),
    ts: blockDeltas.at(-1)?.ts ?? overlay.ts,
  };
  overlaysByChunk.set(key, next);
  return next;
}

export function getMinecraftWorldDeltaOverlay(input: {
  roomId: string;
  worldId: string;
  dimension: string;
  chunk: { x: number; z: number };
}): HelixMinecraftWorldDeltaOverlay | null {
  return overlaysByChunk.get(`${input.roomId}:${input.worldId}:${input.dimension}:${input.chunk.x}:${input.chunk.z}`) ?? null;
}

export function listMinecraftWorldDeltaOverlaysForRoom(roomId: string): HelixMinecraftWorldDeltaOverlay[] {
  return Array.from(overlaysByChunk.values())
    .filter((overlay) => overlay.room_id === roomId)
    .sort((a, b) => a.ts.localeCompare(b.ts) || a.overlay_id.localeCompare(b.overlay_id));
}

export function resetMinecraftWorldDeltaOverlaysForTest(): void {
  overlaysByChunk.clear();
}
