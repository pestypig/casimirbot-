import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA,
  type EnvironmentContainerSummary,
  type EnvironmentHazardSummary,
  type EnvironmentItemSummary,
  type EnvironmentObjectSummary,
  type EnvironmentResourceSummary,
  type HelixEnvironmentDomain,
  type HelixEnvironmentStateSnapshot,
} from "@shared/helix-environment-state-snapshot";
import type { HelixWorldEvent } from "@shared/helix-world-event";

const snapshotsByRoom = new Map<string, HelixEnvironmentStateSnapshot[]>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const numberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const cleanStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(cleanString).filter((entry): entry is string => Boolean(entry)) : [];

const normalizeDomain = (value: unknown): HelixEnvironmentDomain => {
  if (
    value === "minecraft" ||
    value === "game" ||
    value === "virtual_world" ||
    value === "browser_app" ||
    value === "desktop_app" ||
    value === "robotics" ||
    value === "real_world" ||
    value === "custom"
  ) return value;
  return "custom";
};

const normalizeItem = (value: unknown): EnvironmentItemSummary | null => {
  const record = asRecord(value);
  const itemType = cleanString(record?.item_type ?? record?.type ?? record?.item_id);
  if (!record || !itemType) return null;
  const count = numberOrNull(record.count) ?? 1;
  const durability = asRecord(record.durability);
  return {
    item_ref: cleanString(record.item_ref) ?? null,
    item_type: itemType,
    count,
    slot: typeof record.slot === "string" || typeof record.slot === "number" ? record.slot : null,
    display_name: cleanString(record.display_name) ?? null,
    durability: durability && numberOrNull(durability.remaining) !== null && numberOrNull(durability.max) !== null
      ? { remaining: numberOrNull(durability.remaining) ?? 0, max: numberOrNull(durability.max) ?? 0 }
      : null,
    tags: cleanStrings(record.tags),
  };
};

const normalizeObject = (value: unknown): EnvironmentObjectSummary | null => {
  const record = asRecord(value);
  const objectType = cleanString(record?.object_type ?? record?.type ?? record?.entity_type);
  const objectRef = cleanString(record?.object_ref ?? record?.entity_ref ?? record?.id) ?? objectType;
  if (!record || !objectType || !objectRef) return null;
  return {
    object_ref: objectRef,
    object_type: objectType,
    distance: numberOrNull(record.distance),
    relative_direction: cleanString(record.relative_direction) ?? null,
    tags: cleanStrings(record.tags),
    state: asRecord(record.state) ?? undefined,
  };
};

const normalizeContainer = (value: unknown): EnvironmentContainerSummary | null => {
  const record = asRecord(value);
  const containerType = cleanString(record?.container_type ?? record?.type);
  const containerRef = cleanString(record?.container_ref ?? record?.id) ?? containerType;
  if (!record || !containerType || !containerRef) return null;
  const contents = Array.isArray(record.contents_summary)
    ? record.contents_summary.map(normalizeItem).filter((entry): entry is EnvironmentItemSummary => Boolean(entry))
    : [];
  return {
    container_ref: containerRef,
    container_type: containerType,
    contents_known: record.contents_known === true || contents.length > 0,
    contents_summary: contents,
    contents_hash: cleanString(record.contents_hash) ?? null,
    last_verified_at: cleanString(record.last_verified_at) ?? null,
  };
};

const normalizeResource = (value: unknown): EnvironmentResourceSummary | null => {
  const record = asRecord(value);
  const resourceType = cleanString(record?.resource_type ?? record?.type);
  const resourceRef = cleanString(record?.resource_ref ?? record?.id) ?? resourceType;
  if (!record || !resourceType || !resourceRef) return null;
  const state = record.state === "available" || record.state === "growing" || record.state === "depleted" || record.state === "unknown"
    ? record.state
    : "unknown";
  return {
    resource_ref: resourceRef,
    resource_type: resourceType,
    state,
    amount: numberOrNull(record.amount),
    tags: cleanStrings(record.tags),
  };
};

