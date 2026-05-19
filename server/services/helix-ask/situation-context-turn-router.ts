import crypto from "node:crypto";
import {
  HELIX_CONVERSATIONAL_ANSWER_DISTILLATION_SCHEMA,
  type HelixConversationalAnswerDistillation,
  type HelixConversationalAnswerStyle,
} from "@shared/helix-conversational-answer-distillation";
import {
  HELIX_PROCEDURE_REASONING_SNAPSHOT_SCHEMA,
  type HelixProcedureReasoningSnapshot,
} from "@shared/helix-procedure-reasoning-snapshot";
import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import type { HelixLiveContextWindowBinding } from "@shared/helix-live-context-window-binding";
import type {
  HelixDeicticInputModality,
  HelixDeicticReference,
  HelixDeicticResolutionStatus,
} from "@shared/helix-deictic-reference";
import type { HelixSituationEvidenceSelection } from "@shared/helix-situation-evidence-selection";
import type { HelixVisualComparisonSession } from "@shared/helix-visual-comparison-session";
import {
  HELIX_PROCEDURE_MEMORY_RECALL_SCHEMA,
  type HelixProcedureMemoryRecall,
  type HelixProcedureMemoryRecallMode,
  type HelixProcedureMemoryRecallType,
} from "@shared/helix-procedure-memory-recall";
import { detectDeicticReference } from "./deictic-reference-detector";
import { selectSituationEvidence } from "./situation-evidence-selector";
import { resolveActiveSituationContext } from "../situation-room/active-situation-context-resolver";
import { repairUnboundVisualSituationContext } from "../situation-room/live-situation-context-binding-repair";
import { listObservationJournalEntries } from "../situation-room/observation-journal-store";
import { listLiveFieldEvaluations } from "../situation-room/live-field-evaluation-store";
import { buildLiveContextWindowBinding } from "../situation-room/live-context-window-binding-builder";
import { listProcedureEpochLedger } from "../situation-room/procedure-epoch-ledger-store";
import { listProcedureEpochClosures } from "../situation-room/procedure-epoch-closure";
import { listLiveProbeResults } from "../situation-room/live-probe-result-store";
import { createVisualComparisonSession } from "../situation-room/visual-comparison-session-store";
import {
  buildVisualSceneComparisonResult,
  buildVisualSceneQueryIntent,
  selectVisualScenesForQuery,
} from "../situation-room/visual-scene-memory-store";
import { createVoiceLiveHandoff } from "../situation-room/voice-live-handoff-router";
import {
  listProcedureReasoningSnapshots,
  recordProcedureReasoningSnapshot,
} from "../situation-room/procedure-reasoning-snapshot-store";
import {
  listConversationalAnswerDistillations,
  recordConversationalAnswerDistillation,
} from "./conversational-answer-distillation-store";
import { chooseLiveAnswerStyle, formatDistilledAnswer } from "./live-answer-style-policy";
import type { HelixVisualSceneQueryIntent } from "@shared/helix-visual-scene-query-intent";
import type { HelixSelectedVisualSceneSet } from "@shared/helix-selected-visual-scene-set";
import type { HelixVisualSceneComparisonResult } from "@shared/helix-visual-scene-comparison-result";

export type SituationContextTurnRouteKind =
  | "none"
  | "situation_context_question"
  | "procedure_epoch_replay_question"
  | "visual_comparison_setup"
  | "request_user_input";

export type SituationContextTurnRoute = {
  route: SituationContextTurnRouteKind;
  deictic_reference: HelixDeicticReference;
  active_situation_context: HelixActiveSituationContext;
  situation_evidence_selection: HelixSituationEvidenceSelection;
  answer_text: string | null;
  reasoning_snapshot?: HelixProcedureReasoningSnapshot | null;
  answer_distillation?: HelixConversationalAnswerDistillation | null;
  procedure_memory_recall?: HelixProcedureMemoryRecall | null;
  live_context_window_binding?: HelixLiveContextWindowBinding | null;
  comparison_session?: HelixVisualComparisonSession | null;
  visual_scene_query_intent?: HelixVisualSceneQueryIntent | null;
  selected_visual_scene_set?: HelixSelectedVisualSceneSet | null;
  visual_scene_comparison_result?: HelixVisualSceneComparisonResult | null;
  voice_live_handoff?: ReturnType<typeof createVoiceLiveHandoff> | null;
  binding_repair?: ReturnType<typeof repairUnboundVisualSituationContext> | null;
};

const line = (label: string, value: string | null | undefined): string =>
  value && value.trim() ? `${label}: ${value.trim()}` : "";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const isProcedureReplayPrompt = (prompt: string): boolean =>
  /\b(?:why\s+did|what\s+changed|changed\s+since|last\s+(?:seen\s+|situation\s+|scene\s+|visual\s+|screen\s+|live\s+)?epoch|scene\s+epoch|visual\s+epoch|screen\s+epoch|live\s+epoch|since\s+(?:the\s+)?last\s+(?:seen|visual|capture|scene|frame|screen|epoch)|previous\s+(?:scene|frame|visual|screen|capture)|compare\s+current\s+scene|compare\b[\s\S]{0,80}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epoch)|(?:different|difference)\b[\s\S]{0,100}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epoch)|last\s+(?:scene|frame|visual|screen|capture)\b[\s\S]{0,100}\b(?:current|now|looking\s+at|this\s+(?:scene|frame|visual|screen))|confidence\s+change|stay\s+silent|interject|replay\s+the\s+last|procedure\s+memory)\b/i.test(prompt);

