import crypto from "node:crypto";
import type { LiveJobPolicyObservation } from "@shared/live-job-policy-observation";
import { recordLiveEnvironmentCommentary } from "../situation-room/live-environment-commentary-store";

const observationsById = new Map<string, LiveJobPolicyObservation>();
const observationIdsByContract = new Map<string, string[]>();

const hashShort = (value: unknown, size = 20): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function makeLiveJobPolicyObservationId(input: {
  contractId: string;
  sourceObservationRefs: string[];
  eventKind: string;
  summary: string;
}): string {
  return `live_job_policy_observation:${hashShort([
    input.contractId,
    input.sourceObservationRefs,
    input.eventKind,
    input.summary,
  ])}`;
}

const commentarySubjectForPolicyObservation = (
  observation: LiveJobPolicyObservation,
): "minecraft_route" | "source_health" | "dottie_observer" | "visual_source" | "translation" | "unknown" => {
  if (/route_/.test(observation.event_kind)) return "minecraft_route";
  if (/source_/.test(observation.event_kind)) return "source_health";
  if (observation.event_kind === "visual_context_updated") return "visual_source";
  if (observation.event_kind === "translation_segment_ready") return "translation";
  if (observation.job_name.toLowerCase().includes("dottie")) return "dottie_observer";
  return "unknown";
};

export function recordLiveJobPolicyObservation(input: {
  observation: LiveJobPolicyObservation;
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
}): LiveJobPolicyObservation {
  observationsById.set(input.observation.observation_id, input.observation);
  const current = observationIdsByContract.get(input.observation.contract_id) ?? [];
  observationIdsByContract.set(
    input.observation.contract_id,
    Array.from(new Set([...current, input.observation.observation_id])).slice(-500),
  );

  if (input.thread_id) {
    recordLiveEnvironmentCommentary({
      thread_id: input.thread_id,
      room_id: input.room_id ?? null,
      environment_id: input.environment_id ?? null,
      subject: commentarySubjectForPolicyObservation(input.observation),
      kind: input.observation.status === "trigger_matched" ? "salience_candidate" : "observation",
      status: input.observation.status === "blocked" ? "blocked" : "observed",
      compact_summary: input.observation.summary,
      evidence_refs: [input.observation.observation_id, ...input.observation.source_observation_refs],
      related_artifact_ids: [input.observation.contract_id],
      missing_evidence: input.observation.missing_requirements.map((entry) => entry.requirement),
      confidence: input.observation.policy_evaluation.confidence === "high"
        ? 0.9
        : input.observation.policy_evaluation.confidence === "medium"
          ? 0.6
          : 0.3,
      model_invoked: false,
      derived_by_deterministic_reducer: true,
    });
  }

  return input.observation;
}

export function getLiveJobPolicyObservation(observationId: string): LiveJobPolicyObservation | null {
  return observationsById.get(observationId) ?? null;
}

export function listLiveJobPolicyObservations(input: {
  contractId?: string | null;
  limit?: number;
} = {}): LiveJobPolicyObservation[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  const ids = input.contractId
    ? observationIdsByContract.get(input.contractId) ?? []
    : Array.from(observationsById.keys());
  return ids
    .map((id) => observationsById.get(id))
    .filter((entry): entry is LiveJobPolicyObservation => Boolean(entry))
    .slice(-limit);
}

export function resetLiveJobPolicyObservationStoreForTest(): void {
  observationsById.clear();
  observationIdsByContract.clear();
}
