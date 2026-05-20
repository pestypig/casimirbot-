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
  type HelixProcedureMemoryRecallRef,
  type HelixProcedureMemoryRecallType,
  type ProcedureRecallFailureCode,
} from "@shared/helix-procedure-memory-recall";
import { detectDeicticReference } from "./deictic-reference-detector";
import { selectSituationEvidence } from "./situation-evidence-selector";
import { resolveActiveSituationContext } from "../situation-room/active-situation-context-resolver";
import { repairUnboundVisualSituationContext } from "../situation-room/live-situation-context-binding-repair";
import { autoBindExplicitVisualCaptureSituationRun } from "../situation-room/visual-capture-situation-run-autobind";
import { listObservationJournalEntries } from "../situation-room/observation-journal-store";
import { listLiveFieldEvaluations } from "../situation-room/live-field-evaluation-store";
import { buildLiveContextWindowBinding } from "../situation-room/live-context-window-binding-builder";
import { listProcedureEpochLedger } from "../situation-room/procedure-epoch-ledger-store";
import { listProcedureEpochClosures } from "../situation-room/procedure-epoch-closure";
import { listLiveProbeResults } from "../situation-room/live-probe-result-store";
import { createVisualComparisonSession } from "../situation-room/visual-comparison-session-store";
import {
  buildRelativeSessionSemanticIntent,
  buildVisualSceneComparisonResult,
  buildVisualSceneQueryIntent,
  selectSessionSemanticBinding,
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
import type { HelixRelativeSessionSemanticIntent } from "@shared/helix-relative-session-semantic-intent";
import type { HelixSelectedSessionSemanticBinding } from "@shared/helix-selected-session-semantic-binding";
import {
  HELIX_PROCEDURE_EPOCH_REPLAY_SCHEMA,
  type HelixProcedureEpochReplay,
} from "@shared/helix-procedure-epoch-replay";
import type { HelixProcedureEvidenceRetrievalPlan } from "@shared/helix-procedure-evidence-retrieval-plan";
import type { HelixProcedureEvidenceRetrievalResult } from "@shared/helix-procedure-evidence-retrieval-result";
import { isSceneEpochReplayPrompt } from "./scene-epoch-replay-intent";
import { matchProcedureRecallPrompt } from "./procedure-memory-recall-router";
import { buildProcedureEvidenceRetrievalPlan } from "./procedure-evidence-retrieval-planner";
import { buildProcedureEvidenceRetrievalResult } from "./procedure-evidence-retriever";

type HelixSituationTypedFailure = {
  schema: "helix.typed_failure.v1";
  failure_id: string;
  turn_id: string;
  thread_id: string;
  error_code:
    | "visual_scene_memory_no_match"
    | "visual_scene_memory_current_missing"
    | "procedure_epoch_current_unavailable"
    | "procedure_epoch_previous_unavailable"
    | "procedure_memory_unavailable"
    | "procedure_epoch_replay_evidence_unavailable"
    | "procedure_epoch_replay_terminal_authority_rejected"
    | "PROCEDURE_MEMORY_RECALL_EVIDENCE_MISSING"
    | "PROCEDURE_MEMORY_ACTIVE_SITUATION_RUN_MISSING"
    | "PROCEDURE_MEMORY_SELECTED_REFS_MISSING"
    | "PROCEDURE_REASONING_SNAPSHOT_MISSING"
    | "PROCEDURE_EPOCH_LEDGER_MISSING"
    | "PROCEDURE_EPOCH_PREVIOUS_UNAVAILABLE"
    | "PROCEDURE_RECALL_TERMINAL_AUTHORITY_MISSING"
    | "PROCEDURE_RECALL_VOICE_NOT_TERMINAL_AUTHORIZED";
  failure_code?: ProcedureRecallFailureCode;
  failure_kind?: string;
  requested_capability?: string;
  blocking_reason?: string;
  repair_hint?: string;
  live_environment_binding_diagnosis_id?: string | null;
  message: string;
  evidence_refs: string[];
  query_intent_id: string;
  selected_scene_set_id: string;
  query_terms: string[];
  candidate_pool_size: number;
  rejected_candidate_refs: string[];
  missing_evidence: string[];
  next_required_action:
    | "capture_current_visual_epoch"
    | "wait_for_scene_memory_index"
    | "ask_user_for_more_specific_scene_terms"
    | "repair_procedure_memory"
    | "none";
  assistant_answer: false;
  raw_content_included: false;
};

type HelixProcedureEpochReplayDelta = {
  schema: "helix.procedure_epoch_replay_delta.v1";
  current_observation_refs: string[];
  previous_observation_refs: string[];
  current_field_evaluation_refs: string[];
  previous_field_evaluation_refs: string[];
  changed_objects: string[];
  unchanged_objects: string[];
  changed_activity: string[];
  changed_app_window: string[];
  metric_or_value_changes: string[];
  comparison_confidence: number;
  missing_evidence: string[];
  assistant_answer: false;
  raw_content_included: false;
};

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
  relative_session_semantic_intent?: HelixRelativeSessionSemanticIntent | null;
  selected_session_semantic_binding?: HelixSelectedSessionSemanticBinding | null;
  visual_scene_query_intent?: HelixVisualSceneQueryIntent | null;
  selected_visual_scene_set?: HelixSelectedVisualSceneSet | null;
  visual_scene_comparison_result?: HelixVisualSceneComparisonResult | null;
  procedure_epoch_replay_delta?: HelixProcedureEpochReplayDelta | null;
  procedure_evidence_retrieval_plan?: HelixProcedureEvidenceRetrievalPlan | null;
  procedure_evidence_retrieval_result?: HelixProcedureEvidenceRetrievalResult | null;
  typed_failure?: HelixSituationTypedFailure | null;
  procedure_epoch_replay?: HelixProcedureEpochReplay | null;
  voice_live_handoff?: ReturnType<typeof createVoiceLiveHandoff> | null;
  binding_repair?: ReturnType<typeof repairUnboundVisualSituationContext> | null;
};

const line = (label: string, value: string | null | undefined): string =>
  value && value.trim() ? `${label}: ${value.trim()}` : "";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const replayWindowForPrompt = (input: {
  submittedAt?: string | null;
  answerStartedAt: string;
  lookbackMs?: number;
}): { from_ts: string; to_ts: string } => {
  const anchorMs = Date.parse(input.submittedAt ?? "") || Date.parse(input.answerStartedAt) || Date.now();
  const lookbackMs = Math.max(0, Math.trunc(input.lookbackMs ?? 60_000));
  return {
    from_ts: new Date(anchorMs - lookbackMs).toISOString(),
    to_ts: new Date(anchorMs).toISOString(),
  };
};

const isProcedureReplayPrompt = (prompt: string): boolean =>
  /\b(?:why\s+did|what\s+changed|changed\s+since|last\s+(?:seen\s+|situation\s+|scene\s+|visual\s+|screen\s+|live\s+)?epochs?|scene\s+epochs?|visual\s+epochs?|screen\s+epochs?|live\s+epochs?|since\s+(?:the\s+)?last\s+(?:seen|visual|capture|scene|frame|screen|epochs?)|previous\s+(?:scene|frame|visual|screen|capture|epochs?)|compare\s+(?:the\s+)?current\s+scene|compare\b[\s\S]{0,80}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epochs?)|(?:different|difference)\b[\s\S]{0,100}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epochs?)|last\s+(?:scene|frame|visual|screen|capture)\b[\s\S]{0,100}\b(?:current|now|looking\s+at|this\s+(?:scene|frame|visual|screen))|confidence\s+change|stay\s+silent|interject|replay\s+the\s+last|procedure\s+memory)\b/i.test(prompt);

const isProcedureMemoryPrompt = (prompt: string): boolean =>
  /\bprocedure\s+memory\b/i.test(prompt);

const isComparisonPrompt = (prompt: string): boolean =>
  /\b(?:compare\s+this|compare\s+(?:this|the)\s+(?:file|image|picture|screen)|next\s+(?:one|file|image|picture|screen)|remember\s+this\s+as\s+the\s+first)\b/i.test(prompt);

const isEvidenceExpansionPrompt = (prompt: string): boolean =>
  /\b(?:show\s+(?:the\s+)?evidence|what\s+did\s+you\s+base\s+that\s+on|why\s+did\s+you\s+say|why\s+that|go\s+to\s+log|replay\s+that|show\s+refs?|what\s+evidence)\b/i.test(prompt);

const classifyProcedureRecallType = (prompt: string): HelixProcedureMemoryRecallType => {
  if (/\b(?:show\s+(?:the\s+)?evidence|what\s+did\s+you\s+base\s+that\s+on|show\s+refs?|what\s+evidence)\b/i.test(prompt)) return "show_evidence";
  if (/\bwhy\s+(?:did\s+you\s+say|that)\b/i.test(prompt)) return "why_answer";
  if (/\b(?:confidence\s+change|activity\s+confidence)\b/i.test(prompt)) return "confidence_change";
  if (/\b(?:go\s+to\s+log|log)\b/i.test(prompt)) return "log_navigation";
  return "epoch_replay";
};

