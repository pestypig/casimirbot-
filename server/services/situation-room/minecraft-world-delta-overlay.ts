import crypto from "node:crypto";
import {
  HELIX_MINECRAFT_WORLD_DELTA_OVERLAY_SCHEMA,
  type HelixMinecraftWorldDeltaOverlay,
} from "@shared/helix-minecraft-evidence";
import type { HelixMinecraftSpatialEvent } from "@shared/helix-minecraft-spatial-event";

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const chunkFor = (position: { x: number; z: number }): { x: number; z: number } => ({
  x: Math.floor(position.x / 16),
  z: Math.floor(position.z / 16),
});

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
