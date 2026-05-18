import crypto from "node:crypto";
import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import { createLiveAnswerEnvironment } from "./live-answer-environment-store";
import { listLiveSourceProducers } from "./live-source-chunk-buffer";
import { listObservationJournalEntries } from "./observation-journal-store";
import { runLiveFieldWorkersForObservation } from "./live-field-worker-runner";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const latestByRef = (
  observations: HelixObservationJournalEntry[],
  refs: string[],
): HelixObservationJournalEntry | null => {
  const refSet = new Set(refs);
  return [...observations].reverse().find((entry) => refSet.has(entry.observation_id)) ?? observations.at(-1) ?? null;
};

export function repairUnboundVisualSituationContext(input: {
  activeContext: HelixActiveSituationContext;
  promptText: string;
  turnId?: string | null;
  now?: string;
}) {
  if (input.activeContext.status !== "unbound") {
    return null;
  }
  if (input.activeContext.next_required_action !== "create_or_bind_situation_run") {
    return null;
  }
  const producerId = input.activeContext.source_binding_ids.find((entry) => /^live_source_producer:/.test(entry)) ?? null;
  const producer = producerId
    ? listLiveSourceProducers().find((entry) => entry.producer_id === producerId) ?? null
    : null;
  if (!producer || producer.modality !== "visual_frame") {
    return null;
  }
  const observations = listObservationJournalEntries({
    threadId: input.activeContext.thread_id,
    limit: 40,
  }).filter((entry) => !entry.source_id || entry.source_id === producer.source_id);
  const observation = latestByRef(observations, input.activeContext.latest_observation_refs);
  if (!observation) {
    return null;
  }
  const now = input.now ?? new Date().toISOString();
  const createdTurnId = input.turnId && input.turnId.trim()
    ? input.turnId.trim()
    : `situation_context_repair:${hashShort([producer.producer_id, observation.observation_id, input.promptText])}`;
  const { environment } = createLiveAnswerEnvironment({
    thread_id: input.activeContext.thread_id,
    created_turn_id: createdTurnId,
    objective: input.promptText,
    preset: "custom",
    source_ids: [producer.source_id],
    now,
  });
  const workerRun = runLiveFieldWorkersForObservation({
    environment,
    observation,
    now,
  });
  return {
    schema: "helix.live_situation_context_binding_repair.v1",
    repair_id: `live_situation_context_binding_repair:${hashShort([
      input.activeContext.context_id,
      producer.producer_id,
      environment.environment_id,
      observation.observation_id,
    ])}`,
    status: workerRun.run ? "applied" : "failed",
    thread_id: input.activeContext.thread_id,
    environment_id: environment.environment_id,
    situation_run_id: workerRun.run?.situation_run_id ?? null,
    source_id: producer.source_id,
    producer_id: producer.producer_id,
    observation_id: observation.observation_id,
    field_evaluation_refs: workerRun.evaluations.map((entry) => entry.evaluation_id),
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
}
