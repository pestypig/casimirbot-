import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { LiveSourceFreshnessStatus, LiveSourceObservation } from "@shared/live-source-observation";
import { normalizeMinecraftSourceEvent } from "../live-source/normalize-minecraft-source-event";
import { recordLiveSourceObservation } from "../live-source/live-source-observation-store";
import { projectLiveJobObservationToLiveAnswers } from "../live-answers/live-answers-projection";
import {
  listLiveJobContracts,
  getLiveJobContract,
  type StoredLiveJobContract,
} from "./live-job-contract-store";
import { liveJobAcceptsSourceObservation } from "./live-job-source-matcher";
import { reduceAndRecordLiveJobSourceObservation } from "./live-job-runtime";

export type LiveJobRuntimeDispatchResult = {
  source_observation_id: string;
  matched_contract_ids: string[];
  policy_observation_ids: string[];
  live_answers_projection_ids: string[];
  live_answers_delta_ids: string[];
  voice_proposal_ids: string[];
  assistant_answer: false;
  raw_content_included: false;
};

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

const sourceIsDispatchable = (contract: StoredLiveJobContract): boolean =>
  contract.runtime_status !== "stopped" && contract.runtime_status !== "paused";

const contractsForObservation = (sourceObservation: LiveSourceObservation): StoredLiveJobContract[] => {
  const explicitContracts = (sourceObservation.job_contract_ids ?? [])
    .map((contractId) => getLiveJobContract(contractId))
    .filter((contract): contract is StoredLiveJobContract => Boolean(contract));
  const scopedContracts = listLiveJobContracts({
    threadId: sourceObservation.thread_id,
    roomId: sourceObservation.thread_id ? null : sourceObservation.room_id,
    limit: 200,
  });
  return Array.from(new Map(
    [...explicitContracts, ...scopedContracts]
      .filter(sourceIsDispatchable)
      .map((contract) => [contract.contract_id, contract]),
  ).values());
};

export function dispatchLiveSourceObservation(input: {
  sourceObservation: LiveSourceObservation;
  now?: Date;
}): LiveJobRuntimeDispatchResult {
  const matchedContracts = contractsForObservation(input.sourceObservation).filter((contract) =>
    liveJobAcceptsSourceObservation({
      contract,
      sourceObservation: input.sourceObservation,
    }),
  );
  const sourceObservation = recordLiveSourceObservation({
    ...input.sourceObservation,
    job_contract_ids: Array.from(new Set([
      ...(input.sourceObservation.job_contract_ids ?? []),
      ...matchedContracts.map((contract) => contract.contract_id),
    ])),
  });

  const policyObservationIds: string[] = [];
  const liveAnswersProjectionIds: string[] = [];
  const liveAnswersDeltaIds: string[] = [];
  const voiceProposalIds: string[] = [];

  for (const contract of matchedContracts) {
    const reduction = reduceAndRecordLiveJobSourceObservation({
      contract,
      sourceObservation,
      thread_id: contract.thread_id ?? sourceObservation.thread_id ?? null,
      room_id: contract.room_id ?? sourceObservation.room_id ?? null,
      environment_id: contract.environment_id ?? sourceObservation.environment_id ?? null,
      now: input.now,
    });
    policyObservationIds.push(reduction.policy_observation.observation_id);
    if (reduction.voice_proposal) {
      voiceProposalIds.push(reduction.voice_proposal.proposal_id);
    }
    const projection = projectLiveJobObservationToLiveAnswers({
      contract,
      sourceObservation: reduction.source_observation,
      policyObservation: reduction.policy_observation,
      voiceProposal: reduction.voice_proposal,
      thread_id: contract.thread_id ?? reduction.source_observation.thread_id ?? null,
      room_id: contract.room_id ?? reduction.source_observation.room_id ?? null,
      environment_id: contract.environment_id ?? reduction.source_observation.environment_id ?? null,
      now: input.now,
    });
    liveAnswersProjectionIds.push(projection.projection.projection_id);
    if (projection.environment_delta_id) {
      liveAnswersDeltaIds.push(projection.environment_delta_id);
    }
  }

  return {
    source_observation_id: sourceObservation.observation_id,
    matched_contract_ids: matchedContracts.map((contract) => contract.contract_id),
    policy_observation_ids: policyObservationIds,
    live_answers_projection_ids: liveAnswersProjectionIds,
    live_answers_delta_ids: liveAnswersDeltaIds,
    voice_proposal_ids: voiceProposalIds,
    assistant_answer: false,
    raw_content_included: false,
  };
}

