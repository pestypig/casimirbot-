import crypto from "node:crypto";
import {
  HELIX_LIVE_HANDOFF_ARBITRATION_SCHEMA,
  type HelixLiveHandoffArbitration,
} from "@shared/helix-live-handoff-arbitration";
import {
  HELIX_LIVE_TANGENT_EVALUATION_SCHEMA,
  type HelixLiveTangentEvaluation,
} from "@shared/helix-live-tangent-evaluation";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";
import { recordLiveTangentEvaluation } from "./live-tangent-evaluation-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function arbitrateLiveSituationHandoffs(input: {
  run: HelixLiveSituationRun;
  evaluations: HelixLiveFieldEvaluation[];
}): {
  tangent: HelixLiveTangentEvaluation | null;
  arbitration: HelixLiveHandoffArbitration;
  assistant_answer: false;
  raw_content_included: false;
} {
  const now = new Date().toISOString();
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
        trigger_observation_refs: evidenceRefs,
        claim: uncertainty.missing_evidence.join("; "),
        confidence: Math.max(0.2, Math.min(0.8, 1 - uncertainty.confidence)),
        evidence_refs: evidenceRefs,
        missing_evidence: uncertainty.missing_evidence,
        supports: [uncertainty.evaluation_id],
        contradicts: [],
        recommended_handoff: {
          type: "none",
          reason: "Missing corroboration is a field caveat for this run, not an automatic user-facing action.",
        },
        assistant_answer: false,
        raw_content_included: false,
        role: "validation",
        expires_at: new Date(Date.parse(now) + 45_000).toISOString(),
      })
    : null;
  const userNotice = input.evaluations.find((entry) =>
    entry.field_key === "user_notice" &&
    entry.confidence > 0.8 &&
    entry.status === "supported"
  );
  const decision = userNotice ? "ask_handoff_candidate" as const : "silent_update" as const;
  const arbitration: HelixLiveHandoffArbitration = {
    schema: HELIX_LIVE_HANDOFF_ARBITRATION_SCHEMA,
    arbitration_id: `live_handoff_arbitration:${hashShort([
      input.run.situation_run_id,
      decision,
      evidenceRefs,
      userNotice?.evaluation_id ?? null,
    ])}`,
    situation_run_id: input.run.situation_run_id,
    thread_id: input.run.thread_id,
    decision,
    candidate: userNotice
      ? {
          type: "ask_handoff",
          reason: "High-confidence user notice evaluation may be accepted by the runtime as an Ask handoff.",
          evidence_refs: evidenceRefs,
        }
      : {
          type: "none",
          reason: "Low-urgency field evaluations should update the live card silently.",
          evidence_refs: evidenceRefs,
        },
    evidence_refs: evidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
    role: "validation",
    created_at: now,
  };
  return {
    tangent,
    arbitration,
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
}
