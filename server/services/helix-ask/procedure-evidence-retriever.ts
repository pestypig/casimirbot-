import {
  HELIX_PROCEDURE_EVIDENCE_RETRIEVAL_RESULT_SCHEMA,
  type HelixProcedureEvidenceRetrievalResult,
} from "@shared/helix-procedure-evidence-retrieval-result";
import type { HelixProcedureEvidenceRetrievalPlan } from "@shared/helix-procedure-evidence-retrieval-plan";
import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import type { HelixSituationEvidenceSelection } from "@shared/helix-situation-evidence-selection";
import { listObservationJournalEntries } from "../situation-room/observation-journal-store";
import { listLiveFieldEvaluations } from "../situation-room/live-field-evaluation-store";

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const retrievalPlanId = (plan: HelixProcedureEvidenceRetrievalPlan): string =>
  `procedure_evidence_retrieval_plan:${plan.prompt_hash || plan.turn_id}`;

const normalizeObservationRef = (value: string | null | undefined): string =>
  String(value ?? "").trim().replace(/^observation:/, "");

const observationRefVariants = (value: string | null | undefined): string[] => {
  const normalized = normalizeObservationRef(value);
  return normalized ? [normalized, `observation:${normalized}`] : [];
};

const firstSentence = (value: string | null | undefined): string | null => {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!trimmed) return null;
  return trimmed.split(/(?<=[.!?])\s+/)[0]?.trim() || trimmed;
};

const splitCurrentPriorObservationRefs = (input: {
  plan: HelixProcedureEvidenceRetrievalPlan;
  selection: HelixSituationEvidenceSelection;
}): { current: string[]; prior: string[]; rejected: HelixProcedureEvidenceRetrievalResult["rejected_refs"] } => {
  const selected = uniqueStrings(input.selection.selected_observation_refs);
  const rejected: HelixProcedureEvidenceRetrievalResult["rejected_refs"] = [];
  if (selected.length === 0) {
    return { current: [], prior: [], rejected };
  }
  const current = selected.slice(-1);
  const comparisonLike =
    input.plan.task === "comparison" ||
    input.plan.task === "trend" ||
    input.plan.task === "prediction" ||
    input.plan.task === "debug_diagnosis" ||
    input.plan.task === "evidence_replay";
  const prior = comparisonLike ? selected.slice(0, -1).slice(-3) : [];
  if (comparisonLike && prior.length === 0) {
    rejected.push({
      ref: "prior_observation",
      reason: "missing_prior_ref_for_comparison_task",
    });
  }
  return { current, prior, rejected };
};

const selectFieldEvaluations = (input: {
  context: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}) => {
  if (!input.context.situation_run_id) return [];
  const selected = new Set(input.selection.selected_field_evaluation_refs);
  return listLiveFieldEvaluations({
    threadId: input.context.thread_id,
    environmentId: input.context.environment_id ?? null,
    situationRunId: input.context.situation_run_id,
    includeExpired: true,
    limit: 120,
  }).filter((entry) => selected.size === 0 || selected.has(entry.evaluation_id));
};

