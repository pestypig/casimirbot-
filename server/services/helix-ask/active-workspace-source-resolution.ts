import {
  HELIX_ACTIVE_WORKSPACE_SOURCE_RESOLUTION_SCHEMA,
  type HelixActiveWorkspaceSourceResolution,
} from "@shared/helix-active-workspace-source-resolution";

type RecordLike = Record<string, unknown>;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const hashPrompt = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const explicitVisualRe =
  /\b(?:screen|visual|capture|frame|screenshot|camera|live\s+source|visual\s+source|screen\s+capture)\b/i;

const genericDeicticRe =
  /\b(?:what|that|this|which)?\s*(?:are|is|am)?\s*(?:we|i|you)?\s*(?:looking\s+at|viewing|reading|on|open)(?:\s+(?:now|right\s+now|currently))?\b/i;

const activeDocLocationRe =
  /(?:^\s*Locate\s+query\s*:|\b(?:find|locate|where|search|show)\b[\s\S]{0,160}\b(?:current\s+(?:doc|dock)|current\s+docs?\s+viewer\s+context|docs?\s+viewer|current\s+document|current\s+paper|this\s+(?:doc|document|paper)|active\s+(?:doc|document|paper))\b)/im;

const unquotePrompt = (prompt: string): string =>
  prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ").replace(/\s+/g, " ").trim();

const naturalActiveDocContinuationRe =
  /(?:\bwhat(?:'s|\s+is)\s+(?:the\s+)?(?:main|central|core)\s+(?:idea|claim|argument|point|thesis)\b|\bwhat(?:'s|\s+is)\s+(?:it|this|that|the\s+(?:doc(?:ument)?|paper|whitepaper|source))\s+(?:mainly\s+)?about\b|\b(?:explain|summarize|describe|outline)\s+(?:it|this|that|the\s+(?:doc(?:ument)?|paper|whitepaper|source))\b|\bhow\s+(?:does|do|is|are)\s+(?:it|this|that|the\s+(?:doc(?:ument)?|paper|whitepaper|source|idea|claim|argument))\s+(?:connect(?:ed)?|relate(?:d)?|compare(?:d)?|apply|fit|matter)\b|\b(?:does|do|can|could|would)\s+(?:it|this|that|the\s+(?:doc(?:ument)?|paper|whitepaper|source|author))\s+(?:actually\s+)?(?:prove|show|support|establish|demonstrate|imply|claim|argue|mean)\b)/i;

const isActiveDocEvidenceFollowup = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  if (!unquoted) return false;
  if (
    /\b(?:do\s+not|don'?t|without|avoid|ignore|disregard|no\s+need\s+to)\b[\s\S]{0,120}\b(?:quote|cite|extract|explain|summarize|describe|interpret|check|verify|read|use|connect|relate|compare|prove|show|support)\b/i.test(unquoted) ||
    /^(?:if|when|once|after)\b[\s\S]{0,180}\b(?:later|eventually|next\s+time|in\s+the\s+future|tomorrow)\b/i.test(unquoted) ||
    /\b(?:later|eventually|next\s+time|in\s+the\s+future|tomorrow|previously|earlier|historically)\b[\s\S]{0,140}\b(?:quot(?:e|ed|ing)|cit(?:e|ed|ing)|extract(?:ed|ing)?|explain(?:ed|ing)?|summar(?:y|ize|ized|izing)|describ(?:e|ed|ing)|interpret(?:ed|ing)?|check(?:ed|ing)?|verif(?:y|ied|ying)|read|connect(?:ed|ing)?|relat(?:e|ed|ing)|compar(?:e|ed|ing)|prov(?:e|ed|ing)|show(?:n|ed|ing)?|support(?:ed|ing)?)\b/i.test(unquoted) ||
    /\b(?:screen|page|button|label|ui|text|sentence|phrase)\b[\s\S]{0,120}\b(?:says|shows|reads|contains|mentions)\b/i.test(unquoted)
  ) {
    return false;
  }
  return (
    naturalActiveDocContinuationRe.test(unquoted) ||
    /\b(?:quote|cite|extract|show|give)\b[\s\S]{0,100}\b(?:exact|relevant|surrounding)?\s*(?:passage|paragraph|section|excerpt|sentence|lines?|wording)\b/i.test(unquoted) ||
    /\bwhat\s+does\s+(?:it|this|that)\s+mean\s+by\s+(?:saying|claiming|stating|arguing|calling)\b/i.test(unquoted) ||
    /\bwhere\s+(?:it|this|that|the\s+(?:doc(?:ument)?|paper|passage|section))\s+(?:says?|states?|claims?|argues?)\b/i.test(unquoted) ||
    /\b(?:here|in\s+(?:this|that|the|the\s+current)\s+(?:doc(?:ument)?|paper|passage|section|source))\b[\s\S]{0,140}\b(?:mean(?:s|t|ing)?|claim(?:s|ed|ing)?|say(?:s|ing)?|said|stat(?:e|es|ed|ing)|argu(?:e|es|ed|ing)|refer(?:s|red|ring)?|explain(?:s|ed|ing)?|support(?:s|ed|ing)?|establish(?:es|ed|ing)?|impl(?:y|ies|ied|ying))\b/i.test(unquoted) ||
    /\b(?:mean(?:s|t|ing)?|claim(?:s|ed|ing)?|say(?:s|ing)?|said|stat(?:e|es|ed|ing)|argu(?:e|es|ed|ing)|refer(?:s|red|ring)?|explain(?:s|ed|ing)?|support(?:s|ed|ing)?|establish(?:es|ed|ing)?|impl(?:y|ies|ied|ying))\b[\s\S]{0,140}\b(?:here|in\s+(?:this|that|the|the\s+current)\s+(?:doc(?:ument)?|paper|passage|section|source))\b/i.test(unquoted)
  );
};

