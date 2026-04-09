import type { HelixAskDomain } from "../intent-directory";
import { filterCriticTokens, tokenizeAskQuery } from "../query";

const HELIX_CONVERSATION_LEADING_FILLER_RE =
  /^(ok|okay|yeah|yep|right|cool|nice|thanks|thank you|got it|sounds good)\b[\s,.-]*/i;
const HELIX_CONVERSATION_DIRECT_QUESTION_RE =
  /^(?:(?:ok|okay|yeah|yep|right|cool|nice)\b[\s,.-]*)?(?:what|how|why|when|where|who|can you|could you|would you|explain|define|tell me|walk me through)\b/i;
const HELIX_CONVERSATION_QUESTION_PUNCT_RE = /[?ï¼Ÿ]/u;
const HELIX_CONVERSATION_CJK_DIRECT_QUESTION_RE =
  /^(?:è¯·é—®|è«‹å•|ä»ä¹ˆ|ç”¨ä¹ˆ|ç”¨éº¼|ä¸ºä»€ä¹ˆ|ç‚ºä»€éº¼|æ€Žä¹ˆ|æ€Žéº¼|å¦‚ä½•|è°|èª°|å“ª|å“ªé‡Œ|å“ªè£¡|ä½•æ—¶|ä½•æ™‚|æ˜¯ä»€éº¼|æ˜¯ä»€ä¹ˆ)/u;
const HELIX_ASK_DEFINITION_TARGET_GENERIC_RE =
  /^(?:this|that|it|they|them|thing|things|stuff|term|concept|idea|one|ones|those|these)$/i;

const hasConversationQuestionCue = (transcript: string): boolean => {
  const trimmed = transcript.trim();
  if (!trimmed) return false;
  if (HELIX_CONVERSATION_QUESTION_PUNCT_RE.test(trimmed)) return true;
  if (HELIX_CONVERSATION_CJK_DIRECT_QUESTION_RE.test(trimmed)) return true;
  return HELIX_CONVERSATION_DIRECT_QUESTION_RE.test(trimmed.toLowerCase());
};

const isSecurityRiskPrompt = (question: string): boolean =>
  /\b(hack|attack|fraud|scam|phish|phishing|steal|theft|financial|bank|identity|ransom|malware|exploit|protect itself)\b/i.test(
    question,
  );

