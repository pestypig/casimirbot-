import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import { helixEvidenceSourceKindForModality } from "@shared/helix-evidence-source-kind";
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
import type { HelixSourceBindingRepairCandidate } from "@shared/helix-source-binding-repair-candidate";
import type { HelixSourceBindingStatus } from "@shared/helix-source-binding-status";
import {
  addLiveAnswerEnvironmentSourceIds,
  createLiveAnswerEnvironment,
  getLiveAnswerEnvironment,
} from "./live-answer-environment-store";
import { ensureLiveSituationRunForEnvironment } from "./live-situation-run-store";
import { listLiveSourceProducers } from "./live-source-chunk-buffer";
import {
  acceptSourceBindingRepairCandidate,
  createSourceBindingRepairCandidate,
  listSourceBindingStatuses,
} from "./source-binding-status-store";

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const isExplicitVisualCapturePrompt = (promptText: string): boolean =>
  /\bvisual\s+capture\b/i.test(promptText) ||
  /\bvisual\s+screen\s+capture\b/i.test(promptText) ||
  /\bscreen\s+capture\b/i.test(promptText) ||
  /\bcaptured\s+screen\b/i.test(promptText);

export function autoBindExplicitVisualCaptureSituationRun(input: {
  activeContext: HelixActiveSituationContext;
  promptText: string;
  turnId: string;
  replayWindow: { from_ts: string; to_ts: string };
  now: string;
}): {
  environment_id: string;
  situation_run_id: string;
  repair_candidate: HelixSourceBindingRepairCandidate;
  repair_id: string;
  replayed_observation_refs: string[];
} | null {
  if (!isExplicitVisualCapturePrompt(input.promptText)) return null;

  const statuses = listSourceBindingStatuses({
    threadId: input.activeContext.thread_id,
    limit: 200,
  });
  const unboundStatuses = input.activeContext.observed_unbound_source_refs
    .map((statusRef) => statuses.find((status: HelixSourceBindingStatus) => status.status_id === statusRef))
    .filter((status: HelixSourceBindingStatus | undefined): status is HelixSourceBindingStatus => Boolean(status));
  const unboundStatus = unboundStatuses.find((status) => status.modality === "visual_frame") ?? unboundStatuses[0] ?? null;
  const producerFallback = !unboundStatus
    ? listLiveSourceProducers({ threadId: input.activeContext.thread_id })
        .find((producer: HelixLiveSourceProducer) =>
          producer.modality === "visual_frame" &&
          input.activeContext.source_binding_ids.includes(producer.producer_id)
        ) ?? null
    : null;
  const sourceId = unboundStatus?.source_id ?? producerFallback?.source_id ?? null;
  const modality = unboundStatus?.modality ?? producerFallback?.modality ?? null;
  if (!sourceId || modality !== "visual_frame") return null;
  if (input.activeContext.situation_run_id && unboundStatus) return null;

  const existingEnvironment = input.activeContext.environment_id
    ? getLiveAnswerEnvironment(input.activeContext.environment_id)
    : null;
  const environment = existingEnvironment
    ? (addLiveAnswerEnvironmentSourceIds({
        environment_id: existingEnvironment.environment_id,
        source_ids: [sourceId],
        now: input.now,
      })?.environment ?? existingEnvironment)
    : createLiveAnswerEnvironment({
        thread_id: input.activeContext.thread_id,
        created_turn_id: input.turnId,
        objective: input.promptText,
        preset: "custom",
        mode: "text_only",
        source_ids: [sourceId],
        now: input.now,
      }).environment;
  const run = ensureLiveSituationRunForEnvironment({
    environment,
    advanceEpoch: false,
    now: input.now,
  });
  const candidate = createSourceBindingRepairCandidate({
    threadId: input.activeContext.thread_id,
    sourceId,
    sourceKind: unboundStatus?.source_kind ?? helixEvidenceSourceKindForModality(modality),
    modality,
    targetSituationRunId: run.situation_run_id,
    targetEnvironmentId: environment.environment_id,
    proposedBindingPolicy: "repair_acceptance",
    proposedReplayPolicy: "explicit_replay_window",
    oldUnboundObservationRefs: unboundStatus?.latest_observation_refs ?? [],
    oldUnboundChunkRefs: unboundStatus?.latest_chunk_refs ?? [],
    promptText: input.promptText,
    now: input.now,
  });
  const accepted = acceptSourceBindingRepairCandidate({
    repairCandidateId: candidate.repair_candidate_id,
    acceptedByTurnId: input.turnId,
    replayPolicy: "explicit_replay_window",
    replayWindow: input.replayWindow,
    targetSituationRunId: run.situation_run_id,
    targetEnvironmentId: environment.environment_id,
    now: input.now,
  });
  if (!accepted) return null;
  return {
    environment_id: environment.environment_id,
    situation_run_id: run.situation_run_id,
    repair_candidate: candidate,
    repair_id: accepted.repair_id,
    replayed_observation_refs: unique(accepted.replayed_observation_refs),
  };
}
