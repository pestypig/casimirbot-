import { clipText } from "@/lib/helix/ask-value-normalization";

export function extractIntentTerms(text: string, maxTerms = 8): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4)
    .slice(0, maxTerms);
}

export function hasDanglingTurnTail(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase().replace(/[.!?]+$/g, "").trim();
  if (!normalized) return false;
  return /\b(and|or|but|so|because|that|which|who|when|where|why|what|how|if|to|of|for|with|in|on|at|from|is|are|was|were|be|been|being|the|a|an|it|this|these|those|my|your|our|their|does|do|did|can|could|would|will)\s*$/.test(
    normalized,
  );
}

export function isLowInformationTailTranscript(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  if (!normalized) return true;
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 3) return false;
  if (/\b(verify|check|prove|fix|implement|change|update|explain|define|what|why|how)\b/.test(normalized)) {
    return false;
  }
  const compact = words.join("");
  return compact.length <= 18;
}

export function extractLatestContinuationQuestionFocus(transcript: string): string | null {
  const normalized = transcript.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (sentences.length < 2) return null;
  const last = sentences[sentences.length - 1] ?? "";
  if (!last) return null;
  const lowered = last.toLowerCase();
  const looksQuestionPivot =
    /^(?:so|and|right|okay|ok|well)[,\s]+/.test(lowered) ||
    /^(?:what about|how about|can you|could you|would you|please)\b/.test(lowered) ||
    /\?$/.test(last);
  if (!looksQuestionPivot) return null;
  const hasIntentVerb = /\b(?:what about|how about|explain|define|relate|compare|tell|walk me through|can you)\b/.test(
    lowered,
  );
  if (!hasIntentVerb && !/\?$/.test(last)) return null;
  if (last.length < 12) return null;
  return clipText(last, 360);
}

export function hasSufficientLexicalCarryover(nextTranscript: string, priorUserTurn: string): boolean {
  const nextTerms = new Set(extractIntentTerms(nextTranscript, 12));
  const priorTerms = new Set(extractIntentTerms(priorUserTurn, 14));
  if (nextTerms.size === 0 || priorTerms.size === 0) return false;
  let overlap = 0;
  for (const term of nextTerms) {
    if (!priorTerms.has(term)) continue;
    overlap += 1;
    if (overlap >= 2) return true;
  }
  return false;
}

export function isLikelyNearTurnContinuation(args: {
  transcript: string;
  priorUserTurn: string | null;
}): boolean {
  const normalized = args.transcript.trim().toLowerCase();
  const prior = args.priorUserTurn?.trim();
  if (!normalized || !prior) return false;
  if (
    /^(where|why|how|what)\s+(is|are|was|were|does|did)\s+(that|this|it|they|those|these)\b/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/^(and|so|then|also|but|because|which|that|right|yeah|yes|well)\b/.test(normalized)) return true;
  if (/^(it|this|that|they|those|these)\b/.test(normalized)) return true;
  return hasSufficientLexicalCarryover(normalized, prior.toLowerCase());
}
