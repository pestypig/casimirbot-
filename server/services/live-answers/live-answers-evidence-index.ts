import type { LiveJobPolicyObservation } from "@shared/live-job-policy-observation";
import type { LiveSourceObservation } from "@shared/live-source-observation";
import type { VoiceProposal } from "@shared/voice-proposal";
import { listLiveJobPolicyObservations } from "../live-job/live-job-policy-observation-store";
import { listLiveSourceObservations } from "../live-source/live-source-observation-store";
import { listVoiceProposals } from "../voice/voice-proposal-store";

export const LIVE_ANSWERS_QUERY_OBSERVATION_SCHEMA =
  "helix.live_answers_query_observation.v1" as const;

export type LiveAnswersQueryObservation = {
  schema: typeof LIVE_ANSWERS_QUERY_OBSERVATION_SCHEMA;
  query: string;
  contract_id?: string | null;
  evidence_refs: string[];
  current_state: {
    job_status: "active" | "blocked" | "stale" | "quiet" | "triggered" | "unknown";
    route_state?: "on_route" | "drift_candidate" | "drift_confirmed" | "unknown";
    source_freshness?: "fresh" | "stale" | "missing" | "blocked" | "unknown";
    last_trigger?: string | null;
    last_suppression_reason?: string | null;
    voice_policy?: string | null;
    spoken: false;
  };
  source_observations: LiveSourceObservation[];
  policy_observations: LiveJobPolicyObservation[];
  voice_proposals: VoiceProposal[];
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
};

const latest = <T>(values: T[]): T | null =>
  values.length > 0 ? values[values.length - 1] : null;

export function queryLiveAnswersEvidence(input: {
  query?: string | null;
  contractId?: string | null;
  threadId?: string | null;
  limit?: number;
}): LiveAnswersQueryObservation {
  const sourceObservations = listLiveSourceObservations({
    contractId: input.contractId,
    threadId: input.threadId,
    limit: input.limit ?? 50,
  });
  const policyObservations = listLiveJobPolicyObservations({
    contractId: input.contractId,
    limit: input.limit ?? 50,
  });
  const voiceProposals = listVoiceProposals({
    contractId: input.contractId,
    limit: input.limit ?? 20,
  });
  const latestPolicy = latest(policyObservations);
  const latestSource = latest(sourceObservations);
  const latestVoice = latest(voiceProposals);
  const routeState = latestSource?.payload_summary?.route_state?.status ?? "unknown";
  const jobStatus =
    latestPolicy?.status === "blocked"
      ? "blocked"
      : latestPolicy?.status === "stale"
        ? "stale"
        : latestPolicy?.status === "trigger_matched"
          ? "triggered"
          : latestPolicy?.status === "suppressed"
            ? "quiet"
            : "unknown";
  const evidenceRefs = Array.from(new Set([
    ...sourceObservations.map((entry) => entry.observation_id),
    ...sourceObservations.flatMap((entry) => entry.evidence_refs),
    ...policyObservations.map((entry) => entry.observation_id),
    ...policyObservations.flatMap((entry) => entry.source_observation_refs),
    ...voiceProposals.map((entry) => entry.proposal_id),
  ]));

  return {
    schema: LIVE_ANSWERS_QUERY_OBSERVATION_SCHEMA,
    query: input.query ?? "live_answers_evidence",
    contract_id: input.contractId ?? null,
    evidence_refs: evidenceRefs,
    current_state: {
      job_status: jobStatus,
      route_state: routeState,
      source_freshness: latestSource?.freshness.status ?? "unknown",
      last_trigger: latestPolicy?.policy_evaluation.trigger_matched ? latestPolicy.event_kind : null,
      last_suppression_reason: latestPolicy?.policy_evaluation.suppression_reason ?? null,
      voice_policy: latestVoice?.voice_policy ?? null,
      spoken: false,
    },
    source_observations: sourceObservations,
    policy_observations: policyObservations,
    voice_proposals: voiceProposals,
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
  };
}