export const buildProcedureEvidenceRetrievalResult = (input: {
  plan: HelixProcedureEvidenceRetrievalPlan;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}): HelixProcedureEvidenceRetrievalResult => {
  const observationSplit = splitCurrentPriorObservationRefs({
    plan: input.plan,
    selection: input.selection,
  });
  const currentObservationRefSet = new Set(observationSplit.current.flatMap(observationRefVariants));
  const priorObservationRefSet = new Set(observationSplit.prior.flatMap(observationRefVariants));
  const observations = listObservationJournalEntries({
    threadId: input.activeContext.thread_id,
    limit: 120,
  });
  const currentObservation = observations.find((entry) => currentObservationRefSet.has(entry.observation_id)) ?? null;
  const priorObservation = [...observations].reverse().find((entry) => priorObservationRefSet.has(entry.observation_id)) ?? null;
  const fieldEvaluations = selectFieldEvaluations({
    context: input.activeContext,
    selection: input.selection,
  });
  const currentFieldEvaluationRefs = fieldEvaluations
    .filter((entry) => entry.evidence_refs.some((ref) => currentObservationRefSet.has(ref)))
    .map((entry) => entry.evaluation_id);
  const priorFieldEvaluationRefs = fieldEvaluations
    .filter((entry) => entry.evidence_refs.some((ref) => priorObservationRefSet.has(ref)))
    .map((entry) => entry.evaluation_id);
  const stableFieldEvaluations = fieldEvaluations.filter((entry) =>
    entry.status === "current" || entry.status === "supported" || entry.status === "tentative"
  );
  const interpretationRefs = uniqueStrings([
    ...(input.selection.selected_interpretation_run_refs ?? []),
    ...(input.selection.selected_interpretation_worker_run_refs ?? []),
    ...(input.selection.selected_interpretation_hypothesis_refs ?? []),
    ...(input.selection.selected_interpretation_graph_refs ?? []),
    ...(input.selection.selected_interpretation_tangent_refs ?? []),
  ]);
  const selectedCurrentRefs = uniqueStrings([
    ...observationSplit.current,
    ...currentFieldEvaluationRefs,
  ]);
  const selectedPriorRefs = uniqueStrings([
    ...observationSplit.prior,
    ...priorFieldEvaluationRefs,
  ]);
  const changedFacts: HelixProcedureEvidenceRetrievalResult["changed_facts"] = [];
  const currentSummary = firstSentence(currentObservation?.text);
  const priorSummary = firstSentence(priorObservation?.text);
  const comparisonLike = input.plan.task === "comparison" || input.plan.task === "trend";
  if (comparisonLike && currentSummary && priorSummary) {
    changedFacts.push({
      claim: currentSummary === priorSummary
        ? "Current and prior observations select the same summarized visual state."
        : `Current observation differs from prior observation: ${currentSummary}`,
      current_refs: selectedCurrentRefs.length ? selectedCurrentRefs : observationSplit.current,
      prior_refs: selectedPriorRefs.length ? selectedPriorRefs : observationSplit.prior,
      confidence: currentSummary === priorSummary ? 0.62 : 0.72,
    });
  }
  if (input.plan.task === "prediction" && selectedCurrentRefs.length > 0) {
    changedFacts.push({
      claim: "Prediction prompt has current procedure evidence selected; future-facing claims still require explicit uncertainty.",
      current_refs: selectedCurrentRefs,
      prior_refs: selectedPriorRefs,
      confidence: selectedPriorRefs.length > 0 ? 0.64 : 0.5,
    });
  }
  const stableFacts: HelixProcedureEvidenceRetrievalResult["stable_facts"] = stableFieldEvaluations.slice(0, 6).map((entry) => ({
    claim: `${entry.field_key}: ${entry.value}`,
    refs: uniqueStrings([entry.evaluation_id, ...entry.evidence_refs]),
    confidence: Math.max(0, Math.min(1, entry.confidence)),
  }));
  if (stableFacts.length === 0 && selectedCurrentRefs.length > 0) {
    stableFacts.push({
      claim: "Current procedure evidence was selected for terminal reasoning.",
      refs: selectedCurrentRefs,
      confidence: 0.58,
    });
  }
  const uncertainty: HelixProcedureEvidenceRetrievalResult["uncertainty"] = [];
  if (input.plan.evidence_required && selectedCurrentRefs.length === 0) {
    uncertainty.push({
      issue: "current_evidence_missing",
      missing_evidence: ["selected_current_refs"],
      effect_on_answer: "The turn cannot answer from current procedure evidence.",
    });
  }
  if (comparisonLike && selectedPriorRefs.length === 0) {
    uncertainty.push({
      issue: "prior_evidence_missing",
      missing_evidence: ["selected_prior_refs"],
      effect_on_answer: "Comparison answer must be partial or rejected; current-state-only synthesis is not enough.",
    });
  }
  if (input.plan.requested_facets.includes("probes") && input.selection.selected_probe_result_refs.length === 0) {
    uncertainty.push({
      issue: "probe_refs_missing",
      missing_evidence: ["selected_probe_refs"],
      effect_on_answer: "Probe-specific claims should be avoided or caveated.",
    });
  }
  const answerability =
    selectedCurrentRefs.length === 0
      ? "not_answerable"
      : uncertainty.some((entry) => entry.issue === "prior_evidence_missing")
        ? "partially_answerable"
        : "answerable";
  return {
    schema: HELIX_PROCEDURE_EVIDENCE_RETRIEVAL_RESULT_SCHEMA,
    turn_id: input.plan.turn_id,
    retrieval_plan_id: retrievalPlanId(input.plan),
    selected_current_refs: selectedCurrentRefs,
    selected_prior_refs: selectedPriorRefs,
    selected_epoch_refs: uniqueStrings(input.selection.selected_epoch_closure_refs),
    selected_field_evaluation_refs: uniqueStrings(input.selection.selected_field_evaluation_refs),
    selected_interpretation_refs: interpretationRefs,
    selected_probe_refs: uniqueStrings(input.selection.selected_probe_result_refs),
    changed_facts: changedFacts,
    stable_facts: stableFacts,
    uncertainty,
    rejected_refs: uniqueStrings(input.selection.exclusion_reasons).map((reason) => ({ ref: "selection", reason })).concat(observationSplit.rejected),
    answerability,
    assistant_answer: false,
    raw_content_included: false,
  };
};
