import {
  HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA,
  type HelixAskSourceTarget,
  type HelixAskSourceTargetIntent,
} from "@shared/helix-ask-source-target-intent";

type CueRule = {
  target: HelixAskSourceTarget;
  reason: string;
  confidence: number;
  cues: Array<{ label: string; pattern: RegExp }>;
  suppressedRoutes: string[];
};

const matches = (prompt: string, cues: CueRule["cues"]): string[] =>
  cues
    .filter((cue) => cue.pattern.test(prompt))
    .map((cue) => cue.label);

const rules: CueRule[] = [
  {
    target: "docs_viewer",
    reason: "explicit_docs_viewer_source_target",
    confidence: 0.96,
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
    target: "visual_capture",
    reason: "explicit_visual_source_target",
    confidence: 0.94,
    suppressedRoutes: ["active_doc_identity", "active_doc_summary", "active_note", "doc_open_best"],
    cues: [
      { label: "visual_capture", pattern: /\bvisual\s+(?:screen\s+)?capture\b/i },
      { label: "screen_capture", pattern: /\bscreen\s+capture\b/i },
      { label: "visual_source", pattern: /\bvisual\s+(?:source|frame|screen)\b/i },
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
    suppressedRoutes: ["active_doc_identity", "active_doc_summary"],
    cues: [
      { label: "show_evidence", pattern: /\bshow\s+(?:the\s+)?evidence\b/i },
      { label: "why_answer", pattern: /\bwhy\s+did\s+you\s+say\b/i },
      { label: "replay", pattern: /\breplay\s+(?:that|the\s+last)\b/i },
      { label: "last_epoch", pattern: /\blast\s+(?:situation\s+)?epoch\b/i },
      { label: "what_changed", pattern: /\bwhat\s+changed\b/i },
      { label: "confidence_change", pattern: /\bconfidence\s+change\b/i },
    ],
  },
  {
    target: "active_doc",
    reason: "explicit_active_document_target",
    confidence: 0.88,
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
    suppressedRoutes: ["active_doc_identity", "situation_context_question"],
    cues: [
      { label: "active_note", pattern: /\b(?:active|current|open)\s+note\b/i },
      { label: "note_target", pattern: /\b(?:this|that|my)\s+note\b/i },
    ],
  },
  {
    target: "workspace_panel",
    reason: "explicit_workspace_panel_target",
    confidence: 0.78,
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
    suppressedRoutes: ["active_doc_identity", "active_doc_summary", "situation_context_question"],
    cues: [
      { label: "no_workspace", pattern: /\b(?:don't|do\s+not)\s+(?:use|look\s+at|check)\s+(?:workspace|docs|screen|visual|sources?)\b/i },
      { label: "general_question", pattern: /\bgeneral\s+(?:knowledge|reasoning)\b/i },
    ],
  },
];

export function arbitrateAskSourceTarget(input: {
  turnId: string;
  threadId: string;
  promptText: string;
}): HelixAskSourceTargetIntent {
  const prompt = input.promptText.trim();
  for (const rule of rules) {
    const explicitCues = matches(prompt, rule.cues);
    if (explicitCues.length === 0) continue;
    return {
      schema: HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA,
      turn_id: input.turnId,
      thread_id: input.threadId,
      target_source: rule.target,
      explicit_cues: explicitCues,
      suppressed_routes: rule.suppressedRoutes,
      precedence_reason: rule.reason,
      confidence: rule.confidence,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  return {
    schema: HELIX_ASK_SOURCE_TARGET_INTENT_SCHEMA,
    turn_id: input.turnId,
    thread_id: input.threadId,
    target_source: "unknown",
    explicit_cues: [],
    suppressed_routes: [],
    precedence_reason: "no_explicit_source_target",
    confidence: 0.2,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export const sourceTargetSuppressesRoute = (
  sourceTargetIntent: HelixAskSourceTargetIntent | null | undefined,
  route: string,
): boolean => Boolean(sourceTargetIntent?.suppressed_routes.includes(route));
