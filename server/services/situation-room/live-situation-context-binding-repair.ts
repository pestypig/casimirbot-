import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import { helixEvidenceSourceKindForModality } from "@shared/helix-evidence-source-kind";
import type { HelixSourceBindingRepairCandidate } from "@shared/helix-source-binding-repair-candidate";
import { listLiveSourceProducers } from "./live-source-chunk-buffer";
import { createSourceBindingRepairCandidate, listSourceBindingStatuses } from "./source-binding-status-store";

export function repairUnboundVisualSituationContext(input: {
  activeContext: HelixActiveSituationContext;
  promptText: string;
  turnId?: string | null;
  now?: string;
}): (HelixSourceBindingRepairCandidate & {
  status: "candidate_created";
  repair_id: null;
  field_evaluation_refs: [];
}) | null {
  const unboundStatus = input.activeContext.observed_unbound_source_refs
    .map((statusRef) => listSourceBindingStatuses({ threadId: input.activeContext.thread_id, limit: 200 })
      .find((status) => status.status_id === statusRef))
    .find(Boolean) ?? null;
  const producerFallback = !unboundStatus && input.activeContext.status === "unbound"
    ? listLiveSourceProducers({ threadId: input.activeContext.thread_id })
        .find((producer) => input.activeContext.source_binding_ids.includes(producer.producer_id)) ?? null
    : null;
  const sourceId = unboundStatus?.source_id ?? producerFallback?.source_id ?? null;
  const modality = unboundStatus?.modality ?? producerFallback?.modality ?? null;
  if (!sourceId || !modality) return null;
  const candidate = createSourceBindingRepairCandidate({
    threadId: input.activeContext.thread_id,
    sourceId,
    sourceKind: unboundStatus?.source_kind ?? helixEvidenceSourceKindForModality(modality),
    modality,
    targetSituationRunId: input.activeContext.situation_run_id ?? null,
    targetEnvironmentId: input.activeContext.environment_id ?? null,
    proposedReplayPolicy: "future_only",
    oldUnboundObservationRefs: unboundStatus?.latest_observation_refs ?? [],
    oldUnboundChunkRefs: unboundStatus?.latest_chunk_refs ?? [],
    promptText: input.promptText,
    now: input.now,
  });
  return {
    ...candidate,
    status: "candidate_created",
    repair_id: null,
    field_evaluation_refs: [],
  };
}
