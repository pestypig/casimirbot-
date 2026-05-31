import crypto from "node:crypto";
import type {
  EnvironmentHazardSummary,
  EnvironmentItemSummary,
  EnvironmentPosition,
  EnvironmentResourceSummary,
  HelixEnvironmentStateSnapshot,
} from "@shared/helix-environment-state-snapshot";
import type { HelixWorldEvent } from "@shared/helix-world-event";

export type EnvironmentHazardMemoryEntry = EnvironmentHazardSummary & {
  first_seen_at: string;
  last_seen_at: string;
  observation_count: number;
  peak_severity: EnvironmentHazardSummary["severity"];
  evidence_refs: string[];
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  raw_content_included: false;
};

export type EnvironmentResourceMemoryEntry = EnvironmentResourceSummary & {
  first_seen_at: string;
  last_seen_at: string;
  observation_count: number;
  last_known_state: EnvironmentResourceSummary["state"];
  evidence_refs: string[];
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  raw_content_included: false;
};

export type EnvironmentInventoryTransitionEntry = {
  transition_id: string;
  event_type: string;
  room_id: string;
  world_id?: string | null;
  actor_id?: string | null;
  actor_label?: string | null;
  item_type?: string | null;
  count?: number | null;
  container_ref?: string | null;
  container_type?: string | null;
  status: "consumed" | "acquired" | "used" | "container_opened" | "inventory_changed" | "unknown";
  evidence_refs: string[];
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  creates_ask_turn: false;
  turn_triggered: false;
  raw_user_text_included: false;
  raw_content_included: false;
  ts: string;
};

export type EnvironmentRiskResourceLedger = {
  schema: "helix.environment_risk_resource_ledger.v1";
  room_id: string;
  world_id?: string | null;
  known_hazards: EnvironmentHazardMemoryEntry[];
  known_resources: EnvironmentResourceMemoryEntry[];
  inventory_transitions: EnvironmentInventoryTransitionEntry[];
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  updated_at: string;
};

const severityRank: Record<EnvironmentHazardSummary["severity"], number> = {
  info: 0,
  watch: 1,
  warning: 2,
  critical: 3,
};

const ledgersByRoom = new Map<string, EnvironmentRiskResourceLedger>();

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

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

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const positionKey = (position?: EnvironmentPosition): string =>
  position ? `${Math.round(position.x)}:${Math.round(position.y)}:${Math.round(position.z ?? 0)}` : "unknown_position";

const itemFromEvent = (event: HelixWorldEvent): { item_type?: string | null; count?: number | null } => {
  const meta = readRecord(event.meta);
  const inventory = readRecord(event.inventory_delta);
  return {
    item_type: readString(meta?.item_type, meta?.item, inventory?.item_type, inventory?.item, inventory?.item_id),
    count: readNumber(meta?.count, inventory?.count, inventory?.delta_count),
  };
};

const ledgerFor = (roomId: string, worldId: string | null | undefined, updatedAt: string): EnvironmentRiskResourceLedger =>
  ledgersByRoom.get(roomId) ?? {
    schema: "helix.environment_risk_resource_ledger.v1",
    room_id: roomId,
    world_id: worldId ?? null,
    known_hazards: [],
    known_resources: [],
    inventory_transitions: [],
    evidence_refs: [],
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    updated_at: updatedAt,
  };

const mergeHazard = (
  previous: EnvironmentHazardMemoryEntry | undefined,
  hazard: EnvironmentHazardSummary,
  snapshot: HelixEnvironmentStateSnapshot,
): EnvironmentHazardMemoryEntry => {
  const peakSeverity =
    previous && severityRank[previous.peak_severity] > severityRank[hazard.severity]
      ? previous.peak_severity
      : hazard.severity;
  return {
    ...hazard,
    evidence_refs: uniqueStrings([
      ...(previous?.evidence_refs ?? []),
      snapshot.snapshot_id,
      ...snapshot.evidence_refs,
      ...hazard.evidence_refs,
    ]).slice(-48),
    first_seen_at: previous?.first_seen_at ?? snapshot.ts,
    last_seen_at: snapshot.ts,
    observation_count: (previous?.observation_count ?? 0) + 1,
    peak_severity: peakSeverity,
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    raw_content_included: false,
  };
};

