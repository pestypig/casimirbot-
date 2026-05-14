import crypto from "node:crypto";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  HELIX_MINECRAFT_WORLD_SENSE_CONTEXT_SCHEMA,
  HELIX_MINECRAFT_WORLD_SENSE_EVENT_SCHEMA,
  type HelixMinecraftEntitySenseSummary,
  type HelixMinecraftWorldSenseInterpretationHint,
  type HelixMinecraftWorldSenseBoundingBox,
  type HelixMinecraftWorldSenseContext,
  type HelixMinecraftWorldSenseEvent,
  type HelixMinecraftWorldSenseEventType,
} from "@shared/helix-minecraft-world-sense";
import type { HelixCategorizationEvent } from "@shared/helix-categorization-event";
import type { HelixSyntheticEvidence } from "@shared/helix-synthetic-evidence";
import { recordCategorizationEvent } from "./categorization-bus";
import { recordSyntheticEvidence } from "./synthetic-evidence-ledger";

type WorldSenseWindow = {
  key: string;
  roomId: string;
  worldId: string;
  actorKey: string;
  events: HelixMinecraftWorldSenseEvent[];
  latestContext: HelixMinecraftWorldSenseContext | null;
};

export type MinecraftWorldSenseIngestResult = {
  world_sense_event: HelixMinecraftWorldSenseEvent | null;
  world_sense_context: HelixMinecraftWorldSenseContext | null;
};

export type MinecraftWorldSenseReduction = {
  summary: string;
  categorization_events: HelixCategorizationEvent[];
  synthetic_evidence: HelixSyntheticEvidence[];
};

const windows = new Map<string, WorldSenseWindow>();
const latestContextByRoom = new Map<string, HelixMinecraftWorldSenseContext>();

const WINDOW_MAX_EVENTS = 250;
const WINDOW_MS = 180_000;

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

const readBoolean = (...values: unknown[]): boolean | null => {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string" && ["true", "false"].includes(value.toLowerCase())) {
      return value.toLowerCase() === "true";
    }
  }
  return null;
};

const readStringArray = (...values: unknown[]): string[] => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.map((entry: unknown) => String(entry ?? "").trim()).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) return [value.trim()];
  }
  return [];
};

const readBlockTypeArray = (...values: unknown[]): string[] => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value
        .map((entry: unknown) => {
          if (typeof entry === "string") return entry.trim();
          const record = readRecord(entry);
          return readString(record?.type, record?.block_type);
        })
        .filter((entry: string | null): entry is string => Boolean(entry));
    }
    if (typeof value === "string" && value.trim()) return [value.trim()];
  }
  return [];
};

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((entry: unknown) => String(entry ?? "").trim()).filter(Boolean)));

const normalizeEntityType = (value: string | null): string | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  return lower.includes(":") ? lower : `minecraft:${lower}`;
};

const readBoundingBox = (value: unknown): HelixMinecraftWorldSenseBoundingBox | null => {
  const record = readRecord(value);
  if (!record) return null;
  const minRecord = readRecord(record.min);
  const maxRecord = readRecord(record.max);
  const minX = readNumber(record.min_x, minRecord?.x);
  const minY = readNumber(record.min_y, minRecord?.y);
  const minZ = readNumber(record.min_z, minRecord?.z);
  const maxX = readNumber(record.max_x, maxRecord?.x);
  const maxY = readNumber(record.max_y, maxRecord?.y);
  const maxZ = readNumber(record.max_z, maxRecord?.z);
  if (minX === null || minY === null || minZ === null || maxX === null || maxY === null || maxZ === null) {
    return null;
  }
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
};