const normalizeHazard = (value: unknown): EnvironmentHazardSummary | null => {
  const record = asRecord(value);
  const hazardType = cleanString(record?.hazard_type ?? record?.type);
  const hazardRef = cleanString(record?.hazard_ref ?? record?.id) ?? hazardType;
  if (!record || !hazardType || !hazardRef) return null;
  const severity = record.severity === "critical" || record.severity === "warning" || record.severity === "watch" || record.severity === "info"
    ? record.severity
    : "watch";
  return {
    hazard_ref: hazardRef,
    hazard_type: hazardType,
    severity,
    evidence_refs: cleanStrings(record.evidence_refs),
  };
};

export function normalizeEnvironmentStateSnapshot(input: {
  snapshot: unknown;
  event?: HelixWorldEvent | null;
  threadId?: string | null;
}): HelixEnvironmentStateSnapshot | null {
  const record = asRecord(input.snapshot);
  if (!record) return null;
  const event = input.event ?? null;
  const domain = normalizeDomain(record.domain ?? asRecord(event?.meta)?.domain);
  const roomId = cleanString(record.room_id) ?? event?.room_id ?? null;
  const sourceId = cleanString(record.source_id) ?? event?.source_id ?? "source:environment";
  const ts = cleanString(record.ts) ?? event?.ts ?? new Date().toISOString();
  if (!roomId) return null;
  const actorState = asRecord(record.actor_state);
  const inventoryState = asRecord(record.inventory_state);
  const objectState = asRecord(record.object_state);
  const focus = asRecord(record.focus);
  const domainSpecific = asRecord(record.domain_specific);
  const snapshot: HelixEnvironmentStateSnapshot = {
    schema: HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA,
    snapshot_id: cleanString(record.snapshot_id) ?? `environment_snapshot:${hashShort([roomId, sourceId, ts, record.section_hashes ?? null])}`,
    domain,
    domain_adapter: cleanString(record.domain_adapter) ?? cleanString(asRecord(event?.meta)?.domain_adapter) ?? `${domain}.adapter.v1`,
    room_id: roomId,
    world_id: cleanString(record.world_id) ?? event?.world_id ?? null,
    source_id: sourceId,
    actor_id: cleanString(record.actor_id) ?? event?.actor_id ?? null,
    actor_label: cleanString(record.actor_label) ?? event?.actor_label ?? null,
    ts,
    source_tick: numberOrNull(record.source_tick),
    actor_state: actorState ? {
      health: numberOrNull(actorState.health),
      food_level: numberOrNull(actorState.food_level),
      saturation: numberOrNull(actorState.saturation),
      mode: cleanString(actorState.mode) ?? null,
      status_flags: cleanStrings(actorState.status_flags),
    } : undefined,
    inventory_state: inventoryState ? {
      selected_item: normalizeItem(inventoryState.selected_item) ?? null,
      carried_items: Array.isArray(inventoryState.carried_items)
        ? inventoryState.carried_items.map(normalizeItem).filter((entry): entry is EnvironmentItemSummary => Boolean(entry))
        : [],
      equipped_items: Array.isArray(inventoryState.equipped_items)
        ? inventoryState.equipped_items.map(normalizeItem).filter((entry): entry is EnvironmentItemSummary => Boolean(entry))
        : [],
      inventory_hash: cleanString(inventoryState.inventory_hash) ?? null,
      changed_since_last_snapshot: inventoryState.changed_since_last_snapshot === true,
    } : undefined,
    object_state: objectState ? {
      nearby_entities: Array.isArray(objectState.nearby_entities)
        ? objectState.nearby_entities.map(normalizeObject).filter((entry): entry is EnvironmentObjectSummary => Boolean(entry))
        : [],
      nearby_containers: Array.isArray(objectState.nearby_containers)
        ? objectState.nearby_containers.map(normalizeContainer).filter((entry): entry is EnvironmentContainerSummary => Boolean(entry))
        : [],
      resources: Array.isArray(objectState.resources)
        ? objectState.resources.map(normalizeResource).filter((entry): entry is EnvironmentResourceSummary => Boolean(entry))
        : [],
      hazards: Array.isArray(objectState.hazards)
        ? objectState.hazards.map(normalizeHazard).filter((entry): entry is EnvironmentHazardSummary => Boolean(entry))
        : [],
    } : undefined,
    focus: focus ? {
      target_kind: focus.target_kind === "object" || focus.target_kind === "entity" || focus.target_kind === "block" || focus.target_kind === "ui" || focus.target_kind === "empty"
        ? focus.target_kind
        : "unknown",
      target_ref: cleanString(focus.target_ref) ?? null,
      target_type: cleanString(focus.target_type) ?? null,
      distance: numberOrNull(focus.distance),
      line_of_sight: typeof focus.line_of_sight === "boolean" ? focus.line_of_sight : null,
      reachable: typeof focus.reachable === "boolean" ? focus.reachable : null,
    } : undefined,
    section_hashes: asRecord(record.section_hashes) as Record<string, string> ?? {},
    changed_sections: cleanStrings(record.changed_sections),
    domain_specific: domainSpecific ? {
      ...domainSpecific,
      minecraft: {
        ...(asRecord(domainSpecific.minecraft) ?? {}),
        raw_nbt_included: false,
      },
    } : domain === "minecraft" ? { minecraft: { raw_nbt_included: false } } : undefined,
    evidence_refs: cleanStrings(record.evidence_refs).length ? cleanStrings(record.evidence_refs) : event?.evidence_refs ?? [],
    deterministic: true,
    model_invoked: false,
    assistant_answer: false,
    raw_payload_included: false,
    context_policy: "compact_context_pack_only",
  };
  return snapshot;
}