const mergeResource = (
  previous: EnvironmentResourceMemoryEntry | undefined,
  resource: EnvironmentResourceSummary,
  snapshot: HelixEnvironmentStateSnapshot,
): EnvironmentResourceMemoryEntry => ({
  ...resource,
  last_known_state: resource.state ?? previous?.last_known_state ?? "unknown",
  evidence_refs: uniqueStrings([
    ...(previous?.evidence_refs ?? []),
    snapshot.snapshot_id,
    ...snapshot.evidence_refs,
  ]).slice(-48),
  first_seen_at: previous?.first_seen_at ?? snapshot.ts,
  last_seen_at: snapshot.ts,
  observation_count: (previous?.observation_count ?? 0) + 1,
  instruction_authority: "none",
  ask_context_policy: "evidence_only",
  raw_content_included: false,
});

const transitionFromEvent = (event: HelixWorldEvent): EnvironmentInventoryTransitionEntry | null => {
  const eventType = event.event_type.toLowerCase();
  const meta = readRecord(event.meta);
  const item = itemFromEvent(event);
  let status: EnvironmentInventoryTransitionEntry["status"] | null = null;
  if (["item_consume", "item_consumed", "food_eaten"].includes(eventType)) status = "consumed";
  if (["item_acquired", "item_pickup"].includes(eventType)) status = "acquired";
  if (["item_used", "player_interact"].includes(eventType)) status = "used";
  if (["inventory_open", "container_open"].includes(eventType)) status = "container_opened";
  if (["inventory_click", "inventory_context_sample", "inventory_changed"].includes(eventType)) status = "inventory_changed";
  if (!status) return null;
  return {
    transition_id: `environment_inventory_transition:${hashShort([
      event.room_id,
      event.world_id,
      event.actor_id ?? event.actor_label ?? null,
      event.event_type,
      event.ts,
      event.inventory_delta ?? null,
      event.meta ?? null,
    ])}`,
    event_type: event.event_type,
    room_id: event.room_id,
    world_id: event.world_id ?? null,
    actor_id: event.actor_id ?? null,
    actor_label: event.actor_label ?? null,
    item_type: item.item_type ?? null,
    count: item.count,
    container_ref: readString(meta?.container_ref, meta?.container_id),
    container_type: readString(meta?.container_type),
    status,
    evidence_refs: event.evidence_refs.length ? event.evidence_refs : [`world_event:${event.world_id}:${event.ts}:${event.event_type}`],
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    creates_ask_turn: false,
    turn_triggered: false,
    raw_user_text_included: false,
    raw_content_included: false,
    ts: event.ts,
  };
};

const hazardFromEvent = (event: HelixWorldEvent): EnvironmentHazardMemoryEntry | null => {
  const eventType = event.event_type.toLowerCase();
  const meta = readRecord(event.meta);
  if (!["entity_damage", "player_damage", "damage_taken", "player_death", "death", "hazard_context_sample"].includes(eventType)) {
    return null;
  }
  const hazardType =
    eventType === "player_death" || eventType === "death"
      ? "player_death"
      : readString(meta?.hazard_type, meta?.damage_cause, meta?.cause, meta?.entity_type, meta?.source) ?? "damage";
  const severity: EnvironmentHazardSummary["severity"] =
    eventType === "player_death" || eventType === "death"
      ? "critical"
      : readNumber(meta?.health, meta?.current_health) !== null && (readNumber(meta?.health, meta?.current_health) ?? 20) <= 6
        ? "warning"
        : "watch";
  const location = readRecord(event.location);
  const position = location && readNumber(location.x) !== null && readNumber(location.y) !== null
    ? { x: readNumber(location.x) ?? 0, y: readNumber(location.y) ?? 0, z: readNumber(location.z) }
    : undefined;
  return {
    hazard_ref: `hazard:${hashShort([event.room_id, event.world_id, hazardType, positionKey(position)])}`,
    hazard_type: hazardType,
    severity,
    position,
    evidence_refs: event.evidence_refs.length ? event.evidence_refs : [`world_event:${event.world_id}:${event.ts}:${event.event_type}`],
    sensor_scope: "sensor_observable",
    first_seen_at: event.ts,
    last_seen_at: event.ts,
    observation_count: 1,
    peak_severity: severity,
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    raw_content_included: false,
  };
};