const isComparisonPrompt = (prompt: string): boolean =>
  /\b(?:compare\s+this|compare\s+(?:this|the)\s+(?:file|image|picture|screen)|next\s+(?:one|file|image|picture|screen)|remember\s+this\s+as\s+the\s+first)\b/i.test(prompt);

const isEvidenceExpansionPrompt = (prompt: string): boolean =>
  /\b(?:show\s+(?:the\s+)?evidence|why\s+did\s+you\s+say|why\s+that|go\s+to\s+log|replay\s+that|show\s+refs?|what\s+evidence)\b/i.test(prompt);

const classifyProcedureRecallType = (prompt: string): HelixProcedureMemoryRecallType => {
  if (/\b(?:show\s+(?:the\s+)?evidence|show\s+refs?|what\s+evidence)\b/i.test(prompt)) return "show_evidence";
  if (/\bwhy\s+(?:did\s+you\s+say|that)\b/i.test(prompt)) return "why_answer";
  if (/\b(?:confidence\s+change|activity\s+confidence)\b/i.test(prompt)) return "confidence_change";
  if (/\b(?:go\s+to\s+log|log)\b/i.test(prompt)) return "log_navigation";
  return "epoch_replay";
};

const classifyProcedureRecallMode = (prompt: string): HelixProcedureMemoryRecallMode => {
  if (/\b(?:show\s+(?:the\s+)?evidence|show\s+refs?|what\s+evidence)\b/i.test(prompt)) return "brief_evidence";
  if (/\bwhy\s+(?:did\s+you\s+say|that)\b/i.test(prompt)) return "expanded_trace";
  return "epoch_replay";
};

const selectedEvidenceRefs = (selection: HelixSituationEvidenceSelection): string[] =>
  Array.from(new Set([
    ...selection.selected_observation_refs,
    ...selection.selected_field_evaluation_refs,
    ...selection.selected_probe_result_refs,
    ...selection.selected_epoch_closure_refs,
    ...selection.selected_source_descriptor_refs,
  ])).slice(0, 24);

const buildProcedureMemoryRecall = (input: {
  threadId: string;
  turnId: string;
  prompt: string;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
  snapshot?: HelixProcedureReasoningSnapshot | null;
  distillation?: HelixConversationalAnswerDistillation | null;
}): HelixProcedureMemoryRecall => {
  const ledger = listProcedureEpochLedger({
    threadId: input.activeContext.thread_id || input.threadId,
    environmentId: input.activeContext.environment_id ?? null,
    situationRunId: input.activeContext.situation_run_id ?? null,
    epoch: input.activeContext.latest_epoch ?? null,
    limit: 24,
  });
  return {
    schema: HELIX_PROCEDURE_MEMORY_RECALL_SCHEMA,
    recall_id: `procedure_memory_recall:${hashShort([
      input.turnId,
      input.prompt,
      input.snapshot?.snapshot_id,
      input.distillation?.distillation_id,
      ledger.map((entry) => entry.ledger_item_id),
    ])}`,
    thread_id: input.threadId,
    turn_id: input.turnId,
    source_turn_id: input.snapshot?.turn_id ?? input.distillation?.turn_id ?? null,
    snapshot_refs: input.snapshot ? [input.snapshot.snapshot_id] : [],
    epoch_ledger_refs: ledger.map((entry) => entry.ledger_item_id),
    distillation_refs: input.distillation ? [input.distillation.distillation_id] : [],
    selected_evidence_refs: selectedEvidenceRefs(input.selection),
    recall_type: classifyProcedureRecallType(input.prompt),
    recall_mode: classifyProcedureRecallMode(input.prompt),
    assistant_answer: false,
    raw_content_included: false,
  };
};

const getSituationFields = (context: HelixActiveSituationContext) => {
  const evaluations = context.situation_run_id
    ? listLiveFieldEvaluations({
        threadId: context.thread_id,
        environmentId: context.environment_id ?? null,
        situationRunId: context.situation_run_id,
        limit: 20,
      })
    : [];
  const allowedEvaluationRefs = new Set(context.latest_field_evaluation_refs);
  const scopedEvaluations = allowedEvaluationRefs.size > 0
    ? evaluations.filter((entry) => allowedEvaluationRefs.has(entry.evaluation_id))
    : evaluations;
  const byField = new Map(scopedEvaluations.map((entry) => [entry.field_key, entry]));
  return {
    evaluations: scopedEvaluations,
    scene: byField.get("scene") ?? byField.get("place") ?? null,
    activity: byField.get("activity") ?? null,
    objects: byField.get("objects") ?? byField.get("entities") ?? null,
    uncertainty: byField.get("uncertainty") ?? byField.get("missing_evidence") ?? null,
    nextCheck: byField.get("next_check") ?? null,
  };
};

