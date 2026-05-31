import crypto from "node:crypto";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { MinecraftRouteObjectiveState } from "@shared/helix-minecraft-route-objective";
import type { MinecraftRouteRehearsal } from "./minecraft-end-return-route-builder";

export type MinecraftRouteLifecycleReason =
  | "no_transition"
  | "objective_not_active"
  | "gateway_reached"
  | "dimension_transition_to_overworld"
  | "player_death"
  | "dimension_mismatch";

export type MinecraftRouteLifecycleReceipt = {
  schema: "helix.minecraft_route_lifecycle_receipt.v1";
  receipt_id: string;
  objective_id: string;
  route_rehearsal_id?: string | null;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  reason: MinecraftRouteLifecycleReason;
  previous_lifecycle: MinecraftRouteObjectiveState["lifecycle"];
  next_lifecycle: MinecraftRouteObjectiveState["lifecycle"];
  previous_intent_status: MinecraftRouteObjectiveState["intent_status"];
  next_intent_status: MinecraftRouteObjectiveState["intent_status"];
  route_stage_status: "unchanged" | "gateway_reached" | "completed" | "stale";
  evidence_refs: string[];
  instruction_authority: "none";
  ask_instruction_authority: "none";
  ask_context_policy: "evidence_only";
  context_role: "tool_evidence";
  creates_ask_turn: false;
  turn_triggered: false;
  raw_user_text_included: false;
  model_invoked: false;
  derived_by_deterministic_reducer: true;
  ts: string;
};

export type MinecraftRouteLifecycleReduction = {
  objective: MinecraftRouteObjectiveState;
  receipt: MinecraftRouteLifecycleReceipt;
};

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const readString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const readNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const distance2d = (
  a: { x: number; z: number },
  b: { x: number; z: number },
): number => Math.hypot(a.x - b.x, a.z - b.z);

const locationFromEvent = (event: HelixWorldEvent): { dimension: string | null; x: number | null; z: number | null } => {
  const location = readRecord(event.location);
  const meta = readRecord(event.meta);
  return {
    dimension: readString(location?.dimension, meta?.dimension, meta?.to_dimension),
    x: readNumber(location?.x, location?.block_x, meta?.x, meta?.block_x),
    z: readNumber(location?.z, location?.block_z, meta?.z, meta?.block_z),
  };
};

const dimensionTransition = (event: HelixWorldEvent): { from: string | null; to: string | null } => {
  const location = readRecord(event.location);
  const meta = readRecord(event.meta);
  return {
    from: readString(meta?.from_dimension, meta?.from, location?.from_dimension),
    to: readString(meta?.to_dimension, meta?.to, location?.dimension, meta?.dimension),
  };
};

const lifecycleReceipt = (input: {
  objective: MinecraftRouteObjectiveState;
  nextObjective: MinecraftRouteObjectiveState;
  rehearsal?: MinecraftRouteRehearsal | null;
  event: HelixWorldEvent;
  reason: MinecraftRouteLifecycleReason;
  routeStageStatus: MinecraftRouteLifecycleReceipt["route_stage_status"];
  now: string;
}): MinecraftRouteLifecycleReceipt => ({
  schema: "helix.minecraft_route_lifecycle_receipt.v1",
  receipt_id: `minecraft_route_lifecycle:${hashShort([
    input.objective.objective_id,
    input.event.event_type,
    input.event.ts,
    input.reason,
  ])}`,
  objective_id: input.objective.objective_id,
  route_rehearsal_id: input.rehearsal?.route_rehearsal_id ?? null,
  room_id: input.objective.room_id,
  world_id: input.objective.world_id,
  actor_label: input.objective.actor_label ?? input.event.actor_label ?? null,
  reason: input.reason,
  previous_lifecycle: input.objective.lifecycle,
  next_lifecycle: input.nextObjective.lifecycle,
  previous_intent_status: input.objective.intent_status,
  next_intent_status: input.nextObjective.intent_status,
  route_stage_status: input.routeStageStatus,
  evidence_refs: Array.from(new Set([
    ...input.objective.evidence_refs,
    ...(input.rehearsal?.evidence_refs ?? []),
    ...input.event.evidence_refs,
  ])).slice(-48),
  instruction_authority: "none",
  ask_instruction_authority: "none",
  ask_context_policy: "evidence_only",
  context_role: "tool_evidence",
  creates_ask_turn: false,
  turn_triggered: false,
  raw_user_text_included: false,
  model_invoked: false,
  derived_by_deterministic_reducer: true,
  ts: input.now,
});

export function reduceMinecraftRouteObjectiveLifecycle(input: {
  objective: MinecraftRouteObjectiveState;
  rehearsal?: MinecraftRouteRehearsal | null;
  event: HelixWorldEvent;
  now?: string;
}): MinecraftRouteLifecycleReduction {
  const now = input.now ?? input.event.ts;
  const objective = input.objective;
  let nextObjective = objective;
  let reason: MinecraftRouteLifecycleReason = "no_transition";
  let routeStageStatus: MinecraftRouteLifecycleReceipt["route_stage_status"] = "unchanged";

  if (objective.lifecycle !== "active") {
    reason = "objective_not_active";
  } else if (["player_death", "death"].includes(input.event.event_type)) {
    reason = "player_death";
    routeStageStatus = "stale";
    nextObjective = {
      ...objective,
      lifecycle: "stale",
      intent_status: "cancelled",
      updated_at: now,
      evidence_refs: Array.from(new Set([...objective.evidence_refs, ...input.event.evidence_refs])),
    };
  } else if (["world_change", "dimension_transition", "dimension_changed"].includes(input.event.event_type)) {
    const transition = dimensionTransition(input.event);
    if (objective.intent_label === "return_home_from_end" && transition.to === "minecraft:overworld") {
      reason = "dimension_transition_to_overworld";
      routeStageStatus = "completed";
      nextObjective = {
        ...objective,
        lifecycle: "completed",
        intent_status: "completed",
        updated_at: now,
        evidence_refs: Array.from(new Set([...objective.evidence_refs, ...input.event.evidence_refs])),
      };
    } else if (transition.to && input.rehearsal?.candidate_next_waypoint && transition.to !== input.rehearsal.candidate_next_waypoint.dimension) {
      reason = "dimension_mismatch";
      routeStageStatus = "stale";
      nextObjective = {
        ...objective,
        lifecycle: "stale",
        updated_at: now,
        evidence_refs: Array.from(new Set([...objective.evidence_refs, ...input.event.evidence_refs])),
      };
    }
  } else if (input.event.event_type === "player_location_sample" && input.rehearsal?.candidate_next_waypoint) {
    const location = locationFromEvent(input.event);
    const waypoint = input.rehearsal.candidate_next_waypoint;
    if (
      location.dimension === waypoint.dimension &&
      location.x !== null &&
      location.z !== null &&
      distance2d({ x: location.x, z: location.z }, waypoint) <= 4
    ) {
      reason = "gateway_reached";
      routeStageStatus = "gateway_reached";
      nextObjective = {
        ...objective,
        updated_at: now,
        evidence_refs: Array.from(new Set([...objective.evidence_refs, ...input.event.evidence_refs])),
      };
    }
  }

  return {
    objective: nextObjective,
    receipt: lifecycleReceipt({
      objective,
      nextObjective,
      rehearsal: input.rehearsal,
      event: input.event,
      reason,
      routeStageStatus,
      now,
    }),
  };
}
