import type { HelixEventJournalQueryResult } from "@shared/helix-event-journal-query";
import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";
import type { HelixMinecraftWorldDeltaOverlay } from "@shared/helix-minecraft-evidence";
import type { HelixMinecraftWorldSenseContext } from "@shared/helix-minecraft-world-sense";
import type { HelixLiveSourceDescriptor } from "@shared/helix-live-source-descriptor";
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
import type { HelixSituationSourceCapability } from "@shared/helix-situation-source-capability";
import type {
  StagePlaySourceRouteTargetV1,
  StagePlaySourceRouteV1,
  StagePlaySourceRoutingEntryV1,
  StagePlaySourceRoutingStatusV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import type { LiveSourceObservation } from "@shared/live-source-observation";
import { listLiveSourceObservations } from "../live-source/live-source-observation-store";
import { getLatestEnvironmentStateSnapshot } from "./environment-state-snapshot-window";
import { queryEventWindow } from "./event-window-query";
import { listLiveSourceProducers } from "./live-source-chunk-buffer";
import { listLiveSourceDescriptors } from "./live-source-descriptor-builder";
import { queryMinecraftNavigationState } from "./minecraft-navigation-state-store";
import { listMinecraftWorldDeltaOverlaysForRoom } from "./minecraft-world-delta-overlay";
import { getLatestMinecraftWorldSenseContextForRoom } from "./minecraft-world-sense-window";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";
import { listStagePlayRawSessionBufferEntries } from "../stage-play/stage-play-raw-session-buffer-store";

export const STAGE_PLAY_SOURCE_WINDOW_SCHEMA = "stage_play_source_window/v1" as const;

export type StagePlaySourceWindowV1 = {
  schemaVersion: typeof STAGE_PLAY_SOURCE_WINDOW_SCHEMA;
  resolvedAt: string;
  threadId?: string | null;
  roomId: string;
  worldId?: string | null;
  environmentId?: string | null;
  actorLabel?: string | null;
  freshness: "fresh" | "stale" | "missing" | "mixed" | "unknown";
  latestSourceDescriptorRefs: string[];
  latestSourceProducerRefs: string[];
  latestObservationRefs: string[];
  latestSnapshotRefs: string[];
  latestDeltaOverlayRefs: string[];
  latestChunkSnapshotSampleRefs: string[];
  latestNavigationRefs: string[];
  latestRouteSolverObservationRefs: string[];
  latestWorldSenseContextRefs: string[];
  latestEventWindowRefs: string[];
  latestRawSessionBufferRefs: string[];
  sources: StagePlaySourceRoutingEntryV1[];
  sourceRoutes: StagePlaySourceRouteV1[];
  evidenceRefs: string[];
  compactFacts: {
    sourceDescriptors: Array<{
      descriptorId: string;
      sourceId: string;
      modality: string;
      surface: string;
      origin: string;
      state: string;
      cadenceMs?: number | null;
      latestObservationRefs: string[];
    }>;
    sourceProducers: Array<{
      producerId: string;
      sourceId: string;
      modality: string;
      status: string;
      captureMode: string;
      cadenceMs?: number | null;
      latestChunkId?: string | null;
      contentRetentionPolicy: string;
    }>;
    observations: Array<{
      observationId: string;
      sourceId: string;
      sourceKind: string;
      eventKind: string;
      observedAt: string;
      freshness: string;
      evidenceRefs: string[];
    }>;
    environmentSnapshot?: {
      snapshotId: string;
      domain: string;
      sourceId: string;
      ts: string;
      actorId?: string | null;
      actorLabel?: string | null;
      changedSections: string[];
      localMap?: {
        radius?: number | null;
        salientCellCount: number;
        mapHash?: string | null;
        changedSinceLastSnapshot: boolean;
      } | null;
      chunkSnapshot?: {
        sampleRef: string;
        sampledRadiusChunks?: number | null;
        loadedChunksSampled?: number | null;
        surfaceCellCount: number;
        routeCorridorCellCount: number;
        gatewayBlockCount: number;
        bridgeLikeBlockCount: number;
        hazardCellCount: number;
        mapHash?: string | null;
        changedSinceLastSnapshot: boolean;
      } | null;
    } | null;
    deltaOverlay?: {
      overlayId: string;
      worldId: string;
      dimension: string;
      chunk: { x: number; z: number };
      blockDeltaCount: number;
      traversalHints: string[];
      evidenceRefs: string[];
      ts: string;
    } | null;
    navigation?: {
      stateId?: string | null;
      routeStatus?: string | null;
      policySurfaceStatus?: string | null;
      latestObjectiveId?: string | null;
      latestRehearsalId?: string | null;
      latestDriftEventId?: string | null;
      latestLifecycleReceiptId?: string | null;
      latestSolverObservationRefs: string[];
      missingEvidence: string[];
      evidenceRefs: string[];
      updatedAt?: string | null;
    } | null;
    routeSolverObservations: Array<{
      observationId: string;
      provider: string;
      resultStatus: string;
      plannerExecutionState: string;
      movementRequirements: string[];
      riskFlags: string[];
      missingEvidence: string[];
      evidenceRefs: string[];
      ts: string;
    }>;
    worldSense?: {
      contextId: string;
      fromTs: string;
      toTs: string;
      entityClusterCount: number;
      interpretationHintCount: number;
      environmentNoteCount: number;
      missingEvidence: string[];
      evidenceRefs: string[];
    } | null;
    eventWindow: {
      queryId: string;
      matchedCount: number;
      returnedCount: number;
      eventRefs: string[];
      eventTypes: string[];
      latestEventTs?: string | null;
    };
  };
  authority: {
    assistant_answer: false;
    raw_content_included: false;
    raw_payload_included: false;
    terminal_eligible: false;
    agent_executable: false;
    context_role: "tool_evidence";
    ask_context_policy: "evidence_only";
    instruction_authority: "none";
    ask_instruction_authority: "none";
  };
};

export type ResolveStagePlaySourceWindowInput = {
  roomId: string;
  threadId?: string | null;
  sourceId?: string | null;
  sourceKind?: string | null;
  worldId?: string | null;
  environmentId?: string | null;
  actorLabel?: string | null;
  observationLimit?: number;
  eventLimit?: number;
  now?: string;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const compactObservation = (observation: LiveSourceObservation): StagePlaySourceWindowV1["compactFacts"]["observations"][number] => ({
  observationId: observation.observation_id,
  sourceId: observation.source_id,
  sourceKind: observation.source_kind,
  eventKind: observation.event_kind,
  observedAt: observation.observed_at,
  freshness: observation.freshness.status,
  evidenceRefs: observation.evidence_refs,
});

const compactDescriptor = (
  descriptor: HelixLiveSourceDescriptor,
): StagePlaySourceWindowV1["compactFacts"]["sourceDescriptors"][number] => ({
  descriptorId: descriptor.descriptor_id,
  sourceId: descriptor.source_id,
  modality: descriptor.modality,
  surface: descriptor.serving_context.surface,
  origin: descriptor.serving_context.source_origin,
  state: descriptor.current_state,
  cadenceMs: descriptor.cadence_ms ?? null,
  latestObservationRefs: descriptor.latest_observation_refs,
});

const compactProducer = (
  producer: HelixLiveSourceProducer,
): StagePlaySourceWindowV1["compactFacts"]["sourceProducers"][number] => ({
  producerId: producer.producer_id,
  sourceId: producer.source_id,
  modality: producer.modality,
  status: producer.status,
  captureMode: producer.capture_mode,
  cadenceMs: producer.cadence_ms ?? null,
  latestChunkId: producer.latest_chunk_id ?? null,
  contentRetentionPolicy: producer.raw_content_policy,
});

const freshnessFor = (observations: LiveSourceObservation[]): StagePlaySourceWindowV1["freshness"] => {
  const statuses = uniqueStrings(observations.map((observation) => observation.freshness.status));
  if (statuses.length === 0) return "unknown";
  if (statuses.length > 1) return "mixed";
  return statuses[0] === "blocked" ? "missing" : statuses[0] as StagePlaySourceWindowV1["freshness"];
};

const chunkSampleRefFor = (snapshot: HelixEnvironmentStateSnapshot): string | null => {
  if (!snapshot.chunk_snapshot_summary) return null;
  return `chunk_snapshot_sample:${snapshot.snapshot_id}:${snapshot.chunk_snapshot_summary.map_hash ?? "unhashed"}`;
};

const compactSnapshot = (
  snapshot: HelixEnvironmentStateSnapshot | null,
): StagePlaySourceWindowV1["compactFacts"]["environmentSnapshot"] => {
  if (!snapshot) return null;
  const chunkSampleRef = chunkSampleRefFor(snapshot);
  return {
    snapshotId: snapshot.snapshot_id,
    domain: snapshot.domain,
    sourceId: snapshot.source_id,
    ts: snapshot.ts,
    actorId: snapshot.actor_id ?? null,
    actorLabel: snapshot.actor_label ?? null,
    changedSections: snapshot.changed_sections,
    localMap: snapshot.local_map
      ? {
          radius: snapshot.local_map.radius ?? null,
          salientCellCount: snapshot.local_map.salient_cells?.length ?? 0,
          mapHash: snapshot.local_map.map_hash ?? null,
          changedSinceLastSnapshot: snapshot.local_map.changed_since_last_snapshot === true,
        }
      : null,
    chunkSnapshot: snapshot.chunk_snapshot_summary && chunkSampleRef
      ? {
          sampleRef: chunkSampleRef,
          sampledRadiusChunks: snapshot.chunk_snapshot_summary.sampled_radius_chunks ?? null,
          loadedChunksSampled: snapshot.chunk_snapshot_summary.loaded_chunks_sampled ?? null,
          surfaceCellCount: snapshot.chunk_snapshot_summary.surface_cells?.length ?? 0,
          routeCorridorCellCount: snapshot.chunk_snapshot_summary.route_corridor_cells?.length ?? 0,
          gatewayBlockCount: snapshot.chunk_snapshot_summary.gateway_blocks?.length ?? 0,
          bridgeLikeBlockCount: snapshot.chunk_snapshot_summary.bridge_like_blocks?.length ?? 0,
          hazardCellCount: snapshot.chunk_snapshot_summary.hazard_cells?.length ?? 0,
          mapHash: snapshot.chunk_snapshot_summary.map_hash ?? null,
          changedSinceLastSnapshot: snapshot.chunk_snapshot_summary.changed_since_last_snapshot === true,
        }
      : null,
  };
};

const compactDeltaOverlay = (
  overlay: HelixMinecraftWorldDeltaOverlay | null,
): StagePlaySourceWindowV1["compactFacts"]["deltaOverlay"] => {
  if (!overlay) return null;
  return {
    overlayId: overlay.overlay_id,
    worldId: overlay.world_id,
    dimension: overlay.dimension,
    chunk: overlay.chunk,
    blockDeltaCount: overlay.block_deltas.length,
    traversalHints: uniqueStrings(overlay.block_deltas.map((delta) => delta.traversal_hint)),
    evidenceRefs: overlay.evidence_refs,
    ts: overlay.ts,
  };
};

const compactWorldSense = (
  context: HelixMinecraftWorldSenseContext | null,
): StagePlaySourceWindowV1["compactFacts"]["worldSense"] => {
  if (!context) return null;
  return {
    contextId: context.context_id,
    fromTs: context.from_ts,
    toTs: context.to_ts,
    entityClusterCount: context.entity_clusters.length,
    interpretationHintCount: context.interpretation_hints.length,
    environmentNoteCount: context.environment_notes.length,
    missingEvidence: context.missing_evidence,
    evidenceRefs: context.evidence_refs,
  };
};

const compactEventWindow = (
  query: HelixEventJournalQueryResult,
): StagePlaySourceWindowV1["compactFacts"]["eventWindow"] => ({
  queryId: query.query_id,
  matchedCount: query.matched_count,
  returnedCount: query.returned_count,
  eventRefs: query.events.map((event) => event.journal_event_id),
  eventTypes: uniqueStrings(query.events.map((event) => event.event_type)),
  latestEventTs: query.events.at(-1)?.ts ?? null,
});

const routeForModality = (modality: string): StagePlaySourceRouteTargetV1 => {
  if (/minecraft|world_event|environment_state|environment_affordance/.test(modality)) return "world_stage_play";
  if (modality === "visual_frame") return "visual_context";
  if (modality === "audio_transcript" || modality === "text_chat" || modality === "document_context" || modality === "note_context") {
    return "narrative_stage_play";
  }
  if (modality === "procedure_graph" || modality === "process_graph" || modality === "calculator_stream" || modality === "simulation_stream") {
    return "live_answer_output";
  }
  return "debug_only";
};

const normalizeRoutingStatus = (value: string | null | undefined): StagePlaySourceRoutingStatusV1 => {
  if (value === "active" || value === "active_interval" || value === "fresh") return "active";
  if (value === "waiting_for_client") return "waiting_for_client";
  if (value === "permission_required") return "permission_required";
  if (value === "configured_missing" || value === "missing") return "configured_missing";
  if (value === "stale") return "stale";
  if (value === "error" || value === "blocked") return "error";
  if (value === "paused") return "paused";
  if (value === "stopped") return "stopped";
  return "configured_missing";
};

const selectedForStagePlay = (
  status: StagePlaySourceRoutingStatusV1,
  routeTo: StagePlaySourceRouteTargetV1,
  evidenceRefs: string[],
): boolean =>
  evidenceRefs.length > 0 &&
  (status === "active" || status === "stale") &&
  routeTo !== "debug_only" &&
  routeTo !== "live_answer_output";

const sourceFidelityScore = (input: {
  status: StagePlaySourceRoutingStatusV1;
  evidenceRefs: string[];
  hasRecentEvent?: boolean;
  hasDescriptor?: boolean;
  hasProducer?: boolean;
}): number => {
  if (input.status === "configured_missing" || input.status === "permission_required" || input.status === "waiting_for_client") return 0;
  if (input.status === "error" || input.status === "stopped") return 0.12;
  const base = input.hasRecentEvent ? 0.86 : input.hasDescriptor && input.hasProducer ? 0.78 : input.hasDescriptor ? 0.66 : input.hasProducer ? 0.58 : 0.42;
  return Math.max(0, Math.min(1, input.status === "stale" || input.status === "paused" ? base - 0.22 : base));
};

const sourceMissingReason = (status: StagePlaySourceRoutingStatusV1, modality: string): string | null => {
  if (status === "permission_required") return `${modality} source needs user permission.`;
  if (status === "waiting_for_client") return `${modality} source is waiting for the client to attach.`;
  if (status === "configured_missing") return `${modality} source is not configured for this Stage Play window.`;
  if (status === "stale") return `${modality} source has not produced a fresh event.`;
  if (status === "error") return `${modality} source reported an error.`;
  return null;
};

const nextRequiredActionFor = (status: StagePlaySourceRoutingStatusV1, modality: string): string | null => {
  if (modality === "visual_frame" && (status === "configured_missing" || status === "permission_required")) return "Start visual interval";
  if (modality === "audio_transcript" && (status === "configured_missing" || status === "permission_required")) return "Attach audio transcript";
  if ((modality === "world_event" || modality === "minecraft_world_events") && status === "configured_missing") return "Connect Minecraft world events";
  if (status === "paused") return "Resume source";
  if (status === "stale") return "Refresh source";
  if (status === "error") return "Inspect source health";
  return null;
};

const routeFromSource = (source: StagePlaySourceRoutingEntryV1): StagePlaySourceRouteV1 => ({
  sourceId: source.sourceId,
  modality: source.modality,
  routeTo: source.routeTo,
  selected: source.selectedForStagePlay,
  confidence: source.fidelityScore,
  freshness: source.status,
});

export function buildDefaultStagePlayRoutingSources(input: {
  threadId?: string | null;
  environmentId?: string | null;
} = {}): StagePlaySourceRoutingEntryV1[] {
  void input;
  return ([
    {
      sourceId: "source:visual-frame",
      modality: "visual_frame",
      status: "permission_required",
      contribution: "Visual frame capture can provide scene context once the user starts an interval.",
      fidelityScore: 0,
      selectedForStagePlay: false,
      routeTo: "visual_context",
      cadenceMs: 10000,
      lastEventTs: null,
      missingReason: "No visual frame source is currently attached.",
      nextRequiredAction: "Start visual interval",
      evidenceRefs: [],
    },
    {
      sourceId: "source:audio-transcript",
      modality: "audio_transcript",
      status: "configured_missing",
      contribution: "Audio transcript can provide dialogue or narration once attached.",
      fidelityScore: 0,
      selectedForStagePlay: false,
      routeTo: "narrative_stage_play",
      cadenceMs: null,
      lastEventTs: null,
      missingReason: "No audio transcript source is currently attached.",
      nextRequiredAction: "Attach audio transcript",
      evidenceRefs: [],
    },
    {
      sourceId: "source:minecraft-world-events",
      modality: "minecraft_world_events",
      status: "configured_missing",
      contribution: "Minecraft world events can provide current player/world truth once connected.",
      fidelityScore: 0,
      selectedForStagePlay: false,
      routeTo: "world_stage_play",
      cadenceMs: null,
      lastEventTs: null,
      missingReason: "No Minecraft world-event source is currently attached.",
      nextRequiredAction: "Connect Minecraft world events",
      evidenceRefs: [],
    },
    {
      sourceId: "source:manual-feed",
      modality: "text_chat",
      status: "active",
      contribution: "Manual feed is available for user-entered observations and checkpoints.",
      fidelityScore: 0.42,
      selectedForStagePlay: false,
      routeTo: "narrative_stage_play",
      cadenceMs: null,
      lastEventTs: null,
      missingReason: null,
      nextRequiredAction: null,
      evidenceRefs: [],
    },
  ] as StagePlaySourceRoutingEntryV1[]).map((source) => ({
    ...source,
    route: routeFromSource(source),
  }));
}

const compactRoutedSource = (input: {
  sourceId: string;
  modality: string;
  status: string | null | undefined;
  contribution: string;
  cadenceMs?: number | null;
  lastEventTs?: string | null;
  evidenceRefs: string[];
  hasRecentEvent?: boolean;
  hasDescriptor?: boolean;
  hasProducer?: boolean;
}): StagePlaySourceRoutingEntryV1 => {
  const status = normalizeRoutingStatus(input.status);
  const routeTo = routeForModality(input.modality);
  const evidenceRefs = uniqueStrings(input.evidenceRefs);
  const source: StagePlaySourceRoutingEntryV1 = {
    sourceId: input.sourceId,
    modality: input.modality,
    status,
    contribution: input.contribution,
    fidelityScore: sourceFidelityScore({
      status,
      evidenceRefs,
      hasRecentEvent: input.hasRecentEvent,
      hasDescriptor: input.hasDescriptor,
      hasProducer: input.hasProducer,
    }),
    selectedForStagePlay: selectedForStagePlay(status, routeTo, evidenceRefs),
    routeTo,
    cadenceMs: input.cadenceMs ?? null,
    lastEventTs: input.lastEventTs ?? null,
    missingReason: sourceMissingReason(status, input.modality),
    nextRequiredAction: nextRequiredActionFor(status, input.modality),
    evidenceRefs,
  };
  return {
    ...source,
    route: routeFromSource(source),
  };
};

function buildStagePlayRoutingSources(input: {
  descriptors: HelixLiveSourceDescriptor[];
  producers: HelixLiveSourceProducer[];
  observations: LiveSourceObservation[];
  snapshot: HelixEnvironmentStateSnapshot | null;
  capabilities: HelixSituationSourceCapability[];
  rawSessionBufferEntries: ReturnType<typeof listStagePlayRawSessionBufferEntries>;
}): StagePlaySourceRoutingEntryV1[] {
  const byKey = new Map<string, StagePlaySourceRoutingEntryV1>();
  const producerBySource = new Map(input.producers.map((producer) => [producer.source_id, producer]));
  const latestObservationBySourceKind = new Map<string, LiveSourceObservation>();
  for (const observation of input.observations) {
    latestObservationBySourceKind.set(`${observation.source_id}:${observation.source_kind}`, observation);
  }

  for (const descriptor of input.descriptors) {
    const producer = producerBySource.get(descriptor.source_id) ?? null;
    const latestObservation = input.observations
      .filter((observation) => observation.source_id === descriptor.source_id)
      .sort((a, b) => a.observed_at.localeCompare(b.observed_at))
      .at(-1) ?? null;
    const source = compactRoutedSource({
      sourceId: descriptor.source_id,
      modality: descriptor.modality,
      status: descriptor.current_state,
      contribution: `${descriptor.modality} source from ${descriptor.serving_context.surface} via ${descriptor.serving_context.source_origin}.`,
      cadenceMs: descriptor.cadence_ms ?? producer?.cadence_ms ?? null,
      lastEventTs: latestObservation?.observed_at ?? null,
      evidenceRefs: [
        descriptor.descriptor_id,
        producer?.producer_id,
        ...descriptor.latest_observation_refs,
        producer?.latest_chunk_id,
        latestObservation?.observation_id,
      ].filter(Boolean) as string[],
      hasRecentEvent: Boolean(latestObservation),
      hasDescriptor: true,
      hasProducer: Boolean(producer),
    });
    byKey.set(`${source.sourceId}:${source.modality}`, source);
  }

  for (const producer of input.producers) {
    const existing = Array.from(byKey.values()).some((source) => source.sourceId === producer.source_id && source.modality === producer.modality);
    if (existing) continue;
    const latestObservation = input.observations
      .filter((observation) => observation.source_id === producer.source_id)
      .sort((a, b) => a.observed_at.localeCompare(b.observed_at))
      .at(-1) ?? null;
    const source = compactRoutedSource({
      sourceId: producer.source_id,
      modality: producer.modality,
      status: producer.status,
      contribution: `${producer.modality} producer using ${producer.capture_mode} capture.`,
      cadenceMs: producer.cadence_ms ?? null,
      lastEventTs: latestObservation?.observed_at ?? null,
      evidenceRefs: [
        producer.producer_id,
        producer.latest_chunk_id,
        latestObservation?.observation_id,
      ].filter(Boolean) as string[],
      hasRecentEvent: Boolean(latestObservation),
      hasProducer: true,
    });
    byKey.set(`${source.sourceId}:${source.modality}`, source);
  }

  for (const observation of input.observations) {
    const key = `${observation.source_id}:${observation.source_kind}`;
    if (byKey.has(key)) continue;
    const source = compactRoutedSource({
      sourceId: observation.source_id,
      modality: observation.source_kind,
      status: observation.freshness.status,
      contribution: `${observation.source_kind} observation admitted as compact source evidence.`,
      cadenceMs: null,
      lastEventTs: observation.observed_at,
      evidenceRefs: [observation.observation_id, ...observation.evidence_refs],
      hasRecentEvent: true,
    });
    byKey.set(key, source);
  }

  if (input.snapshot) {
    const key = `${input.snapshot.source_id}:environment_state`;
    if (!byKey.has(key)) {
      const source = compactRoutedSource({
        sourceId: input.snapshot.source_id,
        modality: "environment_state",
        status: "active",
        contribution: `${input.snapshot.domain} environment snapshot provides compact actor, object, local-map, and chunk-summary facts.`,
        cadenceMs: null,
        lastEventTs: input.snapshot.ts,
        evidenceRefs: [input.snapshot.snapshot_id, ...input.snapshot.evidence_refs],
        hasRecentEvent: true,
      });
      byKey.set(key, source);
    }
  }

  for (const capability of input.capabilities) {
    const key = `${capability.source_id}:${capability.modality}`;
    if (byKey.has(key)) continue;
    const status = normalizeRoutingStatus(capability.status);
    const source = compactRoutedSource({
      sourceId: capability.source_id,
      modality: capability.modality,
      status,
      contribution: capability.contribution,
      cadenceMs: null,
      lastEventTs: capability.last_event_ts ?? null,
      evidenceRefs: [`source:${capability.source_id}`, `capability:${capability.source_id}`],
      hasRecentEvent: capability.status === "active" && Boolean(capability.last_event_ts),
      hasDescriptor: true,
    });
    byKey.set(key, {
      ...source,
      fidelityScore: capability.fidelity_score,
      selectedForStagePlay: selectedForStagePlay(status, source.routeTo, source.evidenceRefs),
      missingReason: capability.missing_reason ?? source.missingReason,
      nextRequiredAction: capability.next_required_action ?? source.nextRequiredAction,
    });
  }

  for (const rawEntry of input.rawSessionBufferEntries) {
    const key = `${rawEntry.sourceId}:${rawEntry.modality}`;
    const existing = byKey.get(key);
    const evidenceRefs = uniqueStrings([rawEntry.entryId, ...rawEntry.evidenceRefs]);
    if (existing) {
      byKey.set(key, {
        ...existing,
        evidenceRefs: uniqueStrings([...existing.evidenceRefs, ...evidenceRefs]),
      });
      continue;
    }
    const source = compactRoutedSource({
      sourceId: rawEntry.sourceId,
      modality: rawEntry.modality,
      status: "stale",
      contribution: `${rawEntry.modality} audit buffer entry is available for source review.`,
      cadenceMs: null,
      lastEventTs: rawEntry.toTs,
      evidenceRefs,
      hasRecentEvent: false,
    });
    byKey.set(key, source);
  }

  for (const fallback of buildDefaultStagePlayRoutingSources()) {
    if (!Array.from(byKey.values()).some((source) => source.modality === fallback.modality)) {
      byKey.set(`${fallback.sourceId}:${fallback.modality}`, fallback);
    }
  }

  return Array.from(byKey.values()).map((source) => ({
    ...source,
    route: routeFromSource(source),
  })).sort((a, b) =>
    Number(b.selectedForStagePlay) - Number(a.selectedForStagePlay) ||
    a.routeTo.localeCompare(b.routeTo) ||
    a.modality.localeCompare(b.modality) ||
    a.sourceId.localeCompare(b.sourceId)
  );
}

export function resolveStagePlaySourceWindow(input: ResolveStagePlaySourceWindowInput): StagePlaySourceWindowV1 {
  const descriptors = listLiveSourceDescriptors({
    threadId: input.threadId ?? null,
    sourceId: input.sourceId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 24,
  });
  const descriptorSourceIds = new Set(descriptors.map((descriptor) => descriptor.source_id));
  const producers = listLiveSourceProducers({
    threadId: input.threadId ?? null,
  }).filter((producer) =>
    (!input.sourceId || producer.source_id === input.sourceId) &&
    (descriptorSourceIds.size === 0 || descriptorSourceIds.has(producer.source_id))
  ).slice(-24);
  const observations = listLiveSourceObservations({
    threadId: input.threadId ?? null,
    sourceId: input.sourceId ?? null,
    sourceKind: input.sourceKind ?? null,
    limit: input.observationLimit ?? 8,
  }).filter((observation) => observation.room_id === input.roomId || !observation.room_id);
  const snapshot = getLatestEnvironmentStateSnapshot(input.roomId);
  const resolvedAt = input.now ?? new Date().toISOString();
  const capabilities = buildSituationSourceCapabilities({
    threadId: input.threadId ?? "helix-ask:desktop",
    roomId: input.roomId,
    includeDefaults: false,
    now: resolvedAt,
  });
  const rawSessionBufferEntries = listStagePlayRawSessionBufferEntries({
    threadId: input.threadId ?? "helix-ask:desktop",
    roomId: input.roomId,
    limit: 50,
    now: new Date(resolvedAt),
  });
  const worldId = input.worldId ?? snapshot?.world_id ?? null;
  const overlay = listMinecraftWorldDeltaOverlaysForRoom(input.roomId)
    .filter((entry) => !worldId || entry.world_id === worldId)
    .sort((a, b) => a.ts.localeCompare(b.ts) || a.overlay_id.localeCompare(b.overlay_id))
    .at(-1) ?? null;
  const navigationQuery = queryMinecraftNavigationState({
    roomId: input.roomId,
    worldId,
    actorLabel: input.actorLabel ?? snapshot?.actor_label ?? null,
    limit: 6,
  });
  const worldSense = getLatestMinecraftWorldSenseContextForRoom(input.roomId);
  const eventWindow = queryEventWindow({
    source_family: "minecraft",
    room_id: input.roomId,
    world_id: worldId,
    thread_id: input.threadId ?? null,
    limit: input.eventLimit ?? 12,
    include_raw_events: false,
  });
  const chunkSampleRef = snapshot ? chunkSampleRefFor(snapshot) : null;
  const latestNavigationRefs = uniqueStrings([
    navigationQuery.navigation_state?.state_id,
    navigationQuery.navigation_state?.latest_objective_id,
    navigationQuery.navigation_state?.latest_rehearsal_id,
    navigationQuery.navigation_state?.latest_drift_event_id,
    navigationQuery.navigation_state?.latest_lifecycle_receipt_id,
    ...(navigationQuery.navigation_state?.route_rehearsal_refs ?? []),
    ...(navigationQuery.navigation_state?.route_drift_refs ?? []),
    ...(navigationQuery.navigation_state?.route_lifecycle_refs ?? []),
  ]);
  const latestRouteSolverObservationRefs = navigationQuery.latest_solver_observations.map((entry) => entry.observation_id);
  const compactFacts: StagePlaySourceWindowV1["compactFacts"] = {
    sourceDescriptors: descriptors.map(compactDescriptor),
    sourceProducers: producers.map(compactProducer),
    observations: observations.map(compactObservation),
    environmentSnapshot: compactSnapshot(snapshot),
    deltaOverlay: compactDeltaOverlay(overlay),
    navigation: navigationQuery.navigation_state
      ? {
          stateId: navigationQuery.navigation_state.state_id,
          routeStatus: navigationQuery.navigation_state.route_status,
          policySurfaceStatus: navigationQuery.navigation_state.policy_surface_status,
          latestObjectiveId: navigationQuery.navigation_state.latest_objective_id ?? null,
          latestRehearsalId: navigationQuery.navigation_state.latest_rehearsal_id ?? null,
          latestDriftEventId: navigationQuery.navigation_state.latest_drift_event_id ?? null,
          latestLifecycleReceiptId: navigationQuery.navigation_state.latest_lifecycle_receipt_id ?? null,
          latestSolverObservationRefs: latestRouteSolverObservationRefs,
          missingEvidence: navigationQuery.missing_evidence,
          evidenceRefs: navigationQuery.navigation_state.evidence_refs,
          updatedAt: navigationQuery.navigation_state.updated_at,
        }
      : null,
    routeSolverObservations: navigationQuery.latest_solver_observations.map((observation) => ({
      observationId: observation.observation_id,
      provider: observation.provider,
      resultStatus: observation.result_status,
      plannerExecutionState: observation.planner_execution_state,
      movementRequirements: observation.movement_requirements,
      riskFlags: observation.risk_flags,
      missingEvidence: observation.missing_evidence,
      evidenceRefs: observation.evidence_refs,
      ts: observation.ts,
    })),
    worldSense: compactWorldSense(worldSense),
    eventWindow: compactEventWindow(eventWindow),
  };
  const sources = buildStagePlayRoutingSources({ descriptors, producers, observations, snapshot, capabilities, rawSessionBufferEntries });
  const sourceRoutes = sources.map(routeFromSource);

  return {
    schemaVersion: STAGE_PLAY_SOURCE_WINDOW_SCHEMA,
    resolvedAt,
    threadId: input.threadId ?? null,
    roomId: input.roomId,
    worldId,
    environmentId: input.environmentId ?? observations.at(-1)?.environment_id ?? null,
    actorLabel: input.actorLabel ?? snapshot?.actor_label ?? navigationQuery.actor_label ?? null,
    freshness: freshnessFor(observations),
    latestSourceDescriptorRefs: descriptors.map((descriptor) => descriptor.descriptor_id),
    latestSourceProducerRefs: producers.map((producer) => producer.producer_id),
    latestObservationRefs: observations.map((observation) => observation.observation_id),
    latestSnapshotRefs: snapshot ? [snapshot.snapshot_id] : [],
    latestDeltaOverlayRefs: overlay ? [overlay.overlay_id] : [],
    latestChunkSnapshotSampleRefs: chunkSampleRef ? [chunkSampleRef] : [],
    latestNavigationRefs,
    latestRouteSolverObservationRefs,
    latestWorldSenseContextRefs: worldSense ? [worldSense.context_id] : [],
    latestEventWindowRefs: eventWindow.events.map((event) => event.journal_event_id),
    latestRawSessionBufferRefs: rawSessionBufferEntries.map((entry) => entry.entryId),
    sources,
    sourceRoutes,
    evidenceRefs: uniqueStrings([
      ...descriptors.flatMap((descriptor) => [
        descriptor.descriptor_id,
        ...descriptor.latest_observation_refs,
      ]),
      ...producers.flatMap((producer) => [
        producer.producer_id,
        producer.latest_chunk_id,
      ]),
      ...observations.flatMap((observation) => [observation.observation_id, ...observation.evidence_refs]),
      snapshot?.snapshot_id,
      ...(snapshot?.evidence_refs ?? []),
      overlay?.overlay_id,
      ...(overlay?.evidence_refs ?? []),
      ...latestNavigationRefs,
      ...latestRouteSolverObservationRefs,
      ...(navigationQuery.navigation_state?.evidence_refs ?? []),
      worldSense?.context_id,
      ...(worldSense?.evidence_refs ?? []),
      ...eventWindow.events.flatMap((event) => [event.journal_event_id, ...event.evidence_refs]),
      ...rawSessionBufferEntries.map((entry) => entry.entryId),
      ...sources.flatMap((source) => source.evidenceRefs),
      chunkSampleRef,
    ]),
    compactFacts,
    authority: {
      assistant_answer: false,
      raw_content_included: false,
      raw_payload_included: false,
      terminal_eligible: false,
      agent_executable: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      instruction_authority: "none",
      ask_instruction_authority: "none",
    },
  };
}