const mapEventType = (eventType: string): HelixMinecraftWorldSenseEventType | null => {
  const normalized = eventType.trim().toLowerCase();
  if (normalized === "block_edit") return "block_edit";
  if (["entity_cluster_sample", "passive_mob_cluster", "animal_cluster_sample"].includes(normalized)) {
    return "entity_cluster_sample";
  }
  if (["containment_context_sample", "containment_context"].includes(normalized)) {
    return "containment_context_sample";
  }
  if (["item_flow_context", "item_flow_sample", "item_acquired", "item_used"].includes(normalized)) return "item_flow_context";
  if (["environment_context_sample", "environment_context"].includes(normalized)) return "environment_context_sample";
  if (["hazard_context_sample", "hazard_context"].includes(normalized)) return "hazard_context_sample";
  if (["inventory_context_sample", "inventory_context"].includes(normalized)) return "inventory_context_sample";
  if (["interaction_context_sample", "interaction_context"].includes(normalized)) return "interaction_context_sample";
  if (["hostile_context_sample", "hostile_nearby", "mob_nearby"].includes(normalized)) return "hostile_context_sample";
  if (["fluid_context_sample", "fluid_changed", "bucket_empty", "bucket_fill"].includes(normalized)) return "fluid_context_sample";
  if (["light_context_sample", "light_level_sample"].includes(normalized)) return "light_context_sample";
  if (["path_context_sample", "player_location_sample", "location_sample"].includes(normalized)) return "path_context_sample";
  return null;
};

const normalizeWorldSenseEvent = (event: HelixWorldEvent): HelixMinecraftWorldSenseEvent | null => {
  const meta = readRecord(event.meta);
  const location = readRecord(event.location);
  const type = mapEventType(event.event_type);
  if (!type) return null;
  const evidenceRefs = event.evidence_refs.length > 0
    ? event.evidence_refs
    : [`minecraft:${event.world_id}:${event.ts}:${event.event_type}`];
  const sourceId = event.source_id ?? `minecraft:${event.world_id}`;
  const entityType = normalizeEntityType(readString(meta?.entity_type, meta?.target_entity_type, meta?.entity, meta?.mob_type));
  const itemType = normalizeEntityType(readString(meta?.item_type, meta?.item, event.inventory_delta?.item, event.inventory_delta?.item_id));
  const count = readNumber(meta?.count, meta?.entity_count);
  const boundingBox = readBoundingBox(meta?.bounding_box);
  const nearbyHostiles = readStringArray(meta?.nearby_hostiles, meta?.hostiles);
  const nearbyFluids = readStringArray(meta?.nearby_fluids, meta?.fluids);
  const base = {
    schema: HELIX_MINECRAFT_WORLD_SENSE_EVENT_SCHEMA,
    sense_event_id: `minecraft_world_sense:${hashShort([event.world_id, event.ts, event.event_type, event.meta, event.evidence_refs], 18)}`,
    room_id: event.room_id,
    world_id: event.world_id,
    source_id: sourceId,
    actor_id: event.actor_id ?? null,
    actor_label: event.actor_label ?? null,
    event_type: type,
    ts: event.ts,
    evidence_refs: evidenceRefs,
    context_policy: "compact_context_pack_only" as const,
    raw_logs_included: false as const,
  };
  if (type === "block_edit") {
    const action = readString(meta?.action);
    const blockType = readString(meta?.block_type, meta?.placed_block_type, meta?.previous_block_type);
    if ((action !== "broken" && action !== "placed") || !blockType) return null;
    return {
      ...base,
      block_edit: {
        action,
        block_type: blockType,
        previous_block_type: readString(meta?.previous_block_type, meta?.old_block, meta?.block_before),
        placed_against_block_type: readString(meta?.placed_against_block_type, meta?.placed_against, meta?.target_block),
        face: readString(meta?.face),
        tool_item: readString(meta?.tool_item),
        exact_block_geometry: true,
      },
    };
  }
  if (type === "entity_cluster_sample") {
    if (!entityType || count === null) return null;
    return {
      ...base,
      entity_cluster: {
        entity_type: entityType,
        count,
        bounding_box: boundingBox,
        density: readString(meta?.density) as "low" | "medium" | "high" | null,
        density_score: readNumber(meta?.density_score),
        nearest_player_distance: readNumber(meta?.nearest_player_distance, meta?.distance),
        exact_entity_geometry: true,
      },
    };
  }
  if (type === "containment_context_sample") {
    const nearbyBlocks = readBlockTypeArray(meta?.nearby_blocks, meta?.blocks);
    const likelyBarriers = uniqueStrings([
      ...readStringArray(meta?.likely_barriers),
      ...nearbyBlocks.filter((block) => /fence|wall|trapdoor|door|gate|glass|stone|cobblestone|slab/.test(block.toLowerCase())),
    ]);
    return {
      ...base,
      containment_context: {
        target_entity_type: entityType,
        nearby_blocks: nearbyBlocks,
        likely_barriers: likelyBarriers,
        possible_escape_routes:
          (readString(meta?.possible_escape_routes, meta?.escape_routes) as "low" | "medium" | "high" | "unknown" | null) ?? null,
        pit_depth: readNumber(meta?.pit_depth),
        enclosure_width: readNumber(meta?.enclosure_width, meta?.width),
        enclosure_depth: readNumber(meta?.enclosure_depth, meta?.depth),
      },
    };
  }
  if (type === "item_flow_context" || event.event_type === "item_acquired" || event.event_type === "item_used") {
    if (!itemType) return null;
    return {
      ...base,
      event_type: "item_flow_context",
      item_flow: {
        item_type: itemType,
        action: readString(meta?.action, event.event_type) ?? event.event_type,
        count: readNumber(meta?.count),
        nearby_container: readBoolean(meta?.nearby_container),
        nearby_hopper: readBoolean(meta?.nearby_hopper),
      },
    };
  }
  if (type === "hostile_context_sample" || type === "environment_context_sample" || type === "fluid_context_sample" || type === "light_context_sample" || type === "hazard_context_sample") {
    return {
      ...base,
      environment_context: {
        light_level: readNumber(meta?.light_level),
        biome: readString(meta?.biome),
        nearby_fluids: nearbyFluids,
        nearby_hostiles: nearbyHostiles.length > 0 ? nearbyHostiles : entityType && type === "hostile_context_sample" ? [entityType] : [],
        fall_risk: readString(meta?.fall_risk) as "low" | "medium" | "high" | "unknown" | null,
        fire_or_lava_risk: readString(meta?.fire_or_lava_risk) as "low" | "medium" | "high" | "unknown" | null,
      },
    };
  }
  return {
    ...base,
    path_context: {
      sample_count: readNumber(meta?.sample_count),
      dominant_direction: readString(meta?.dominant_direction, meta?.facing),
      repeated_return: readBoolean(meta?.repeated_return),
    },
    environment_context: {
      light_level: readNumber(meta?.light_level),
      biome: readString(meta?.biome, location?.biome),
      nearby_fluids: nearbyFluids,
      nearby_hostiles: nearbyHostiles,
      fall_risk: readString(meta?.fall_risk) as "low" | "medium" | "high" | "unknown" | null,
      fire_or_lava_risk: readString(meta?.fire_or_lava_risk) as "low" | "medium" | "high" | "unknown" | null,
    },
  };
};

