export const clipConversationText = (value: string, maxChars = 320): string => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

export const sanitizeConversationBriefText = (value: string, maxChars = 520): string => {
  const normalized = value
    .replace(/\?/g, ".")
    .replace(/\s+/g, " ")
    .replace(/\.\.+/g, ".")
    .trim();
  return clipConversationText(normalized, maxChars);
};

export const HELIX_CONVERSATION_FILLER_RE =
  /^(ok|okay|yeah|yep|nope|thanks|thank you|cool|nice|right|got it|sounds good|testing|test)\b/i;
export const HELIX_CONVERSATION_LEADING_FILLER_RE =
  /^(ok|okay|yeah|yep|right|cool|nice|thanks|thank you|got it|sounds good)\b[\s,.-]*/i;
export const HELIX_CONVERSATION_VERIFY_RE =
  /\b(verify|verification|prove|proof|validate|validation|integrity|certificate|pass\/fail|pass fail|audit|check)\b/i;
export const HELIX_CONVERSATION_ACT_RE =
  /\b(implement|fix|change|update|remove|add|create|run|patch|deploy|execute|do this|take action)\b/i;
export const HELIX_CONVERSATION_OBSERVE_RE =
  /\b(observe|monitor|watch|track|status|state|what changed|what is happening|inspect|summarize)\b/i;
export const HELIX_CONVERSATION_EXPLORATORY_RE =
  /\b(how|why|what|walk me through|full solve|explain|overview|tell me about|break down|understand|explore)\b/i;
export const HELIX_CONVERSATION_DIRECT_QUESTION_RE =
  /^(?:(?:ok|okay|yeah|yep|right|cool|nice)\b[\s,.-]*)?(?:what|how|why|when|where|who|can you|could you|would you|explain|define|tell me|walk me through)\b/i;
export const HELIX_CONVERSATION_QUESTION_PUNCT_RE = /[?ï¼Ÿ]/u;
export const HELIX_CONVERSATION_CJK_DIRECT_QUESTION_RE =
  /^(?:è¯·é—®|è«‹å•|ä»€ä¹ˆ|ç”šä¹ˆ|ç”šéº¼|ä¸ºä»€ä¹ˆ|ç‚ºä»€éº¼|æ€Žä¹ˆ|æ€Žéº¼|å¦‚ä½•|è°|èª°|å“ª|å“ªé‡Œ|å“ªè£¡|ä½•æ—¶|ä½•æ™‚|æ˜¯ä»€éº¼|æ˜¯ä»€ä¹ˆ)/u;
