import crypto from "node:crypto";
import {
  HELIX_SITUATION_RUN_ACCEPTANCE_SCHEMA,
  type HelixSituationRunAcceptance,
  type HelixSituationRunAcceptanceCheck,
} from "@shared/helix-situation-run-acceptance";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixLiveFieldWorkerRun } from "@shared/helix-live-field-worker-run";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";
import type { HelixLiveTangentEvaluation } from "@shared/helix-live-tangent-evaluation";
import type { HelixLiveArbitrationCandidate } from "@shared/helix-live-arbitration-candidate";
import type { HelixPlanContract } from "@shared/helix-plan-contract";
import { listLiveSituationRuns } from "./live-situation-run-store";
import { listLiveFieldWorkerRuns } from "./live-field-worker-run-store";
import { listLiveFieldEvaluations } from "./live-field-evaluation-store";
import { listLiveTangentEvaluations } from "./live-tangent-evaluation-store";
import { listLiveArbitrationCandidates } from "./live-arbitration-candidate-store";
import { listAskHandoffs } from "../helix-ask/ask-handoff-router";
import { listPlanContracts } from "../helix-ask/plan-contract-boundary-guard";

const acceptances: HelixSituationRunAcceptance[] = [];

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const check = (name: string, passed: boolean, evidence: string): HelixSituationRunAcceptanceCheck => ({
  check: name,
  passed,
  evidence,
});

export function runSituationRunAcceptance(input: {
  threadId: string;
  scenario?: HelixSituationRunAcceptance["scenario"];
  situationRunId?: string | null;
  now?: string;
}): HelixSituationRunAcceptance {
  const now = input.now ?? new Date().toISOString();
  const scenario = input.scenario ?? "generic_visual_folder";
  const runs = listLiveSituationRuns({ threadId: input.threadId, limit: 50 });
  const run = (input.situationRunId
    ? runs.find((entry: HelixLiveSituationRun) => entry.situation_run_id === input.situationRunId)
    : runs.at(-1)) ?? null;
  const workerRuns = run ? listLiveFieldWorkerRuns({ threadId: input.threadId, situationRunId: run.situation_run_id, limit: 200 }) : [];
  const evaluations = run ? listLiveFieldEvaluations({ threadId: input.threadId, situationRunId: run.situation_run_id, includeExpired: true, limit: 200 }) : [];
  const tangents = run ? listLiveTangentEvaluations({ threadId: input.threadId, situationRunId: run.situation_run_id, limit: 80 }) : [];
  const candidates = run ? listLiveArbitrationCandidates({ threadId: input.threadId, situationRunId: run.situation_run_id, includeExpired: true, limit: 80 }) : [];
  const handoffs = listAskHandoffs({ threadId: input.threadId, limit: 80 });
  const contracts = listPlanContracts({ threadId: input.threadId, limit: 80 });
  const fieldKeys = new Set(evaluations.map((entry: HelixLiveFieldEvaluation) => entry.field_key));
  const checks: HelixSituationRunAcceptanceCheck[] = [
    check("situation_run_active", Boolean(run?.status === "active"), run?.situation_run_id ?? "none"),
    check("source_binding_present", Boolean(run?.source_binding_id), run?.source_binding_id ?? "none"),
    check("field_worker_runs_completed", workerRuns.some((entry: HelixLiveFieldWorkerRun) => entry.status === "completed"), `${workerRuns.length} worker runs`),
    check("field_evaluations_present", evaluations.length > 0, `${evaluations.length} evaluations`),
    check("field_evaluations_not_answers", evaluations.every((entry: HelixLiveFieldEvaluation) => entry.assistant_answer === false), "assistant_answer=false"),
    check("tangents_not_answers", tangents.every((entry: HelixLiveTangentEvaluation) => entry.assistant_answer === false), `${tangents.length} tangents`),
    check("arbitration_candidates_present", candidates.length > 0, `${candidates.length} candidates`),
  ];
  if (scenario === "generic_visual_folder") {
    checks.push(
      check("generic_visual_scope", run?.modality_scope === "generic_visual", run?.modality_scope ?? "none"),
      check("activity_field_present", fieldKeys.has("activity"), Array.from(fieldKeys).join(",")),
      check("objects_field_present", fieldKeys.has("objects") || fieldKeys.has("entities"), Array.from(fieldKeys).join(",")),
      check(
        "missing_corroboration_not_blocking",
        evaluations.some((entry: HelixLiveFieldEvaluation) => entry.field_key === "activity" && entry.status !== "blocked"),
        evaluations.find((entry: HelixLiveFieldEvaluation) => entry.field_key === "activity")?.status ?? "no_activity",
      ),
      check(
        "silent_update_candidate",
        candidates.some((entry: HelixLiveArbitrationCandidate) => entry.candidate_type === "silent_update"),
        candidates.map((entry: HelixLiveArbitrationCandidate) => entry.candidate_type).join(",") || "none",
      ),
    );
  }
  if (scenario === "direct_ask_handoff") {
    checks.push(check("ask_handoff_available", handoffs.length > 0, `${handoffs.length} handoffs`));
  }
  if (scenario === "workstation_affordance") {
    checks.push(check("plan_contracts_do_not_execute", contracts.every((entry: HelixPlanContract) => entry.can_execute_itself === false), `${contracts.length} contracts`));
  }
  const ok = checks.every((entry: HelixSituationRunAcceptanceCheck) => entry.passed);
  const acceptance: HelixSituationRunAcceptance = {
    schema: HELIX_SITUATION_RUN_ACCEPTANCE_SCHEMA,
    acceptance_id: `situation_run_acceptance:${hashShort([input.threadId, scenario, run?.situation_run_id ?? null, now])}`,
    scenario,
    thread_id: input.threadId,
    situation_run_id: run?.situation_run_id ?? null,
    source_binding_id: run?.source_binding_id ?? null,
    epoch: run?.current_epoch ?? null,
    ok,
    checks,
    summary: ok ? `${scenario} acceptance passed.` : `${scenario} acceptance has ${checks.filter((entry: HelixSituationRunAcceptanceCheck) => !entry.passed).length} failing checks.`,
    assistant_answer: false,
    raw_content_included: false,
    created_at: now,
  };
  acceptances.push(acceptance);
  if (acceptances.length > 200) acceptances.splice(0, acceptances.length - 200);
  return acceptance;
}

export function listSituationRunAcceptances(input: {
  threadId?: string | null;
  limit?: number;
} = {}): HelixSituationRunAcceptance[] {
  const limit = Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80)));
  return acceptances
    .filter((entry: HelixSituationRunAcceptance) => !input.threadId || entry.thread_id === input.threadId)
    .sort((a: HelixSituationRunAcceptance, b: HelixSituationRunAcceptance) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetSituationRunAcceptancesForTest(): void {
  acceptances.splice(0, acceptances.length);
}
