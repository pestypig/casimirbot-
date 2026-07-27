import { removeEnvironmentProbeState } from "./environment-probe-broker";
import { removeEnvironmentSourceHeartbeats } from "./environment-source-heartbeat-store";
import { removeEnvironmentSourceManifests } from "./environment-source-registry";
import { removeEnvironmentStateSnapshots } from "./environment-state-snapshot-window";
import { removeMinecraftSpatialWindows } from "./minecraft-spatial-window";
import { removeLiveContinuationRunDebug } from "./live-continuation-runner";
import { removeLiveSourceChunkBufferState } from "./live-source-chunk-buffer";
import { removeLiveSourceDescriptors } from "./live-source-descriptor-builder";
import { removeLiveSourceIdentities } from "./live-source-identity-store";
import { removeLiveSourceProducerBinding } from "./live-source-producer-binding";
import { removeLiveSourceProducerLifecycleEvents } from "./live-source-producer-lifecycle-store";
import { removeLiveWorkstationPipelines } from "./live-workstation-pipeline-store";
import { removeSituationSourceCapabilities } from "./situation-source-capability-store";
import { removeSituationThreadBindings } from "./thread-binding-store";
import { removeVisualProducerSchedulerAdoptions } from "./visual-producer-scheduler-adoption-store";
import { removeVisualSnapshotState } from "./visual-snapshot-store";
import { removeWorkstationLiveSourceState } from "./workstation-live-source-ingest";
import { forgetWorldSources } from "./world-source-registry";

export type RoomSourceRuntimeInvalidationReceipt = {
  source_id: string | null;
  room_id: string | null;
  manifests_removed: number;
  heartbeats_removed: number;
  pending_probes_removed: number;
  probe_results_removed: number;
  snapshots_removed: number;
  event_journal_records_removed: number;
  spatial_windows_removed: number;
  thread_bindings_removed: number;
  world_sources_removed: number;
  generic_live_records_removed: number;
};

export const invalidateRoomSourceRuntimeState = (input: {
  sourceId?: string | null;
  roomId?: string | null;
}): RoomSourceRuntimeInvalidationReceipt => {
  const sourceId = input.sourceId?.trim() || null;
  const roomId = input.roomId?.trim() || null;
  if (!sourceId && !roomId) {
    throw new Error(
      "Room source runtime invalidation requires sourceId or roomId.",
    );
  }
  const probes = removeEnvironmentProbeState({ sourceId, roomId });
  const chunks = sourceId
    ? removeLiveSourceChunkBufferState({ sourceId })
    : { producers: 0, chunks: 0, analysisJobs: 0 };
  const workstation = sourceId
    ? removeWorkstationLiveSourceState({ sourceId })
    : { sources: 0, events: 0, windows: 0 };
  const visual = sourceId
    ? removeVisualSnapshotState({ sourceId })
    : { sources: 0, frames: 0, evidence: 0, alignments: 0 };
  const genericLiveRecordsRemoved = sourceId
    ? chunks.producers +
      chunks.chunks +
      chunks.analysisJobs +
      workstation.sources +
      workstation.events +
      workstation.windows +
      visual.sources +
      visual.frames +
      visual.evidence +
      visual.alignments +
      removeLiveSourceProducerBinding({ sourceId }) +
      removeLiveSourceProducerLifecycleEvents({ sourceId }) +
      removeSituationSourceCapabilities({ sourceId }) +
      removeLiveContinuationRunDebug({ sourceId }) +
      removeLiveSourceDescriptors({ sourceId }) +
      removeLiveWorkstationPipelines({ sourceId }) +
      removeVisualProducerSchedulerAdoptions({ sourceId }) +
      removeLiveSourceIdentities({ sourceId })
    : 0;
  return {
    source_id: sourceId,
    room_id: roomId,
    manifests_removed: removeEnvironmentSourceManifests({
      sourceId,
      roomId,
    }),
    heartbeats_removed: removeEnvironmentSourceHeartbeats({
      sourceId,
      roomId,
    }),
    pending_probes_removed: probes.pending,
    probe_results_removed: probes.results,
    snapshots_removed: removeEnvironmentStateSnapshots({
      sourceId,
      roomId,
    }),
    // The journal is historical evidence, not current availability. Protected
    // records stay hidden by default and are retained until explicit data
    // deletion rather than being erased by credential lifecycle changes.
    event_journal_records_removed: 0,
    spatial_windows_removed: removeMinecraftSpatialWindows({
      sourceId,
      roomId,
    }),
    thread_bindings_removed: removeSituationThreadBindings({
      sourceId,
      roomId,
    }),
    world_sources_removed: forgetWorldSources({
      sourceId,
      roomId,
    }),
    generic_live_records_removed: genericLiveRecordsRemoved,
  };
};
