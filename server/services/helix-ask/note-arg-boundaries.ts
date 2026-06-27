const HELIX_ASK_TURN_CLAUSE_BOUNDARY_RE = /\s*(?:,|\band then\b|\bthen\b|\bafter that\b|\bwhile\b|\balso\b)\s+/i;
const HELIX_ASK_TURN_NOTE_ARG_TAIL_INTENT_RE =
  /\b(?:copy|compare|contrast|difference|different|versus|vs\.?|explain|summari[sz]e|open|read|list|delete|rename|clear|switch|go\s+to|view|show)\b/i;

export type HelixAskNoteArgBoundaryTrimmerDependencies = {
  isBoundedNoteArgsEnabled: () => boolean;
};

export const createAskTurnActionArgBoundaryTrimmer = (
  deps: HelixAskNoteArgBoundaryTrimmerDependencies,
) => (value: string): string => {
  let normalized = value.trim().replace(/^["']|["']$/g, "").replace(/[.?!]+$/, "");
  if (!normalized) return "";
  if (!deps.isBoundedNoteArgsEnabled()) return normalized;
  const clauseBoundary = normalized.search(HELIX_ASK_TURN_CLAUSE_BOUNDARY_RE);
  if (clauseBoundary > 0) {
    normalized = normalized.slice(0, clauseBoundary).trim();
  }
  const intentTail = normalized.match(HELIX_ASK_TURN_NOTE_ARG_TAIL_INTENT_RE);
  if (intentTail && typeof intentTail.index === "number" && intentTail.index > 0) {
    normalized = normalized.slice(0, intentTail.index).trim();
  }
  return normalized.replace(/[.?!]+$/, "").trim();
};

export const trimAskTurnProtectedTitleArgBoundaries = (value: string): string => {
  let normalized = value.trim().replace(/^["']|["']$/g, "").replace(/[.?!]+$/, "");
  if (!normalized) return "";
  const clauseBoundary = normalized.search(HELIX_ASK_TURN_CLAUSE_BOUNDARY_RE);
  if (clauseBoundary > 0) {
    normalized = normalized.slice(0, clauseBoundary).trim();
  }
  return normalized.replace(/[.?!]+$/, "").trim();
};

export const resolveAskTurnTextArg = (transcript: string): string | null => {
  const colonMatch = transcript.match(/:\s*([\s\S]+)$/);
  if (colonMatch?.[1]?.trim()) return colonMatch[1].trim();
  const quotedMatch = transcript.match(/"([^"]+)"/);
  if (quotedMatch?.[1]?.trim()) return quotedMatch[1].trim();
  return null;
};

export const resolveAskTurnTitleArg = (transcript: string): string | null => {
  const quoted = transcript.match(/"(.*?)"/);
  if (quoted?.[1]?.trim()) return trimAskTurnProtectedTitleArgBoundaries(quoted[1]);
  const called = transcript.match(/\b(?:called|named|title)\s+(.+?)(?:\s*(?:,|\band then\b|\bthen\b|\bafter that\b|\bwhile\b|\balso\b)\s+|$)/i);
  if (called?.[1]?.trim()) return trimAskTurnProtectedTitleArgBoundaries(called[1]);
  const noteTitle = transcript.match(/\bnote\s+(.+?)(?:\s*(?:,|\band then\b|\bthen\b|\bafter that\b|\bwhile\b|\balso\b)\s+|$)/i);
  if (noteTitle?.[1]?.trim()) return trimAskTurnProtectedTitleArgBoundaries(noteTitle[1]);
  return null;
};

export const isAskTurnDeicticNoteLabel = (value: string | null | undefined): boolean => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[?!.;,:"'`]+$/g, "")
    .replace(/\s+/g, " ");
  return /^(?:that|this|it|the|my|active|current)(?:\s+note|\s+notepad)?$/.test(normalized) ||
    /^(?:the\s+)?(?:note\s+)?i\s+just\s+created(?:\s+note|\s+notepad)?$/.test(normalized) ||
    /^(?:the\s+)?(?:last|latest|recent|newly)\s+(?:created\s+)?(?:note|notepad)$/.test(normalized) ||
    /^(?:just\s+created|newly\s+created)(?:\s+note|\s+notepad)?$/.test(normalized);
};

export const isAskTurnDeicticNoteTarget = (value: string | null | undefined): boolean => {
  return isAskTurnDeicticNoteLabel(value);
};

export const isAskTurnInvalidResolvedNoteTitle = (value: string | null | undefined): boolean => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return true;
  return (
    /^(?:and|then|also|after|afterwards|list|tell|show|explain|summari[sz]e|compare|difference|differences|deltas?)$/.test(
      normalized,
    ) ||
    /^(?:and|then|also|afterwards?)\b/i.test(normalized) ||
    /^(?:tell|show|list|explain|summari[sz]e)\s+(?:me|the|main|key|differences|deltas)\b/i.test(normalized) ||
    /^(?:against|with|versus|vs\.?|to)\s+(?:the\s+)?(?:doc|docs|document|paper)\b/i.test(normalized) ||
    /\b(?:doc|docs|document|paper)\b[\s\S]*\b(?:tell|show|list|captured|main\s+point|takeaway|summary)\b/i.test(normalized)
  );
};
