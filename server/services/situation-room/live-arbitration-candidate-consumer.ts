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
import { appendProcedureEpochLedgerItem } from "./procedure-epoch-ledger-store";
import { recordProcedureEpochClosure } from "./procedure-epoch-closure";
import { recordAskHandoffConsumption } from "../helix-ask/ask-handoff-consumption-store";
import { recordPlanContractExecution } from "../helix-ask/plan-contract-execution-store";

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
  }).find((entry: { situation_run_id: string }) => entry.situation_run_id === candidate.situation_run_id);
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
  appendProcedureEpochLedgerItem({
    situation_run_id: candidate.situation_run_id,
    source_binding_id: candidate.source_binding_id,
    thread_id: candidate.thread_id,
    environment_id: candidate.environment_id,
    epoch: candidate.epoch,
    item_kind: "arbitration_candidate",
    item_ref: candidate.candidate_id,
    summary: `Arbitration candidate suppressed: ${reason}.`,
    causality_refs: [
      ...candidate.evidence_refs,
      ...candidate.field_evaluation_refs,
      ...candidate.tangent_refs,
    ],
    created_at: now,
  });
  recordProcedureEpochClosure({
    situation_run_id: candidate.situation_run_id,
    thread_id: candidate.thread_id,
    environment_id: candidate.environment_id,
    source_binding_id: candidate.source_binding_id,
    epoch: candidate.epoch,
    status: reason === "candidate_expired" ? "expired" : "suppressed",
    card_updated: false,
    confidence_changes: [],
    pending_actions: [],
    next_epoch_triggers: [],
    created_at: now,
  });
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
    appendProcedureEpochLedgerItem({
      situation_run_id: candidate.situation_run_id,
      source_binding_id: candidate.source_binding_id,
      thread_id: candidate.thread_id,
      environment_id: candidate.environment_id,
      epoch: candidate.epoch,
      item_kind: "silent_update",
      item_ref: candidate.candidate_id,
      summary: "Arbitration candidate consumed as a silent card update.",
      causality_refs: [
        ...candidate.evidence_refs,
        ...candidate.field_evaluation_refs,
        ...candidate.tangent_refs,
      ],
      created_at: now,
    });
    recordProcedureEpochClosure({
      situation_run_id: candidate.situation_run_id,
      thread_id: candidate.thread_id,
      environment_id: candidate.environment_id,
      source_binding_id: candidate.source_binding_id,
      epoch: candidate.epoch,
      status: "silent_update",
      card_updated: true,
      confidence_changes: [],
      pending_actions: [],
      next_epoch_triggers: [],
      created_at: now,
    });
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
    const consumptionTrace = recordAskHandoffConsumption({
      handoff_id: handoff.handoff_id,
      situation_run_id: candidate.situation_run_id,
      epoch: candidate.epoch,
      thread_id: candidate.thread_id,
      selected_evidence_refs: handoff.selected_evidence_refs,
      reasoning_budget: handoff.reasoning_budget,
      terminal_turn_required: true,
      status: "pending",
      created_at: now,
    });
    appendProcedureEpochLedgerItem({
      situation_run_id: candidate.situation_run_id,
      source_binding_id: candidate.source_binding_id,
      thread_id: candidate.thread_id,
      environment_id: candidate.environment_id,
      epoch: candidate.epoch,
      item_kind: "handoff",
      item_ref: handoff.handoff_id,
      summary: `Ask handoff pending: ${handoff.question}`,
      causality_refs: [
        candidate.candidate_id,
        consumptionTrace.consumption_id,
        ...handoff.selected_evidence_refs,
      ],
      created_at: now,
    });
    recordProcedureEpochClosure({
      situation_run_id: candidate.situation_run_id,
      thread_id: candidate.thread_id,
      environment_id: candidate.environment_id,
      source_binding_id: candidate.source_binding_id,
      epoch: candidate.epoch,
      status: "handoff_pending",
      card_updated: true,
      confidence_changes: [],
      pending_actions: [handoff.handoff_id],
      next_epoch_triggers: [],
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
    const executionTrace = recordPlanContractExecution({
      plan_id: contract.plan_id,
      situation_run_id: candidate.situation_run_id,
      epoch: candidate.epoch,
      action_id: contract.action_id,
      runtime_status: "pending",
      receipt_refs: contract.evidence_refs,
      created_at: now,
    });
    appendProcedureEpochLedgerItem({
      situation_run_id: candidate.situation_run_id,
      source_binding_id: candidate.source_binding_id,
      thread_id: candidate.thread_id,
      environment_id: candidate.environment_id,
      epoch: candidate.epoch,
      item_kind: "plan_contract",
      item_ref: contract.plan_id,
      summary: `Plan contract pending for ${contract.action_id}.`,
      causality_refs: [
        candidate.candidate_id,
        executionTrace.execution_id,
        ...contract.evidence_refs,
      ],
      created_at: now,
    });
    recordProcedureEpochClosure({
      situation_run_id: candidate.situation_run_id,
      thread_id: candidate.thread_id,
      environment_id: candidate.environment_id,
      source_binding_id: candidate.source_binding_id,
      epoch: candidate.epoch,
      status: "plan_pending",
      card_updated: true,
      confidence_changes: [],
      pending_actions: [contract.plan_id],
      next_epoch_triggers: [],
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
  appendProcedureEpochLedgerItem({
    situation_run_id: candidate.situation_run_id,
    source_binding_id: candidate.source_binding_id,
    thread_id: candidate.thread_id,
    environment_id: candidate.environment_id,
    epoch: candidate.epoch,
    item_kind: "request_user_input",
    item_ref: requestInput.request_id,
    summary: requestInput.question,
    causality_refs: requestInput.evidence_refs,
    created_at: now,
  });
  recordProcedureEpochClosure({
    situation_run_id: candidate.situation_run_id,
    thread_id: candidate.thread_id,
    environment_id: candidate.environment_id,
    source_binding_id: candidate.source_binding_id,
    epoch: candidate.epoch,
    status: "request_input_pending",
    card_updated: true,
    confidence_changes: [],
    pending_actions: [requestInput.request_id],
    next_epoch_triggers: [],
    created_at: now,
  });
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