const filterActiveSituationContextByWindow = (
  context: HelixActiveSituationContext,
  binding: HelixLiveContextWindowBinding | null,
  answerStartedAt: string,
): HelixActiveSituationContext => {
  if (!binding || !context.situation_run_id) return context;
  const includedObservationRefs = new Set(binding.included_observation_refs);
  const windowToMs = Date.parse(binding.window.to_ts);
  const answerStartedMs = Date.parse(answerStartedAt);
  const latestObservationRefs = context.latest_observation_refs.filter((ref) => includedObservationRefs.has(ref));
  const evaluations = listLiveFieldEvaluations({
    threadId: context.thread_id,
    environmentId: context.environment_id ?? null,
    situationRunId: context.situation_run_id,
    limit: 100,
  });
  const latestFieldEvaluationRefs = context.latest_field_evaluation_refs.filter((ref) => {
    const evaluation = evaluations.find((entry) => entry.evaluation_id === ref);
    if (!evaluation) return false;
    const createdMs = Date.parse(evaluation.created_at);
    const createdBeforeAnchor = Number.isFinite(createdMs) && createdMs <= windowToMs;
    const availableBeforeAnswer = Number.isFinite(createdMs) && createdMs <= answerStartedMs;
    const refsIncluded = evaluation.evidence_refs.some((evidenceRef) => includedObservationRefs.has(evidenceRef));
    return availableBeforeAnswer && (refsIncluded || createdBeforeAnchor);
  });
  const latestClosureRefs = context.latest_closure_refs.filter((ref) => {
    if (latestObservationRefs.length > 0 || latestFieldEvaluationRefs.length > 0) return true;
    return !binding.excluded_observation_refs.some((entry) => entry.reason === "after_anchor");
  });
  const status =
    context.status === "active" && latestObservationRefs.length === 0 && latestFieldEvaluationRefs.length === 0
      ? "no_fresh_evidence"
      : context.status;
  return {
    ...context,
    latest_observation_refs: latestObservationRefs,
    latest_field_evaluation_refs: latestFieldEvaluationRefs,
    latest_closure_refs: latestClosureRefs,
    status,
    freshness_summary:
      status === "no_fresh_evidence"
        ? "Active SituationRun exists, but no observations were inside the turn's live context window."
        : context.freshness_summary,
  };
};

const buildSituationFullReasoning = (input: {
  prompt: string;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}): string => {
  const context = input.activeContext;
  const { scene, activity, objects, uncertainty, nextCheck } = getSituationFields(context);
  const asksSelection = /\b(?:clicking|clicked|selected|selection|highlighted)\b/i.test(input.prompt);
  const selectionCaveat = asksSelection
    ? "I can use the active visual SituationRun, but I can only confirm the clicked/selected file if the selected state is visible in the latest frame or captured in the next epoch."
    : "I can use the active visual SituationRun; this is grounded in compact procedure evidence, not raw screen pixels.";
  return [
    selectionCaveat,
    line("Scene", scene?.value),
    line("Activity", activity?.value),
    line("Visible objects", objects?.value),
    line("Uncertainty", uncertainty?.value),
    line("Next check", nextCheck?.next_check || nextCheck?.value),
    `Evidence refs: ${selectedEvidenceRefs(input.selection).slice(0, 8).join(", ") || "none selected"}.`,
    context.status === "stale" ? "Freshness caveat: selected evidence is stale." : "",
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");
};

const summarizeVisibleContext = (value: string | null | undefined): string => {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!trimmed) return "the active visual workspace";
  const firstSentence = trimmed.split(/(?<=[.!?])\s+/)[0] ?? trimmed;
  return firstSentence.length > 180 ? `${firstSentence.slice(0, 177).trim()}...` : firstSentence;
};

const stripSceneLeadIn = (value: string): string => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned
    .replace(/^(?:the\s+)?(?:visible\s+scene|current\s+live\s+frame|live\s+frame|current\s+frame|image|screen)\s+(?:showcases|shows|depicts|displays|features|contains)\s+/i, "")
    .replace(/^(?:the\s+)?(?:active\s+context|ui)\s+(?:appears\s+to\s+be|suggests)\s+/i, "")
    .trim();
};

const extractLabeledContainer = (value: string): { kind: string; label: string } | null => {
  const text = value.replace(/\s+/g, " ").trim();
  const match = text.match(/\b(file\s+directory|directory|folder|interface|window)\s+(?:labeled|named|titled)\s+"([^"]+)"/i);
  if (!match?.[1] || !match[2]) return null;
  const rawKind = match[1].toLowerCase();
  const kind = rawKind === "file directory" ? "folder" : rawKind;
  return { kind, label: match[2].replace(/[.,;\s]+$/, "") };
};

