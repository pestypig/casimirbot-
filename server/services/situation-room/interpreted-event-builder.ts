import type { LiveAnswerEnvironmentDelta } from "@shared/helix-live-answer-environment";
import type { LiveSituationArtifactDelta } from "@shared/helix-live-situation-artifact";
import type { HelixCategorizationEvent } from "@shared/helix-categorization-event";
import type { HelixSyntheticEvidence } from "@shared/helix-synthetic-evidence";
import type { HelixUserSteeringEvent } from "@shared/helix-user-steering-event";
import { listCategorizationEvents } from "./categorization-bus";
import { listSyntheticEvidence } from "./synthetic-evidence-ledger";
import {
  appendInterpretedEvent,
  makeInterpretedEventId,
} from "./interpreted-event-log-store";
import {
  getActiveLiveSituationArtifactForThread,
  listLiveSituationArtifactDeltas,
} from "./live-situation-artifact-store";
import {
  getActiveLiveAnswerEnvironmentForThread,
  listLiveAnswerEnvironmentDeltas,
} from "./live-answer-environment-store";
import { listContinuousCategorizationJobs } from "./continuous-categorization-job-store";

export function recordInterpretedEventForCategorization(event: HelixCategorizationEvent) {
  return appendInterpretedEvent({
    event_id: makeInterpretedEventId({
      threadId: event.thread_id,
      kind: "categorization",
      sourceId: event.event_id,
    }),
    thread_id: event.thread_id,
    source_family: event.source_family,
    kind: "categorization",
    title: event.category.replace(/_/g, " "),
    summary: event.summary,
    confidence: event.confidence,
    evidence_refs: event.evidence_refs,
    source_event_ids: [event.source_event_id],
    model_invoked: event.model_invoked,
    deterministic: event.deterministic,
    created_at: event.created_at,
  });
}

export function recordInterpretedEventForSyntheticEvidence(evidence: HelixSyntheticEvidence) {
  return appendInterpretedEvent({
    event_id: makeInterpretedEventId({
      threadId: evidence.thread_id,
      kind: "synthetic_evidence",
      sourceId: evidence.evidence_id,
    }),
    thread_id: evidence.thread_id,
    kind: "synthetic_evidence",
    title: String(evidence.produced_by).replace(/_/g, " "),
    summary: evidence.claim,
    confidence: evidence.support_status === "supports" ? 0.85 : evidence.support_status === "partial" ? 0.6 : 0.35,
    evidence_refs: evidence.source_refs,
    source_event_ids: [evidence.evidence_id],
    model_invoked: evidence.model_invoked,
    deterministic: evidence.deterministic,
    created_at: evidence.created_at,
  });
}

export function recordInterpretedEventForLiveSituationDelta(delta: LiveSituationArtifactDelta) {
  return appendInterpretedEvent({
    event_id: makeInterpretedEventId({
      threadId: delta.thread_id,
      kind: "mission_memory_update",
      sourceId: delta.delta_id,
    }),
    thread_id: delta.thread_id,
    room_id: delta.artifact_snapshot.room_id,
    source_family: "minecraft_events",
    kind: "mission_memory_update",
    title: delta.reason.replace(/_/g, " "),
    summary: delta.artifact_snapshot.latest_evaluation?.summary ??
      delta.artifact_snapshot.current_state_lines.last_decision,
    confidence: delta.artifact_snapshot.latest_evaluation ? 0.75 : null,
    evidence_refs: delta.evidence_refs,
    source_event_ids: [delta.delta_id],
    related_artifact_ids: [delta.artifact_id],
    model_invoked: delta.artifact_snapshot.latest_evaluation?.model_invoked ?? false,
    deterministic: !(delta.artifact_snapshot.latest_evaluation?.model_invoked ?? false),
    created_at: delta.ts,
  });
}

export function recordInterpretedEventForLiveAnswerDelta(delta: LiveAnswerEnvironmentDelta) {
  return appendInterpretedEvent({
    event_id: makeInterpretedEventId({
      threadId: delta.thread_id,
      kind: "live_environment_delta",
      sourceId: delta.delta_id,
    }),
    thread_id: delta.thread_id,
    room_id: delta.environment_snapshot.room_id ?? null,
    kind: "live_environment_delta",
    title: delta.reason.replace(/_/g, " "),
    summary: delta.environment_snapshot.latest_evaluation?.summary ??
      delta.environment_snapshot.latest_summary ??
      `Live environment changed ${delta.changed_line_keys.join(", ") || "state"}.`,
    confidence: delta.environment_snapshot.latest_evaluation ? 0.75 : null,
    evidence_refs: delta.evidence_refs,
    source_event_ids: [delta.delta_id],
    related_artifact_ids: [delta.environment_id],
    model_invoked: delta.model_invoked === true,
    deterministic: delta.model_invoked !== true,
    created_at: delta.ts,
  });
}

export function recordInterpretedEventForUserSteering(steering: HelixUserSteeringEvent) {
  return appendInterpretedEvent({
    event_id: makeInterpretedEventId({
      threadId: steering.thread_id,
      kind: "user_steering",
      sourceId: steering.steering_id,
    }),
    thread_id: steering.thread_id,
    room_id: steering.room_id ?? null,
    kind: "user_steering",
    title: steering.effect.replace(/_/g, " "),
    summary: steering.interpreted_claim ?? steering.prompt,
    confidence: 0.9,
    evidence_refs: steering.evidence_refs,
    source_event_ids: [steering.steering_id],
    related_artifact_ids: steering.target_ids,
    model_invoked: false,
    deterministic: true,
    created_at: steering.created_at,
  });
}

export function synchronizeInterpretedEventsForThread(input: {
  threadId: string;
  roomId?: string | null;
}): void {
  for (const event of listCategorizationEvents(input.threadId)) {
    recordInterpretedEventForCategorization(event);
  }
  for (const evidence of listSyntheticEvidence(input.threadId)) {
    recordInterpretedEventForSyntheticEvidence(evidence);
  }
  const artifact = getActiveLiveSituationArtifactForThread(input.threadId);
  if (artifact && (!input.roomId || artifact.room_id === input.roomId)) {
    for (const delta of listLiveSituationArtifactDeltas(artifact.artifact_id)) {
      recordInterpretedEventForLiveSituationDelta(delta);
    }
  }
  const environment = getActiveLiveAnswerEnvironmentForThread(input.threadId);
  if (environment && (!input.roomId || environment.room_id === input.roomId)) {
    for (const delta of listLiveAnswerEnvironmentDeltas(environment.environment_id)) {
      recordInterpretedEventForLiveAnswerDelta(delta);
    }
  }
  for (const job of listContinuousCategorizationJobs({ threadId: input.threadId, roomId: input.roomId ?? null, status: "any" })) {
    appendInterpretedEvent({
      event_id: makeInterpretedEventId({
        threadId: job.thread_id,
        kind: "source_observation",
        sourceId: `${job.job_id}:${job.updated_at}`,
      }),
      thread_id: job.thread_id,
      room_id: job.room_id ?? null,
      source_family: job.source_family,
      kind: "source_observation",
      title: "categorization job",
      summary: job.latest_summary ?? `${job.status} categorization job watching ${job.source_family}.`,
      confidence: null,
      evidence_refs: job.latest_evidence_refs,
      related_job_ids: [job.job_id],
      model_invoked: false,
      deterministic: true,
      created_at: job.updated_at,
    });
  }
}