const classifyProcedureRecallMode = (prompt: string): HelixProcedureMemoryRecallMode => {
  const rule = matchProcedureRecallPrompt(prompt);
  if (rule) return rule.mode;
  if (/\b(?:show\s+(?:the\s+)?evidence|what\s+did\s+you\s+base\s+that\s+on|show\s+refs?|what\s+evidence)\b/i.test(prompt)) return "brief_evidence";
  if (/\bwhy\s+(?:did\s+you\s+say|that)\b/i.test(prompt)) return "expanded_trace";
  return "epoch_replay";
};

const selectedEvidenceRefs = (selection: HelixSituationEvidenceSelection): string[] =>
  Array.from(new Set([
    ...selection.selected_source_binding_status_refs,
    ...selection.selected_observation_refs,
    ...selection.selected_field_evaluation_refs,
    ...(selection.selected_interpretation_run_refs ?? []),
    ...(selection.selected_interpretation_worker_run_refs ?? []),
    ...(selection.selected_interpretation_hypothesis_refs ?? []),
    ...(selection.selected_interpretation_graph_refs ?? []),
    ...(selection.selected_interpretation_tangent_refs ?? []),
    ...selection.selected_probe_result_refs,
    ...selection.selected_epoch_closure_refs,
    ...selection.selected_source_descriptor_refs,
  ])).slice(0, 24);

const selectedSourceRefs = (selection: HelixSituationEvidenceSelection): string[] =>
  Array.from(new Set([
    ...selection.selected_source_binding_status_refs.map((ref) => ref.startsWith("source_binding_status:") ? ref : `source_binding_status:${ref}`),
    ...selection.selected_source_refs.map((ref) => ref.startsWith("source:") ? ref : `source:${ref}`),
    ...selection.selected_observation_refs.map((ref) => ref.startsWith("observation:") ? ref : `observation:${ref}`),
    ...selection.selected_field_evaluation_refs.map((ref) => ref.startsWith("field_eval:") ? ref : `field_eval:${ref}`),
  ])).slice(0, 16);

const retrieveProcedureEvidence = (input: {
  plan: HelixProcedureEvidenceRetrievalPlan;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}): HelixProcedureEvidenceRetrievalResult =>
  buildProcedureEvidenceRetrievalResult({
    plan: input.plan,
    activeContext: input.activeContext,
    selection: input.selection,
  });

const withRefPrefix = (kind: string, refs: string[]): string[] =>
  refs
    .map((ref) => ref.trim())
    .filter(Boolean)
    .map((ref) => ref.includes(":") ? ref : `${kind}:${ref}`);

const sanitizeRecallSummary = (value: string | null | undefined): string | null => {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!trimmed) return null;
  return trimmed
    .replace(/\bRaw images?, audio, and logs were not injected into Ask context\.?/gi, "Unredacted media and log payloads were not included.")
    .replace(/\bRaw images?, audio, logs, worker traces, and process graph snapshots were not included\.?/gi, "Unredacted media, log, worker-trace, and process-graph payloads were not included.")
    .replace(/\braw screen pixels\b/gi, "unredacted screen pixels");
};

const renderProcedureEpochTerminalAuthority = (terminalArtifactKind: "procedure_epoch_replay" | "typed_failure"): string =>
  [
    "Terminal authority",
    "server_authoritative=true",
    `terminal_artifact_kind=${terminalArtifactKind}`,
    "source_target=procedure_memory",
    "target_kind=situation_epoch",
    "client_shortcut_allowed=false",
    "no_tool_direct_allowed=false",
  ].join("\n");

const renderProcedureEpochReplayAnswer = (replay: HelixProcedureEpochReplay): string =>
  [
    "Current observation",
    replay.current_observation ?? "Unavailable",
    "",
    "Previous observation",
    replay.previous_observation ?? "Unavailable",
    "",
    "Changed elements since previous epoch",
    ...(replay.changed_elements.length ? replay.changed_elements.map((entry) => `- ${entry}`) : ["- none confidently selected"]),
    "",
    "Unchanged elements / stable",
    ...(replay.unchanged_elements.length ? replay.unchanged_elements.map((entry) => `- ${entry}`) : ["- none confidently selected"]),
    "",
    "Uncertainty / unclear",
    ...(replay.uncertainty.length ? replay.uncertainty.map((entry) => `- ${entry}`) : ["- comparison confidence unavailable"]),
    "",
    "Evidence refs",
    ...(replay.evidence_refs.length ? replay.evidence_refs.map((entry) => `- ${entry}`) : ["- none selected"]),
    "",
    renderProcedureEpochTerminalAuthority("procedure_epoch_replay"),
  ].join("\n");

const renderProcedureEpochFailureAnswer = (failure: HelixSituationTypedFailure): string =>
  [
    failure.message,
    "",
    "Current observation",
    failure.error_code === "procedure_epoch_current_unavailable" ? "Unavailable" : "Unavailable or insufficiently selected",
    "",
    "Previous observation",
    failure.error_code === "procedure_epoch_previous_unavailable" ? "Unavailable" : "Unavailable or insufficiently selected",
    "",
    "Changed elements since previous epoch",
    "- none confidently selected",
    "",
    "Unchanged elements / stable",
    "- none confidently selected",
    "",
    "Uncertainty / unclear",
    ...uniqueStrings([
      ...failure.missing_evidence,
      failure.message,
    ]).map((entry) => `- ${entry}`),
    "",
    "Evidence refs",
    ...(failure.evidence_refs.length ? failure.evidence_refs.map((entry) => `- ${entry}`) : ["- none selected"]),
    "",
    renderProcedureEpochTerminalAuthority("typed_failure"),
  ].join("\n");

