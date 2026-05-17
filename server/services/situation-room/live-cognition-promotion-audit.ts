import crypto from "node:crypto";
import {
  HELIX_LIVE_COGNITION_PROMOTION_AUDIT_SCHEMA,
  type HelixLiveCognitionPromotionAudit,
  type HelixLiveCognitionPromotionAuditCheck,
} from "@shared/helix-live-cognition-promotion-audit";
import type { HelixAskHandoff } from "@shared/helix-ask-handoff";
import type { HelixGoalCard } from "@shared/helix-goal-card";
import type { HelixInterpretationCard } from "@shared/helix-interpretation-card";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import type { HelixPlanContract } from "@shared/helix-plan-contract";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const check = (name: string, passed: boolean, evidence: string): HelixLiveCognitionPromotionAuditCheck => ({
  check: name,
  passed,
  evidence,
});

export function auditLiveCognitionPromotion(input: {
  threadId: string;
  observation?: HelixObservationJournalEntry | null;
  interpretation?: HelixInterpretationCard | null;
  goal?: HelixGoalCard | null;
  handoff?: HelixAskHandoff | null;
  planContract?: HelixPlanContract | null;
}): HelixLiveCognitionPromotionAudit {
  const checks: HelixLiveCognitionPromotionAuditCheck[] = [];
  if (input.observation) {
    checks.push(check("observation_not_assistant_answer", input.observation.assistant_answer === false, input.observation.observation_id));
    checks.push(check(
      "observation_role_typed",
      Boolean(input.observation.role),
      input.observation.role,
    ));
  }
  if (input.interpretation) {
    checks.push(check("interpretation_has_evidence_refs", input.interpretation.evidence_refs.length > 0, input.interpretation.interpretation_id));
    checks.push(check("interpretation_has_expiry", !Number.isNaN(Date.parse(input.interpretation.expires_at)), input.interpretation.expires_at));
    checks.push(check("interpretation_not_assistant_answer", input.interpretation.assistant_answer === false, input.interpretation.interpretation_id));
  }
  if (input.goal) {
    checks.push(check("goal_has_next_evidence_needed", input.goal.next_evidence_needed.length > 0, input.goal.goal_id));
    checks.push(check("goal_cannot_execute_tools", input.goal.may_execute_tool === false, input.goal.goal_id));
    checks.push(check("goal_not_assistant_answer", input.goal.assistant_answer === false, input.goal.goal_id));
  }
  if (input.handoff) {
    checks.push(check("handoff_has_allowed_inputs", Boolean(input.handoff.allowed_inputs), input.handoff.handoff_id));
    checks.push(check("handoff_has_forbidden_actions", input.handoff.forbidden_actions.length > 0, input.handoff.handoff_id));
    checks.push(check("handoff_not_assistant_answer", input.handoff.assistant_answer === false, input.handoff.handoff_id));
  }
  if (input.planContract) {
    checks.push(check("plan_contract_does_not_self_execute", input.planContract.can_execute_itself === false, input.planContract.plan_id));
    checks.push(check("plan_contract_not_assistant_answer", input.planContract.assistant_answer === false, input.planContract.plan_id));
  }
  checks.push(check("promotion_has_at_least_observation", Boolean(input.observation), input.observation?.observation_id ?? "none"));
  const violations = checks.filter((entry) => !entry.passed).map((entry) => entry.check);
  const now = new Date().toISOString();
  return {
    schema: HELIX_LIVE_COGNITION_PROMOTION_AUDIT_SCHEMA,
    audit_id: `live_cognition_promotion_audit:${hashShort([input.threadId, checks, now])}`,
    thread_id: input.threadId,
    ok: violations.length === 0,
    checks,
    violations,
    assistant_answer: false,
    raw_content_included: false,
    created_at: now,
  };
}
