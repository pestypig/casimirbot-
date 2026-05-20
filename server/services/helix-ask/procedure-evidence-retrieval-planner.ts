import crypto from "node:crypto";
import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import {
  HELIX_PROCEDURE_EVIDENCE_RETRIEVAL_PLAN_SCHEMA,
  type HelixProcedureEvidenceRetrievalAnchor,
  type HelixProcedureEvidenceRetrievalCompareAgainst,
  type HelixProcedureEvidenceRetrievalFacet,
  type HelixProcedureEvidenceRetrievalPlan,
  type HelixProcedureEvidenceRetrievalTask,
} from "@shared/helix-procedure-evidence-retrieval-plan";
import type { HelixSituationEvidenceSelection } from "@shared/helix-situation-evidence-selection";
import type { HelixVisualSceneQueryIntent } from "@shared/helix-visual-scene-query-intent";
import { isSceneEpochReplayPrompt } from "./scene-epoch-replay-intent";

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const uniqueFacets = (values: Array<HelixProcedureEvidenceRetrievalFacet | null | undefined>): HelixProcedureEvidenceRetrievalFacet[] =>
  Array.from(new Set(values.filter((value): value is HelixProcedureEvidenceRetrievalFacet => Boolean(value))));

const classifyTask = (prompt: string): HelixProcedureEvidenceRetrievalTask => {
  if (/\b(?:debug|diagnos(?:e|is)|why\s+(?:did\s+)?(?:it\s+)?fail|error|failure|broken|authority failed)\b/i.test(prompt)) {
    return "debug_diagnosis";
  }
  if (/\b(?:predict|prediction|likely\s+next|what\s+(?:will|might|should)\s+happen|forecast|risk)\b/i.test(prompt)) {
    return "prediction";
  }
  if (/\b(?:trend|over\s+time|last\s+\d+\s+(?:epochs?|frames?|turns?)|last\s+n\s+epochs?)\b/i.test(prompt)) {
    return "trend";
  }
  if (isSceneEpochReplayPrompt(prompt) || /\b(?:compare|comparison|what\s+changed|changed\s+since|difference|different|delta)\b/i.test(prompt)) {
    return "comparison";
  }
  if (/\b(?:replay|show\s+(?:the\s+)?evidence|show\s+refs?|what\s+evidence|what\s+did\s+you\s+base)\b/i.test(prompt)) {
    return "evidence_replay";
  }
  if (/\b(?:why|explain|justify|basis|rank\s+causes?|cause|because)\b/i.test(prompt)) {
    return "explanation";
  }
  return "current_state";
};

const classifyAnchor = (input: {
  prompt: string;
  activeContext?: HelixActiveSituationContext | null;
  visualSceneQueryIntent?: HelixVisualSceneQueryIntent | null;
}): HelixProcedureEvidenceRetrievalAnchor => {
  if (/\bdebug\s+export\b/i.test(input.prompt)) return "debug_export";
  if (/\b(?:time\s+window|last\s+\d+\s+(?:seconds?|minutes?)|since\s+\d{1,2}:|\bfrom\b[\s\S]{0,20}\bto\b)\b/i.test(input.prompt)) return "time_window";
  if (input.visualSceneQueryIntent?.query_terms.length) return "named_scene";
  if (input.activeContext?.latest_epoch !== null && input.activeContext?.latest_epoch !== undefined) return "latest_visual_epoch";
  if ((input.activeContext?.latest_observation_refs ?? []).length > 0) return "latest_live_source_observation";
  return "latest_situation_run";
};

const classifyCompareAgainst = (input: {
  prompt: string;
  task: HelixProcedureEvidenceRetrievalTask;
  visualSceneQueryIntent?: HelixVisualSceneQueryIntent | null;
}): HelixProcedureEvidenceRetrievalCompareAgainst | undefined => {
  if (input.task !== "comparison" && input.task !== "trend") return undefined;
  if (/\b(?:time\s+window|since\s+\d{1,2}:|\bfrom\b[\s\S]{0,20}\bto\b)\b/i.test(input.prompt)) return "time_window";
  if (input.visualSceneQueryIntent?.query_terms.length) return "named_scene";
  if (/\blast\s+(?:n|\d+|several|few|multiple)?\s*epochs?\b|\bepochs\b/i.test(input.prompt)) return "last_n_epochs";
  if (/\bprevious\s+turn|last\s+answer|that\s+answer\b/i.test(input.prompt)) return "previous_turn";
  return "previous_epoch";
};

const requestedFacetsForTask = (input: {
  prompt: string;
  task: HelixProcedureEvidenceRetrievalTask;
  selection?: HelixSituationEvidenceSelection | null;
}): HelixProcedureEvidenceRetrievalFacet[] => {
  const base: HelixProcedureEvidenceRetrievalFacet[] = [
    "scene",
    "activity",
    "objects",
    "app_window",
    "source_binding",
    "field_evaluations",
    "interpretations",
    "uncertainty",
  ];
  return uniqueFacets([
    ...base,
    input.task === "comparison" || input.task === "trend" || input.task === "prediction" ? "probes" : null,
    input.task === "prediction" ? "predictions" : null,
    input.task === "explanation" || input.task === "debug_diagnosis" || input.task === "evidence_replay" ? "terminal_authority" : null,
    input.selection?.selected_probe_result_refs.length ? "probes" : null,
    /\b(?:terminal|authority|final answer|why answer)\b/i.test(input.prompt) ? "terminal_authority" : null,
  ]);
};

export const buildProcedureEvidenceRetrievalPlan = (input: {
  turnId: string;
  promptText: string;
  activeContext?: HelixActiveSituationContext | null;
  selection?: HelixSituationEvidenceSelection | null;
  visualSceneQueryIntent?: HelixVisualSceneQueryIntent | null;
  sourceTargets?: string[];
  evidenceRequired?: boolean;
}): HelixProcedureEvidenceRetrievalPlan => {
  const task = classifyTask(input.promptText);
  const anchor = classifyAnchor({
    prompt: input.promptText,
    activeContext: input.activeContext,
    visualSceneQueryIntent: input.visualSceneQueryIntent,
  });
  const compareAgainst = classifyCompareAgainst({
    prompt: input.promptText,
    task,
    visualSceneQueryIntent: input.visualSceneQueryIntent,
  });
  const sourceTargets = uniqueStrings([
    ...(input.sourceTargets ?? []),
    ...(input.selection?.selected_source_refs ?? []),
    input.activeContext?.environment_id ? `live_answer_environment:${input.activeContext.environment_id}` : null,
    input.activeContext?.situation_run_id ? `situation_run:${input.activeContext.situation_run_id}` : null,
  ]);
  const requestedFacets = requestedFacetsForTask({
    prompt: input.promptText,
    task,
    selection: input.selection,
  });
  return {
    schema: HELIX_PROCEDURE_EVIDENCE_RETRIEVAL_PLAN_SCHEMA,
    turn_id: input.turnId,
    prompt_hash: hashShort(input.promptText),
    task,
    anchor,
    ...(compareAgainst ? { compare_against: compareAgainst } : {}),
    requested_facets: requestedFacets,
    source_targets: sourceTargets.length ? sourceTargets : ["procedure_log"],
    evidence_required: input.evidenceRequired ?? true,
    why_needed:
      task === "current_state"
        ? "Current-state answer must be grounded in selected procedure evidence rather than a direct projection shortcut."
        : `${task} prompt must retrieve procedure-log evidence before terminal answer selection.`,
    assistant_answer: false,
    raw_content_included: false,
  };
};