export const renderHelixAskSimpleWritingAdviceAnswer = (question: string): string | null => {
  const trimmed = question.trim();
  if (!trimmed) return null;
  const writingAdvicePrompt =
    /\b(short answer|brief answer|short response|one sentence|opening paragraph|takeaway|summary|wording|phrasing|structure)\b/i.test(
      trimmed,
    ) &&
    /\b(clean way|best way|good way|how should i|how do i|what(?:'s| is) (?:a )?(?:clean|good|best) way)\b/i.test(
      trimmed,
    );
  if (!writingAdvicePrompt) return null;
  return (
    "Lead with the direct answer, follow with one sentence that gives the key reason or evidence, " +
    "and end with a caveat or next step only if it changes the outcome. That keeps the response short, " +
    "readable, and easy to expand when the reader needs more context.\n\n" +
    "Sources: docs/helix-ask-flow.md, docs/helix-ask-agent-policy.md"
  );
};

export const hasHelixAskRepoTechnicalCue = (question: string): boolean => {
  const trimmed = question.trim();
  if (!trimmed) return false;
  const hasCodeLikeIdentifier =
    /\b[a-z][a-z0-9]*(?:_[a-z0-9]+){1,}\b/.test(trimmed) ||
    /\b[a-z][a-z0-9_]*[A-Z][A-Za-z0-9_]*\b/.test(trimmed) ||
    /`[A-Za-z_][A-Za-z0-9_]*`/.test(trimmed) ||
    /\b[A-Za-z_][A-Za-z0-9_]*\s*\(\s*\)/.test(trimmed) ||
    /\/api\/[a-z0-9/_-]+/i.test(trimmed);
  if (hasCodeLikeIdentifier) return true;
  const internalMechanicsPrompt =
    /\b(?:how does|where (?:is|are)|walk through|show|describe|explain|what determines|what checks|what does)\b/i.test(
      trimmed,
    ) &&
    /\b(?:debug payload|debug live events|diagnostics?|relation packet|answer contract|citation repair|training-trace|intent directory|topic tags|quality mode|fallback reasons?|source paths?|adapter\/run|sanitizeSourcesLine|report_mode_reason|answer_path|arbiter_mode|arbiter mode|deterministic fallback|relation-?mode|contract parse failures?|goal-?zone harness|pass\/fail across seeds|hybrid explain mode|intent detection|final answer cleanup|relation topology|dual-domain detection|platonic gate scoring|citation allowlists?|graph resolver)\b/i.test(
      trimmed,
    );
  return internalMechanicsPrompt;
};

export const shouldBypassHelixAskPreIntentClarifyForCompositionalPrompt = (args: {
  question: string;
  explicitRepoExpectation?: boolean;
  hasFilePathHints?: boolean;
  endpointHintCount?: number;
  requiresRepoEvidence?: boolean;
  intentDomain?: HelixAskDomain;
}): boolean => {
  const trimmed = args.question.trim();
  if (!trimmed) return false;
  if (
    args.explicitRepoExpectation ||
    args.hasFilePathHints ||
    (args.endpointHintCount ?? 0) > 0 ||
    args.requiresRepoEvidence ||
    args.intentDomain === "repo" ||
    args.intentDomain === "hybrid"
  ) {
    return false;
  }
  const writingAdvicePrompt =
    /\b(short answer|brief answer|short response|one sentence|opening paragraph|takeaway|summary|wording|phrasing|structure)\b/i.test(
      trimmed,
    ) &&
    /\b(clean way|best way|good way|how should i|how do i|what(?:'s| is) (?:a )?(?:clean|good|best) way)\b/i.test(
      trimmed,
    );
  if (writingAdvicePrompt) return true;
  if (hasConversationQuestionCue(trimmed)) return false;
  if (trimmed.length > 120) return false;
  return /^(?:say|write|reply|respond|give|tell|draft|compose)\b/i.test(trimmed);
};

export const hasHelixAskConcreteDefinitionTarget = (question: string): boolean => {
  const trimmed = question.trim();
  if (!trimmed) return false;
  const normalized = trimmed.replace(HELIX_CONVERSATION_LEADING_FILLER_RE, "").trim();
  const directMatch = normalized.match(
    /^(?:(?:what\s+(?:is|are))|what's|whats|define|describe|explain|meaning\s+of)\s+(.+?)[.?!]*$/i,
  );
  const meanMatch = normalized.match(
    /^(?:what\s+does)\s+(.+?)\s+mean(?:\s+in\s+.+?)?[.?!]*$/i,
  );
  const matched = directMatch ?? meanMatch;
  if (!matched) return false;
  let target = (matched[1] ?? "").trim();
  target = target.replace(/^["'`([{<\s]+|["'`)\]}>]+$/g, "").trim();
  target = target.replace(/^(?:the|a|an)\s+/i, "").trim();
  target = target.replace(/\b(?:in|for)\s+(?:simple|plain)\s+terms$/i, "").trim();
  if (!target) return false;
  const targetTokens = filterCriticTokens(tokenizeAskQuery(target));
  if (targetTokens.length === 0) return false;
  if (targetTokens.every((token) => HELIX_ASK_DEFINITION_TARGET_GENERIC_RE.test(token))) {
    return false;
  }
  return true;
};

export const shouldBypassHelixAskPreIntentClarifyForDefinitionTarget = (args: {
  question: string;
  explicitRepoExpectation?: boolean;
  hasFilePathHints?: boolean;
  endpointHintCount?: number;
  requiresRepoEvidence?: boolean;
}): boolean => {
  const trimmed = args.question.trim();
  if (!trimmed) return false;
  if (args.explicitRepoExpectation) return false;
  return hasHelixAskConcreteDefinitionTarget(trimmed);
};

export const shouldBypassHelixAskPreIntentClarifyForGeneralDefinitionTarget = (args: {
  question: string;
  intentDomain?: HelixAskDomain;
  explicitRepoExpectation?: boolean;
  hasFilePathHints?: boolean;
  endpointHintCount?: number;
  requiresRepoEvidence?: boolean;
}): boolean => {
  const trimmed = args.question.trim();
  if (!trimmed) return false;
  if (args.intentDomain && args.intentDomain !== "general") return false;
  if (args.explicitRepoExpectation) return false;
  if (args.requiresRepoEvidence) return false;
  if (args.hasFilePathHints) return false;
  if ((args.endpointHintCount ?? 0) > 0) return false;
  if (isSecurityRiskPrompt(trimmed)) return false;
  if (hasHelixAskRepoTechnicalCue(trimmed)) return false;
  return hasHelixAskConcreteDefinitionTarget(trimmed);
};

export const shouldBypassHelixAskPreIntentClarifyForCompareTarget = (question: string): boolean => {
  const trimmed = question.trim();
  if (!trimmed) return false;
  if (!/\b(?:compare|comparison|different|difference|versus|vs\.?|contrast|between)\b/i.test(trimmed)) {
    return false;
  }
  const normalized = trimmed.replace(HELIX_CONVERSATION_LEADING_FILLER_RE, "").trim();
  const compareBody = normalized
    .replace(/^(?:please\s+)?(?:compare|contrast)\b/i, "")
    .replace(/\bdifference\s+between\b/i, "between")
    .trim();
  const segments = compareBody
    .split(/\b(?:and|vs\.?|versus)\b/i)
    .map((part) => part.replace(/^between\b/i, "").replace(/[?.!,;:]+$/g, "").trim())
    .filter(Boolean);
  const informativeSegments = segments.filter((segment) => {
    const tokens = filterCriticTokens(tokenizeAskQuery(segment));
    if (tokens.length === 0) return false;
    if (tokens.every((token) => HELIX_ASK_DEFINITION_TARGET_GENERIC_RE.test(token))) return false;
    return true;
  });
  return informativeSegments.length >= 2;
};

export const shouldUseGeneralAmbiguityAnswerFloor = (args: {
  intentDomain: HelixAskDomain;
  requiresRepoEvidence: boolean;
  explicitRepoExpectation: boolean;
  hasFilePathHints: boolean;
  endpointHintCount: number;
}): boolean =>
  args.intentDomain === "general" &&
  !args.requiresRepoEvidence &&
  !args.explicitRepoExpectation &&
  !args.hasFilePathHints &&
  args.endpointHintCount <= 0;

export const buildGeneralAmbiguityAnswerFloor = (args: {
  question: string;
  clarifyLine: string;
  minTextChars?: number;
}): string => {
  const minTextChars = Math.max(0, Math.floor(args.minTextChars ?? 220));
  const writingAdvice = renderHelixAskSimpleWritingAdviceAnswer(args.question);
  if (writingAdvice) {
    const answer = `${writingAdvice}\n\nClarify: ${args.clarifyLine}`.trim();
    if (answer.length >= minTextChars) {
      return answer;
    }
    return (
      `${answer}\n` +
      "Use concrete nouns, measurable evidence, and one explicit uncertainty so reviewers can audit every claim."
    ).trim();
  }
  const compactQuestion = args.question.trim();
  const questionLead = compactQuestion
    ? `Best-effort answer for "${compactQuestion}": keep the response claim-first, include the strongest available evidence line, and keep one explicit uncertainty visible.`
    : "Best-effort answer: keep the response claim-first, include the strongest available evidence line, and keep one explicit uncertainty visible.";
  const scaffold = [
    questionLead,
    "Implication: this supports a provisional decision now, and the decision should update when new evidence directly resolves the uncertainty.",
    `Clarify: ${args.clarifyLine}`,
  ].join("\n\n").trim();
  if (scaffold.length >= minTextChars) {
    return scaffold;
  }
  return (
    `${scaffold}\n` +
    "Prefer direct language over abstractions so the reader can verify what is known, what is inferred, and what is still missing."
  ).trim();
};
