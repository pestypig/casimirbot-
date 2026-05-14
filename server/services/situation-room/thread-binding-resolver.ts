import type { HelixSituationThreadBinding } from "@shared/helix-situation-thread-binding";
import {
  listSituationThreadBindings,
  resolveSituationThreadBinding,
} from "./thread-binding-store";
import { listWorldSourcesSeen } from "./world-source-registry";

export type SituationBindingResolveReason =
  | "matched"
  | "no_thread_context"
  | "no_active_thread_binding"
  | "source_detected_but_observe_only"
  | "source_id_mismatch"
  | "thread_binding_expired"
  | "binding_mismatch";

export type SituationBindingResolveResult = {
  binding: HelixSituationThreadBinding | null;
  reason: SituationBindingResolveReason;
  mismatched_bindings: HelixSituationThreadBinding[];
  diagnostic: {
    room_id?: string | null;
    source_id?: string | null;
    world_id?: string | null;
    detected_source_count: number;
    active_binding_count: number;
  };
};

const normalize = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const bindingMatchesKnownIds = (
  binding: HelixSituationThreadBinding,
  input: {
    source_id?: string | null;
    graph_id?: string | null;
    world_id?: string | null;
  },
): boolean => {
  const sourceId = normalize(input.source_id);
  const graphId = normalize(input.graph_id);
  const worldId = normalize(input.world_id);
  if (binding.graph_id && graphId && binding.graph_id !== graphId) return false;
  if (binding.source_id && sourceId && binding.source_id !== sourceId) return false;
  if (binding.world_id && worldId && binding.world_id !== worldId) return false;
  return true;
};

export function resolveWorldEventThreadBinding(input: {
  room_id?: string | null;
  source_id?: string | null;
  graph_id?: string | null;
  world_id?: string | null;
}): SituationBindingResolveResult {
  const binding = resolveSituationThreadBinding(input);
  if (binding && bindingMatchesKnownIds(binding, input)) {
    return {
      binding,
      reason: binding.mode === "observe_only" ? "source_detected_but_observe_only" : "matched",
      mismatched_bindings: [],
      diagnostic: {
        room_id: normalize(input.room_id),
        source_id: normalize(input.source_id),
        world_id: normalize(input.world_id),
        detected_source_count: 0,
        active_binding_count: 1,
      },
    };
  }

  const roomId = normalize(input.room_id);
  if (!roomId) {
    return {
      binding: null,
      reason: "no_thread_context",
      mismatched_bindings: [],
      diagnostic: {
        room_id: null,
        source_id: normalize(input.source_id),
        world_id: normalize(input.world_id),
        detected_source_count: 0,
        active_binding_count: 0,
      },
    };
  }

  const sameRoom = listSituationThreadBindings().filter(
    (candidate: HelixSituationThreadBinding) => candidate.room_id === roomId,
  );
  const sameRoomSources = listWorldSourcesSeen().filter((source: { room_id: string }) => source.room_id === roomId);
  const mismatched = sameRoom.filter((candidate: HelixSituationThreadBinding) => !bindingMatchesKnownIds(candidate, input));
  if (mismatched.length > 0) {
    return {
      binding: null,
      reason: "source_id_mismatch",
      mismatched_bindings: mismatched,
      diagnostic: {
        room_id: roomId,
        source_id: normalize(input.source_id),
        world_id: normalize(input.world_id),
        detected_source_count: sameRoomSources.length,
        active_binding_count: sameRoom.length,
      },
    };
  }

  return {
    binding: binding ?? null,
    reason: binding
      ? binding.mode === "observe_only"
        ? "source_detected_but_observe_only"
        : "matched"
      : sameRoomSources.length > 0
        ? "no_active_thread_binding"
        : "no_thread_context",
    mismatched_bindings: [],
    diagnostic: {
      room_id: roomId,
      source_id: normalize(input.source_id),
      world_id: normalize(input.world_id),
      detected_source_count: sameRoomSources.length,
      active_binding_count: sameRoom.length,
    },
  };
}