const getWindowKey = (event: HelixMinecraftWorldSenseEvent): string =>
  `${event.room_id}:${event.world_id}:${event.actor_id ?? event.actor_label ?? "world"}`;

const getOrCreateWindow = (event: HelixMinecraftWorldSenseEvent): WorldSenseWindow => {
  const key = getWindowKey(event);
  const existing = windows.get(key);
  if (existing) return existing;
  const next: WorldSenseWindow = {
    key,
    roomId: event.room_id,
    worldId: event.world_id,
    actorKey: event.actor_id ?? event.actor_label ?? "world",
    events: [],
    latestContext: null,
  };
  windows.set(key, next);
  return next;
};

const compactWindow = (window: WorldSenseWindow, nowTs: string): void => {
  const nowMs = Number.isFinite(Date.parse(nowTs)) ? Date.parse(nowTs) : Date.now();
  window.events = window.events
    .filter((event: HelixMinecraftWorldSenseEvent) => {
      const tsMs = Date.parse(event.ts);
      return !Number.isFinite(tsMs) || nowMs - tsMs <= WINDOW_MS;
    })
    .slice(-WINDOW_MAX_EVENTS);
};

const itemFlowRelevantToEntity = (entityType: string, itemType: string): boolean => {
  if (entityType.includes("chicken")) {
    return itemType.includes("egg") || itemType.includes("seed") || itemType.includes("wheat_seeds");
  }
  if (entityType.includes("cow") || entityType.includes("sheep")) return itemType.includes("wheat");
  if (entityType.includes("pig")) return itemType.includes("carrot") || itemType.includes("potato");
  return false;
};

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const isDenseCluster = (cluster: HelixMinecraftEntitySenseSummary): boolean =>
  cluster.density === "high" || (cluster.density_score ?? 0) >= 0.7 || cluster.count >= 6;