export function extractEnvironmentStateSnapshotFromWorldEvent(event: HelixWorldEvent): HelixEnvironmentStateSnapshot | null {
  if (event.event_type !== "environment_state_snapshot") return null;
  const meta = asRecord(event.meta);
  const snapshot = meta?.snapshot ?? meta?.environment_state_snapshot ?? null;
  const snapshotRecord = asRecord(snapshot);
  const minecraft = asRecord(asRecord(snapshotRecord?.domain_specific)?.minecraft);
  if (snapshotRecord?.raw_payload_included === true || minecraft?.raw_nbt_included === true) return null;
  return normalizeEnvironmentStateSnapshot({ snapshot, event });
}

export function ingestEnvironmentStateSnapshot(snapshot: HelixEnvironmentStateSnapshot): HelixEnvironmentStateSnapshot {
  const list = snapshotsByRoom.get(snapshot.room_id) ?? [];
  const next = [...list.filter((entry) => entry.snapshot_id !== snapshot.snapshot_id), snapshot]
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(-40);
  snapshotsByRoom.set(snapshot.room_id, next);
  return snapshot;
}

export function listEnvironmentStateSnapshots(input: {
  roomId: string;
  limit?: number;
}): HelixEnvironmentStateSnapshot[] {
  return (snapshotsByRoom.get(input.roomId) ?? []).slice(-(input.limit ?? 20));
}

export function getLatestEnvironmentStateSnapshot(roomId: string): HelixEnvironmentStateSnapshot | null {
  return listEnvironmentStateSnapshots({ roomId, limit: 1 }).at(-1) ?? null;
}

export function getPreviousEnvironmentStateSnapshot(input: {
  roomId: string;
  snapshotId: string;
}): HelixEnvironmentStateSnapshot | null {
  const list = snapshotsByRoom.get(input.roomId) ?? [];
  const index = list.findIndex((entry) => entry.snapshot_id === input.snapshotId);
  if (index > 0) return list[index - 1] ?? null;
  if (index < 0 && list.length > 0) return list.at(-1) ?? null;
  return null;
}

export function isRedundantEnvironmentStateSnapshot(snapshot: HelixEnvironmentStateSnapshot): boolean {
  const previous = getPreviousEnvironmentStateSnapshot({
    roomId: snapshot.room_id,
    snapshotId: snapshot.snapshot_id,
  });
  if (!previous) return false;
  if (snapshot.changed_sections.length > 0) return false;
  return stableJson(previous.section_hashes) === stableJson(snapshot.section_hashes);
}

export function resetEnvironmentStateSnapshotWindowsForTest(): void {
  snapshotsByRoom.clear();
}
