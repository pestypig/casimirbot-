import crypto from "node:crypto";
import {
  HELIX_SITUATION_THREAD_BINDING_RECEIPT_SCHEMA,
  HELIX_SITUATION_THREAD_BINDING_SCHEMA,
  type HelixSituationBindingKind,
  type HelixSituationThreadBinding,
  type HelixSituationThreadBindingReceipt,
} from "@shared/helix-situation-thread-binding";

const bindings = new Map<string, HelixSituationThreadBinding>();

const readNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const maxBindings = (): number =>
  Math.max(1, Math.min(2048, Math.floor(readNumber(process.env.HELIX_SITUATION_BINDING_MAX, 256))));

const ttlMs = (): number =>
  Math.max(0, Math.floor(readNumber(process.env.HELIX_SITUATION_BINDING_TTL_MS, 3_600_000)));

const normalize = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const inferBindingKind = (input: {
  source_id?: string | null;
  graph_id?: string | null;
  world_id?: string | null;
}): HelixSituationBindingKind => {
  if (normalize(input.graph_id)) return "graph";
  if (normalize(input.source_id)) return "source";
  if (normalize(input.world_id)) return "minecraft_world";
  return "room";
};

const buildBindingId = (input: {
  room_id: string;
  source_id?: string | null;
  graph_id?: string | null;
  world_id?: string | null;
  thread_id: string;
}): string =>
  `situation-binding:${hashShort({
    room_id: input.room_id,
    source_id: normalize(input.source_id),
    graph_id: normalize(input.graph_id),
    world_id: normalize(input.world_id),
    thread_id: input.thread_id,
  })}`;

const isExpired = (binding: HelixSituationThreadBinding, nowMs = Date.now()): boolean =>
  Boolean(binding.expires_at && Date.parse(binding.expires_at) <= nowMs);

const pruneBindings = (): void => {
  const nowMs = Date.now();
  for (const [bindingId, binding] of bindings) {
    if (isExpired(binding, nowMs)) bindings.delete(bindingId);
  }
  const overflow = bindings.size - maxBindings();
  if (overflow <= 0) return;
  const oldest = Array.from(bindings.values()).sort((a: HelixSituationThreadBinding, b: HelixSituationThreadBinding) =>
    a.updated_at.localeCompare(b.updated_at),
  );
  for (const binding of oldest.slice(0, overflow)) {
    bindings.delete(binding.binding_id);
  }
};

export function createSituationThreadBinding(input: {
  room_id: string;
  source_id?: string | null;
  graph_id?: string | null;
  world_id?: string | null;
  thread_id: string;
  turn_id?: string | null;
  session_id?: string | null;
  trace_id?: string | null;
  mode?: "observe_only" | "standby_receipts";
  append_policy?: "salient_only" | "all_receipts_debug";
}): HelixSituationThreadBindingReceipt {
  pruneBindings();
  const roomId = normalize(input.room_id);
  const threadId = normalize(input.thread_id);
  if (!roomId || !threadId) {
    return {
      schema: HELIX_SITUATION_THREAD_BINDING_RECEIPT_SCHEMA,
      ok: false,
      error: "missing_thread_context",
      message: "Situation thread binding requires room_id and thread_id.",
    };
  }
  const now = new Date().toISOString();
  const ttl = ttlMs();
  const bindingId = buildBindingId({
    room_id: roomId,
    source_id: input.source_id,
    graph_id: input.graph_id,
    world_id: input.world_id,
    thread_id: threadId,
  });
  const existing = bindings.get(bindingId);
  const binding: HelixSituationThreadBinding = {
    schema: HELIX_SITUATION_THREAD_BINDING_SCHEMA,
    binding_id: bindingId,
    binding_kind: inferBindingKind(input),
    room_id: roomId,
    source_id: normalize(input.source_id),
    graph_id: normalize(input.graph_id),
    world_id: normalize(input.world_id),
    thread_id: threadId,
    turn_id: normalize(input.turn_id),
    session_id: normalize(input.session_id),
    trace_id: normalize(input.trace_id),
    mode: input.mode ?? "standby_receipts",
    append_policy: input.append_policy ?? "salient_only",
    context_policy: "explicit_attachment_only",
    command_lane_enabled: false,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    expires_at: ttl > 0 ? new Date(Date.now() + ttl).toISOString() : null,
  };
  bindings.set(binding.binding_id, binding);
  pruneBindings();
  return {
    schema: HELIX_SITUATION_THREAD_BINDING_RECEIPT_SCHEMA,
    ok: true,
    binding,
    error: null,
    message: "Situation thread binding created.",
  };
}

export function resolveSituationThreadBinding(input: {
  room_id?: string | null;
  source_id?: string | null;
  graph_id?: string | null;
  world_id?: string | null;
}): HelixSituationThreadBinding | null {
  pruneBindings();
  const roomId = normalize(input.room_id);
  if (!roomId) return null;
  const sourceId = normalize(input.source_id);
  const graphId = normalize(input.graph_id);
  const worldId = normalize(input.world_id);
  const matches = Array.from(bindings.values()).filter(
    (binding: HelixSituationThreadBinding) => binding.room_id === roomId,
  );
  const graph = graphId ? matches.find((binding: HelixSituationThreadBinding) => binding.graph_id === graphId) : null;
  if (graph) return graph;
  const source = sourceId ? matches.find((binding: HelixSituationThreadBinding) => binding.source_id === sourceId) : null;
  if (source) return source;
  const world = worldId ? matches.find((binding: HelixSituationThreadBinding) => binding.world_id === worldId) : null;
  if (world) return world;
  return matches.find((binding: HelixSituationThreadBinding) => binding.binding_kind === "room") ?? null;
}

export function listSituationThreadBindings(): HelixSituationThreadBinding[] {
  pruneBindings();
  return Array.from(bindings.values()).sort((a: HelixSituationThreadBinding, b: HelixSituationThreadBinding) =>
    b.updated_at.localeCompare(a.updated_at),
  );
}

export function deleteSituationThreadBinding(bindingId: string): HelixSituationThreadBindingReceipt {
  pruneBindings();
  const binding = bindings.get(bindingId);
  if (!binding) {
    return {
      schema: HELIX_SITUATION_THREAD_BINDING_RECEIPT_SCHEMA,
      ok: false,
      error: "binding_not_found",
      message: "Situation thread binding was not found.",
    };
  }
  bindings.delete(bindingId);
  return {
    schema: HELIX_SITUATION_THREAD_BINDING_RECEIPT_SCHEMA,
    ok: true,
    binding,
    error: null,
    message: "Situation thread binding deleted.",
  };
}

export function resetSituationThreadBindings(): void {
  bindings.clear();
}