const buildInterpretationHints = (
  summaries: HelixMinecraftEntitySenseSummary[],
  environmentNotes: string[],
): HelixMinecraftWorldSenseInterpretationHint[] => {
  const hints: HelixMinecraftWorldSenseInterpretationHint[] = [];
  for (const cluster of summaries) {
    const dense = isDenseCluster(cluster);
    const hasContainment = Boolean(cluster.containment);
    const flow = cluster.item_flow ?? [];
    const hasItemFlow = flow.length > 0;
    const hasContainerFlow = flow.some((entry) => entry.nearby_container === true || entry.nearby_hopper === true);
    const chicken = cluster.entity_type.includes("chicken");
    const confidence = chicken
      ? hasContainment && hasContainerFlow
        ? 0.85
        : hasContainment && hasItemFlow
          ? 0.76
          : hasContainment && dense
            ? 0.62
            : dense
              ? 0.5
              : 0.35
      : hasContainment && dense
        ? 0.62
        : dense
          ? 0.5
          : 0.35;
    const confidenceStep = chicken
      ? confidence >= 0.85
        ? "0.85 containment + egg pickup + container/hopper evidence"
        : confidence >= 0.76
          ? "0.76 containment + repeated egg pickup / seed use / breeding-style item flow"
          : confidence >= 0.62
            ? "0.62 dense cluster appears contained"
            : confidence >= 0.5
              ? "0.50 dense chicken cluster"
              : "0.35 chickens nearby"
      : confidence >= 0.62
        ? "0.62 dense entity cluster appears contained"
        : confidence >= 0.5
          ? "0.50 dense entity cluster"
          : "0.35 entities nearby";
    const label = chicken
      ? confidence >= 0.85
        ? "high-confidence egg-source farm evidence"
        : confidence >= 0.76
          ? "likely chicken farm / egg source"
          : confidence >= 0.62
            ? "possible contained chicken cluster"
            : confidence >= 0.5
              ? "dense chicken cluster"
              : "chickens nearby"
      : hasContainment
        ? `possible contained ${cluster.entity_type.replace(/^minecraft:/, "")} cluster`
        : `${cluster.entity_type.replace(/^minecraft:/, "")} cluster`;
    hints.push({
      hint_id: `minecraft_world_sense_hint:${hashShort([cluster.entity_type, cluster.evidence_refs, confidenceStep], 14)}`,
      hint_type: chicken ? "possible_farm_interpretation" : hasContainment ? "contained_entity_cluster" : "dense_entity_cluster",
      label,
      confidence: clamp(confidence),
      confidence_ladder_step: confidenceStep,
      evidence_refs: cluster.evidence_refs,
      missing_evidence: uniqueStrings([
        hasContainment ? "" : `${cluster.entity_type} cluster needs containment context before farm/pen interpretation.`,
        hasItemFlow ? "" : `${cluster.entity_type} cluster needs item-flow evidence before routine/farm interpretation.`,
        hasContainerFlow ? "" : `${cluster.entity_type} cluster has no hopper/chest/container transfer evidence yet.`,
      ]),
      deterministic: true,
      model_invoked: false,
    });
  }
  if (environmentNotes.some((note) => /hostile|lava|fall|fire/i.test(note))) {
    hints.push({
      hint_id: `minecraft_world_sense_hint:${hashShort(["hazard", environmentNotes], 14)}`,
      hint_type: "hazard_context",
      label: "environment hazard context",
      confidence: 0.7,
      confidence_ladder_step: "hazard context from neutral environment samples",
      evidence_refs: [],
      missing_evidence: [],
      deterministic: true,
      model_invoked: false,
    });
  }
  return hints.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
};