const routeStatusFromWorldEvent = (
  event: HelixWorldEvent,
): "on_route" | "drift_candidate" | "drift_confirmed" | "unknown" => {
  const meta = readRecord(event.meta);
  const objective = readRecord(event.objective_delta);
  const explicit = normalizeString(meta.route_state) ??
    normalizeString(meta.route_status) ??
    normalizeString(meta.drift_status) ??
    normalizeString(objective.route_state) ??
    normalizeString(objective.route_status);
  const value = explicit ?? event.event_type;
  if (/^(?:on_route|route_clean|route_on_path|route_on_route)$/i.test(value)) return "on_route";
  if (/^(?:drift_candidate|route_drift_candidate|off_route_candidate)$/i.test(value)) return "drift_candidate";
  if (/^(?:drift_confirmed|route_drift_confirmed|route_drift|off_route|drift)$/i.test(value)) return "drift_confirmed";
  return "unknown";
};

const freshnessFromWorldEvent = (event: HelixWorldEvent): LiveSourceFreshnessStatus => {
  const meta = readRecord(event.meta);
  const explicit = normalizeString(meta.freshness_status) ?? normalizeString(meta.source_health);
  if (explicit === "fresh" || explicit === "stale" || explicit === "missing" || explicit === "blocked" || explicit === "unknown") {
    return explicit;
  }
  if (/source_(?:missing|disconnected)|minecraft_source_missing/i.test(event.event_type)) return "missing";
  if (/source_stale|minecraft_source_stale/i.test(event.event_type)) return "stale";
  if (/source_blocked|minecraft_source_blocked/i.test(event.event_type)) return "blocked";
  return "fresh";
};

const positionFromWorldEvent = (
  event: HelixWorldEvent,
): { x?: number; y?: number; z?: number; dimension?: string } | null => {
  const location = readRecord(event.location);
  if (Object.keys(location).length === 0) return null;
  return {
    x: readNumber(location.x),
    y: readNumber(location.y),
    z: readNumber(location.z),
    dimension: normalizeString(location.dimension) ?? normalizeString(location.world) ?? undefined,
  };
};

export function dispatchMinecraftWorldEventToLiveJobs(input: {
  event: HelixWorldEvent;
  threadId?: string | null;
  environmentId?: string | null;
  now?: Date;
}): LiveJobRuntimeDispatchResult {
  const meta = readRecord(input.event.meta);
  const routeState = routeStatusFromWorldEvent(input.event);
  const sourceObservation = normalizeMinecraftSourceEvent({
    thread_id: normalizeString(input.threadId) ?? undefined,
    room_id: input.event.room_id,
    environment_id: normalizeString(input.environmentId),
    source_id: normalizeString(input.event.source_id) ?? "source:minecraft-server",
    binding_id: normalizeString(meta.binding_id),
    observed_at: input.event.ts,
    now: input.now,
    stale_after_ms: readNumber(meta.stale_after_ms) ?? null,
    freshness_status: freshnessFromWorldEvent(input.event),
    source_label: input.event.world_id,
    confidence: "high",
    position: positionFromWorldEvent(input.event),
    route_state: routeState === "unknown"
      ? null
      : {
          status: routeState,
          target: normalizeString(meta.target) ?? normalizeString(readRecord(input.event.objective_delta).target),
          distance_from_route: readNumber(meta.distance_from_route),
        },
    evidence_refs: input.event.evidence_refs,
  });
  return dispatchLiveSourceObservation({
    sourceObservation,
    now: input.now,
  });
}