const inferVisibleContentPhrase = (input: {
  scene: string | null | undefined;
  objects: string | null | undefined;
}): string => {
  const text = `${input.scene ?? ""} ${input.objects ?? ""}`.toLowerCase();
  const content: string[] = [];
  if (/\bsolar|sdo|sun|flare|magnetic|dynamics|observator/.test(text)) {
    content.push("solar-observation");
  }
  if (/\bvideo|\.mp4|\.mov\b/.test(text)) {
    content.push("video");
  }
  if (/\bimage|\.png|\.jpg|diagram|graph|chart/.test(text)) {
    content.push("image");
  }
  if (/\bpdf|document/.test(text)) {
    content.push("document");
  }
  if (content.length === 0) return "visible file entries";
  const unique = Array.from(new Set(content));
  if (unique.length === 1) return `${unique[0]} files`;
  if (unique[0] === "solar-observation") {
    return `solar-observation ${unique.slice(1).join(" and ")} files`;
  }
  return `${unique.join(" and ")} files`;
};

const summarizeVisibleWorkspace = (input: {
  prompt: string;
  scene: string | null | undefined;
  objects: string | null | undefined;
}): string => {
  const source = input.scene ?? input.objects ?? null;
  const sceneSummary = summarizeVisibleContext(source);
  const stripped = stripSceneLeadIn(sceneSummary);
  const labeled = extractLabeledContainer(source ?? "");
  const contentPhrase = inferVisibleContentPhrase({ scene: input.scene, objects: input.objects });
  if (labeled) {
    return `a ${labeled.kind} labeled "${labeled.label}" with ${contentPhrase}`;
  }
  if (!stripped || stripped === "the active visual workspace") {
    return "the active visual workspace";
  }
  return stripped.replace(/\.$/, "");
};

const buildConciseSituationAnswer = (input: {
  prompt: string;
  activeContext: HelixActiveSituationContext;
  style: HelixConversationalAnswerStyle;
}): { concise: string; caveat: string | null } => {
  const { scene, activity, objects, uncertainty } = getSituationFields(input.activeContext);
  const prompt = input.prompt;
  const visible = summarizeVisibleWorkspace({
    prompt,
    scene: scene?.value,
    objects: objects?.value,
  });
  const asksAboutSpecificFile = /\b(?:what|which|describe|see)\b[\s\S]{0,80}\bfile\b|\bfile\s+(?:i'm|i am|am i|that i'm|that i am)\s+(?:looking|clicking|viewing)\b/i.test(prompt);
  if (/\b(?:equation|formula)\b/i.test(prompt)) {
    return {
      concise: `You're viewing ${visible}, but I can't identify a specific equation until a readable formula or opened file is visible.`,
      caveat: null,
    };
  }
  if (/\b(?:clicking|clicked|selected|selection|highlighted)\b/i.test(prompt)) {
    return {
      concise: "I can see the active folder or screen view, but I can't confirm the clicked file unless the selection is visible or the next frame captures the change.",
      caveat: null,
    };
  }
  if (asksAboutSpecificFile) {
    return {
      concise: `You're viewing ${visible}, but I can't confirm a specific selected file from the current evidence.`,
      caveat: null,
    };
  }
  if (/\b(?:file|folder|looking at|screen|this|now)\b/i.test(prompt)) {
    const action = activity?.value ? ` ${activity.value}` : "";
    return {
      concise: `You're viewing ${visible}.${action ? ` ${action}` : ""}`,
      caveat: uncertainty?.value ? `Caveat: ${uncertainty.value}` : null,
    };
  }
  return {
    concise: summarizeVisibleContext(scene?.value ?? activity?.value ?? objects?.value),
    caveat: uncertainty?.value ? `Caveat: ${uncertainty.value}` : null,
  };
};

