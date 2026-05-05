import type { HelixSituationThreadBinding } from "@shared/helix-situation-thread-binding";
import {
  listSituationThreadBindings,
  resolveSituationThreadBinding,
} from "./thread-binding-store";

export type SituationBindingResolveReason =
  | "matched"
  | "no_thread_context"
  | "binding_mismatch";

export type SituationBindingResolveResult = {
  binding: HelixSituationThreadBinding | null;
  reason: SituationBindingResolveReason;
  mismatched_bindings: HelixSituationThreadBinding[];
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
    return { binding, reason: "matched", mismatched_bindings: [] };
  }

  const roomId = normalize(input.room_id);
  if (!roomId) return { binding: null, reason: "no_thread_context", mismatched_bindings: [] };

  const sameRoom = listSituationThreadBindings().filter(
    (candidate: HelixSituationThreadBinding) => candidate.room_id === roomId,
  );
  const mismatched = sameRoom.filter((candidate: HelixSituationThreadBinding) => !bindingMatchesKnownIds(candidate, input));
  if (mismatched.length > 0) {
    return {
      binding: null,
      reason: "binding_mismatch",
      mismatched_bindings: mismatched,
    };
  }

  return {
    binding: binding ?? null,
    reason: binding ? "matched" : "no_thread_context",
    mismatched_bindings: [],
  };
}
