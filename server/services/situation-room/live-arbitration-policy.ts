import crypto from "node:crypto";
import {
  HELIX_LIVE_ARBITRATION_CANDIDATE_SCHEMA,
  type HelixLiveArbitrationCandidate,
  type HelixLiveArbitrationCandidatePriority,
  type HelixLiveArbitrationCandidateType,
} from "@shared/helix-live-arbitration-candidate";
import type { HelixLiveHandoffArbitration } from "@shared/helix-live-handoff-arbitration";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";
import type { HelixLiveTangentEvaluation } from "@shared/helix-live-tangent-evaluation";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const candidateTypeFor = (decision: HelixLiveHandoffArbitration["decision"]): HelixLiveArbitrationCandidateType => {
  if (decision === "ask_handoff_candidate") return "ask_handoff_candidate";
  if (decision === "plan_contract_candidate") return "plan_contract_candidate";
  if (decision === "request_user_input_candidate") return "request_user_input_candidate";
  if (decision === "blocked") return "suppress";
  return "silent_update";
};

const priorityFor = (type: HelixLiveArbitrationCandidateType, evaluations: HelixLiveFieldEvaluation[]): HelixLiveArbitrationCandidatePriority => {
  if (evaluations.some((entry: HelixLiveFieldEvaluation) => entry.field_key === "risk" && entry.confidence > 0.82)) return "critical";
  if (type === "plan_contract_candidate" || type === "request_user_input_candidate") return "warn";
  if (type === "ask_handoff_candidate") return "notice";
  return "info";
};

export function buildLiveArbitrationCandidate(input: {
  run: HelixLiveSituationRun;
  arbitration: HelixLiveHandoffArbitration;
  evaluations: HelixLiveFieldEvaluation[];
  tangent?: HelixLiveTangentEvaluation | null;
  now?: string;
}): HelixLiveArbitrationCandidate {
  const now = input.now ?? new Date().toISOString();
  const type = candidateTypeFor(input.arbitration.decision);
  const userNotice = input.evaluations.find((entry: HelixLiveFieldEvaluation) => entry.field_key === "user_notice");
  const question = type === "ask_handoff_candidate"
    ? userNotice?.value ?? "Explain the latest live situation update using selected field evidence."
    : undefined;
  return {
    schema: HELIX_LIVE_ARBITRATION_CANDIDATE_SCHEMA,
    candidate_id: `live_arbitration_candidate:${hashShort([
      input.run.situation_run_id,
      input.run.current_epoch,
      input.arbitration.arbitration_id,
      type,
    ])}`,
    situation_run_id: input.run.situation_run_id,
    thread_id: input.run.thread_id,
    environment_id: input.run.environment_id,
    source_binding_id: input.run.source_binding_id,
    epoch: input.run.current_epoch,
    candidate_type: type,
    reason: input.arbitration.candidate?.reason ?? "Handoff arbitration completed.",
    priority: priorityFor(type, input.evaluations),
    evidence_refs: input.arbitration.evidence_refs,
    field_evaluation_refs: input.evaluations.map((entry: HelixLiveFieldEvaluation) => entry.evaluation_id),
    tangent_refs: input.tangent ? [input.tangent.tangent_id] : [],
    proposed_output: {
      handoff_type: type === "ask_handoff_candidate" ? "helix_ask_reasoning" : undefined,
      question,
      plan_action_id: type === "plan_contract_candidate" ? "situation-room.live-source.capture_now" : undefined,
      missing_input: type === "request_user_input_candidate" ? "User intent or permission is required before continuing." : undefined,
    },
    status: "pending",
    expires_at: new Date(Date.parse(now) + 45_000).toISOString(),
    assistant_answer: false,
    raw_content_included: false,
  };
}