const recordReasoningAndDistillation = (input: {
  turnId: string;
  threadId: string;
  prompt: string;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
  sourceAnswerKind: "situation_context_question" | "procedure_epoch_replay";
  fullReasoningSummary: string;
  conciseAnswer: string;
  caveat?: string | null;
  style: HelixConversationalAnswerStyle;
}): {
  snapshot: HelixProcedureReasoningSnapshot;
  distillation: HelixConversationalAnswerDistillation;
  terminalText: string;
} => {
  const evidenceRefs = selectedEvidenceRefs(input.selection);
  const snapshot: HelixProcedureReasoningSnapshot = recordProcedureReasoningSnapshot({
    schema: HELIX_PROCEDURE_REASONING_SNAPSHOT_SCHEMA,
    snapshot_id: `procedure_reasoning_snapshot:${hashShort([
      input.turnId,
      input.activeContext.situation_run_id,
      input.selection.selection_id,
      input.fullReasoningSummary,
    ])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    situation_run_id: input.activeContext.situation_run_id ?? null,
    epoch: input.activeContext.latest_epoch ?? null,
    user_question: input.prompt,
    full_reasoning_summary: input.fullReasoningSummary,
    observation_refs: input.selection.selected_observation_refs,
    field_evaluation_refs: input.selection.selected_field_evaluation_refs,
    prediction_refs: [],
    probe_result_refs: input.selection.selected_probe_result_refs,
    confidence_update_refs: [],
    epoch_closure_refs: input.selection.selected_epoch_closure_refs,
    selected_evidence_pack_ref: input.selection.selection_id,
    assistant_answer: false,
    raw_content_included: false,
  });
  const distillation: HelixConversationalAnswerDistillation = recordConversationalAnswerDistillation({
    schema: HELIX_CONVERSATIONAL_ANSWER_DISTILLATION_SCHEMA,
    distillation_id: `conversational_answer_distillation:${hashShort([
      input.turnId,
      snapshot.snapshot_id,
      input.conciseAnswer,
      input.style,
    ])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    situation_run_id: input.activeContext.situation_run_id ?? null,
    source_answer_kind: input.sourceAnswerKind,
    full_reasoning_refs: [snapshot.snapshot_id, input.selection.selection_id],
    selected_evidence_refs: evidenceRefs,
    concise_answer: input.conciseAnswer,
    caveat: input.caveat ?? null,
    expansion_available: true,
    expansion_ref: snapshot.snapshot_id,
    style: input.style,
    assistant_answer: false,
    raw_content_included: false,
  });
  return {
    snapshot,
    distillation,
    terminalText: formatDistilledAnswer({
      conciseAnswer: distillation.concise_answer,
      caveat: distillation.caveat,
      style: distillation.style,
      expansionAvailable: distillation.expansion_available,
    }),
  };
};

const buildSnapshotExpansionAnswer = (input: {
  snapshot: HelixProcedureReasoningSnapshot | null;
  distillation: HelixConversationalAnswerDistillation | null;
}): string => {
  if (!input.snapshot && !input.distillation) {
    return "I do not have a saved situation reasoning snapshot to expand yet.";
  }
  const snapshot = input.snapshot;
  const distillation = input.distillation;
  return [
    distillation?.concise_answer ? `Short answer: ${distillation.concise_answer}` : "",
    snapshot?.full_reasoning_summary ? `Reasoning snapshot: ${snapshot.full_reasoning_summary}` : "",
    snapshot ? `Evidence refs: ${[
      ...snapshot.observation_refs,
      ...snapshot.field_evaluation_refs,
      ...snapshot.probe_result_refs,
      ...snapshot.epoch_closure_refs,
    ].slice(0, 12).join(", ") || "none"}.` : "",
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");
};

const buildReplayAnswer = (input: {
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}): string => {
  const context = input.activeContext;
  if (!context.situation_run_id || context.latest_epoch === null || context.latest_epoch === undefined) {
    return "I do not have a bound situation epoch to replay yet.";
  }
  const closures = listProcedureEpochClosures({
    threadId: context.thread_id,
    environmentId: context.environment_id ?? null,
    situationRunId: context.situation_run_id,
    limit: 2,
  });
  const closure = closures.at(-1) ?? null;
  const epoch = closure?.epoch ?? context.latest_epoch;
  const ledger = listProcedureEpochLedger({
    threadId: context.thread_id,
    environmentId: context.environment_id ?? null,
    situationRunId: context.situation_run_id,
    epoch,
    limit: 20,
  });
  const runLedger = listProcedureEpochLedger({
    threadId: context.thread_id,
    environmentId: context.environment_id ?? null,
    situationRunId: context.situation_run_id,
    limit: 200,
  });
  const previousEpoch = Array.from(new Set(runLedger.map((entry) => entry.epoch)))
    .filter((candidate) => candidate < epoch)
    .sort((a, b) => a - b)
    .at(-1) ?? null;
  const previousEpochLedger = previousEpoch === null
    ? []
    : runLedger.filter((entry) => entry.epoch === previousEpoch);
  const probes = listLiveProbeResults({
    threadId: context.thread_id,
    environmentId: context.environment_id ?? null,
    situationRunId: context.situation_run_id,
    limit: 5,
  });
  const { scene, activity, objects } = getSituationFields(context);
  const selectedObservationSet = new Set(input.selection.selected_observation_refs);
  const selectedObservations = selectedObservationSet.size > 0
    ? listObservationJournalEntries({
        threadId: context.thread_id,
        limit: 80,
      }).filter((entry) => selectedObservationSet.has(entry.observation_id))
    : [];
  const selectedObservationSummary = selectedObservations
    .map((entry) => entry.text.trim())
    .filter(Boolean)
    .slice(-2)
    .join(" Then ");
  const selectedPreviousObservation = selectedObservations.at(-2) ?? null;
  const selectedCurrentObservation = selectedObservations.at(-1) ?? null;
  const currentObservationLedger = ledger.filter((entry) => entry.item_kind === "observation").at(-1) ?? null;
  const previousObservationLedger = previousEpochLedger.filter((entry) => entry.item_kind === "observation").at(-1) ?? null;
  const currentObservation = currentObservationLedger?.summary ?? selectedCurrentObservation?.text.trim() ?? selectedObservationSummary;
  const previousObservation = previousObservationLedger?.summary ?? selectedPreviousObservation?.text.trim() ?? null;
  const currentObservationRef = currentObservationLedger?.item_ref ?? selectedCurrentObservation?.observation_id ?? null;
  const previousObservationRef = previousObservationLedger?.item_ref ?? selectedPreviousObservation?.observation_id ?? null;
  const latestProbe = probes.at(-1) ?? null;
  return [
    `Epoch ${epoch} closed as ${closure?.status ?? "unknown"}.`,
    previousEpoch !== null ? `Compared against epoch ${previousEpoch}.` : "Previous epoch: no earlier bound epoch was selected.",
    line("Previous observation", previousObservation),
    line("Current observation", currentObservation),
    line("Scene", scene?.value),
    line("Activity", activity?.value),
    line("Objects", objects?.value),
    latestProbe ? `Probe result: ${latestProbe.status}; signals: ${latestProbe.observed_signals.join(", ") || "none"}.` : "Probe result: no probe result was selected for this epoch.",
    closure?.confidence_changes.length ? `Confidence changes: ${closure.confidence_changes.join(", ")}.` : "",
    closure?.pending_actions.length ? `Pending actions: ${closure.pending_actions.join(", ")}.` : "Arbitration did not require an action from this epoch.",
    `Evidence refs: ${[
      previousObservationRef,
      currentObservationRef,
      ...input.selection.selected_probe_result_refs,
      ...input.selection.selected_epoch_closure_refs,
      ...input.selection.selected_field_evaluation_refs,
    ].filter(Boolean).slice(0, 8).join(", ") || "none selected"}.`,
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");
};

const buildSceneComparisonAnswer = (result: HelixVisualSceneComparisonResult): string =>
  [
    result.summary,
    result.shared_traits.length ? `Shared traits: ${result.shared_traits.join(", ")}.` : "",
    result.differences.length ? `Differences: ${result.differences.join("; ")}.` : "",
    `Evidence refs: ${result.evidence_refs.slice(0, 8).join(", ") || "none selected"}.`,
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");

export function routeSituationContextTurn(input: {
  threadId: string;
  promptText: string;
  inputModality?: HelixDeicticInputModality;
  turnId?: string | null;
  submittedAt?: string | null;
  speechStartAt?: string | null;
  speechEndAt?: string | null;
  serverReceivedAt?: string | null;
  answerStartedAt?: string | null;
  lookbackMs?: number;
  liveTailPolicy?: "strict_past" | "live_tail_explicit" | "procedure_continuation";
}): SituationContextTurnRoute {
  const turnId = input.turnId ?? `situation_context_turn:${hashShort([
    input.threadId,
    input.promptText,
    input.inputModality ?? "typed",
    Date.now(),
  ])}`;
  const activeContext = resolveActiveSituationContext({ threadId: input.threadId });
  const initialReference = detectDeicticReference({
    threadId: input.threadId,
    promptText: input.promptText,
    inputModality: input.inputModality ?? "typed",
  });
  if (!initialReference.candidate_signal && isEvidenceExpansionPrompt(input.promptText)) {
    const latestDistillation = listConversationalAnswerDistillations({
      threadId: input.threadId,
      limit: 1,
    }).at(-1) ?? null;
    const latestSnapshot = latestDistillation?.expansion_ref
      ? (listProcedureReasoningSnapshots({ threadId: input.threadId, limit: 20 })
          .find((entry) => entry.snapshot_id === latestDistillation.expansion_ref) ?? null)
      : (listProcedureReasoningSnapshots({ threadId: input.threadId, limit: 1 }).at(-1) ?? null);
    const selection = selectSituationEvidence({
      threadId: input.threadId,
      activeContext,
      deicticReference: initialReference,
      askingHistory: true,
    });
    return {
      route: "procedure_epoch_replay_question",
      deictic_reference: {
        ...initialReference,
        reference_type: "latest_epoch_change",
        candidate_signal: true,
        resolution_status: latestSnapshot || latestDistillation ? "resolved" : "missing_context",
        resolved_context_refs: [
          activeContext.context_id,
          latestSnapshot?.snapshot_id ?? "",
          latestDistillation?.distillation_id ?? "",
        ].filter(Boolean),
      },
      active_situation_context: activeContext,
      situation_evidence_selection: selection,
      answer_text: buildSnapshotExpansionAnswer({
        snapshot: latestSnapshot,
        distillation: latestDistillation,
      }),
      reasoning_snapshot: latestSnapshot,
      answer_distillation: latestDistillation,
      procedure_memory_recall: buildProcedureMemoryRecall({
        threadId: input.threadId,
        turnId,
        prompt: input.promptText,
        activeContext,
        selection,
        snapshot: latestSnapshot,
        distillation: latestDistillation,
      }),
      live_context_window_binding: null,
      comparison_session: null,
      voice_live_handoff: null,
      binding_repair: null,
    };
  }
  if (!initialReference.candidate_signal) {
    const selection = selectSituationEvidence({
      threadId: input.threadId,
      activeContext,
      deicticReference: initialReference,
    });
    return {
      route: "none",
      deictic_reference: initialReference,
      active_situation_context: activeContext,
      situation_evidence_selection: selection,
      answer_text: null,
      reasoning_snapshot: null,
      answer_distillation: null,
      procedure_memory_recall: null,
      live_context_window_binding: null,
      comparison_session: null,
      voice_live_handoff: null,
      binding_repair: null,
    };
  }
  const bindingRepair = repairUnboundVisualSituationContext({
    activeContext,
    promptText: input.promptText,
  });
  const baseResolvedActiveContext = bindingRepair?.status === "applied"
    ? resolveActiveSituationContext({
        threadId: bindingRepair.thread_id,
        environmentId: bindingRepair.environment_id,
      })
    : activeContext;
  const resolvedActiveContext = bindingRepair?.status === "applied"
    ? {
        ...baseResolvedActiveContext,
        latest_field_evaluation_refs: uniqueStrings([
          ...baseResolvedActiveContext.latest_field_evaluation_refs,
          ...bindingRepair.field_evaluation_refs,
        ]),
        status: baseResolvedActiveContext.status === "no_fresh_evidence"
          ? "active" as const
          : baseResolvedActiveContext.status,
      }
    : baseResolvedActiveContext;
  const answerStartedAt = input.answerStartedAt ?? new Date().toISOString();
  const liveContextWindowBinding = buildLiveContextWindowBinding({
    threadId: resolvedActiveContext.thread_id || input.threadId,
    turnId,
    questionText: input.promptText,
    anchorKind: input.inputModality === "voice" ? "voice_direct_address" : "typed_user_prompt",
    anchorSourceId: input.inputModality === "voice" ? "voice_input" : "typed_prompt",
    speechStartAt: input.speechStartAt ?? null,
    speechEndAt: input.speechEndAt ?? null,
    submittedAt: input.submittedAt ?? answerStartedAt,
    serverReceivedAt: input.serverReceivedAt ?? answerStartedAt,
    answerStartedAt,
    lookbackMs: input.lookbackMs ?? (/\bwhat\s+just\s+happened\b/i.test(input.promptText) ? 90_000 : 60_000),
    tailPolicy: input.liveTailPolicy ?? "strict_past",
  });
  const temporalActiveContext = filterActiveSituationContextByWindow(
    resolvedActiveContext,
    liveContextWindowBinding,
    answerStartedAt,
  );
  const resolutionStatus: HelixDeicticResolutionStatus = temporalActiveContext.status === "active"
      ? "resolved"
    : temporalActiveContext.status === "stale"
      ? "stale"
      : temporalActiveContext.status === "unbound"
        ? "unbound_source"
        : "missing_context";
  const deicticReference = {
    ...initialReference,
    resolved_context_refs: [
      resolvedActiveContext.context_id,
      resolvedActiveContext.situation_run_id ?? "",
      ...temporalActiveContext.latest_observation_refs,
      ...temporalActiveContext.latest_field_evaluation_refs,
      ...temporalActiveContext.latest_probe_result_refs,
      ...temporalActiveContext.latest_closure_refs,
    ].filter(Boolean),
    resolution_status: resolutionStatus,
  };
  const selection = selectSituationEvidence({
    threadId: input.threadId,
    activeContext: temporalActiveContext,
    deicticReference,
    askingHistory: isProcedureReplayPrompt(input.promptText),
  });
  const voiceLiveHandoff = input.inputModality === "voice"
    ? createVoiceLiveHandoff({
        threadId: input.threadId,
        transcript: input.promptText,
        deicticReference,
        situationEvidenceSelection: selection,
      })
    : null;
  if (!selection.answerable) {
    return {
      route: "situation_context_question",
      deictic_reference: deicticReference,
      active_situation_context: temporalActiveContext,
      situation_evidence_selection: selection,
      answer_text: [
        "I resolved this as a live situation-context question, but there is no server-bound active SituationRun evidence to answer from yet.",
        bindingRepair?.status === "failed"
          ? "I attempted to bind the live visual source into a SituationRun, but the repair failed."
          : selection.answerability_reason,
        `Next required action: ${temporalActiveContext.next_required_action ?? "start or bind a live source"}.`,
      ].join(" "),
      reasoning_snapshot: null,
      answer_distillation: null,
      procedure_memory_recall: null,
      live_context_window_binding: liveContextWindowBinding,
      comparison_session: null,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  const visualSceneQueryIntent = buildVisualSceneQueryIntent({
    turnId,
    threadId: input.threadId,
    promptText: input.promptText,
  });
  if (visualSceneQueryIntent?.compare_to_current && temporalActiveContext.situation_run_id) {
    const selectedVisualSceneSet = selectVisualScenesForQuery({
      turnId,
      threadId: input.threadId,
      queryIntent: visualSceneQueryIntent,
      situationRunId: temporalActiveContext.situation_run_id,
      currentEpoch: temporalActiveContext.latest_epoch ?? null,
    });
    const visualSceneComparisonResult = buildVisualSceneComparisonResult({
      turnId,
      threadId: input.threadId,
      queryIntent: visualSceneQueryIntent,
      selectedSceneSet: selectedVisualSceneSet,
    });
    if (visualSceneComparisonResult) {
      const fullReasoning = buildSceneComparisonAnswer(visualSceneComparisonResult);
      const distillationBundle = recordReasoningAndDistillation({
        turnId,
        threadId: input.threadId,
        prompt: input.promptText,
        activeContext: temporalActiveContext,
        selection,
        sourceAnswerKind: "procedure_epoch_replay",
        fullReasoningSummary: fullReasoning,
        conciseAnswer: visualSceneComparisonResult.summary,
        caveat: null,
        style: chooseLiveAnswerStyle({
          promptText: input.promptText,
          inputModality: input.inputModality,
        }),
      });
      return {
        route: "procedure_epoch_replay_question",
        deictic_reference: deicticReference,
        active_situation_context: temporalActiveContext,
        situation_evidence_selection: selection,
        answer_text: fullReasoning,
        reasoning_snapshot: distillationBundle.snapshot,
        answer_distillation: distillationBundle.distillation,
        procedure_memory_recall: buildProcedureMemoryRecall({
          threadId: input.threadId,
          turnId,
          prompt: input.promptText,
          activeContext: temporalActiveContext,
          selection,
          snapshot: distillationBundle.snapshot,
          distillation: distillationBundle.distillation,
        }),
        live_context_window_binding: liveContextWindowBinding,
        comparison_session: null,
        visual_scene_query_intent: visualSceneQueryIntent,
        selected_visual_scene_set: selectedVisualSceneSet,
        visual_scene_comparison_result: visualSceneComparisonResult,
        voice_live_handoff: voiceLiveHandoff,
        binding_repair: bindingRepair,
      };
    }
  }
  if (isComparisonPrompt(input.promptText) && temporalActiveContext.situation_run_id && temporalActiveContext.latest_observation_refs[0]) {
    const comparisonSession = createVisualComparisonSession({
      threadId: input.threadId,
      situationRunId: temporalActiveContext.situation_run_id,
      baselineEpoch: temporalActiveContext.latest_epoch ?? 0,
      baselineObservationRef: temporalActiveContext.latest_observation_refs.at(-1) ?? temporalActiveContext.latest_observation_refs[0],
    });
    return {
      route: "visual_comparison_setup",
      deictic_reference: deicticReference,
      active_situation_context: temporalActiveContext,
      situation_evidence_selection: selection,
      answer_text: [
        "I saved the current visual SituationRun observation as the comparison baseline.",
        `Baseline: ${comparisonSession.baseline_observation_ref} at epoch ${comparisonSession.baseline_epoch}.`,
        "Show the next file/image and let the next visual epoch arrive; comparison will be grounded in the procedure evidence, not raw image injection.",
      ].join("\n"),
      reasoning_snapshot: null,
      answer_distillation: null,
      procedure_memory_recall: null,
      live_context_window_binding: liveContextWindowBinding,
      comparison_session: comparisonSession,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  if (isProcedureReplayPrompt(input.promptText) || deicticReference.reference_type === "latest_epoch_change") {
    const fullReasoning = buildReplayAnswer({ activeContext: temporalActiveContext, selection });
    const distillationBundle = recordReasoningAndDistillation({
      turnId,
      threadId: input.threadId,
      prompt: input.promptText,
      activeContext: temporalActiveContext,
      selection,
      sourceAnswerKind: "procedure_epoch_replay",
      fullReasoningSummary: fullReasoning,
      conciseAnswer: fullReasoning.split("\n").slice(0, 3).join(" "),
      caveat: null,
      style: chooseLiveAnswerStyle({
        promptText: input.promptText,
        inputModality: input.inputModality,
      }),
    });
    return {
      route: "procedure_epoch_replay_question",
      deictic_reference: deicticReference,
      active_situation_context: temporalActiveContext,
      situation_evidence_selection: selection,
      answer_text: distillationBundle.terminalText,
      reasoning_snapshot: distillationBundle.snapshot,
      answer_distillation: distillationBundle.distillation,
      procedure_memory_recall: buildProcedureMemoryRecall({
        threadId: input.threadId,
        turnId,
        prompt: input.promptText,
        activeContext: temporalActiveContext,
        selection,
        snapshot: distillationBundle.snapshot,
        distillation: distillationBundle.distillation,
      }),
      live_context_window_binding: liveContextWindowBinding,
      comparison_session: null,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  const style = chooseLiveAnswerStyle({
    promptText: input.promptText,
    inputModality: input.inputModality,
  });
  const fullReasoning = buildSituationFullReasoning({
    prompt: input.promptText,
    activeContext: temporalActiveContext,
    selection,
  });
  const concise = buildConciseSituationAnswer({
    prompt: input.promptText,
    activeContext: temporalActiveContext,
    style,
  });
  const distillationBundle = recordReasoningAndDistillation({
    turnId,
    threadId: input.threadId,
    prompt: input.promptText,
    activeContext: temporalActiveContext,
    selection,
    sourceAnswerKind: "situation_context_question",
    fullReasoningSummary: fullReasoning,
    conciseAnswer: concise.concise,
    caveat: concise.caveat,
    style,
  });
  return {
    route: "situation_context_question",
    deictic_reference: deicticReference,
    active_situation_context: temporalActiveContext,
    situation_evidence_selection: selection,
    answer_text: distillationBundle.terminalText,
    reasoning_snapshot: distillationBundle.snapshot,
    answer_distillation: distillationBundle.distillation,
    procedure_memory_recall: null,
    live_context_window_binding: liveContextWindowBinding,
    comparison_session: null,
    voice_live_handoff: voiceLiveHandoff,
    binding_repair: bindingRepair,
  };
}
