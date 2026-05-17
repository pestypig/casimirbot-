import crypto from "node:crypto";
import {
  HELIX_LIVE_TANGENT_EVALUATION_SCHEMA,
  type HelixLiveTangentEvaluation,
} from "@shared/helix-live-tangent-evaluation";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";
import { createAskHandoff } from "../helix-ask/ask-handoff-router";
import { recordLiveTangentEvaluation } from "./live-tangent-evaluation-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function arbitrateLiveSituationHandoffs(input: {
  run: HelixLiveSituationRun;
  evaluations: HelixLiveFieldEvaluation[];
}) {
  const evidenceRefs = Array.from(new Set(input.evaluations.flatMap((entry) => entry.evidence_refs))).slice(-12);
  const uncertainty = input.evaluations.find((entry) => entry.field_key === "uncertainty" || entry.field_key === "missing_evidence");
  const tangent: HelixLiveTangentEvaluation | null = uncertainty && uncertainty.missing_evidence.length > 0
    ? recordLiveTangentEvaluation({
        schema: HELIX_LIVE_TANGENT_EVALUATION_SCHEMA,
        tangent_id: `live_tangent:${hashShort([
          input.run.situation_run_id,
          uncertainty.evaluation_id,
          uncertainty.missing_evidence,
        ])}`,
        situation_run_id: input.run.situation_run_id,
        thread_id: input.run.thread_id,
        tangent_type: "missing_evidence_tangent",
        claim: uncertainty.missing_evidence.join("; "),
        confidence: Math.max(0.2, Math.min(0.8, 1 - uncertainty.confidence)),
        evidence_refs: evidenceRefs,
        recommended_handoff: {
          type: "none",
          reason: "Missing corroboration is a field caveat for this run, not an automatic user-facing action.",
        },
        assistant_answer: false,
        raw_content_included: false,
        role: "validation",
      })
    : null;
  const userNotice = input.evaluations.find((entry) =>
    entry.field_key === "user_notice" &&
    entry.confidence > 0.8 &&
    entry.status === "supported"
  );
  const handoff = userNotice
    ? createAskHandoff({
        thread_id: input.run.thread_id,
        room_id: input.run.environment_id,
        handoff_type: "helix_ask_reasoning",
        objective: "Prepare a user-facing notice from approved situation-run evidence.",
        question: "What should be surfaced to the user based only on selected field evaluations?",
        selected_evidence_refs: evidenceRefs,
        allowed_inputs: {
          observation_refs: evidenceRefs,
          interpretation_refs: [],
          goal_refs: [],
        },
        expected_output: "grounded_micro_report",
        reasoning_budget: input.run.reasoning_budget,
        raw_context_approved: false,
      })
    : null;
  return {
    tangent,
    handoff,
    decision: handoff ? "ask_handoff" : "silent_card_update",
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
}