const buildContext = (window: WorldSenseWindow): HelixMinecraftWorldSenseContext | null => {
  const events = window.events.slice().sort((a: HelixMinecraftWorldSenseEvent, b: HelixMinecraftWorldSenseEvent) => a.ts.localeCompare(b.ts) || a.sense_event_id.localeCompare(b.sense_event_id));
  const clusterEvents = events.filter((event: HelixMinecraftWorldSenseEvent) => event.entity_cluster);
  const latestClusterByType = new Map<string, HelixMinecraftWorldSenseEvent>();
  for (const event of clusterEvents) {
    const key = event.entity_cluster!.entity_type;
    const existing = latestClusterByType.get(key);
    if (!existing || existing.ts <= event.ts) latestClusterByType.set(key, event);
  }
  const containmentEvents = events.filter((event: HelixMinecraftWorldSenseEvent) => event.containment_context);
  const itemFlowEvents = events.filter((event: HelixMinecraftWorldSenseEvent) => event.item_flow);
  const environmentEvents = events.filter((event: HelixMinecraftWorldSenseEvent) => event.environment_context);
  const summaries: HelixMinecraftEntitySenseSummary[] = [];
  for (const clusterEvent of latestClusterByType.values()) {
    const cluster = clusterEvent.entity_cluster!;
    const containment = containmentEvents
      .filter((event: HelixMinecraftWorldSenseEvent) => {
        const target = event.containment_context?.target_entity_type;
        return !target || target === cluster.entity_type;
      })
      .at(-1)?.containment_context ?? null;
    const flows = itemFlowEvents
      .filter((event: HelixMinecraftWorldSenseEvent) => event.item_flow && itemFlowRelevantToEntity(cluster.entity_type, event.item_flow.item_type))
      .slice(-5)
      .map((event: HelixMinecraftWorldSenseEvent) => event.item_flow!);
    summaries.push({
      entity_type: cluster.entity_type,
      count: cluster.count,
      density: cluster.density ?? null,
      density_score: cluster.density_score ?? null,
      bounding_box: cluster.bounding_box ?? null,
      nearest_player_distance: cluster.nearest_player_distance ?? null,
      containment: containment
        ? {
            nearby_blocks: containment.nearby_blocks,
            likely_barriers: containment.likely_barriers,
            possible_escape_routes: containment.possible_escape_routes ?? null,
            pit_depth: containment.pit_depth ?? null,
            enclosure_width: containment.enclosure_width ?? null,
            enclosure_depth: containment.enclosure_depth ?? null,
          }
        : null,
      item_flow: flows,
      evidence_refs: uniqueStrings([
        ...clusterEvent.evidence_refs,
        ...(containmentEvents.at(-1)?.evidence_refs ?? []),
        ...itemFlowEvents.flatMap((event: HelixMinecraftWorldSenseEvent) => event.evidence_refs),
      ]).slice(-32),
    });
  }
  if (summaries.length === 0 && environmentEvents.length === 0) return window.latestContext;
  const environmentNotes = uniqueStrings(environmentEvents.flatMap((event: HelixMinecraftWorldSenseEvent) => {
    const environment = event.environment_context;
    if (!environment) return [];
    return [
      typeof environment.light_level === "number" ? `Light level sample: ${environment.light_level}.` : "",
      environment.nearby_fluids.length > 0 ? `Nearby fluids sampled: ${environment.nearby_fluids.join(", ")}.` : "",
      environment.nearby_hostiles.length > 0 ? `Nearby hostiles sampled: ${environment.nearby_hostiles.join(", ")}.` : "",
      environment.fall_risk && environment.fall_risk !== "unknown" ? `Fall risk sampled: ${environment.fall_risk}.` : "",
      environment.fire_or_lava_risk && environment.fire_or_lava_risk !== "unknown" ? `Fire/lava risk sampled: ${environment.fire_or_lava_risk}.` : "",
    ];
  }));
  const missingEvidence = uniqueStrings(summaries.flatMap((summary: HelixMinecraftEntitySenseSummary) => [
    summary.containment ? "" : `${summary.entity_type} cluster has no containment context sample yet.`,
    summary.item_flow && summary.item_flow.length > 0 ? "" : `${summary.entity_type} cluster has no relevant item-flow sample yet.`,
  ]));
  const first = events[0];
  const last = events.at(-1)!;
  const context: HelixMinecraftWorldSenseContext = {
    schema: HELIX_MINECRAFT_WORLD_SENSE_CONTEXT_SCHEMA,
    context_id: `minecraft_world_sense_context:${hashShort([window.key, first.ts, last.ts, summaries], 18)}`,
    room_id: window.roomId,
    world_id: window.worldId,
    actor_label: last.actor_label ?? first.actor_label ?? null,
    from_ts: first.ts,
    to_ts: last.ts,
    entity_clusters: summaries.sort((a: HelixMinecraftEntitySenseSummary, b: HelixMinecraftEntitySenseSummary) => b.count - a.count).slice(0, 8),
    interpretation_hints: buildInterpretationHints(summaries, environmentNotes),
    environment_notes: environmentNotes.slice(-8),
    missing_evidence: missingEvidence.slice(-8),
    evidence_refs: uniqueStrings(events.flatMap((event: HelixMinecraftWorldSenseEvent) => event.evidence_refs)).slice(-48),
    deterministic: true,
    model_invoked: false,
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
  };
  window.latestContext = context;
  latestContextByRoom.set(window.roomId, context);
  return context;
};