export function buildActiveWorkspaceSourceResolution(input: {
  turnId: string;
  promptText: string;
  workspaceSnapshot?: unknown;
}): HelixActiveWorkspaceSourceResolution {
  const prompt = input.promptText.trim();
  const snapshot = readRecord(input.workspaceSnapshot);
  const activePanel = readString(snapshot?.activePanel);
  const activeDocPath =
    readString(snapshot?.activeDocPath) ||
    readString(snapshot?.docContextPath);
  const docContextValid =
    Boolean(activeDocPath) &&
    (
      snapshot?.docContextValid === true ||
      snapshot?.hasDocContext === true ||
      activePanel === "docs-viewer"
    );
  const explicitVisual = explicitVisualRe.test(prompt);
  const genericDeictic = genericDeicticRe.test(prompt);
  const activeDocLocation = activeDocLocationRe.test(prompt);
  const activeDocEvidenceFollowup = isActiveDocEvidenceFollowup(prompt);
  const docsViewerActive = activePanel === "docs-viewer" && docContextValid;

  let resolvedSourceTarget: HelixActiveWorkspaceSourceResolution["resolved_source_target"] = "unknown";
  let resolvedTargetKind: HelixActiveWorkspaceSourceResolution["resolved_target_kind"] = "unknown";
  let requestedTerminalKind: string | null = null;
  let reason: HelixActiveWorkspaceSourceResolution["reason"] = "no_active_workspace_resolution";
  let confidence = 0.2;

  if (explicitVisual) {
    reason = "explicit_visual_prompt_bypasses_workspace";
    confidence = 0.72;
  } else if (docsViewerActive && activeDocLocation) {
    resolvedSourceTarget = "docs_viewer";
    resolvedTargetKind = "docs_viewer";
    requestedTerminalKind = "doc_location_result";
    reason = "active_doc_location_prompt";
    confidence = 0.96;
  } else if (docsViewerActive && activeDocEvidenceFollowup) {
    resolvedSourceTarget = "active_doc";
    resolvedTargetKind = "active_doc";
    requestedTerminalKind = "doc_evidence_synthesis_answer";
    reason = "active_doc_evidence_followup";
    confidence = 0.97;
  } else if (docsViewerActive && genericDeictic) {
    resolvedSourceTarget = "active_doc";
    resolvedTargetKind = "active_doc";
    requestedTerminalKind = "active_doc_identity";
    reason = "generic_deictic_bound_to_active_docs";
    confidence = 0.94;
  } else if (genericDeictic) {
    reason = "ambiguous_without_active_workspace_source";
    confidence = 0.62;
  }

  return {
    schema: HELIX_ACTIVE_WORKSPACE_SOURCE_RESOLUTION_SCHEMA,
    turn_id: input.turnId,
    prompt_hash: hashPrompt(prompt),
    active_panel: activePanel,
    active_doc_path: activeDocPath,
    doc_context_valid: docContextValid,
    generic_deictic: genericDeictic,
    explicit_visual: explicitVisual,
    resolved_source_target: resolvedSourceTarget,
    resolved_target_kind: resolvedTargetKind,
    requested_terminal_kind: requestedTerminalKind,
    reason,
    confidence,
    assistant_answer: false,
    raw_content_included: false,
  };
}
