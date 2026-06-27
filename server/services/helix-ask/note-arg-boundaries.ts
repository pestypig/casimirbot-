import { clipConversationText } from "./conversation-text";

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

export const resolveAskTurnCreateNoteTitleArg = (transcript: string): string | null => {
  const createMatch = transcript.match(
    /\b(?:create|make|new|start)\s+(?:a\s+)?(?:[\w-]+\s+){0,3}note(?:\s+(?:called|named|titled?)\s+)?(.+?)(?:\s*,|\s+\bwith\b|\s+\bfrom\b|\s+\busing\b|\s+\band\s+(?:then|put|add|save|write|copy|store|append)\b|\s+\bthen\b|\s+\bafter that\b|\s+\bwhile\b|\s+\balso\b|$)/i,
  );
  const value = trimAskTurnProtectedTitleArgBoundaries(createMatch?.[1] ?? "");
  if (value) return value;
  return resolveAskTurnTitleArg(transcript);
};

export const isAskTurnCreateNoteIntent = (transcript: string): boolean =>
  /\b(?:create|make|new|start)\s+(?:a\s+)?(?:[\w-]+\s+){0,3}note\b/i.test(transcript.trim());

export const maskAskTurnProtectedArgumentSpansForIntent = (transcript: string): string => {
  if (!isAskTurnCreateNoteIntent(transcript)) return transcript;
  return transcript.replace(
    /\b((?:called|named|titled?|title))\s+(.+?)(?=\s*(?:,|\band\s+then\b|\bthen\b|\bafter\s+that\b|\bwhile\b|\balso\b)\s+|$)/gi,
    (_match, introducer: string) => `${introducer} <NOTE_TITLE>`,
  );
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

export type HelixAskNoteSinkArgReadersDependencies = {
  trimActionArgBoundaries: (value: string) => string;
};

export const createAskTurnNoteSinkArgReaders = (
  deps: HelixAskNoteSinkArgReadersDependencies,
) => {
  const normalizeAskTurnRequestedNoteTitle = (value: string | null | undefined): string | null => {
    const cleaned = deps.trimActionArgBoundaries(value ?? "")
    .replace(/^(?:a\s+|the\s+|my\s+)?(?:note|notepad)\s+(?:called|named|titled)\s+/i, "")
    .replace(/^(?:called|named|titled)\s+/i, "")
    .replace(/^(?:a\s+|the\s+|my\s+)?(?:note|notepad)\s+/i, "")
    .replace(/\s+(?:note|notepad)$/i, "")
    .replace(/\s+(?:too|also|as\s+well|please)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || isAskTurnDeicticNoteTarget(cleaned) || isAskTurnInvalidResolvedNoteTitle(cleaned)) return null;
  const key = cleaned.toLowerCase();
  if (/^(?:a|an|the|my)?\s*(?:note|notepad)?$/.test(key)) return null;
  if (/^(?:scratch|memo|brief|log|journal|pad)$/.test(key)) return null;
    return cleaned;
  };

  const resolveAskTurnLayDestinationNoteSinkArg = (transcript: string): string | null => {
    const match = transcript.match(
      /\b(?:drop|put|save|add|append|write|store|stash|file|park|place)\s+(?:(?:that|this|it)\s+)?(?:(?:finding|result|answer|part|bit|section|location|takeaway|summary)\s+)?(?:to|into|in|inside)\s+(?!clipboard\b|docs?\b|documents?\b|papers?\b)(.+?)\s*$/i,
    );
    const target = normalizeAskTurnRequestedNoteTitle(match?.[1] ?? "");
    return target;
  };

  const resolveAskTurnSummaryNamedNoteSinkArg = (transcript: string): string | null => {
    const match = transcript.match(
      /\b(?:summari[sz]e|explain)\b[\s\S]*?\b(?:to|into|in|inside)\s+(?!clipboard\b|docs?\b|documents?\b|papers?\b|sections?\b|paragraphs?\b)(.+?)\s*$/i,
    );
    const target = normalizeAskTurnRequestedNoteTitle(match?.[1] ?? "");
    if (!target || isAskTurnDeicticNoteTarget(target)) return target || null;
    const hasNoteLikeTarget =
      /\b(?:note|notepad|scratch|refs?|reference|test|log|journal|brief|memo|pad)\b/i.test(target);
    const looksLikeFormattingInstruction =
      /\b(?:one|two|three|few|short|brief|concise|paragraph|paragraphs|sentence|sentences|bullets?|plain\s+english|plain\s+language)\b/i.test(
        target,
      );
    const hasNamedSinkShape = target.split(/\s+/).filter(Boolean).length >= 2;
    return (hasNoteLikeTarget || hasNamedSinkShape) && !looksLikeFormattingInstruction ? target : null;
  };

  const resolveAskTurnLocationNamedNoteSinkArg = (transcript: string): string | null => {
    const match = transcript.match(
      /\b(?:put|add|append|save|write|store|stash|file|park|place|drop)\b[\s\S]*?\b(?:location|finding|part|bit|section)\b[\s\S]*?\b(?:to|into|in|inside)\s+(?!clipboard\b|docs?\b|documents?\b|papers?\b|sections?\b)(.+?)\s*$/i,
    );
    const target = normalizeAskTurnRequestedNoteTitle(match?.[1] ?? "") ?? resolveAskTurnLayDestinationNoteSinkArg(transcript);
    if (!target || isAskTurnDeicticNoteTarget(target)) return target || null;
    const hasNoteLikeTarget = /\b(?:note|notepad|scratch|refs?|reference|test|log|journal|brief|memo|pad)\b/i.test(target);
    const hasNamedSinkShape = target.split(/\s+/).filter(Boolean).length >= 2;
    return hasNoteLikeTarget || hasNamedSinkShape
      ? target
      : null;
  };

  const resolveAskTurnArtifactBareNoteTargetArg = (transcript: string): string | null => {
    const normalized = transcript.trim();
    if (!isAskTurnArtifactReferenceIntent(normalized)) return null;
    const match = normalized.match(
      /\b(?:put|save|copy|add|append|drop|store|stash|file|park|place)\b[\s\S]*\b(?:clipboard\s+)?(?:result|answer|output|response)\b[\s\S]*\b(?:to|into|in|inside)\s+(?!clipboard\b|docs?\b|documents?\b|papers?\b)(.+?)\s*$/i,
    );
    const target = deps.trimActionArgBoundaries(match?.[1] ?? "");
    if (!target) return null;
    return target;
  };

  const resolveAskTurnAppendNoteTextArg = (transcript: string): string | null => {
    const colon = transcript.match(/:\s*([\s\S]+)$/);
    if (colon?.[1]?.trim()) return colon[1].trim();
    const appendBeforeTarget = transcript.match(
      /\b(?:append|add|put|save|write)\s+(.+?)\s+\b(?:to|into|in)\s+(?:the\s+|my\s+)?(?:note|notepad)\b/i,
    );
    if (appendBeforeTarget?.[1]?.trim()) return deps.trimActionArgBoundaries(appendBeforeTarget[1]);
    const appendSimple = transcript.match(/\b(?:append|add|put|save|write)\s+(.+?)$/i);
    if (appendSimple?.[1]?.trim()) return deps.trimActionArgBoundaries(appendSimple[1]);
    return null;
  };

  const resolveAskTurnDocsRetrievalQueryArg = (transcript: string): string => {
    const normalized = transcript.trim();
    const patterns = [
      /\b(?:look|search|find|scan|check)\s+(?:in|through|across)\s+(?:the\s+)?(?:docs?|documents?|files?|repo|repository)\s+(?:for|about)\s+(.+?)(?:\s+\b(?:and|then)\b\s+|\s+\b(?:to|into|in|inside)\b\s+|$)/i,
      /\b(?:look\s+for|search\s+for|find)\s+(.+?)(?:\s+\b(?:and|then)\b\s+|\s+\b(?:to|into|in|inside)\b\s+|$)/i,
    ];
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      const value = deps.trimActionArgBoundaries(match?.[1] ?? "");
      if (value) return value;
    }
    return clipConversationText(
      normalized
        .replace(/\b(?:look|search|find|scan|check)\b/gi, " ")
        .replace(/\b(?:docs?|documents?|files?|repo|repository|summary|summari[sz]e|useful|key|details|points|put|add|save|store|stash|file|park|place|write|note|notepad)\b/gi, " "),
      120,
    );
  };

  return {
    normalizeAskTurnRequestedNoteTitle,
    resolveAskTurnAppendNoteTextArg,
    resolveAskTurnArtifactBareNoteTargetArg,
    resolveAskTurnDocsRetrievalQueryArg,
    resolveAskTurnLayDestinationNoteSinkArg,
    resolveAskTurnLocationNamedNoteSinkArg,
    resolveAskTurnSummaryNamedNoteSinkArg,
  };
};