export function ingestMinecraftWorldSenseEvent(event: HelixWorldEvent): MinecraftWorldSenseIngestResult {
  const senseEvent = normalizeWorldSenseEvent(event);
  if (!senseEvent) return { world_sense_event: null, world_sense_context: null };
  const window = getOrCreateWindow(senseEvent);
  window.events.push(senseEvent);
  window.events.sort((a: HelixMinecraftWorldSenseEvent, b: HelixMinecraftWorldSenseEvent) => a.ts.localeCompare(b.ts) || a.sense_event_id.localeCompare(b.sense_event_id));
  compactWindow(window, senseEvent.ts);
  return {
    world_sense_event: senseEvent,
    world_sense_context: buildContext(window),
  };
}

export function reduceMinecraftWorldSense(input: {
  threadId: string;
  context: HelixMinecraftWorldSenseContext;
}): MinecraftWorldSenseReduction {
  const clusterSummaries = input.context.entity_clusters.map((cluster: HelixMinecraftEntitySenseSummary) => {
    const containment = cluster.containment
      ? `containment hints: ${[
          cluster.containment.possible_escape_routes ? `escape routes ${cluster.containment.possible_escape_routes}` : "",
          cluster.containment.enclosure_width && cluster.containment.enclosure_depth
            ? `enclosure ${cluster.containment.enclosure_width}x${cluster.containment.enclosure_depth}`
            : "",
          cluster.containment.pit_depth ? `pit depth ${cluster.containment.pit_depth}` : "",
          cluster.containment.likely_barriers.length > 0 ? `barriers ${cluster.containment.likely_barriers.slice(0, 3).join(", ")}` : "",
        ].filter(Boolean).join(", ")}`
      : "containment unknown";
    const flow = cluster.item_flow && cluster.item_flow.length > 0
      ? `item flow: ${cluster.item_flow.map((entry: NonNullable<HelixMinecraftEntitySenseSummary["item_flow"]>[number]) => `${entry.action} ${entry.item_type}`).join(", ")}`
      : "item flow unknown";
    return `${cluster.count} ${cluster.entity_type.replace(/^minecraft:/, "")} (${cluster.density ?? "unknown"} density), ${containment}, ${flow}.`;
  });
  const summary = clusterSummaries.length > 0
    ? clusterSummaries.join(" ")
    : input.context.environment_notes.join(" ");
  const categorizationEvents = [
    ...input.context.entity_clusters.map((cluster: HelixMinecraftEntitySenseSummary) =>
      recordCategorizationEvent({
        thread_id: input.threadId,
        source_event_id: input.context.context_id,
        source_family: "minecraft",
        category: cluster.containment ? "containment_context" : "entity_context",
        summary: `${cluster.count} ${cluster.entity_type} entities observed in compact context${cluster.containment ? " with containment hints" : ""}.`,
        confidence: cluster.containment ? 0.78 : 0.58,
        evidence_refs: cluster.evidence_refs,
        deterministic: true,
        model_invoked: false,
      }),
    ),
    ...input.context.interpretation_hints.map((hint: HelixMinecraftWorldSenseInterpretationHint) =>
      recordCategorizationEvent({
        thread_id: input.threadId,
        source_event_id: input.context.context_id,
        source_family: "minecraft",
        category:
          hint.hint_type === "possible_farm_interpretation" && hint.confidence >= 0.76
            ? "repeated_item_flow"
            : hint.hint_type === "contained_entity_cluster" || hint.hint_type === "possible_farm_interpretation"
            ? "contained_entity_cluster"
            : hint.hint_type === "repeated_item_flow"
              ? "repeated_item_flow"
              : hint.hint_type === "hazard_context"
                ? "hazard_context"
                : "dense_entity_cluster",
        summary: `${hint.label}. Confidence ladder: ${hint.confidence_ladder_step}.`,
        confidence: hint.confidence,
        evidence_refs: hint.evidence_refs,
        deterministic: true,
        model_invoked: false,
      }),
    ),
    ...input.context.entity_clusters
      .filter((cluster: HelixMinecraftEntitySenseSummary) => cluster.item_flow !== undefined && cluster.item_flow.length > 0)
      .map((cluster: HelixMinecraftEntitySenseSummary) =>
        recordCategorizationEvent({
          thread_id: input.threadId,
          source_event_id: input.context.context_id,
          source_family: "minecraft",
          category: "item_flow_context",
          summary: `${cluster.entity_type} cluster has related item-flow evidence.`,
          confidence: 0.72,
          evidence_refs: cluster.evidence_refs,
          deterministic: true,
          model_invoked: false,
        }),
      ),
  ];
  const syntheticEvidence = input.context.entity_clusters.map((cluster: HelixMinecraftEntitySenseSummary) =>
    recordSyntheticEvidence({
      thread_id: input.threadId,
      produced_by: "minecraft_world_sense_reducer",
      claim: `${cluster.count} ${cluster.entity_type} entities were observed${cluster.containment ? " with containment context" : ""}${cluster.item_flow && cluster.item_flow.length > 0 ? " and related item-flow context" : ""}.`,
      support_status: cluster.containment ? "supports" : "partial",
      source_refs: cluster.evidence_refs,
      reusable_context_ref: input.context.context_id,
      deterministic: true,
      model_invoked: false,
    }),
  );
  const interpretationEvidence = input.context.interpretation_hints.map((hint: HelixMinecraftWorldSenseInterpretationHint) =>
    recordSyntheticEvidence({
      thread_id: input.threadId,
      produced_by: "minecraft_world_sense_reducer",
      claim: `${hint.label}: ${hint.confidence_ladder_step}`,
      support_status: hint.confidence >= 0.76 ? "supports" : hint.confidence >= 0.5 ? "partial" : "unknown",
      source_refs: hint.evidence_refs,
      reusable_context_ref: input.context.context_id,
      deterministic: true,
      model_invoked: false,
    }),
  );
  return {
    summary,
    categorization_events: categorizationEvents,
    synthetic_evidence: [...syntheticEvidence, ...interpretationEvidence],
  };
}

export function getLatestMinecraftWorldSenseContextForRoom(roomId: string): HelixMinecraftWorldSenseContext | null {
  return latestContextByRoom.get(roomId) ?? null;
}

export function resetMinecraftWorldSenseWindows(): void {
  windows.clear();
  latestContextByRoom.clear();
}