const buildProcedureEpochTypedFailure = (input: {
  turnId: string;
  threadId: string;
  errorCode: HelixSituationTypedFailure["error_code"];
  failureCode?: ProcedureRecallFailureCode;
  message: string;
  evidenceRefs?: string[];
  missingEvidence?: string[];
  selection?: HelixSituationEvidenceSelection | null;
  queryIntentId?: string | null;
  selectedSceneSetId?: string | null;
}): HelixSituationTypedFailure => {
  const evidenceRefs = uniqueStrings([
    ...(input.evidenceRefs ?? []),
    ...(input.selection ? selectedEvidenceRefs(input.selection) : []),
  ]);
  return {
    schema: "helix.typed_failure.v1",
    failure_id: `typed_failure:${hashShort([input.turnId, input.errorCode, evidenceRefs, input.missingEvidence])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    error_code: input.errorCode,
    ...(input.failureCode ? { failure_code: input.failureCode } : {}),
    message: input.message,
    evidence_refs: evidenceRefs,
    query_intent_id: input.queryIntentId ?? "",
    selected_scene_set_id: input.selectedSceneSetId ?? "",
    query_terms: [],
    candidate_pool_size: 0,
    rejected_candidate_refs: [],
    missing_evidence: uniqueStrings(input.missingEvidence ?? []),
    next_required_action:
      input.errorCode === "procedure_epoch_current_unavailable"
        ? "capture_current_visual_epoch"
        : input.errorCode === "procedure_epoch_previous_unavailable"
          ? "wait_for_scene_memory_index"
          : input.errorCode === "procedure_memory_unavailable"
            ? "repair_procedure_memory"
          : "none",
    ...(input.errorCode === "procedure_memory_unavailable"
      ? {
          failure_kind: "procedure_memory_unavailable",
          requested_capability: "procedure_memory",
          blocking_reason: "no_active_situation_run",
          repair_hint: "create_or_resume_situation_run",
          live_environment_binding_diagnosis_id: null,
        }
      : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildProcedureMemoryRecall = (input: {
  threadId: string;
  turnId: string;
  prompt: string;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
  snapshot?: HelixProcedureReasoningSnapshot | null;
  distillation?: HelixConversationalAnswerDistillation | null;
}): HelixProcedureMemoryRecall => {
  const mode = classifyProcedureRecallMode(input.prompt);
  const terminalArtifactKind =
    mode === "epoch_replay"
      ? "procedure_epoch_replay"
      : mode === "expanded_trace"
        ? "answer_distillation_expansion"
        : "procedure_memory_recall";
  const ledger = listProcedureEpochLedger({
    threadId: input.activeContext.thread_id || input.threadId,
    environmentId: input.activeContext.environment_id ?? null,
    situationRunId: input.activeContext.situation_run_id ?? null,
    epoch: input.activeContext.latest_epoch ?? null,
    limit: 24,
  });
  const toRecallRef = (
    refId: string,
    refKind: HelixProcedureMemoryRecallRef["ref_kind"],
    summary?: string | null,
  ): HelixProcedureMemoryRecallRef => ({
    ref_id: refId,
    ref_kind: refKind,
    source_scope: input.activeContext.situation_run_id ? "active_situation_run" : "legacy_context_pack",
    situation_run_id: input.activeContext.situation_run_id ?? null,
    environment_id: input.activeContext.environment_id ?? null,
    epoch: input.activeContext.latest_epoch ?? null,
    created_at: null,
    observed_at: null,
    confidence: null,
    summary: summary ?? null,
    assistant_answer: false,
    raw_content_included: false,
  });
  const selectedEvidenceRefIds = selectedEvidenceRefs(input.selection);
  const selectedEvidence = selectedEvidenceRefIds.map((refId) => toRecallRef(refId, "selected_evidence"));
  const reasoningSnapshots = input.snapshot
    ? [toRecallRef(input.snapshot.snapshot_id, "reasoning_snapshot", firstSentence(sanitizeRecallSummary(input.snapshot.full_reasoning_summary)))]
    : [];
  const epochLedger = ledger.map((entry) => ({
    ref_id: entry.ledger_item_id,
    ref_kind: "epoch_ledger" as const,
    source_scope: "active_situation_epoch" as const,
    situation_run_id: entry.situation_run_id,
    environment_id: entry.environment_id,
    epoch: entry.epoch,
    created_at: entry.created_at,
    observed_at: null,
    confidence: null,
    summary: entry.summary,
    assistant_answer: false as const,
    raw_content_included: false as const,
  }));
  const probeResults = input.selection.selected_probe_result_refs.map((refId) => toRecallRef(refId, "probe_result"));
  const confidenceUpdates = ledger
    .filter((entry) => entry.item_kind === "confidence_update")
    .map((entry) => ({
      ref_id: entry.ledger_item_id,
      ref_kind: "confidence_update" as const,
      source_scope: "active_situation_epoch" as const,
      situation_run_id: entry.situation_run_id,
      environment_id: entry.environment_id,
      epoch: entry.epoch,
      created_at: entry.created_at,
      observed_at: null,
      confidence: null,
      summary: entry.summary,
      assistant_answer: false as const,
      raw_content_included: false as const,
    }));
  const closures = input.selection.selected_epoch_closure_refs.map((refId) => toRecallRef(refId, "closure"));
  const requiredRefsPresent =
    mode === "epoch_replay"
      ? epochLedger.length > 0 || selectedEvidence.length > 0
      : mode === "expanded_trace"
        ? selectedEvidence.length > 0 && reasoningSnapshots.length > 0
        : selectedEvidence.length > 0;
  const missingEvidenceReasons = uniqueStrings([
    selectedEvidence.length > 0 ? null : "selected_evidence_refs_missing",
    mode === "expanded_trace" && reasoningSnapshots.length === 0 ? "reasoning_snapshot_refs_missing" : null,
    mode === "epoch_replay" && epochLedger.length === 0 ? "epoch_ledger_refs_missing" : null,
  ]);
  const terminalAuthorized = requiredRefsPresent && input.selection.answerable && input.activeContext.situation_run_id !== null;
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
    anchor_turn_id: input.snapshot?.turn_id ?? input.distillation?.turn_id ?? null,
    anchor_answer_ref: input.distillation?.distillation_id ?? null,
    source_turn_id: input.snapshot?.turn_id ?? input.distillation?.turn_id ?? null,
    mode,
    terminal_artifact_kind: terminalArtifactKind,
    situation_run_id: input.activeContext.situation_run_id ?? null,
    environment_id: input.activeContext.environment_id ?? null,
    source_binding_id: input.activeContext.source_binding_ids[0] ?? null,
    epoch: input.activeContext.latest_epoch ?? null,
    selected_evidence_refs: selectedEvidence,
    reasoning_snapshot_refs: reasoningSnapshots,
    epoch_ledger_refs: epochLedger,
    probe_result_refs: probeResults,
    confidence_update_refs: confidenceUpdates,
    closure_refs: closures,
    answer_distillation_ref: input.distillation?.distillation_id ?? null,
    expansion_ref: input.snapshot?.snapshot_id ?? input.distillation?.expansion_ref ?? null,
    selection_precedence: [
      "active_situation_run",
      "active_situation_epoch",
      "visual_scene_memory",
      "answer_distillation",
      "legacy_context_pack",
    ],
    evidence_complete: missingEvidenceReasons.length === 0,
    missing_evidence_reasons: missingEvidenceReasons,
    terminal_authorized: terminalAuthorized,
    voice_read_authorized:
      terminalAuthorized &&
      (
        terminalArtifactKind === "procedure_memory_recall" ||
        terminalArtifactKind === "answer_distillation_expansion" ||
        terminalArtifactKind === "procedure_epoch_replay"
      ),
    snapshot_refs: input.snapshot ? [input.snapshot.snapshot_id] : [],
    distillation_refs: input.distillation ? [input.distillation.distillation_id] : [],
    selected_evidence_ref_ids: selectedEvidenceRefIds,
    epoch_ledger_ref_ids: ledger.map((entry) => entry.ledger_item_id),
    recall_type: classifyProcedureRecallType(input.prompt),
    recall_mode: mode,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const renderProcedureRecallAnswer = (
  recall: HelixProcedureMemoryRecall,
  input: {
    snapshot?: HelixProcedureReasoningSnapshot | null;
    distillation?: HelixConversationalAnswerDistillation | null;
  } = {},
): string => {
  const selectedEvidence = recall.selected_evidence_refs.map((ref) => `- ${ref.ref_id}${ref.summary ? `: ${ref.summary}` : ""}`);
  const reasoning = recall.reasoning_snapshot_refs.map((ref) => `- ${ref.ref_id}${ref.summary ? `: ${ref.summary}` : ""}`);
  const probes = recall.probe_result_refs.map((ref) => `- ${ref.ref_id}`);
  const confidence = recall.confidence_update_refs.map((ref) => `- ${ref.ref_id}${ref.summary ? `: ${ref.summary}` : ""}`);
  const closures = recall.closure_refs.map((ref) => `- ${ref.ref_id}`);
  if (recall.mode === "brief_evidence") {
    return [
      input.distillation?.concise_answer ? `Answered claim: ${input.distillation.concise_answer}` : "Answered claim: latest terminal answer anchor.",
      input.snapshot?.full_reasoning_summary ? `Reasoning snapshot: ${sanitizeRecallSummary(input.snapshot.full_reasoning_summary)}` : "",
      "Selected evidence refs",
      ...(selectedEvidence.length ? selectedEvidence : ["- none selected"]),
      `Evidence refs: ${recall.selected_evidence_ref_ids.slice(0, 12).join(", ") || "none"}.`,
      reasoning.length ? "Reasoning snapshot refs" : "",
      ...reasoning,
      confidence.length ? "Confidence update refs" : "",
      ...confidence,
      recall.evidence_complete ? "" : `Caveat: evidence is partial (${recall.missing_evidence_reasons.join(", ")}).`,
      "Unredacted media, logs, worker traces, and process-graph payloads were not included.",
    ].filter(Boolean).join("\n");
  }
  if (recall.mode === "expanded_trace") {
    return [
      input.distillation?.concise_answer ? `Claim: ${input.distillation.concise_answer}` : "Claim: latest terminal answer anchor.",
      input.snapshot?.full_reasoning_summary ? `Reasoning snapshot summary: ${sanitizeRecallSummary(input.snapshot.full_reasoning_summary)}` : "",
      "Evidence refs used",
      ...(selectedEvidence.length ? selectedEvidence : ["- none selected"]),
      "Reasoning snapshot refs",
      ...(reasoning.length ? reasoning : ["- none selected"]),
      probes.length ? "Probe result refs" : "",
      ...probes,
      confidence.length ? "Confidence update refs" : "",
      ...confidence,
      closures.length ? "Epoch closure refs" : "",
      ...closures,
      recall.missing_evidence_reasons.length
        ? `Missing or uncertain: ${recall.missing_evidence_reasons.join(", ")}.`
        : "Missing or uncertain: none selected by the recall artifact.",
      "This is a replay-safe reasoning snapshot summary, not raw trace output.",
    ].filter(Boolean).join("\n");
  }
  return [
    `Epoch: ${recall.epoch ?? "unknown"}`,
    "Ledger item refs",
    ...(recall.epoch_ledger_refs.length
      ? recall.epoch_ledger_refs.map((ref) => `- ${ref.ref_id}${ref.summary ? `: ${ref.summary}` : ""}`)
      : ["- none selected"]),
    "Selected evidence refs",
    ...(selectedEvidence.length ? selectedEvidence : ["- none selected"]),
    closures.length ? "Closure refs" : "",
    ...closures,
    confidence.length ? "Confidence deltas" : "",
    ...confidence,
    recall.missing_evidence_reasons.length
      ? `Missing or uncertain: ${recall.missing_evidence_reasons.join(", ")}.`
      : "",
    "Unredacted media, logs, worker traces, and process-graph payloads were not included.",
  ].filter(Boolean).join("\n");
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

const getLatestObservationSummary = (context: HelixActiveSituationContext): string | null => {
  const refs = new Set(context.latest_observation_refs);
  if (refs.size === 0) return null;
  return listObservationJournalEntries({
    threadId: context.thread_id,
    limit: 120,
  })
    .filter((entry) => refs.has(entry.observation_id))
    .at(-1)?.text?.trim() ?? null;
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
    context.status === "active" &&
    latestObservationRefs.length === 0 &&
    latestFieldEvaluationRefs.length === 0 &&
    (context.latest_interpretation_hypothesis_refs ?? []).length === 0
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
    line("Scene", scene?.value ?? getLatestObservationSummary(context)),
    line("Activity", activity?.value),
    line("Visible objects", objects?.value),
    line("Uncertainty", uncertainty?.value),
    line("Next check", nextCheck?.next_check || nextCheck?.value),
    `Evidence refs: ${selectedEvidenceRefs(input.selection).slice(0, 8).join(", ") || "none selected"}.`,
    `Source refs: ${selectedSourceRefs(input.selection).join(", ") || "none selected"}.`,
    context.status === "stale" ? "Freshness caveat: selected evidence is stale." : "",
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");
};

const summarizeVisibleContext = (value: string | null | undefined): string => {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!trimmed) return "the active visual workspace";
  return trimmed;
};

const stripSceneLeadIn = (value: string): string => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned
    .replace(/^(?:a\s+|the\s+)?(?:visible\s+scene|current\s+live\s+frame|live\s+frame|current\s+frame|visual\s+capture\s+frame|current\s+visual\s+capture\s+frame|image|screen)\s+(?:captures|showcases|shows|depicts|displays|features|contains)\s+/i, "")
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

const normalizeBriefPart = (value: string | null | undefined): string | null => {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return null;
  return text.replace(/\.$/, "");
};

const composeOperatorBrief = (input: {
  visible: string;
  activity?: string | null;
  objects?: string | null;
}): string => {
  const visible = normalizeBriefPart(input.visible) ?? "the active visual workspace";
  const activity = normalizeBriefPart(input.activity);
  const objects = normalizeBriefPart(input.objects);
  const lines = [`I'm seeing ${visible.replace(/^\s*(?:you're\s+viewing|i'?m\s+seeing)\s+/i, "")}.`];
  if (activity) lines.push(`The useful signal is ${activity.replace(/\.$/, "")}.`);
  if (objects) lines.push(`Visible objects include ${objects.replace(/\.$/, "")}.`);
  return lines.join(" ");
};

const buildConciseSituationAnswer = (input: {
  prompt: string;
  activeContext: HelixActiveSituationContext;
  style: HelixConversationalAnswerStyle;
}): { concise: string; caveat: string | null } => {
  const { scene, activity, objects, uncertainty } = getSituationFields(input.activeContext);
  const observationSummary = getLatestObservationSummary(input.activeContext);
  const prompt = input.prompt;
  const visible = summarizeVisibleWorkspace({
    prompt,
    scene: scene?.value ?? observationSummary,
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
    return {
      concise: composeOperatorBrief({
        visible,
        activity: activity?.value,
        objects: objects?.value,
      }),
      caveat: uncertainty?.value ?? null,
    };
  }
  return {
    concise: composeOperatorBrief({
      visible: summarizeVisibleContext(scene?.value ?? observationSummary ?? objects?.value),
      activity: activity?.value,
      objects: objects?.value,
    }),
    caveat: uncertainty?.value ?? null,
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
  const terminalTextLines = [
    formatDistilledAnswer({
      conciseAnswer: distillation.concise_answer,
      caveat: distillation.caveat,
      style: distillation.style,
      expansionAvailable: distillation.expansion_available,
    }),
  ];
  if (distillation.style === "debug") {
    terminalTextLines.push(`Source refs: ${selectedSourceRefs(input.selection).join(", ") || "none selected"}.`);
  }
  return {
    snapshot,
    distillation,
    terminalText: terminalTextLines.join("\n"),
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

const firstSentence = (value: string | null | undefined, max = 220): string | null => {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!trimmed) return null;
  const sentence = trimmed.split(/(?<=[.!?])\s+/)[0] ?? trimmed;
  return sentence.length > max ? `${sentence.slice(0, max - 3).trim()}...` : sentence;
};

const extractReplayTerms = (value: string | null | undefined): string[] => {
  const text = String(value ?? "").toLowerCase();
  const terms: string[] = [];
  if (/\btask manager\b/.test(text)) terms.push("Windows Task Manager");
  if (/\bperformance\s+tab\b|\bperformance\s+panel\b/.test(text)) terms.push("Performance tab");
  if (/\bcpu\b/.test(text)) terms.push("CPU metrics");
  if (/\bmemory\b/.test(text)) terms.push("memory metrics");
  if (/\bdisk\b|\bssd\b/.test(text)) terms.push("disk metrics");
  if (/\bethernet\b|\bnetwork\b/.test(text)) terms.push("network metrics");
  if (/\bgpu\b|\bnvidia\b|\bintel uhd\b/.test(text)) terms.push("GPU metrics");
  if (/\bfile explorer\b/.test(text)) terms.push("File Explorer");
  const folderMatch = String(value ?? "").match(/\bfolder\s+(?:labeled|named|titled)\s+"([^"]+)"/i);
  if (folderMatch?.[1]) terms.push(`folder "${folderMatch[1]}"`);
  if (/\bbrowser\b|\btab\b|\bweb page\b|\bwebsite\b/.test(text) && !/\btask manager\b/.test(text)) terms.push("browser tab");
  return uniqueStrings(terms);
};

const extractMetricChangeHints = (current: string | null, previous: string | null): string[] => {
  const currentTerms = new Set(extractReplayTerms(current));
  const previousTerms = new Set(extractReplayTerms(previous));
  const sharedMetricTerms = [...currentTerms].filter((term) => previousTerms.has(term) && /\bmetrics?\b/i.test(term));
  if (sharedMetricTerms.length === 0) return [];
  if ((current ?? "").replace(/\s+/g, " ").trim() === (previous ?? "").replace(/\s+/g, " ").trim()) {
    return [];
  }
  return [`Visible ${sharedMetricTerms.join(", ")} refreshed between epochs; values may have shifted while the same performance view stayed open.`];
};

const refsForObservation = (refs: string[], observationRef: string | null): string[] => {
  if (!observationRef) return [];
  const bare = observationRef.replace(/^observation:/, "");
  return refs.filter((ref) => ref === observationRef || ref === bare || ref.endsWith(bare));
};

const buildReplayAnswerBundle = (input: {
  turnId: string;
  threadId: string;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}): {
  fullReasoning: string;
  conciseAnswer: string;
  delta: HelixProcedureEpochReplayDelta;
  replay: HelixProcedureEpochReplay;
  typedFailure: HelixSituationTypedFailure | null;
} => {
  const context = input.activeContext;
  if (!context.situation_run_id || context.latest_epoch === null || context.latest_epoch === undefined) {
    const delta: HelixProcedureEpochReplayDelta = {
      schema: "helix.procedure_epoch_replay_delta.v1",
      current_observation_refs: [],
      previous_observation_refs: [],
      current_field_evaluation_refs: [],
      previous_field_evaluation_refs: [],
      changed_objects: [],
      unchanged_objects: [],
      changed_activity: [],
      changed_app_window: [],
      metric_or_value_changes: [],
      comparison_confidence: 0,
      missing_evidence: ["bound_situation_epoch_missing"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const typedFailure = buildProcedureEpochTypedFailure({
      turnId: input.turnId,
      threadId: input.threadId,
      errorCode: "procedure_epoch_current_unavailable",
      message: "I do not have a current bound situation epoch to replay yet.",
      missingEvidence: ["bound_situation_epoch_missing", "current_observation_missing"],
      selection: input.selection,
    });
    const replay: HelixProcedureEpochReplay = {
      schema: HELIX_PROCEDURE_EPOCH_REPLAY_SCHEMA,
      replay_id: `procedure_epoch_replay:${hashShort([input.turnId, "current_unavailable"])}`,
      turn_id: input.turnId,
      thread_id: input.threadId,
      situation_run_id: null,
      current_epoch: null,
      previous_epoch: null,
      current_observation: null,
      previous_observation: null,
      changed_elements: [],
      unchanged_elements: [],
      uncertainty: typedFailure.missing_evidence,
      current_observation_refs: [],
      previous_observation_refs: [],
      current_field_evaluation_refs: [],
      previous_field_evaluation_refs: [],
      probe_result_refs: [],
      epoch_closure_refs: [],
      evidence_refs: typedFailure.evidence_refs,
      comparison_confidence: 0,
      assistant_answer: false,
      raw_content_included: false,
    };
    const failureText = renderProcedureEpochFailureAnswer(typedFailure);
    return {
      fullReasoning: failureText,
      conciseAnswer: failureText,
      delta,
      replay,
      typedFailure,
    };
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
  const recentObservations = listObservationJournalEntries({
    threadId: context.thread_id,
    limit: 80,
  }).filter((entry) => entry.modality === "visual_frame");
  const selectedObservations = selectedObservationSet.size > 0
    ? recentObservations.filter((entry) => selectedObservationSet.has(entry.observation_id))
    : recentObservations.slice(-2);
  const replayObservations = selectedObservations.length >= 2
    ? selectedObservations
    : recentObservations.slice(-2);
  const selectedObservationSummary = replayObservations
    .map((entry) => entry.text.trim())
    .filter(Boolean)
    .slice(-2)
    .join(" Then ");
  const selectedPreviousObservation = replayObservations.at(-2) ?? null;
  const selectedCurrentObservation = replayObservations.at(-1) ?? null;
  const currentObservationLedger = ledger.filter((entry) => entry.item_kind === "observation").at(-1) ?? null;
  const previousObservationLedger = previousEpochLedger.filter((entry) => entry.item_kind === "observation").at(-1) ?? null;
  const currentObservation = currentObservationLedger?.summary ?? selectedCurrentObservation?.text.trim() ?? selectedObservationSummary;
  const previousObservation = previousObservationLedger?.summary ?? selectedPreviousObservation?.text.trim() ?? null;
  const currentObservationRef = currentObservationLedger?.item_ref ?? selectedCurrentObservation?.observation_id ?? null;
  const previousObservationRef = previousObservationLedger?.item_ref ?? selectedPreviousObservation?.observation_id ?? null;
  const latestProbe = probes.at(-1) ?? null;
  const currentTerms = extractReplayTerms([currentObservation, scene?.value, objects?.value].filter(Boolean).join(" "));
  const previousTerms = extractReplayTerms(previousObservation);
  const unchangedObjects = currentTerms.filter((term) => previousTerms.includes(term));
  const changedObjects = uniqueStrings([
    ...currentTerms.filter((term) => !previousTerms.includes(term)),
    ...previousTerms.filter((term) => !currentTerms.includes(term)).map((term) => `previous ${term}`),
  ]);
  const currentBrief = firstSentence(currentObservation) ?? "No current observation summary was selected.";
  const previousBrief = firstSentence(previousObservation) ?? "No previous observation summary was selected.";
  const metricChanges = extractMetricChangeHints(currentObservation, previousObservation);
  const sameWorkspace = unchangedObjects.length > 0;
  const changedActivity = sameWorkspace
    ? []
    : changedObjects.length > 0
      ? ["Visible activity or focus changed between the selected epochs."]
      : [];
  const changedAppWindow = sameWorkspace
    ? []
    : changedObjects.filter((term) => /\b(?:task manager|file explorer|browser|folder)\b/i.test(term));
  const missingEvidence = [
    previousObservation ? null : "previous_observation_missing",
    currentObservation ? null : "current_observation_missing",
  ].filter((entry): entry is string => Boolean(entry));
  const comparisonConfidence = missingEvidence.length > 0 ? 0.35 : sameWorkspace ? 0.72 : 0.64;
  const currentObservationRefs = refsForObservation(input.selection.selected_observation_refs, currentObservationRef);
  const previousObservationRefs = refsForObservation(input.selection.selected_observation_refs, previousObservationRef);
  const selectedFieldEvaluations = context.situation_run_id
    ? listLiveFieldEvaluations({
        threadId: context.thread_id,
        environmentId: context.environment_id ?? null,
        situationRunId: context.situation_run_id,
        limit: 80,
      }).filter((entry) => input.selection.selected_field_evaluation_refs.includes(entry.evaluation_id))
    : [];
  const currentFieldEvaluationRefs = selectedFieldEvaluations
    .filter((entry) => !currentObservationRef || entry.evidence_refs.some((ref) => refsForObservation([ref], currentObservationRef).length > 0))
    .map((entry) => entry.evaluation_id);
  const previousFieldEvaluationRefs = selectedFieldEvaluations
    .filter((entry) => previousObservationRef && entry.evidence_refs.some((ref) => refsForObservation([ref], previousObservationRef).length > 0))
    .map((entry) => entry.evaluation_id);
  const delta: HelixProcedureEpochReplayDelta = {
    schema: "helix.procedure_epoch_replay_delta.v1",
    current_observation_refs: currentObservationRefs,
    previous_observation_refs: previousObservationRefs,
    current_field_evaluation_refs: uniqueStrings(currentFieldEvaluationRefs),
    previous_field_evaluation_refs: uniqueStrings(previousFieldEvaluationRefs),
    changed_objects: changedObjects,
    unchanged_objects: unchangedObjects,
    changed_activity: changedActivity,
    changed_app_window: changedAppWindow,
    metric_or_value_changes: metricChanges,
    comparison_confidence: comparisonConfidence,
    missing_evidence: missingEvidence,
    assistant_answer: false,
    raw_content_included: false,
  };
  const changedElements = uniqueStrings([
    ...changedAppWindow.map((entry) => `app/window changed: ${entry}`),
    ...changedObjects.map((entry) => `object changed: ${entry}`),
    ...changedActivity,
    ...metricChanges,
  ]);
  const unchangedElements = unchangedObjects.map((entry) => `stable app/window/object: ${entry}`);
  const uncertainty = uniqueStrings([
    ...missingEvidence,
    context.status === "stale" ? "selected situation evidence is stale" : null,
    latestProbe ? null : "probe_result_missing",
    closure ? null : "epoch_closure_missing",
    `comparison confidence ${comparisonConfidence.toFixed(2)}`,
  ]);
  const evidenceRefs = uniqueStrings([
    ...withRefPrefix("observation", [previousObservationRef ?? "", currentObservationRef ?? ""]),
    ...withRefPrefix("field_eval", [
      ...currentFieldEvaluationRefs,
      ...previousFieldEvaluationRefs,
    ]),
    ...withRefPrefix("procedure_epoch", input.selection.selected_epoch_closure_refs),
    ...withRefPrefix("probe_result", input.selection.selected_probe_result_refs),
    ...withRefPrefix("procedure_memory_recall", []),
    `selection:${input.selection.selection_id}`,
  ]);
  const replay: HelixProcedureEpochReplay = {
    schema: HELIX_PROCEDURE_EPOCH_REPLAY_SCHEMA,
    replay_id: `procedure_epoch_replay:${hashShort([
      input.turnId,
      context.situation_run_id,
      epoch,
      previousEpoch,
      currentObservationRef,
      previousObservationRef,
    ])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    situation_run_id: context.situation_run_id,
    current_epoch: epoch,
    previous_epoch: previousEpoch,
    current_observation: currentObservation ?? null,
    previous_observation: previousObservation ?? null,
    changed_elements: changedElements,
    unchanged_elements: unchangedElements,
    uncertainty,
    current_observation_refs: currentObservationRefs,
    previous_observation_refs: previousObservationRefs,
    current_field_evaluation_refs: uniqueStrings(currentFieldEvaluationRefs),
    previous_field_evaluation_refs: uniqueStrings(previousFieldEvaluationRefs),
    probe_result_refs: input.selection.selected_probe_result_refs,
    epoch_closure_refs: input.selection.selected_epoch_closure_refs,
    evidence_refs: evidenceRefs,
    comparison_confidence: comparisonConfidence,
    assistant_answer: false,
    raw_content_included: false,
  };
  const typedFailure = !currentObservation
    ? buildProcedureEpochTypedFailure({
        turnId: input.turnId,
        threadId: input.threadId,
        errorCode: "procedure_epoch_current_unavailable",
        message: "I could not replay the scene epoch because current visual observation evidence is unavailable.",
        evidenceRefs,
        missingEvidence,
        selection: input.selection,
      })
    : !previousObservation
      ? buildProcedureEpochTypedFailure({
          turnId: input.turnId,
          threadId: input.threadId,
          errorCode: "procedure_epoch_previous_unavailable",
          message: "I could not compare scene epochs because previous visual observation evidence is unavailable.",
          evidenceRefs,
          missingEvidence,
          selection: input.selection,
        })
      : null;
  const changeLine = missingEvidence.length > 0
    ? `Change: comparison is incomplete because ${missingEvidence.join(", ")}.`
    : sameWorkspace
      ? `Change: the main view appears stable; ${metricChanges[0] ?? "only minor visual or value-level changes were selected."}`
      : `Change: ${changedObjects.length ? changedObjects.join(", ") : "the visible scene changed between the selected epochs"}.`;
  const unchangedLine = unchangedObjects.length
    ? `Unchanged: ${unchangedObjects.join(", ")}.`
    : "Unchanged: no stable app/window/object terms were confidently selected.";
  const fullReasoning = [
    `Epoch ${epoch} closed as ${closure?.status ?? "unknown"}.`,
    previousEpoch !== null ? `Compared against epoch ${previousEpoch}.` : "Previous epoch: no earlier bound epoch was selected.",
    line("Previous observation", previousObservation),
    line("Current observation", currentObservation),
    changeLine,
    unchangedLine,
    metricChanges.length ? `Metric/value changes: ${metricChanges.join(" ")}` : "",
    line("Scene", scene?.value),
    line("Activity", activity?.value),
    line("Objects", objects?.value),
    latestProbe ? `Probe result: ${latestProbe.status}; signals: ${latestProbe.observed_signals.join(", ") || "none"}.` : "Probe result: no probe result was selected for this epoch.",
    closure?.confidence_changes.length ? `Confidence changes: ${closure.confidence_changes.join(", ")}.` : "",
    closure?.pending_actions.length ? `Pending actions: ${closure.pending_actions.join(", ")}.` : "Arbitration did not require an action from this epoch.",
    `Evidence refs: ${[
      previousObservationRef,
      currentObservationRef,
      ...(input.selection.selected_interpretation_hypothesis_refs ?? []),
      ...(input.selection.selected_interpretation_graph_refs ?? []),
      ...input.selection.selected_probe_result_refs,
      ...input.selection.selected_epoch_closure_refs,
      ...input.selection.selected_field_evaluation_refs,
    ].filter(Boolean).slice(0, 8).join(", ") || "none selected"}.`,
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");
  const conciseAnswer = [
    `Current: ${currentBrief}`,
    `Previous: ${previousBrief}`,
    changeLine,
    unchangedObjects.length ? `Unchanged: ${unchangedObjects.join(", ")}.` : null,
    `Evidence refs: ${[
      previousObservationRef,
      currentObservationRef,
      ...(input.selection.selected_interpretation_hypothesis_refs ?? []),
      ...input.selection.selected_field_evaluation_refs,
      ...input.selection.selected_epoch_closure_refs,
    ].filter(Boolean).slice(0, 6).join(", ") || "none selected"}.`,
  ].filter(Boolean).join("\n");
  return {
    fullReasoning,
    conciseAnswer,
    delta,
    replay,
    typedFailure,
  };
};

const buildSceneComparisonAnswer = (result: HelixVisualSceneComparisonResult): string =>
  [
    result.summary,
    result.changed_app_or_window.length ? `App/window changes: ${result.changed_app_or_window.join("; ")}.` : "",
    result.changed_objects.length ? `Object changes: ${result.changed_objects.join("; ")}.` : "",
    result.changed_activity.length ? `Activity changes: ${result.changed_activity.join("; ")}.` : "",
    result.shared_traits.length ? `Shared traits: ${result.shared_traits.join(", ")}.` : "",
    result.differences.length ? `Differences: ${result.differences.join("; ")}.` : "",
    result.missing_evidence.length ? `Missing evidence: ${result.missing_evidence.join(", ")}.` : "",
    `Next check: ${result.next_check}`,
    `Prior evidence refs: ${result.prior_scene_evidence_refs.slice(0, 8).join(", ") || "none selected"}.`,
    `Current evidence refs: ${result.current_scene_evidence_refs.slice(0, 8).join(", ") || "none selected"}.`,
    `Evidence refs: ${result.evidence_refs.slice(0, 12).join(", ") || "none selected"}.`,
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");

const buildVisualSceneMemoryFailure = (input: {
  turnId: string;
  threadId: string;
  queryIntent: HelixVisualSceneQueryIntent;
  selectedSceneSet: HelixSelectedVisualSceneSet;
}): HelixSituationTypedFailure => {
  const currentMissing = input.selectedSceneSet.missing_evidence.includes("current_visual_scene_memory_missing");
  const code = currentMissing ? "visual_scene_memory_current_missing" : "visual_scene_memory_no_match";
  return {
    schema: "helix.typed_failure.v1",
    failure_id: `typed_failure:${hashShort([input.turnId, code, input.selectedSceneSet.selection_id])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    error_code: code,
    message: currentMissing
      ? "I could not compare scenes because no current visual scene memory entry was selected."
      : "I could not find a prior visual scene matching the requested props or intent.",
    evidence_refs: input.selectedSceneSet.evidence_refs,
    query_intent_id: input.queryIntent.query_intent_id,
    selected_scene_set_id: input.selectedSceneSet.selection_id,
    query_terms: input.queryIntent.query_terms,
    candidate_pool_size: input.selectedSceneSet.candidate_pool_size,
    rejected_candidate_refs: input.selectedSceneSet.rejected_candidates.map((entry) => entry.scene_memory_ref),
    missing_evidence: input.selectedSceneSet.missing_evidence,
    next_required_action: currentMissing
      ? "capture_current_visual_epoch"
      : input.selectedSceneSet.candidate_pool_size === 0
        ? "wait_for_scene_memory_index"
        : "ask_user_for_more_specific_scene_terms",
    assistant_answer: false,
    raw_content_included: false,
  };
};

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
  let activeContext = resolveActiveSituationContext({ threadId: input.threadId });
  const answerStartedAt = input.answerStartedAt ?? new Date().toISOString();
  const initialReference = detectDeicticReference({
    threadId: input.threadId,
    promptText: input.promptText,
    inputModality: input.inputModality ?? "typed",
  });
  const autoBoundVisualCapture = autoBindExplicitVisualCaptureSituationRun({
    activeContext,
    promptText: input.promptText,
    turnId,
    replayWindow: replayWindowForPrompt({
      submittedAt: input.submittedAt,
      answerStartedAt,
      lookbackMs: input.lookbackMs,
    }),
    now: answerStartedAt,
  });
  if (autoBoundVisualCapture) {
    activeContext = resolveActiveSituationContext({
      threadId: activeContext.thread_id || input.threadId,
    });
  }
  const earlyRelativeSessionSemanticIntent = buildRelativeSessionSemanticIntent({
    turnId,
    threadId: input.threadId,
    promptText: input.promptText,
  });
  const earlyVisualSceneQueryIntent = buildVisualSceneQueryIntent({
    turnId,
    threadId: input.threadId,
    promptText: input.promptText,
  });
  const hardRecallRule = matchProcedureRecallPrompt(input.promptText);
  const useEarlyRecallRoute =
    Boolean(hardRecallRule && (hardRecallRule.mode !== "epoch_replay" || input.inputModality === "voice")) ||
    (!initialReference.candidate_signal && isEvidenceExpansionPrompt(input.promptText));
  if (useEarlyRecallRoute) {
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
    const procedureMemoryRecall = buildProcedureMemoryRecall({
      threadId: input.threadId,
      turnId,
      prompt: input.promptText,
      activeContext,
      selection,
      snapshot: latestSnapshot,
      distillation: latestDistillation,
    });
    const missingFailureCode: ProcedureRecallFailureCode =
      !activeContext.situation_run_id
        ? "PROCEDURE_MEMORY_ACTIVE_SITUATION_RUN_MISSING"
        : procedureMemoryRecall.mode === "expanded_trace" && !latestSnapshot
          ? "PROCEDURE_REASONING_SNAPSHOT_MISSING"
          : procedureMemoryRecall.selected_evidence_refs.length === 0
            ? "PROCEDURE_MEMORY_SELECTED_REFS_MISSING"
            : "PROCEDURE_MEMORY_RECALL_EVIDENCE_MISSING";
    const voiceUnauthorized =
      input.inputModality === "voice" &&
      procedureMemoryRecall.voice_read_authorized !== true;
    const typedFailure = (!procedureMemoryRecall.terminal_authorized || voiceUnauthorized)
      ? buildProcedureEpochTypedFailure({
          turnId,
          threadId: input.threadId,
          errorCode: voiceUnauthorized
            ? "PROCEDURE_RECALL_VOICE_NOT_TERMINAL_AUTHORIZED"
            : missingFailureCode,
          failureCode: voiceUnauthorized
            ? "PROCEDURE_RECALL_VOICE_NOT_TERMINAL_AUTHORIZED"
            : missingFailureCode,
          message: voiceUnauthorized
            ? "I can't read that recall aloud because the procedure recall artifact is not terminal-authorized."
            : missingFailureCode === "PROCEDURE_REASONING_SNAPSHOT_MISSING"
              ? "I can't explain the basis for that answer because this turn has no terminal-authorized reasoning snapshot refs."
              : missingFailureCode === "PROCEDURE_MEMORY_SELECTED_REFS_MISSING"
                ? "I can't show evidence for that answer because the terminal answer has no selected evidence refs."
                : missingFailureCode === "PROCEDURE_MEMORY_ACTIVE_SITUATION_RUN_MISSING"
                  ? "I can't show procedure-memory evidence because there is no active SituationRun bound to this thread."
                  : "I can't recall procedure evidence because the required selected refs are missing.",
          evidenceRefs: procedureMemoryRecall.selected_evidence_ref_ids,
          missingEvidence: procedureMemoryRecall.missing_evidence_reasons,
          selection,
        })
      : null;
    const recallDeicticReference = {
      ...initialReference,
      reference_type: "latest_epoch_change" as const,
      candidate_signal: true,
      resolution_status: latestSnapshot || latestDistillation ? "resolved" as const : "missing_context" as const,
      resolved_context_refs: [
        activeContext.context_id,
        latestSnapshot?.snapshot_id ?? "",
        latestDistillation?.distillation_id ?? "",
      ].filter(Boolean),
    };
    const procedureEvidenceRetrievalPlan = buildProcedureEvidenceRetrievalPlan({
      turnId,
      promptText: input.promptText,
      activeContext,
      selection,
      sourceTargets: ["procedure_memory", "situation_epoch"],
      evidenceRequired: true,
    });
    const procedureEvidenceRetrievalResult = retrieveProcedureEvidence({
      plan: procedureEvidenceRetrievalPlan,
      activeContext,
      selection,
    });
    return {
      route: "procedure_epoch_replay_question",
      deictic_reference: recallDeicticReference,
      active_situation_context: activeContext,
      situation_evidence_selection: selection,
      procedure_evidence_retrieval_plan: procedureEvidenceRetrievalPlan,
      procedure_evidence_retrieval_result: procedureEvidenceRetrievalResult,
      answer_text: typedFailure
        ? `${typedFailure.message}\nFailure: ${typedFailure.failure_code ?? typedFailure.error_code}`
        : renderProcedureRecallAnswer(procedureMemoryRecall, {
            snapshot: latestSnapshot,
            distillation: latestDistillation,
          }),
      reasoning_snapshot: latestSnapshot,
      answer_distillation: latestDistillation,
      procedure_memory_recall: procedureMemoryRecall,
      live_context_window_binding: null,
      comparison_session: null,
      typed_failure: typedFailure,
      voice_live_handoff: voiceUnauthorized
        ? {
            schema: "helix.voice_live_handoff.v1",
            handoff_id: `voice_live_handoff:${hashShort([turnId, "procedure_recall_unauthorized"])}`,
            thread_id: input.threadId,
            transcript: input.promptText,
            deictic_reference: recallDeicticReference,
            situation_evidence_selection: selection,
            route: "procedure_epoch_replay_question",
            quick_response_suppressed: true,
            assistant_answer: false,
            raw_content_included: false,
          }
        : null,
      binding_repair: null,
    };
  }
  if (isProcedureMemoryPrompt(input.promptText) && !activeContext.situation_run_id) {
    const selection = selectSituationEvidence({
      threadId: input.threadId,
      activeContext,
      deicticReference: initialReference,
      askingHistory: true,
    });
    const typedFailure = buildProcedureEpochTypedFailure({
      turnId,
      threadId: input.threadId,
      errorCode: "procedure_memory_unavailable",
      message: "Auntie Dot: sensors are separate from mission memory.\nVisual capture status: unavailable or not bound into procedure memory.\nProcedure memory is unavailable because no_active_situation_run.\nRepair hint: create_or_resume_situation_run.",
      evidenceRefs: [],
      missingEvidence: ["active_situation_run", "procedure_memory"],
      selection,
    });
    const procedureEvidenceRetrievalPlan = buildProcedureEvidenceRetrievalPlan({
      turnId,
      promptText: input.promptText,
      activeContext,
      selection,
      sourceTargets: ["procedure_memory"],
      evidenceRequired: true,
    });
    const procedureEvidenceRetrievalResult = retrieveProcedureEvidence({
      plan: procedureEvidenceRetrievalPlan,
      activeContext,
      selection,
    });
    return {
      route: "procedure_epoch_replay_question",
      deictic_reference: {
        ...initialReference,
        reference_type: "latest_epoch_change",
        candidate_signal: true,
        resolution_status: "missing_context",
        resolved_context_refs: [activeContext.context_id],
      },
      active_situation_context: activeContext,
      situation_evidence_selection: selection,
      procedure_evidence_retrieval_plan: procedureEvidenceRetrievalPlan,
      procedure_evidence_retrieval_result: procedureEvidenceRetrievalResult,
      answer_text: typedFailure.message,
      reasoning_snapshot: null,
      answer_distillation: null,
      procedure_memory_recall: null,
      live_context_window_binding: null,
      comparison_session: null,
      relative_session_semantic_intent: earlyRelativeSessionSemanticIntent,
      visual_scene_query_intent: earlyVisualSceneQueryIntent,
      selected_visual_scene_set: null,
      visual_scene_comparison_result: null,
      typed_failure: typedFailure,
      voice_live_handoff: null,
      binding_repair: null,
    };
  }
  if (!initialReference.candidate_signal && !earlyVisualSceneQueryIntent) {
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
  const resolvedActiveContext = activeContext;
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
    candidate_signal: initialReference.candidate_signal || Boolean(earlyVisualSceneQueryIntent),
    reference_type: earlyVisualSceneQueryIntent || isSceneEpochReplayPrompt(input.promptText)
      ? "latest_epoch_change" as const
      : initialReference.reference_type,
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
    askingHistory: isSceneEpochReplayPrompt(input.promptText) || isProcedureReplayPrompt(input.promptText),
  });
  const voiceLiveHandoff = input.inputModality === "voice"
    ? createVoiceLiveHandoff({
        threadId: input.threadId,
        transcript: input.promptText,
        deicticReference,
        situationEvidenceSelection: selection,
      })
    : null;
  const wantsSceneEpochReplay =
    isSceneEpochReplayPrompt(input.promptText) ||
    deicticReference.reference_type === "latest_epoch_change";
  const procedureEvidenceRetrievalPlan = buildProcedureEvidenceRetrievalPlan({
    turnId,
    promptText: input.promptText,
    activeContext: temporalActiveContext,
    selection,
    visualSceneQueryIntent: earlyVisualSceneQueryIntent,
    sourceTargets: wantsSceneEpochReplay ? ["procedure_memory", "situation_epoch"] : ["visual_capture"],
    evidenceRequired: true,
  });
  const procedureEvidenceRetrievalResult = retrieveProcedureEvidence({
    plan: procedureEvidenceRetrievalPlan,
    activeContext: temporalActiveContext,
    selection,
  });
  if (wantsSceneEpochReplay && !selection.answerable) {
    const errorCode = temporalActiveContext.situation_run_id
      ? "procedure_epoch_replay_evidence_unavailable"
      : "procedure_epoch_current_unavailable";
    const typedFailure = buildProcedureEpochTypedFailure({
      turnId,
      threadId: input.threadId,
      errorCode,
      message: errorCode === "procedure_epoch_current_unavailable"
        ? "I could not replay scene epochs because current visual SituationRun evidence is unavailable."
        : "I could not replay scene epochs because selected procedure epoch evidence is unavailable.",
      missingEvidence: uniqueStrings([
        selection.answerability_reason,
        temporalActiveContext.situation_run_id ? null : "active_situation_run_missing",
        ...selection.exclusion_reasons,
      ]),
      selection,
    });
    return {
      route: "procedure_epoch_replay_question",
      deictic_reference: deicticReference,
      active_situation_context: temporalActiveContext,
      situation_evidence_selection: selection,
      procedure_evidence_retrieval_plan: procedureEvidenceRetrievalPlan,
      procedure_evidence_retrieval_result: procedureEvidenceRetrievalResult,
      answer_text: renderProcedureEpochFailureAnswer(typedFailure),
      reasoning_snapshot: null,
      answer_distillation: null,
      procedure_memory_recall: null,
      live_context_window_binding: liveContextWindowBinding,
      comparison_session: null,
      visual_scene_comparison_result: null,
      selected_visual_scene_set: null,
      typed_failure: typedFailure,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  if (!selection.answerable) {
    return {
      route: "situation_context_question",
      deictic_reference: deicticReference,
      active_situation_context: temporalActiveContext,
      situation_evidence_selection: selection,
      procedure_evidence_retrieval_plan: procedureEvidenceRetrievalPlan,
      procedure_evidence_retrieval_result: procedureEvidenceRetrievalResult,
      answer_text: [
        "I resolved this as a live situation-context question, but there is no server-bound active SituationRun evidence to answer from yet.",
        bindingRepair
          ? `Repair candidate created: ${bindingRepair.repair_candidate_id}. Explicit acceptance is required before this source can power an answer.`
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
  }) ?? earlyVisualSceneQueryIntent;
  if (visualSceneQueryIntent && temporalActiveContext.situation_run_id) {
    const relativeSessionSemanticIntent = earlyRelativeSessionSemanticIntent ?? buildRelativeSessionSemanticIntent({
      turnId,
      threadId: input.threadId,
      promptText: input.promptText,
    });
    const selectedSessionSemanticBinding = relativeSessionSemanticIntent
      ? selectSessionSemanticBinding({
          turnId,
          threadId: input.threadId,
          semanticIntent: relativeSessionSemanticIntent,
          situationRunId: temporalActiveContext.situation_run_id,
          environmentId: temporalActiveContext.environment_id ?? null,
          currentEpoch: temporalActiveContext.latest_epoch ?? null,
        })
      : null;
    const boundVisualSceneQueryIntent = buildVisualSceneQueryIntent({
      turnId,
      threadId: input.threadId,
      promptText: input.promptText,
      semanticBinding: selectedSessionSemanticBinding,
    }) ?? visualSceneQueryIntent;
    const selectedVisualSceneSet = selectVisualScenesForQuery({
      turnId,
      threadId: input.threadId,
      queryIntent: boundVisualSceneQueryIntent,
      situationRunId: temporalActiveContext.situation_run_id,
      environmentId: temporalActiveContext.environment_id ?? null,
      currentEpoch: temporalActiveContext.latest_epoch ?? null,
    });
    const visualProcedureEvidenceRetrievalPlan = buildProcedureEvidenceRetrievalPlan({
      turnId,
      promptText: input.promptText,
      activeContext: temporalActiveContext,
      selection,
      visualSceneQueryIntent: boundVisualSceneQueryIntent,
      sourceTargets: ["procedure_memory", "visual_scene_memory"],
      evidenceRequired: true,
    });
    const visualProcedureEvidenceRetrievalResult = retrieveProcedureEvidence({
      plan: visualProcedureEvidenceRetrievalPlan,
      activeContext: temporalActiveContext,
      selection,
    });
    if (!boundVisualSceneQueryIntent.compare_to_current) {
      const selected = selectedVisualSceneSet.selected_scenes[0]?.scene_memory ?? null;
      const fullReasoning = selected
        ? [
            `I found a prior visual scene matching the requested props or intent: ${selected.visible_title ?? selected.scene_memory_id}.`,
            `Selected scene: ${selected.scene_memory_id} at epoch ${selected.epoch}.`,
            selectedVisualSceneSet.rejected_candidates.length
              ? `Rejected candidates: ${selectedVisualSceneSet.rejected_candidates.map((entry) => `${entry.scene_memory_ref} (${entry.reason}, score ${entry.score})`).join("; ")}.`
              : "",
            `Evidence refs: ${selectedVisualSceneSet.evidence_refs.slice(0, 12).join(", ") || "none selected"}.`,
            "Raw images, audio, and logs were not injected into Ask context.",
          ].filter(Boolean).join("\n")
        : [
            "I could not find a prior visual scene matching the requested props or intent.",
            `Query terms: ${boundVisualSceneQueryIntent.query_terms.join(", ") || "none selected"}.`,
            `Missing evidence: ${selectedVisualSceneSet.missing_evidence.join(", ") || "prior_scene_match_missing"}.`,
            "Raw images, audio, and logs were not injected into Ask context.",
          ].join("\n");
      const typedFailure = selected ? null : buildVisualSceneMemoryFailure({
        turnId,
        threadId: input.threadId,
        queryIntent: boundVisualSceneQueryIntent,
        selectedSceneSet: selectedVisualSceneSet,
      });
      const distillationBundle = recordReasoningAndDistillation({
        turnId,
        threadId: input.threadId,
        prompt: input.promptText,
        activeContext: temporalActiveContext,
        selection,
        sourceAnswerKind: "procedure_epoch_replay",
        fullReasoningSummary: fullReasoning,
        conciseAnswer: selected
          ? `Found prior scene ${selected.visible_title ?? selected.scene_memory_id}.`
          : typedFailure?.message ?? "I could not find a prior visual scene matching the requested props or intent.",
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
        procedure_evidence_retrieval_plan: visualProcedureEvidenceRetrievalPlan,
        procedure_evidence_retrieval_result: visualProcedureEvidenceRetrievalResult,
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
        relative_session_semantic_intent: relativeSessionSemanticIntent,
        selected_session_semantic_binding: selectedSessionSemanticBinding,
        visual_scene_query_intent: boundVisualSceneQueryIntent,
        selected_visual_scene_set: selectedVisualSceneSet,
        visual_scene_comparison_result: null,
        typed_failure: typedFailure,
        voice_live_handoff: voiceLiveHandoff,
        binding_repair: bindingRepair,
      };
    }
    const visualSceneComparisonResult = buildVisualSceneComparisonResult({
      turnId,
      threadId: input.threadId,
      queryIntent: boundVisualSceneQueryIntent,
      selectedSceneSet: selectedVisualSceneSet,
    });
    if (visualSceneComparisonResult) {
      if (wantsSceneEpochReplay) {
        const replayBundle = buildReplayAnswerBundle({
          turnId,
          threadId: input.threadId,
          activeContext: temporalActiveContext,
          selection,
        });
        const replayText = replayBundle.typedFailure
          ? renderProcedureEpochFailureAnswer(replayBundle.typedFailure)
          : renderProcedureEpochReplayAnswer(replayBundle.replay);
        const distillationBundle = recordReasoningAndDistillation({
          turnId,
          threadId: input.threadId,
          prompt: input.promptText,
          activeContext: temporalActiveContext,
          selection,
          sourceAnswerKind: "procedure_epoch_replay",
          fullReasoningSummary: replayText,
          conciseAnswer: replayText,
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
          procedure_evidence_retrieval_plan: visualProcedureEvidenceRetrievalPlan,
          procedure_evidence_retrieval_result: visualProcedureEvidenceRetrievalResult,
          answer_text: replayText,
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
          relative_session_semantic_intent: relativeSessionSemanticIntent,
          selected_session_semantic_binding: selectedSessionSemanticBinding,
          visual_scene_query_intent: boundVisualSceneQueryIntent,
          selected_visual_scene_set: selectedVisualSceneSet,
          visual_scene_comparison_result: visualSceneComparisonResult,
          procedure_epoch_replay_delta: replayBundle.delta,
          procedure_epoch_replay: replayBundle.replay,
          typed_failure: replayBundle.typedFailure,
          voice_live_handoff: voiceLiveHandoff,
          binding_repair: bindingRepair,
        };
      }
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
        procedure_evidence_retrieval_plan: visualProcedureEvidenceRetrievalPlan,
        procedure_evidence_retrieval_result: visualProcedureEvidenceRetrievalResult,
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
        relative_session_semantic_intent: relativeSessionSemanticIntent,
        selected_session_semantic_binding: selectedSessionSemanticBinding,
        visual_scene_query_intent: boundVisualSceneQueryIntent,
        selected_visual_scene_set: selectedVisualSceneSet,
        visual_scene_comparison_result: visualSceneComparisonResult,
        voice_live_handoff: voiceLiveHandoff,
        binding_repair: bindingRepair,
      };
    }
    const typedFailure = buildVisualSceneMemoryFailure({
      turnId,
      threadId: input.threadId,
      queryIntent: boundVisualSceneQueryIntent,
      selectedSceneSet: selectedVisualSceneSet,
    });
    const fullReasoning = [
      typedFailure.message,
      `Query terms: ${boundVisualSceneQueryIntent.query_terms.join(", ") || "none selected"}.`,
      `Selection reason: ${selectedVisualSceneSet.selection_reason}.`,
      selectedVisualSceneSet.missing_evidence.length
        ? `Missing evidence: ${selectedVisualSceneSet.missing_evidence.join(", ")}.`
        : "",
      `Evidence refs: ${selectedVisualSceneSet.evidence_refs.slice(0, 8).join(", ") || "none selected"}.`,
      "Raw images, audio, and logs were not injected into Ask context.",
    ].filter(Boolean).join("\n");
    const distillationBundle = recordReasoningAndDistillation({
      turnId,
      threadId: input.threadId,
      prompt: input.promptText,
      activeContext: temporalActiveContext,
      selection,
      sourceAnswerKind: "procedure_epoch_replay",
      fullReasoningSummary: fullReasoning,
      conciseAnswer: typedFailure.message,
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
      procedure_evidence_retrieval_plan: visualProcedureEvidenceRetrievalPlan,
      procedure_evidence_retrieval_result: visualProcedureEvidenceRetrievalResult,
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
      relative_session_semantic_intent: relativeSessionSemanticIntent,
      selected_session_semantic_binding: selectedSessionSemanticBinding,
      visual_scene_query_intent: boundVisualSceneQueryIntent,
      selected_visual_scene_set: selectedVisualSceneSet,
      visual_scene_comparison_result: null,
      typed_failure: typedFailure,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
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
      procedure_evidence_retrieval_plan: procedureEvidenceRetrievalPlan,
      procedure_evidence_retrieval_result: procedureEvidenceRetrievalResult,
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
    const replayBundle = buildReplayAnswerBundle({
      turnId,
      threadId: input.threadId,
      activeContext: temporalActiveContext,
      selection,
    });
    const replayText = wantsSceneEpochReplay && replayBundle.typedFailure
      ? renderProcedureEpochFailureAnswer(replayBundle.typedFailure)
      : wantsSceneEpochReplay
        ? renderProcedureEpochReplayAnswer(replayBundle.replay)
        : replayBundle.fullReasoning;
    const distillationBundle = recordReasoningAndDistillation({
      turnId,
      threadId: input.threadId,
      prompt: input.promptText,
      activeContext: temporalActiveContext,
      selection,
      sourceAnswerKind: "procedure_epoch_replay",
      fullReasoningSummary: replayText,
      conciseAnswer: replayText,
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
      procedure_evidence_retrieval_plan: procedureEvidenceRetrievalPlan,
      procedure_evidence_retrieval_result: procedureEvidenceRetrievalResult,
      answer_text: replayText,
      reasoning_snapshot: distillationBundle.snapshot,
      answer_distillation: distillationBundle.distillation,
      procedure_epoch_replay_delta: replayBundle.delta,
      procedure_epoch_replay: replayBundle.replay,
      typed_failure: wantsSceneEpochReplay ? replayBundle.typedFailure : null,
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
    procedure_evidence_retrieval_plan: procedureEvidenceRetrievalPlan,
    procedure_evidence_retrieval_result: procedureEvidenceRetrievalResult,
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