export const isAskTurnArtifactReferenceIntent = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase();
  return /\b(?:that|this|it|current|active|result|answer|finding|output|response)\b/.test(normalized);
};

export const isAskTurnArtifactToNoteIntent = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase();
  if (!isAskTurnArtifactReferenceIntent(transcript)) return false;
  return (
    /\b(?:put|save|copy|add|append|drop|store|stash|file|park|place)\b[\s\S]*\b(?:to|into|in|inside)\b[\s\S]*\b(?:note|notes|notepad)\b/.test(normalized) ||
    /\b(?:put|save|copy|add|append|drop|store|stash|file|park|place)\b[\s\S]*\b(?:note|notes|notepad)\b/.test(normalized) ||
    /\b(?:put|save|copy|add|append|drop|store|stash|file|park|place)\b[\s\S]*\b(?:clipboard\s+)?(?:result|answer|output|response)\b[\s\S]*\b(?:to|into|in|inside)\s+(?!clipboard\b|docs?\b|documents?\b|papers?\b)([a-z0-9][\w\s-]{1,120})$/i.test(
      normalized,
    )
  );
};

export const isAskTurnDeicticNoteWriteWithoutExplicitTitle = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase();
  return /\b(?:put|save|copy|add|append|drop|store|stash|file|park|place)\b[\s\S]*\b(?:to|into|in|inside)\s+(?:the\s+|that\s+|this\s+|my\s+)?(?:note|notes|notepad)\b/.test(
    normalized,
  );
};

export const isAskTurnArtifactToClipboardIntent = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase();
  if (!isAskTurnArtifactReferenceIntent(transcript)) return false;
  return /\b(?:copy|save|write|put|store)\b[\s\S]*\b(?:to|into|in)\b[\s\S]*\bclipboard\b/.test(normalized);
};

export const isAskTurnRepoCueIntent = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;
  return /\b(?:repo|repository|files?|codebase|source code|code paths?)\b/.test(normalized);
};

export const isAskTurnAppendToNoteCue = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) return false;
  return (
    /\b(?:append|add|save|put|write)\b[\s\S]*\b(?:to|into)\b[\s\S]*\b(?:note|notes|notepad)\b/.test(normalized) ||
    /\b(?:append|add|save|put|write)\b[\s\S]*\b(?:note|notes|notepad)\b/.test(normalized)
  );
};

export const isAskTurnNoteMutationPrecedenceIntent = (transcript: string): boolean =>
  /\b(?:create|make|start|new|append|update|add|write|save|store)\b[\s\S]{0,140}\b(?:workstation\s+)?(?:note|notepad|scratch|memo)\b/i.test(
    transcript,
  );
