import {
  HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA,
  type HelixAskSourceTarget,
  type HelixAskSourceTargetIntent,
  type HelixAskSourceTargetRequestedOutput,
  type HelixAskSourceTargetStrength,
} from "@shared/helix-ask-source-target-intent";
import { detectRepoCodeEvidenceIntent } from "./repo-code-intent-detector";
import {
  isSceneEpochReplayPrompt,
  SCENE_EPOCH_REPLAY_FORBIDDEN_ROUTES,
} from "./scene-epoch-replay-intent";
import {
  matchProcedureRecallPrompt,
  PROCEDURE_RECALL_SUPPRESSED_ROUTES,
  procedureRecallTargetSource,
} from "./procedure-memory-recall-router";
import {
  isContextualLiveSourceCadenceMention,
  isLiveSourceCadenceControlPrompt,
} from "./live-source-continuation-intent";

type CueRule = {
  target: HelixAskSourceTarget;
  reason: string;
  confidence: number;
  strength: HelixAskSourceTargetStrength;
  requestedOutputs: HelixAskSourceTargetRequestedOutput[];
  targetKind?: HelixAskSourceTarget;
  allowClientShortcut?: boolean;
  allowNoToolDirect?: boolean;
  cues: Array<{ label: string; pattern: RegExp }>;
  suppressedRoutes: string[];
};

const matches = (prompt: string, cues: CueRule["cues"]): string[] =>
  cues
    .filter((cue: CueRule["cues"][number]) => cue.pattern.test(prompt))
    .map((cue: CueRule["cues"][number]) => cue.label);

const isStructuredDocsViewerPrompt = (prompt: string): boolean => {
  const docsViewerCue =
    /\bcurrent\s+docs?\s+viewer\s+context\b/i.test(prompt) ||
    /\bdocs?\s+viewer\b/i.test(prompt);
  const structuredPathCue = /^\s*Document\s+path\s*:/im.test(prompt);
  const locateQueryCue = /^\s*Locate\s+query\s*:/im.test(prompt);
  const locationsListCue =
    /\bReturn\s+a\s+short\s+"?Locations:"?\s+list\b/i.test(prompt) ||
    /\banchors?\/sections?\b/i.test(prompt) ||
    /\bevidence\s+snippets?\b/i.test(prompt);
  return (docsViewerCue && (structuredPathCue || locateQueryCue || locationsListCue)) ||
    (structuredPathCue && locateQueryCue && locationsListCue);
};

const isExplicitProcessGraphPrompt = (prompt: string): boolean =>
  /\b(?:process\s+graph|workstation\s+(?:process\s+)?graph|workstation\s+state|what\s+panels\s+are\s+open|which\s+panels\s+are\s+open|panels\s+open)\b/i.test(prompt);

const isGenericSceneEpochPhrase = (prompt: string): boolean =>
  /\b(?:scene\s+epoch|visual\s+epoch|screen\s+epoch|live\s+epoch|last\s+(?:seen\s+|situation\s+|scene\s+|visual\s+|screen\s+|live\s+)?epoch|previous\s+(?:scene|frame|visual|screen|capture)|last\s+(?:scene|frame|visual|screen|capture))\b/i.test(prompt);

