import type { HelixEventJournalQueryResult } from "@shared/helix-event-journal-query";
import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";
import type { HelixMinecraftWorldDeltaOverlay } from "@shared/helix-minecraft-evidence";
import type { HelixMinecraftWorldSenseContext } from "@shared/helix-minecraft-world-sense";
import type { HelixLiveSourceDescriptor } from "@shared/helix-live-source-descriptor";
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
import type { LiveSourceObservation } from "@shared/live-source-observation";
import { listLiveSourceObservations } from "../live-source/live-source-observation-store";
import { getLatestEnvironmentStateSnapshot } from "./environment-state-snapshot-window";
import { queryEventWindow } from "./event-window-query";
import { listLiveSourceProducers } from "./live-source-chunk-buffer";
import { listLiveSourceDescriptors } from "./live-source-descriptor-builder";
import { queryMinecraftNavigationState } from "./minecraft-navigation-state-store";
import { listMinecraftWorldDeltaOverlaysForRoom } from "./minecraft-world-delta-overlay";
import { getLatestMinecraftWorldSenseContextForRoom } from "./minecraft-world-sense-window";

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

  return {
    schemaVersion: STAGE_PLAY_SOURCE_WINDOW_SCHEMA,
    resolvedAt: input.now ?? new Date().toISOString(),
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
