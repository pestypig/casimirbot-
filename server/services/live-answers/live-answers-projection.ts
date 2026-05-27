import crypto from "node:crypto";
import {
  LIVE_ANSWERS_PROJECTION_SCHEMA,
  type LiveAnswersProjection,
} from "@shared/live-answers-projection";
import type { LiveJobPolicyObservation } from "@shared/live-job-policy-observation";
import type { LiveSourceObservation } from "@shared/live-source-observation";
import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";
import type { VoiceProposal } from "@shared/voice-proposal";
import {
  getActiveLiveAnswerEnvironmentForRoom,
  getActiveLiveAnswerEnvironmentForSource,
  getActiveLiveAnswerEnvironmentForThread,
  getLiveAnswerEnvironment,
  updateLiveAnswerEnvironment,
} from "../situation-room/live-answer-environment-store";

const projectionsById = new Map<string, LiveAnswersProjection>();
const projectionIdsByContract = new Map<string, string[]>();

const hashShort = (value: unknown, size = 20): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const latestEligibleText = (
  observation: LiveJobPolicyObservation,
  outputKind: LiveJobPolicyObservation["output_candidates"][number]["output_kind"],
): string | null =>
  observation.output_candidates.find((candidate) => candidate.output_kind === outputKind && candidate.eligible && candidate.text)?.text ?? null;

const projectionKind = (
  observation: LiveJobPolicyObservation,
  voiceProposal?: VoiceProposal | null,
): LiveAnswersProjection["display_kind"] => {
  if (voiceProposal) return "voice_proposal";
  if (observation.event_kind === "source_missing" || observation.event_kind === "source_stale") return "source_health";
  if (observation.event_kind === "route_clean" || observation.event_kind === "route_drift_candidate" || observation.event_kind === "route_drift_confirmed") {
    return "route_status";
  }
  if (observation.status === "blocked" || observation.status === "missing_input" || observation.status === "failed") return "job_diagnostic";
  return "dottie_status";
};

const displaySummary = (
  observation: LiveJobPolicyObservation,
  voiceProposal?: VoiceProposal | null,
): string => {
  if (voiceProposal) return `${voiceProposal.proposed_text} Spoken: no.`;
  return latestEligibleText(observation, "live_answers_card") ??
    latestEligibleText(observation, "route_evidence") ??
    latestEligibleText(observation, "source_health_status") ??
    observation.summary;
};

const dottieStatus = (
  observation: LiveJobPolicyObservation,
): LiveAnswersProjection["state"]["dottie_status"] => {
  if (observation.status === "blocked" || observation.status === "missing_input") return "blocked";
  if (observation.status === "stale") return "stale";
  if (observation.status === "trigger_matched") return "trigger_matched";
  if (observation.status === "suppressed") return "holding_quiet";
  return undefined;
};

const buildLineValues = (input: {
  projection: LiveAnswersProjection;
  policyObservation: LiveJobPolicyObservation;
  sourceObservation: LiveSourceObservation;
  voiceProposal?: VoiceProposal | null;
}): Record<string, {
  value: string;
  confidence?: number | null;
  evidence_refs?: string[];
  source_event_ids?: string[];
  deterministic?: boolean;
}> => {
  const evidenceRefs = [
    input.projection.projection_id,
    input.policyObservation.observation_id,
    input.sourceObservation.observation_id,
    ...(input.voiceProposal ? [input.voiceProposal.proposal_id] : []),
  ];
  const confidence =
    input.policyObservation.policy_evaluation.confidence === "high"
      ? 0.9
      : input.policyObservation.policy_evaluation.confidence === "medium"
        ? 0.6
        : 0.3;
  const routeState = input.sourceObservation.payload_summary?.route_state?.status;
  const lineValues: Record<string, {
    value: string;
    confidence?: number | null;
    evidence_refs?: string[];
    source_event_ids?: string[];
    deterministic?: boolean;
  }> = {
    situation: {
      value: input.projection.display_summary,
      confidence,
      evidence_refs: evidenceRefs,
      source_event_ids: [input.sourceObservation.observation_id],
      deterministic: true,
    },
    next_check: {
      value: input.voiceProposal
        ? "Voice proposal created; nothing has been spoken."
        : routeState === "on_route"
          ? "Continue watching for confirmed route drift or stale source data."
          : "Continue projecting live evidence for Helix Ask retrieval.",
      confidence,
      evidence_refs: evidenceRefs,
      source_event_ids: [input.sourceObservation.observation_id],
      deterministic: true,
    },
  };

  if (routeState === "on_route") {
    lineValues.rehearsal = {
      value: "Route: clean. Dottie is holding quiet because no trigger matched.",
      confidence,
      evidence_refs: evidenceRefs,
      source_event_ids: [input.sourceObservation.observation_id],
      deterministic: true,
    };
  } else if (routeState === "drift_candidate" || routeState === "drift_confirmed") {
    lineValues.risk = {
      value: routeState === "drift_confirmed" ? "Route drift confirmed." : "Route drift candidate observed.",
      confidence,
      evidence_refs: evidenceRefs,
      source_event_ids: [input.sourceObservation.observation_id],
      deterministic: true,
    };
  }

  if (input.sourceObservation.freshness.status === "stale" || input.sourceObservation.freshness.status === "missing") {
    lineValues.unknowns = {
      value: input.sourceObservation.freshness.status === "missing"
        ? "Minecraft source missing."
        : "Minecraft source is stale.",
      confidence,
      evidence_refs: evidenceRefs,
      source_event_ids: [input.sourceObservation.observation_id],
      deterministic: true,
    };
  }

  return lineValues;
};

