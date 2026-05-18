import crypto from "node:crypto";
import {
  HELIX_AGENTIC_REQUEST_INPUT_SCHEMA,
  type HelixAgenticRequestInput,
} from "@shared/helix-agentic-request-input";
import type { HelixAskHandoff } from "@shared/helix-ask-handoff";
import type { HelixPlanContract } from "@shared/helix-plan-contract";
import type { HelixLiveArbitrationCandidate } from "@shared/helix-live-arbitration-candidate";
import { createAskHandoff } from "../helix-ask/ask-handoff-router";
import { createPlanContract } from "../helix-ask/plan-contract-boundary-guard";
import { listLiveSituationRuns } from "./live-situation-run-store";
import {
  getLiveArbitrationCandidate,
  updateLiveArbitrationCandidateStatus,
} from "./live-arbitration-candidate-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export type HelixLiveArbitrationSilentUpdate = {
  schema: "helix.live_arbitration_silent_update.v1";
  candidate_id: string;
  situation_run_id: string;
  thread_id: string;
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

export type HelixLiveArbitrationCandidateConsumption = {
  schema: "helix.live_arbitration_candidate_consumption.v1";
  candidate_id: string;
  decision:
    | "silent_update"
    | "ask_handoff"
    | "plan_contract"
    | "request_user_input"
    | "suppressed"
    | "dismissed"
    | "not_found";
  status: "consumed" | "suppressed" | "dismissed" | "not_found";
  reason: string;
  silent_update?: HelixLiveArbitrationSilentUpdate | null;
  ask_handoff?: HelixAskHandoff | null;
  plan_contract?: HelixPlanContract | null;
  request_user_input?: HelixAgenticRequestInput | null;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

const activeRunMatches = (candidate: HelixLiveArbitrationCandidate): boolean => {
  const run = listLiveSituationRuns({
    threadId: candidate.thread_id,
    environmentId: candidate.environment_id,
    limit: 20,
  }).find((entry) => entry.situation_run_id === candidate.situation_run_id);
  return Boolean(
    run &&
    run.source_binding_id === candidate.source_binding_id &&
    run.current_epoch === candidate.epoch &&
    run.status === "active",
  );
};

const suppressed = (
  candidate: HelixLiveArbitrationCandidate,
  reason: string,
  now: string,
): HelixLiveArbitrationCandidateConsumption => {
  updateLiveArbitrationCandidateStatus(candidate.candidate_id, "suppressed");
  return {
    schema: "helix.live_arbitration_candidate_consumption.v1",
    candidate_id: candidate.candidate_id,
    decision: "suppressed",
    status: "suppressed",
    reason,
    silent_update: null,
    ask_handoff: null,
    plan_contract: null,
    request_user_input: null,
    assistant_answer: false,
    raw_content_included: false,
    created_at: now,
  };
};

export function consumeLiveArbitrationCandidate(input: {
  candidateId: string;
  mode?: "auto" | "explicit_ask" | "policy_approved_companion";
  now?: string;
}): HelixLiveArbitrationCandidateConsumption {
  const now = input.now ?? new Date().toISOString();
  const candidate = getLiveArbitrationCandidate(input.candidateId);
  if (!candidate) {
    return {
      schema: "helix.live_arbitration_candidate_consumption.v1",
      candidate_id: input.candidateId,
      decision: "not_found",
      status: "not_found",
      reason: "candidate_not_found",
      assistant_answer: false,
      raw_content_included: false,
      created_at: now,
    };
  }
  if (candidate.status !== "pending") {
    return {
      schema: "helix.live_arbitration_candidate_consumption.v1",
      candidate_id: candidate.candidate_id,
      decision: "dismissed",
      status: "dismissed",
      reason: `candidate_status_${candidate.status}`,
      assistant_answer: false,
      raw_content_included: false,
      created_at: now,
    };
  }
  if (Date.parse(candidate.expires_at) <= Date.parse(now)) {
    updateLiveArbitrationCandidateStatus(candidate.candidate_id, "expired");
    return suppressed(candidate, "candidate_expired", now);
  }
  if (!activeRunMatches(candidate)) {
    return suppressed(candidate, "source_binding_or_epoch_mismatch", now);
  }

  if (candidate.candidate_type === "suppress") {
    return suppressed(candidate, candidate.reason, now);
  }

  if (candidate.candidate_type === "silent_update") {
    updateLiveArbitrationCandidateStatus(candidate.candidate_id, "consumed");
    const silentUpdate: HelixLiveArbitrationSilentUpdate = {
      schema: "helix.live_arbitration_silent_update.v1",
      candidate_id: candidate.candidate_id,
      situation_run_id: candidate.situation_run_id,
      thread_id: candidate.thread_id,
      evidence_refs: candidate.evidence_refs,
      assistant_answer: false,
      raw_content_included: false,
      created_at: now,
    };
    return {
      schema: "helix.live_arbitration_candidate_consumption.v1",
      candidate_id: candidate.candidate_id,
      decision: "silent_update",
      status: "consumed",
      reason: "low_urgency_card_projection_update",
      silent_update: silentUpdate,
      ask_handoff: null,
      plan_contract: null,
      request_user_input: null,
      assistant_answer: false,
      raw_content_included: false,
      created_at: now,
    };
  }

  if (candidate.candidate_type === "ask_handoff_candidate") {
    const handoff = createAskHandoff({
      handoff_id: `ask_handoff:${hashShort([candidate.candidate_id, now])}`,
      thread_id: candidate.thread_id,
      objective: candidate.proposed_output?.question ?? candidate.reason,
      question: candidate.proposed_output?.question ?? candidate.reason,
      handoff_type: candidate.proposed_output?.handoff_type ?? "helix_ask_reasoning",
      selected_evidence_refs: [
        ...candidate.evidence_refs,
        ...candidate.field_evaluation_refs,
        ...candidate.tangent_refs,
      ],
      allowed_inputs: {
        observation_refs: candidate.evidence_refs,
      },
      reasoning_budget: candidate.priority === "critical" ? "normal" : "cheap",
      expected_output: "grounded_micro_report",
      raw_context_approved: false,
      created_at: now,
    });
    updateLiveArbitrationCandidateStatus(candidate.candidate_id, "consumed");
    return {
      schema: "helix.live_arbitration_candidate_consumption.v1",
      candidate_id: candidate.candidate_id,
      decision: "ask_handoff",
      status: "consumed",
      reason: "ask_handoff_created_by_consumer",
      silent_update: null,
      ask_handoff: handoff,
      plan_contract: null,
      request_user_input: null,
      assistant_answer: false,
      raw_content_included: false,
      created_at: now,
    };
  }

  if (candidate.candidate_type === "plan_contract_candidate") {
    const contract = createPlanContract({
      plan_id: `plan_contract:${hashShort([candidate.candidate_id, now])}`,
      thread_id: candidate.thread_id,
      panel_id: "situation-room",
      action_id: candidate.proposed_output?.plan_action_id ?? "situation-room.live-source.capture_now",
      args: {
        situation_run_id: candidate.situation_run_id,
        source_binding_id: candidate.source_binding_id,
        epoch: candidate.epoch,
      },
      evidence_refs: [
        ...candidate.evidence_refs,
        ...candidate.field_evaluation_refs,
        ...candidate.tangent_refs,
      ],
      client_adoption_required: true,
      terminal_expectation: {
        type: "client_adoption_observation_required",
        artifact: "client_capability_adoption",
      },
      execute: false,
      created_at: now,
    });
    updateLiveArbitrationCandidateStatus(candidate.candidate_id, "consumed");
    return {
      schema: "helix.live_arbitration_candidate_consumption.v1",
      candidate_id: candidate.candidate_id,
      decision: "plan_contract",
      status: "consumed",
      reason: "plan_contract_created_without_execution",
      silent_update: null,
      ask_handoff: null,
      plan_contract: contract,
      request_user_input: null,
      assistant_answer: false,
      raw_content_included: false,
      created_at: now,
    };
  }

  const requestInput: HelixAgenticRequestInput = {
    schema: HELIX_AGENTIC_REQUEST_INPUT_SCHEMA,
    request_id: `request_user_input:${hashShort([candidate.candidate_id, now])}`,
    thread_id: candidate.thread_id,
    room_id: null,
    question: candidate.proposed_output?.missing_input ?? candidate.reason,
    answer_options: ["Continue with visual evidence only", "Add more context first"],
    why_it_matters: "The situation run marked this input as useful before promoting the candidate.",
    evidence_refs: [
      ...candidate.evidence_refs,
      ...candidate.field_evaluation_refs,
      ...candidate.tangent_refs,
    ],
    expected_effect: "resolve_missing_evidence",
    source: "clarification_dialogue",
    assistant_answer: false,
    raw_content_included: false,
    created_at: now,
  };
  updateLiveArbitrationCandidateStatus(candidate.candidate_id, "consumed");
  return {
    schema: "helix.live_arbitration_candidate_consumption.v1",
    candidate_id: candidate.candidate_id,
    decision: "request_user_input",
    status: "consumed",
    reason: "request_user_input_created_by_consumer",
    silent_update: null,
    ask_handoff: null,
    plan_contract: null,
    request_user_input: requestInput,
    assistant_answer: false,
    raw_content_included: false,
    created_at: now,
  };
}

