import { extractAskTurnDocPathArgs } from "./doc-args";

export const HELIX_ASK_TURN_COMPARE_CUE_RE =
  /\b(?:compare|comparison|contrast|difference|differences|different|delta|deltas|versus|vs\.?)\b/i;

export type HelixAskCompareIntentReaderDependencies = {
  maskProtectedArgumentSpansForIntent: (transcript: string) => string;
  trimActionArgBoundaries: (value: string) => string;
};

export const askTurnHasExplicitWorkspaceCompareOperand = (normalizedTranscript: string): boolean =>
  /\/(?:docs|notes|artifacts)\//i.test(normalizedTranscript) ||
  /\b(?:doc|docs|document|paper|note|notes|notepad|scratch|memo|pad|workspace)\b/i.test(normalizedTranscript) ||
  /\b(?:this|that|the|current|active)\s+(?:doc|document|paper|note|notepad|scratch|memo|pad)\b/i.test(normalizedTranscript) ||
  /\b(?:against|with|to)\s+(?:the\s+)?(?:doc|docs|document|paper|note|notes|notepad|scratch|memo|pad)\b/i.test(
    normalizedTranscript,
  );

export const isAskTurnComparePrecedenceIntent = (transcript: string): boolean =>
  /\bcompare\b[\s\S]{0,160}\b(?:against|with|to|versus|vs\.?)\b[\s\S]{0,120}\b(?:note|notes|current\s+doc|current\s+document|doc|document)\b/i.test(
    transcript,
  );

export const isAskTurnGenericDocCompareTarget = (value: string | null | undefined): boolean => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return false;
  if (extractAskTurnDocPathArgs(normalized).length > 0) return true;
  return /\b(?:doc|docs|document|paper|figure|figures|pdf|markdown|file)\b/.test(normalized);
};

export const createAskTurnCompareIntentReaders = (
  deps: HelixAskCompareIntentReaderDependencies,
) => {
  const isAskTurnConceptualVsQuestion = (transcript: string): boolean => {
    const normalized = deps.maskProtectedArgumentSpansForIntent(transcript).toLowerCase().replace(/\s+/g, " ");
    if (!/\b(?:versus|vs\.?|difference\s+between|compare|contrast)\b/i.test(normalized)) return false;
    if (askTurnHasExplicitWorkspaceCompareOperand(normalized)) return false;
    return /\b(?:what\s+is|what\s+are|define|explain|why|how|difference\s+between|simple\s+words|simple\s+terms|plain\s+english|plain\s+language|basically|is\s+that|proper\s+time|coordinate\s+time|clock\s+riding|clock\s+rides|traveler\s+clock|coordinate\s+label|background\s+question|conceptual\s+question)\b/i.test(
      normalized,
    );
  };

  const askTurnHasCompareCueOutsideProtectedArgs = (transcript: string): boolean =>
    !isAskTurnConceptualVsQuestion(transcript) &&
    HELIX_ASK_TURN_COMPARE_CUE_RE.test(deps.maskProtectedArgumentSpansForIntent(transcript).toLowerCase());

  const isAskTurnDocNotesHybridCompareIntent = (transcript: string): boolean => {
    const normalized = deps.maskProtectedArgumentSpansForIntent(transcript).trim().toLowerCase();
    if (!normalized) return false;
    const hasCompareCue = askTurnHasCompareCueOutsideProtectedArgs(transcript);
    if (!hasCompareCue) return false;
    const hasDocCue = /\b(?:doc|docs|document|paper)\b/.test(normalized);
    const hasNotesCue = /\b(?:note|notes|notepad)\b/.test(normalized);
    return hasDocCue && hasNotesCue;
  };

  const isAskTurnExtractAppendCompareIntent = (transcript: string): boolean => {
    const normalized = deps.maskProtectedArgumentSpansForIntent(transcript).trim().toLowerCase();
    if (!normalized) return false;
    const hasExtractCue = /\b(?:extract|pull|collect)\b/.test(normalized) && /\b(?:numeric|number|figure|claim)s?\b/.test(normalized);
    const hasAppendCue = /\bappend\b/.test(normalized) && /\b(?:note|notes|notepad)\b/.test(normalized);
    const hasCompareCue = askTurnHasCompareCueOutsideProtectedArgs(transcript);
    return hasExtractCue && hasAppendCue && hasCompareCue;
  };

  const isAskTurnCreateCopyCompareIntent = (transcript: string): boolean => {
    const normalized = deps.maskProtectedArgumentSpansForIntent(transcript).trim().toLowerCase();
    if (!normalized) return false;
    const hasCreateNoteCue = /\b(?:create|new|start)\s+(?:a\s+)?note\b/.test(normalized);
    const hasCopyClipboardCue =
      /\bcopy\b[\s\S]*\b(?:latest|last|recent)\b[\s\S]*\bclipboard\b[\s\S]*\b(?:entry|item|text)?\b[\s\S]*\bnote\b/.test(
        normalized,
      );
    const hasCompareCue = askTurnHasCompareCueOutsideProtectedArgs(transcript);
    return hasCreateNoteCue && hasCopyClipboardCue && hasCompareCue;
  };

  const isAskTurnCompareCopyResultToClipboardIntent = (transcript: string): boolean => {
    const normalized = deps.maskProtectedArgumentSpansForIntent(transcript).trim().toLowerCase();
    if (!normalized) return false;
    const hasCompareCue = askTurnHasCompareCueOutsideProtectedArgs(transcript);
    const hasClipboardCopyCue =
      /\bcopy\b[\s\S]*\b(?:result|results|summary|differences|deltas|analysis|it|that)\b[\s\S]*\bclipboard\b/.test(
        normalized,
      ) || /\bcopy\b[\s\S]*\bclipboard\b/.test(normalized);
    return hasCompareCue && hasClipboardCopyCue;
  };

  const resolveAskTurnCompareRightHandTargetArg = (transcript: string): string | null => {
    const match = transcript.match(
      /\b(?:with|against|versus|vs\.?|to)\s+(.+?)(?:\s*(?:,|\band\s+(?:tell|show|list|explain|summari[sz]e)\b|\btell\s+me\b|\bshow\s+me\b|\blist\s+the\b|\bmain\s+differences\b|\bdifferences\b|\bdeltas\b)\s*[\s\S]*|$)/i,
    );
    const target = deps.trimActionArgBoundaries(match?.[1] ?? "")
      .replace(/^(?:a\s+|the\s+|my\s+)?(?:note|notepad)\s+(?:called|named|titled)\s+/i, "")
      .replace(/^(?:called|named|titled)\s+/i, "")
      .replace(/^(?:the\s+|my\s+)?(?:note|notepad)\s+/i, "")
      .replace(/\s+(?:note|notepad)$/i, "")
      .trim();
    return target || null;
  };

  return {
    askTurnHasCompareCueOutsideProtectedArgs,
    isAskTurnCompareCopyResultToClipboardIntent,
    isAskTurnCreateCopyCompareIntent,
    isAskTurnDocNotesHybridCompareIntent,
    isAskTurnExtractAppendCompareIntent,
    isAskTurnConceptualVsQuestion,
    resolveAskTurnCompareRightHandTargetArg,
  };
};