export function summarizeLiveJobPolicyForProjection(
  observation: LiveJobPolicyObservation,
): {
  line_key: "route_evidence" | "source_health" | "dottie_commentary" | "live_job_status";
  value: string;
  evidence_refs: string[];
  assistant_answer: false;
} {
  const lineKey =
    observation.event_kind === "route_clean" ||
    observation.event_kind === "route_drift_candidate" ||
    observation.event_kind === "route_drift_confirmed"
      ? "route_evidence"
      : observation.event_kind === "source_missing" || observation.event_kind === "source_stale"
        ? "source_health"
        : observation.job_name.toLowerCase().includes("dottie")
          ? "dottie_commentary"
          : "live_job_status";
  return {
    line_key: lineKey,
    value: observation.summary,
    evidence_refs: [observation.observation_id, ...observation.source_observation_refs],
    assistant_answer: false,
  };
}

export function projectLiveJobObservationToLiveAnswers(input: {
  contract: SituationRoomLiveJobContract;
  sourceObservation: LiveSourceObservation;
  policyObservation: LiveJobPolicyObservation;
  voiceProposal?: VoiceProposal | null;
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
  now?: Date;
}): {
  projection: LiveAnswersProjection;
  environment_delta_id: string | null;
} {
  const now = input.now?.toISOString() ?? new Date().toISOString();
  const projection: LiveAnswersProjection = {
    schema: LIVE_ANSWERS_PROJECTION_SCHEMA,
    projection_id: `live_answers_projection:${hashShort([
      input.contract.contract_id,
      input.policyObservation.observation_id,
      input.voiceProposal?.proposal_id ?? null,
      now,
    ])}`,
    created_at: now,
    contract_id: input.contract.contract_id,
    source_observation_refs: [input.sourceObservation.observation_id],
    policy_observation_refs: [input.policyObservation.observation_id],
    voice_proposal_refs: input.voiceProposal ? [input.voiceProposal.proposal_id] : [],
    display_kind: projectionKind(input.policyObservation, input.voiceProposal),
    display_summary: displaySummary(input.policyObservation, input.voiceProposal),
    state: {
      job_status: input.policyObservation.status,
      route_state: input.sourceObservation.payload_summary?.route_state?.status ?? "unknown",
      source_freshness: input.sourceObservation.freshness.status,
      dottie_status: dottieStatus(input.policyObservation),
      voice_status: input.voiceProposal ? "proposal_only" : "none",
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  projectionsById.set(projection.projection_id, projection);
  const current = projectionIdsByContract.get(input.contract.contract_id) ?? [];
  projectionIdsByContract.set(
    input.contract.contract_id,
    Array.from(new Set([...current, projection.projection_id])).slice(-500),
  );

  const environment = (
    input.environment_id ? getLiveAnswerEnvironment(input.environment_id) : null
  ) ?? (
    input.thread_id ? getActiveLiveAnswerEnvironmentForThread(input.thread_id) : null
  ) ?? (
    input.room_id ? getActiveLiveAnswerEnvironmentForRoom(input.room_id) : null
  ) ?? getActiveLiveAnswerEnvironmentForSource(input.sourceObservation.source_id);
  const delta = environment
    ? updateLiveAnswerEnvironment({
        environment_id: environment.environment_id,
        reason: "source_event",
        line_values: buildLineValues({
          projection,
          policyObservation: input.policyObservation,
          sourceObservation: input.sourceObservation,
          voiceProposal: input.voiceProposal,
        }),
        latest_summary: projection.display_summary,
        evidence_refs: [
          projection.projection_id,
          input.policyObservation.observation_id,
          input.sourceObservation.observation_id,
          ...(input.voiceProposal ? [input.voiceProposal.proposal_id] : []),
        ],
        source_event_count: 1,
        now,
      })
    : null;

  return {
    projection,
    environment_delta_id: delta?.delta.delta_id ?? null,
  };
}

export function getLiveAnswersProjection(projectionId: string): LiveAnswersProjection | null {
  return projectionsById.get(projectionId) ?? null;
}

export function listLiveAnswersProjections(input: {
  contractId?: string | null;
  limit?: number;
} = {}): LiveAnswersProjection[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  const ids = input.contractId
    ? projectionIdsByContract.get(input.contractId) ?? []
    : Array.from(projectionsById.keys());
  return ids
    .map((id) => projectionsById.get(id))
    .filter((entry): entry is LiveAnswersProjection => Boolean(entry))
    .slice(-limit);
}

export function resetLiveAnswersProjectionStoreForTest(): void {
  projectionsById.clear();
  projectionIdsByContract.clear();
}