export function updateEnvironmentRiskResourceLedgerFromSnapshot(
  snapshot: HelixEnvironmentStateSnapshot,
): EnvironmentRiskResourceLedger {
  const current = ledgerFor(snapshot.room_id, snapshot.world_id, snapshot.ts);
  const hazardMap = new Map(current.known_hazards.map((entry) => [entry.hazard_ref, entry]));
  for (const hazard of snapshot.object_state?.hazards ?? []) {
    hazardMap.set(hazard.hazard_ref, mergeHazard(hazardMap.get(hazard.hazard_ref), hazard, snapshot));
  }
  const resourceMap = new Map(current.known_resources.map((entry) => [entry.resource_ref, entry]));
  for (const resource of snapshot.object_state?.resources ?? []) {
    resourceMap.set(resource.resource_ref, mergeResource(resourceMap.get(resource.resource_ref), resource, snapshot));
  }
  const next: EnvironmentRiskResourceLedger = {
    ...current,
    world_id: snapshot.world_id ?? current.world_id ?? null,
    known_hazards: Array.from(hazardMap.values())
      .sort((a, b) => severityRank[b.peak_severity] - severityRank[a.peak_severity] || b.last_seen_at.localeCompare(a.last_seen_at))
      .slice(0, 64),
    known_resources: Array.from(resourceMap.values())
      .sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at) || a.resource_ref.localeCompare(b.resource_ref))
      .slice(0, 96),
    inventory_transitions: current.inventory_transitions.slice(-96),
    updated_at: snapshot.ts,
  };
  next.evidence_refs = uniqueStrings([
    ...next.known_hazards.flatMap((entry) => entry.evidence_refs),
    ...next.known_resources.flatMap((entry) => entry.evidence_refs),
    ...next.inventory_transitions.flatMap((entry) => entry.evidence_refs),
  ]).slice(-128);
  ledgersByRoom.set(snapshot.room_id, next);
  return next;
}

export function updateEnvironmentRiskResourceLedgerFromWorldEvent(
  event: HelixWorldEvent,
): EnvironmentRiskResourceLedger | null {
  const current = ledgerFor(event.room_id, event.world_id, event.ts);
  const hazard = hazardFromEvent(event);
  const transition = transitionFromEvent(event);
  if (!hazard && !transition) return null;
  const hazardMap = new Map(current.known_hazards.map((entry) => [entry.hazard_ref, entry]));
  if (hazard) {
    const previous = hazardMap.get(hazard.hazard_ref);
    hazardMap.set(hazard.hazard_ref, {
      ...hazard,
      first_seen_at: previous?.first_seen_at ?? hazard.first_seen_at,
      observation_count: (previous?.observation_count ?? 0) + 1,
      peak_severity:
        previous && severityRank[previous.peak_severity] > severityRank[hazard.severity]
          ? previous.peak_severity
          : hazard.severity,
      evidence_refs: uniqueStrings([...(previous?.evidence_refs ?? []), ...hazard.evidence_refs]).slice(-48),
    });
  }
  const next: EnvironmentRiskResourceLedger = {
    ...current,
    known_hazards: Array.from(hazardMap.values())
      .sort((a, b) => severityRank[b.peak_severity] - severityRank[a.peak_severity] || b.last_seen_at.localeCompare(a.last_seen_at))
      .slice(0, 64),
    inventory_transitions: transition
      ? [...current.inventory_transitions.filter((entry) => entry.transition_id !== transition.transition_id), transition].slice(-96)
      : current.inventory_transitions.slice(-96),
    updated_at: event.ts,
  };
  next.evidence_refs = uniqueStrings([
    ...next.known_hazards.flatMap((entry) => entry.evidence_refs),
    ...next.known_resources.flatMap((entry) => entry.evidence_refs),
    ...next.inventory_transitions.flatMap((entry) => entry.evidence_refs),
  ]).slice(-128);
  ledgersByRoom.set(event.room_id, next);
  return next;
}

export function getEnvironmentRiskResourceLedger(roomId: string): EnvironmentRiskResourceLedger | null {
  return ledgersByRoom.get(roomId) ?? null;
}

export function resetEnvironmentRiskResourceLedgersForTest(): void {
  ledgersByRoom.clear();
}
