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
