export type HelixAskReasoningContextMode = "attached" | "isolated";

export type HelixAskDocContextActionLike = {
  panel_id?: unknown;
  action_id?: unknown;
} | null | undefined;

export type HelixAskDeicticWorkspaceContextDependencies = {
  isDeicticDocFixEnabled: () => boolean;
};

const HELIX_ASK_TURN_DEICTIC_CONTEXT_WITH_DOC_FIX_RE =
  /\b(?:what\s+is\s+this(?:\s+(?:doc|document|paper))?|what\s+is\s+that(?:\s+(?:doc|document|paper))?|where\s+in\s+this\s+(?:doc|document|paper)|where\s+in\s+that\s+(?:doc|document|paper)|where\s+does\s+this\s+(?:doc|document|paper)|where\s+does\s+that\s+(?:doc|document|paper)|find\s+.*\s+in\s+this\s+(?:doc|document|paper)|find\s+.*\s+in\s+that\s+(?:doc|document|paper)|locate\s+.*\s+in\s+this\s+(?:doc|document|paper)|locate\s+.*\s+in\s+that\s+(?:doc|document|paper)|read\s+this|read\s+that|explain\s+this|explain\s+that|summari[sz]e\s+this|summari[sz]e\s+that)\b/i;
const HELIX_ASK_TURN_DEICTIC_CONTEXT_LEGACY_RE =
  /\b(?:what\s+is\s+this|what\s+is\s+that|read\s+this|read\s+that|explain\s+this|explain\s+that|summari[sz]e\s+this|summari[sz]e\s+that)\b/i;

export const resolveAskTurnReasoningContextMode = (
  mode: unknown,
): HelixAskReasoningContextMode => (mode === "isolated" ? "isolated" : "attached");

export const createShouldUseAskTurnDeicticWorkspaceContext = (
  deps: HelixAskDeicticWorkspaceContextDependencies,
) => (transcript: string): boolean => {
  const pattern = deps.isDeicticDocFixEnabled()
    ? HELIX_ASK_TURN_DEICTIC_CONTEXT_WITH_DOC_FIX_RE
    : HELIX_ASK_TURN_DEICTIC_CONTEXT_LEGACY_RE;
  return pattern.test(transcript.trim().toLowerCase());
};

export const isAskTurnDocContextMutatingAction = (action?: HelixAskDocContextActionLike): boolean =>
  action?.panel_id === "docs-viewer" &&
  ["open_doc", "open_doc_by_path", "open_latest_doc_by_topic", "open_doc_and_read"].includes(String(action.action_id));

export const isAskTurnDocContextPreservingAction = (action?: HelixAskDocContextActionLike): boolean =>
  action?.panel_id === "docs-viewer" &&
  [
    "search_docs",
    "identify_current_doc",
    "summarize_doc",
    "summarize_section",
    "explain_paper",
    "locate_in_doc",
    "verify_active_doc",
  ].includes(String(action.action_id));

export const isAskTurnCompositeWorkspaceContextStatusIntent = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return false;
  const wantsDoc =
    /\b(?:what|which)\s+(?:doc|document|paper)\b[\s\S]*\b(?:open|viewing|on|looking\s+at)\b/i.test(normalized) ||
    /\b(?:doc|document|paper)\s+(?:is\s+)?(?:open|active|current)\b/i.test(normalized);
  const wantsNote =
    /\b(?:what|which)\s+note\b[\s\S]*\b(?:editing|open|active|current|on)\b/i.test(normalized) ||
    /\bnote\s+(?:is\s+)?(?:editing|open|active|current)\b/i.test(normalized);
  return wantsDoc && wantsNote;
};

export const isAskTurnWorkspaceChangeSummaryIntent = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase().replace(/\s+/g, " ");
  return (
    /\b(?:summari[sz]e|recap|tell\s+me)\b[\s\S]*\b(?:what\s+changed|changes?|changed)\b[\s\S]*\bworkspace\b/i.test(normalized) ||
    /\bwhat\s+changed\s+in\s+(?:my|the)\s+workspace\b/i.test(normalized)
  );
};