const rules: CueRule[] = [
  {
    target: "docs_viewer",
    reason: "explicit_docs_viewer_source_target",
    confidence: 0.96,
    strength: "hard",
    requestedOutputs: ["file_path"],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: [
      "situation_context_question",
      "visual_deictic",
      "visual_frame_evidence",
      "active_doc_identity",
      "active_doc_summary",
    ],
    cues: [
      { label: "current_docs_viewer_context", pattern: /\bcurrent\s+docs?\s+viewer\s+context\b/i },
      { label: "docs_viewer", pattern: /\bdocs?\s+viewer\b/i },
      { label: "document_path_field", pattern: /^\s*Document\s+path\s*:/im },
      { label: "locate_query_field", pattern: /^\s*Locate\s+query\s*:/im },
      { label: "locations_list", pattern: /\bReturn\s+a\s+short\s+"?Locations:"?\s+list\b/i },
      { label: "anchors_sections", pattern: /\banchors?\/sections?\b/i },
      { label: "evidence_snippets", pattern: /\bevidence\s+snippets?\b/i },
    ],
  },
  {
    target: "live_pipeline",
    reason: "explicit_live_pipeline_control_source_target",
    confidence: 0.94,
    strength: "hard",
    requestedOutputs: ["live_pipeline_receipt"],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["situation_context_question", "active_doc_identity", "active_doc_summary", "model_only_concept"],
    cues: [
      { label: "set_interval", pattern: /\bset\s+(?:the\s+)?(?:interval|cadence|rate)\b/i },
      { label: "capture_cadence", pattern: /\b(?:capture|visual|screen|frame)\b[\s\S]{0,80}\b(?:cadence|interval|every\s+\d{1,3}\s*(?:seconds?|sec|s))\b/i },
      { label: "keep_live_answer", pattern: /\b(?:keep|continue)\b[\s\S]{0,80}\b(?:checking|watching|monitoring|using|looking\s+at)\b[\s\S]{0,80}\b(?:screen|visual|capture|frame|live\s+answer|live\s+source)\b/i },
      { label: "watch_live_source", pattern: /\b(?:watch|monitor|track|observe|check)\b[\s\S]{0,80}\b(?:screen|visual|capture|frame|live\s+answer|live\s+source)\b[\s\S]{0,80}\b(?:as\s+a\s+)?live\s+answer\b/i },
      { label: "start_live_source", pattern: /\bstart\b[\s\S]{0,80}\b(?:live\s+source|visual\s+capture|screen\s+capture)\b/i },
      { label: "repair_live_source", pattern: /\b(?:fix|repair|recover)\b[\s\S]{0,80}\b(?:live\s+)?(?:screen|visual|capture|frame|source|producer)\b/i },
      { label: "attach_source", pattern: /\battach\b[\s\S]{0,80}\b(?:source|visual|capture|producer)\b/i },
      { label: "adopt_producer", pattern: /\badopt\b[\s\S]{0,80}\b(?:producer|visual\s+producer|capture)\b/i },
    ],
  },
  {
    target: "procedure_memory",
    targetKind: "visual_scene_memory",
    reason: "explicit_visual_scene_memory_source_target",
    confidence: 0.93,
    strength: "hard",
    requestedOutputs: [
      "procedure_epoch_replay",
      "field_evaluation_refs",
      "interpretation_refs",
      "current_visual_state",
      "visual_scene_query_intent",
      "selected_visual_scene_set",
      "visual_scene_comparison_result",
      "typed_failure",
    ],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["process_graph_overview", "active_doc_identity", "active_doc_summary", "model_only_concept"],
    cues: [
      { label: "compare_to_named_prior_scene", pattern: /\bcompare\b[\s\S]{0,120}\b(?:to\s+)?(?:the\s+)?(?:last|previous)?\s*[A-Za-z0-9 _.-]{2,80}\s+(?:folder\s+)?scene\b/i },
      { label: "find_named_prior_scene", pattern: /\bfind\b[\s\S]{0,80}\b(?:camera\s+roll|soho|sun|audio\s+export|task\s+manager|[A-Za-z0-9 _.-]{2,60})\s+scene\b/i },
      { label: "changed_since_named_prior_scene", pattern: /\bwhat\s+changed\s+since\s+(?:the\s+)?[A-Za-z0-9 _.-]{2,80}\s+(?:folder|scene)\b/i },
      { label: "last_folder_scene", pattern: /\blast\s+folder\s+scene\b/i },
      { label: "current_task_manager_to_prior_scene", pattern: /\bcompare\b[\s\S]{0,120}\bcurrent\s+task\s*manager\s+scene\b[\s\S]{0,120}\blast\s+folder\s+scene\b/i },
      { label: "media_roll_scene_memory", pattern: /\bcamera\s*roll\b[\s\S]{0,80}\bscene\b|\bscene\b[\s\S]{0,80}\bcamera\s*roll\b/i },
      { label: "audio_export_folder_scene", pattern: /\baudio\s*exports?\s+folder\b/i },
      { label: "sun_folder_scene", pattern: /\bsun\s+folder\s+scene\b/i },
      { label: "semantic_scene_memory", pattern: /\b(?:camera\s+roll|soho|sun\s+folder|audio\s+exports?|task\s+manager)\b[\s\S]{0,120}\b(?:scene|compare|changed|previous|last)\b/i },
    ],
  },
  {
    target: "procedure_memory",
    targetKind: "situation_epoch",
    reason: "explicit_visual_epoch_delta_source_target",
    confidence: 0.94,
    strength: "hard",
    requestedOutputs: ["procedure_epoch_replay", "field_evaluation_refs", "interpretation_refs", "current_visual_state"],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["process_graph_overview", "active_doc_identity", "active_doc_summary", "model_only_concept"],
    cues: [
      { label: "what_changed", pattern: /\bwhat\s+changed\b/i },
      { label: "changed_since", pattern: /\bchanged\s+since\b/i },
      { label: "last_epoch", pattern: /\blast\s+(?:seen\s+|situation\s+|scene\s+|visual\s+|screen\s+|live\s+)?epoch\b/i },
      { label: "scene_epoch", pattern: /\bscene\s+epoch\b/i },
      { label: "visual_epoch", pattern: /\bvisual\s+epoch\b/i },
      { label: "screen_epoch", pattern: /\bscreen\s+epoch\b/i },
      { label: "live_epoch", pattern: /\blive\s+epoch\b/i },
      { label: "since_last_seen", pattern: /\bsince\s+(?:the\s+)?last\s+seen\b/i },
      { label: "since_last_visual", pattern: /\bsince\s+(?:the\s+)?last\s+visual\b/i },
      { label: "since_last_capture", pattern: /\bsince\s+(?:the\s+)?last\s+capture\b/i },
      { label: "previous_frame", pattern: /\bprevious\s+frame\b/i },
      { label: "previous_visual", pattern: /\bprevious\s+visual\b/i },
      { label: "previous_scene_or_screen", pattern: /\bprevious\s+(?:scene|screen|capture)\b/i },
      { label: "compare_to_last", pattern: /\bcompare\b[\s\S]{0,80}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epoch)\b/i },
      { label: "compare_current_scene", pattern: /\bcompare\s+current\s+scene\b/i },
      { label: "difference_from_last_scene", pattern: /\b(?:different|difference)\b[\s\S]{0,100}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epoch)\b/i },
      { label: "last_scene_current_scene", pattern: /\blast\s+(?:scene|frame|visual|screen|capture)\b[\s\S]{0,100}\b(?:current|now|looking\s+at|this\s+(?:scene|frame|visual|screen))\b/i },
    ],
  },
  {
    target: "visual_capture",
    reason: "explicit_visual_source_target",
    confidence: 0.94,
    strength: "hard",
    requestedOutputs: ["current_visual_state", "field_evaluation_refs", "interpretation_refs"],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["active_doc_identity", "active_doc_summary", "active_note", "doc_open_best"],
    cues: [
      { label: "visual_capture", pattern: /\bvisual\s+(?:screen\s+)?capture\b/i },
      { label: "screen_capture", pattern: /\bscreen\s+capture\b/i },
      { label: "visual_source", pattern: /\bvisual\s+(?:source|frame|screen)\b/i },
      { label: "visuals_plural", pattern: /\b(?:the\s+)?visuals\b/i },
      { label: "describe_visuals", pattern: /\b(?:describe|explain|summari[sz]e)\s+(?:what\s+)?(?:the\s+)?visuals\s+(?:are|show|contain|depict)\b/i },
      { label: "screen_share", pattern: /\bscreen\s+share\b/i },
      { label: "current_screen", pattern: /\b(?:current|latest)\s+(?:screen|visual|frame)\b/i },
      { label: "on_screen", pattern: /\bon\s+(?:my|the)\s+screen\b/i },
      { label: "in_screen_or_visual", pattern: /\bin\s+(?:my|the)\s+(?:screen|visual|visual\s+screen|screen\s+capture)\b/i },
      { label: "visible_workspace", pattern: /\bvisible\s+(?:screen|window|folder|file)\b/i },
      { label: "looking_at_file", pattern: /\b(?:what|which|describe)?\s*(?:file|window|folder)\s+(?:am\s+i|i(?:'m| am)|are\s+we)\s+(?:looking\s+at|viewing|seeing|clicking|selecting)\b/i },
      { label: "looking_at_now", pattern: /\bwhat\s+(?:am\s+i|are\s+we)\s+looking\s+at(?:\s+(?:now|right\s+now))?\b/i },
      { label: "explain_looking_at_now", pattern: /\b(?:explain|describe|summari[sz]e)\s+what\s+(?:i(?:'m| am)|we(?:'re| are))\s+looking\s+at(?:\s+(?:now|right\s+now))?\b/i },
    ],
  },
  {
    target: "world_event",
    reason: "explicit_world_event_source_target",
    confidence: 0.94,
    strength: "hard",
    requestedOutputs: ["procedure_epoch_replay"],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["active_doc_identity", "active_doc_summary", "situation_context_question"],
    cues: [
      { label: "minecraft", pattern: /\b(?:minecraft|minehut)\b/i },
      { label: "world_event", pattern: /\bworld[-\s]?events?\b/i },
      { label: "game_event_log", pattern: /\bgame\s+event\s+log\b/i },
      { label: "world_source", pattern: /\bworld\s+source\b/i },
    ],
  },
  {
    target: "procedure_memory",
    reason: "explicit_procedure_memory_recall",
    confidence: 0.9,
    strength: "hard",
    requestedOutputs: ["procedure_epoch_replay"],
    targetKind: "procedure_memory",
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["active_doc_identity", "active_doc_summary"],
    cues: [
      { label: "show_evidence", pattern: /\bshow\s+(?:the\s+)?evidence\b/i },
      { label: "why_answer", pattern: /\bwhy\s+did\s+you\s+say\b/i },
      { label: "replay", pattern: /\breplay\s+(?:that|the\s+last|the\s+procedure|procedure\s+memory)\b/i },
      { label: "procedure_memory", pattern: /\bprocedure\s+memory\b/i },
      { label: "last_epoch", pattern: /\blast\s+(?:seen\s+|situation\s+|scene\s+|visual\s+|screen\s+|live\s+)?epoch\b/i },
      { label: "scene_epoch", pattern: /\bscene\s+epoch\b/i },
      { label: "visual_epoch", pattern: /\bvisual\s+epoch\b/i },
      { label: "screen_epoch", pattern: /\bscreen\s+epoch\b/i },
      { label: "live_epoch", pattern: /\blive\s+epoch\b/i },
      { label: "what_changed", pattern: /\bwhat\s+changed\b/i },
      { label: "changed_since", pattern: /\bchanged\s+since\b/i },
      { label: "since_last_seen", pattern: /\bsince\s+(?:the\s+)?last\s+seen\b/i },
      { label: "since_last_visual", pattern: /\bsince\s+(?:the\s+)?last\s+visual\b/i },
      { label: "since_last_capture", pattern: /\bsince\s+(?:the\s+)?last\s+capture\b/i },
      { label: "previous_frame", pattern: /\bprevious\s+frame\b/i },
      { label: "previous_visual", pattern: /\bprevious\s+visual\b/i },
      { label: "compare_to_last", pattern: /\bcompare\b[\s\S]{0,80}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epoch)\b/i },
      { label: "compare_current_scene", pattern: /\bcompare\s+current\s+scene\b/i },
      { label: "difference_from_last_scene", pattern: /\b(?:different|difference)\b[\s\S]{0,100}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epoch)\b/i },
      { label: "last_scene_current_scene", pattern: /\blast\s+(?:scene|frame|visual|screen|capture)\b[\s\S]{0,100}\b(?:current|now|looking\s+at|this\s+(?:scene|frame|visual|screen))\b/i },
      { label: "confidence_change", pattern: /\bconfidence\s+change\b/i },
    ],
  },
  {
    target: "active_doc",
    reason: "explicit_active_document_target",
    confidence: 0.88,
    strength: "hard",
    requestedOutputs: ["file_path"],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["situation_context_question"],
    cues: [
      { label: "active_doc", pattern: /\b(?:active|current|open)\s+(?:doc|document|paper)\b/i },
      { label: "what_paper_viewing", pattern: /\bwhat\s+(?:paper|doc|document)\s+(?:am\s+i|are\s+we)\s+(?:viewing|reading|looking\s+at)\b/i },
      { label: "open_document", pattern: /\b(?:what|which)\s+(?:doc|document|paper)\s+is\s+(?:open|currently\s+open)\b/i },
      { label: "this_doc", pattern: /\b(?:this|that)\s+(?:doc|document|paper)\b/i },
    ],
  },
  {
    target: "active_note",
    reason: "explicit_active_note_target",
    confidence: 0.86,
    strength: "hard",
    requestedOutputs: [],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["active_doc_identity", "situation_context_question"],
    cues: [
      { label: "active_note", pattern: /\b(?:active|current|open)\s+note\b/i },
      { label: "note_target", pattern: /\b(?:this|that|my)\s+note\b/i },
    ],
  },
  {
    target: "process_graph",
    reason: "explicit_process_graph_source_target",
    confidence: 0.92,
    strength: "hard",
    requestedOutputs: ["process_overview"],
    allowClientShortcut: false,
    allowNoToolDirect: false,
    suppressedRoutes: ["situation_context_question", "visual_deictic", "active_doc_identity", "active_doc_summary", "model_only_concept"],
    cues: [
      { label: "process_graph", pattern: /\bprocess\s+graph\b/i },
      { label: "workstation_process_graph", pattern: /\bworkstation\s+(?:process\s+)?graph\b/i },
      { label: "workstation_state", pattern: /\bworkstation\s+state\b/i },
      { label: "panels_open", pattern: /\b(?:what|which)\s+panels\s+are\s+open\b/i },
      { label: "show_workstation_process_graph", pattern: /\bshow\b[\s\S]{0,80}\bworkstation\s+(?:process\s+)?graph\b/i },
    ],
  },
  {
    target: "workspace_panel",
    reason: "explicit_workspace_panel_target",
    confidence: 0.78,
    strength: "soft",
    requestedOutputs: ["process_overview"],
    targetKind: "workstation_state",
    allowClientShortcut: true,
    allowNoToolDirect: false,
    suppressedRoutes: [],
    cues: [
      { label: "workspace_panel", pattern: /\b(?:panel|workspace|workstation|tab|dock)\b/i },
      { label: "open_panel", pattern: /\b(?:open|show|switch\s+to)\b[\s\S]{0,80}\b(?:panel|workspace|workstation|tab|dock)\b/i },
    ],
  },
  {
    target: "model_only",
    reason: "explicit_model_only_target",
    confidence: 0.76,
    strength: "hard",
    requestedOutputs: [],
    targetKind: "general_background",
    allowClientShortcut: false,
    allowNoToolDirect: true,
    suppressedRoutes: ["active_doc_identity", "active_doc_summary", "situation_context_question"],
    cues: [
      { label: "no_workspace", pattern: /\b(?:don't|do\s+not)\s+(?:use|look\s+at|check)\s+(?:workspace|docs|screen|visual|sources?)\b/i },
      { label: "general_question", pattern: /\bgeneral\s+(?:knowledge|reasoning)\b/i },
    ],
  },
];

const toSourceTargetIntent = (input: {
  turnId: string;
  threadId: string;
  target: HelixAskSourceTarget;
  targetKind?: HelixAskSourceTarget;
  strength: HelixAskSourceTargetStrength;
  explicitCues: string[];
  reasons: string[];
  requestedOutputs: HelixAskSourceTargetRequestedOutput[];
  suppressedRoutes: string[];
  precedenceReason: string;
  confidence: number;
  allowClientShortcut?: boolean;
  allowNoToolDirect?: boolean;
}): HelixAskSourceTargetIntent => {
  const hardSourceTarget =
    input.target !== "unknown" &&
    input.target !== "model_only" &&
    input.target !== "general_background";
  const mustEnterBackendAsk =
    hardSourceTarget &&
    input.allowNoToolDirect !== true;
  const allowClientShortcut = hardSourceTarget ? false : input.allowClientShortcut ?? !mustEnterBackendAsk;
  const allowNoToolDirect = hardSourceTarget ? false : input.allowNoToolDirect ?? !mustEnterBackendAsk;
  return {
    schema: HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA,
    turn_id: input.turnId,
    thread_id: input.threadId,
    target_source: input.target,
    target_kind: input.targetKind ?? input.target,
    strength: input.strength,
    explicit_cues: input.explicitCues,
    reasons: input.reasons,
    requested_outputs: Array.from(new Set(input.requestedOutputs)),
    suppressed_routes: input.suppressedRoutes,
    precedence_reason: input.precedenceReason,
    must_enter_backend_ask: mustEnterBackendAsk,
    allow_client_shortcut: allowClientShortcut,
    allow_no_tool_direct: allowNoToolDirect,
    confidence: input.confidence,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const mapRepoRequestedOutputs = (
  outputs: ReturnType<typeof detectRepoCodeEvidenceIntent>["requestedOutputs"],
): HelixAskSourceTargetRequestedOutput[] =>
  outputs.flatMap((output: ReturnType<typeof detectRepoCodeEvidenceIntent>["requestedOutputs"][number]) => {
    if (output === "repo_code") return ["repo_code" as const];
    if (output === "file_path") return ["file_path" as const];
    if (output === "line_backed_source") return ["line_backed_source" as const];
    if (output === "implementation_location") return ["implementation_location" as const];
    if (output === "route_trace") return ["route_trace" as const];
    if (output === "tool_call_eligibility") return ["tool_call_eligibility" as const];
    if (output === "terminal_contract") return ["terminal_contract" as const];
    if (output === "codex_comparison") return ["codex_comparison" as const];
    return ["repo_code" as const];
  });

const isSituationEpochCue = (cue: string): boolean =>
  /epoch|changed|since|previous|compare|different|difference|visual|scene|frame|capture/i.test(cue);

const filterLivePipelineCues = (prompt: string, cues: string[]): string[] =>
  cues.filter((cue: string) => {
    if (cue !== "set_interval" && cue !== "capture_cadence") return true;
    return isLiveSourceCadenceControlPrompt(prompt);
  }).filter((cue: string) => {
    if (cue !== "start_live_source") return true;
    return !isContextualLiveSourceCadenceMention(prompt);
  });

const PROCEDURE_EPOCH_REQUESTED_OUTPUTS: HelixAskSourceTargetRequestedOutput[] = [
  "procedure_epoch_replay",
  "field_evaluation_refs",
  "interpretation_refs",
  "current_visual_state",
  "visual_scene_query_intent",
  "selected_visual_scene_set",
  "visual_scene_comparison_result",
  "typed_failure",
];

export function arbitrateAskSourceTarget(input: {
  turnId: string;
  threadId: string;
  promptText: string;
}): HelixAskSourceTargetIntent {
  const prompt = input.promptText.trim();
  const procedureRecallRule = matchProcedureRecallPrompt(prompt);
  if (procedureRecallRule) {
    return toSourceTargetIntent({
      turnId: input.turnId,
      threadId: input.threadId,
      target: procedureRecallTargetSource(procedureRecallRule),
      targetKind: procedureRecallRule.target_kind,
      strength: "hard",
      explicitCues: [procedureRecallRule.cue],
      reasons: ["hard_procedure_memory_recall_prompt", procedureRecallRule.cue],
      requestedOutputs: procedureRecallRule.requested_outputs,
      suppressedRoutes: [...PROCEDURE_RECALL_SUPPRESSED_ROUTES],
      precedenceReason: "hard_procedure_memory_recall_prompt",
      confidence: 0.98,
      allowClientShortcut: false,
      allowNoToolDirect: false,
    });
  }
  if (isStructuredDocsViewerPrompt(prompt)) {
    const docsRule = rules.find((rule: CueRule) => rule.target === "docs_viewer");
    if (docsRule) {
      const explicitCues = matches(prompt, docsRule.cues);
      return toSourceTargetIntent({
        turnId: input.turnId,
        threadId: input.threadId,
        target: docsRule.target,
        targetKind: docsRule.targetKind,
        strength: docsRule.strength,
        explicitCues,
        reasons: [docsRule.reason, ...explicitCues],
        requestedOutputs: docsRule.requestedOutputs,
        suppressedRoutes: docsRule.suppressedRoutes,
        precedenceReason: docsRule.reason,
        confidence: docsRule.confidence,
        allowClientShortcut: docsRule.allowClientShortcut,
        allowNoToolDirect: docsRule.allowNoToolDirect,
      });
    }
  }
  const repoIntent = detectRepoCodeEvidenceIntent(prompt);
  if (repoIntent.repoEvidenceRequested) {
    return toSourceTargetIntent({
      turnId: input.turnId,
      threadId: input.threadId,
      target: "repo_code",
      targetKind: "repo_code",
      strength: repoIntent.strength,
      explicitCues: repoIntent.reasons,
      reasons: repoIntent.reasons,
      requestedOutputs: mapRepoRequestedOutputs(repoIntent.requestedOutputs),
      suppressedRoutes: [
        "situation_context_question",
        "visual_deictic",
        "visual_frame_evidence",
        "active_doc_identity",
        "active_doc_summary",
        "active_note",
        "doc_open_best",
      ],
      precedenceReason:
        repoIntent.strength === "hard"
          ? "explicit_repo_code_source_target"
          : "project_local_entity_source_target",
      confidence: repoIntent.strength === "hard" ? 0.97 : 0.82,
      allowClientShortcut: false,
      allowNoToolDirect: false,
    });
  }
  if (isExplicitProcessGraphPrompt(prompt)) {
    const processGraphRule = rules.find((rule: CueRule) => rule.target === "process_graph");
    if (processGraphRule) {
      const explicitCues = matches(prompt, processGraphRule.cues);
      return toSourceTargetIntent({
        turnId: input.turnId,
        threadId: input.threadId,
        target: processGraphRule.target,
        targetKind: processGraphRule.targetKind,
        strength: processGraphRule.strength,
        explicitCues: explicitCues.length > 0 ? explicitCues : ["process_graph"],
        reasons: [processGraphRule.reason, ...(explicitCues.length > 0 ? explicitCues : ["process_graph"])],
        requestedOutputs: processGraphRule.requestedOutputs,
        suppressedRoutes: processGraphRule.suppressedRoutes,
        precedenceReason: processGraphRule.reason,
        confidence: processGraphRule.confidence,
        allowClientShortcut: processGraphRule.allowClientShortcut,
        allowNoToolDirect: processGraphRule.allowNoToolDirect,
      });
    }
  }
  const visualSceneMemoryRule = rules.find((rule: CueRule) => rule.reason === "explicit_visual_scene_memory_source_target");
  if (visualSceneMemoryRule && !isGenericSceneEpochPhrase(prompt)) {
    const explicitCues = matches(prompt, visualSceneMemoryRule.cues);
    if (explicitCues.length > 0) {
      return toSourceTargetIntent({
        turnId: input.turnId,
        threadId: input.threadId,
        target: visualSceneMemoryRule.target,
        targetKind: "visual_scene_memory",
        strength: visualSceneMemoryRule.strength,
        explicitCues,
        reasons: [visualSceneMemoryRule.reason, ...explicitCues],
        requestedOutputs: PROCEDURE_EPOCH_REQUESTED_OUTPUTS,
        suppressedRoutes: visualSceneMemoryRule.suppressedRoutes,
        precedenceReason: visualSceneMemoryRule.reason,
        confidence: visualSceneMemoryRule.confidence,
        allowClientShortcut: visualSceneMemoryRule.allowClientShortcut,
        allowNoToolDirect: visualSceneMemoryRule.allowNoToolDirect,
      });
    }
  }
  if (isSceneEpochReplayPrompt(prompt)) {
    return toSourceTargetIntent({
      turnId: input.turnId,
      threadId: input.threadId,
      target: "procedure_memory",
      targetKind: "situation_epoch",
      strength: "hard",
      explicitCues: ["scene_epoch_replay"],
      reasons: ["explicit_visual_epoch_delta_source_target", "scene_epoch_replay"],
      requestedOutputs: PROCEDURE_EPOCH_REQUESTED_OUTPUTS,
      suppressedRoutes: [...SCENE_EPOCH_REPLAY_FORBIDDEN_ROUTES],
      precedenceReason: "explicit_visual_epoch_delta_source_target",
      confidence: 0.96,
      allowClientShortcut: false,
      allowNoToolDirect: false,
    });
  }
  const procedureMemoryRule = rules.find((rule: CueRule) => rule.target === "procedure_memory");
  if (procedureMemoryRule) {
    const explicitCues = matches(prompt, procedureMemoryRule.cues);
    if (procedureMemoryRule.reason === "explicit_visual_scene_memory_source_target" && explicitCues.length > 0) {
      return toSourceTargetIntent({
        turnId: input.turnId,
        threadId: input.threadId,
        target: procedureMemoryRule.target,
        targetKind: "visual_scene_memory",
        strength: procedureMemoryRule.strength,
        explicitCues,
        reasons: [procedureMemoryRule.reason, ...explicitCues],
        requestedOutputs: PROCEDURE_EPOCH_REQUESTED_OUTPUTS,
        suppressedRoutes: procedureMemoryRule.suppressedRoutes,
        precedenceReason: procedureMemoryRule.reason,
        confidence: procedureMemoryRule.confidence,
        allowClientShortcut: procedureMemoryRule.allowClientShortcut,
        allowNoToolDirect: procedureMemoryRule.allowNoToolDirect,
      });
    }
    if (explicitCues.some(isSituationEpochCue)) {
      return toSourceTargetIntent({
        turnId: input.turnId,
        threadId: input.threadId,
        target: procedureMemoryRule.target,
        targetKind: "situation_epoch",
        strength: procedureMemoryRule.strength,
        explicitCues,
        reasons: [procedureMemoryRule.reason, ...explicitCues],
        requestedOutputs: PROCEDURE_EPOCH_REQUESTED_OUTPUTS,
        suppressedRoutes: procedureMemoryRule.suppressedRoutes,
        precedenceReason: procedureMemoryRule.reason,
        confidence: procedureMemoryRule.confidence,
        allowClientShortcut: procedureMemoryRule.allowClientShortcut,
        allowNoToolDirect: procedureMemoryRule.allowNoToolDirect,
      });
    }
  }
  for (const rule of rules) {
    const explicitCues =
      rule.target === "live_pipeline"
        ? filterLivePipelineCues(prompt, matches(prompt, rule.cues))
        : matches(prompt, rule.cues);
    if (explicitCues.length === 0) continue;
    const targetKind =
      rule.target === "procedure_memory" && explicitCues.some(isSituationEpochCue)
        ? "situation_epoch"
        : rule.targetKind;
    const requestedOutputs =
      rule.target === "procedure_memory" && targetKind === "situation_epoch"
        ? PROCEDURE_EPOCH_REQUESTED_OUTPUTS
        : rule.requestedOutputs;
    return toSourceTargetIntent({
      turnId: input.turnId,
      threadId: input.threadId,
      target: rule.target,
      targetKind,
      strength: rule.strength,
      explicitCues,
      reasons: [rule.reason, ...explicitCues],
      requestedOutputs,
      suppressedRoutes: rule.suppressedRoutes,
      precedenceReason: rule.reason,
      confidence: rule.confidence,
      allowClientShortcut: rule.allowClientShortcut,
      allowNoToolDirect: rule.allowNoToolDirect,
    });
  }
  return toSourceTargetIntent({
    turnId: input.turnId,
    threadId: input.threadId,
    target: "unknown",
    strength: "none",
    explicitCues: [],
    reasons: ["no_explicit_source_target"],
    requestedOutputs: [],
    suppressedRoutes: [],
    precedenceReason: "no_explicit_source_target",
    confidence: 0.2,
    allowClientShortcut: true,
    allowNoToolDirect: true,
  });
}

export const sourceTargetSuppressesRoute = (
  sourceTargetIntent: HelixAskSourceTargetIntent | null | undefined,
  route: string,
): boolean => Boolean(sourceTargetIntent?.suppressed_routes.includes(route));
