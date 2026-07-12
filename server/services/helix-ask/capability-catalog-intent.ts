const CAPABILITY_BEHAVIOR_TOOL_LABEL_PATTERN =
  "(?:research[-\\s]+papers?|scholarly(?:[-\\s]+research)?|scientific[-\\s]+calculator|calculator|docs?(?:[-\\s]+viewer)?|repo(?:[-\\s]+search)?|internet[-\\s]+search|moral[-\\s]+graph|image[-\\s]+lens|visual[-\\s]+capture|workstation[-\\s]+notes?|notes?|workspace(?:[-\\s]+diagnostic)?|live[-\\s]+source|live[-\\s]+environment|narrator|voice|postulate(?:[-\\s]+board)?|helix[-\\s]+ask)";

const CAPABILITY_BEHAVIOR_SUBJECT_PATTERN =
  `(?:(?:(?:the|this)\\s+)?${CAPABILITY_BEHAVIOR_TOOL_LABEL_PATTERN}|(?:your|the|this)\\s+(?:${CAPABILITY_BEHAVIOR_TOOL_LABEL_PATTERN}\\s+)?(?:tool|capability|workflow))`;

const CAPABILITY_CATALOG_OBJECT_PATTERN =
  `(?:helix\\s+ask|ask\\s+turn|this\\s+agent|the\\s+agent|ask|agent|live\\s+answer)[\\s\\S]{0,120}(?:tools?|tool\\s+calls?|tool\\s+call\\s+goals?|capabilities)|(?:tools?|tool\\s+calls?|tool\\s+call\\s+goals?|capabilities)[\\s\\S]{0,120}(?:helix\\s+ask|ask\\s+turn|this\\s+agent|the\\s+agent|ask|agent|live\\s+answer)|${CAPABILITY_BEHAVIOR_SUBJECT_PATTERN}`;

const stripWholePromptWrappingQuotes = (promptText: string): string | null => {
  const trimmed = promptText.trim();
  if (trimmed.length < 2) return null;
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (!["\"", "'", "`"].includes(first) || first !== last) return null;
  const inner = trimmed.slice(1, -1).trim();
  return inner || null;
};

const CAPABILITY_CATALOG_REQUEST_PATTERNS = [
  /\bwhat\s+tools\s+are\s+available\s+for\s+(?:the\s+)?helix\s+ask\s+to\s+use\b/i,
  new RegExp(
    `\\b(?:does|do|can|could|how\\s+(?:does|do|can))\\s+${CAPABILITY_BEHAVIOR_SUBJECT_PATTERN}\\b[\\s\\S]{0,260}\\b(?:allow|able|support|select|pick|choose|parse|open|openable|check|use|fallback|escalat|inspect|read|search|create|append|mutat|control|work|access|route|return)\\w*\\b`,
    "i",
  ),
  /\bwhat\s+can\s+i\s+do\s+with\s+helix\s+ask\b/i,
  /\bwhat\s+can\s+(?:helix\s+ask|ask|this\s+agent|the\s+agent)\s+do\b/i,
  /\bhow\s+can\s+(?:helix\s+ask|ask|this\s+agent|the\s+agent)\s+help\b/i,
  /\bwhat\s+(?:tools?|tool\s+calls?|capabilities)\s+(?:are\s+)?(?:available|visible|admissible)\b/i,
  /\bwhat\s+(?:tools?|tool\s+calls?|capabilities)\s+can\s+(?:helix\s+ask|ask|agent)\s+(?:use|call|run|see|access)\b/i,
  /\bwhat\s+(?:tools?|tool\s+calls?|capabilities)\s+can\s+(?:you|i|we)\s+(?:use|call|run|see|access)\b[\s\S]{0,100}\b(?:as|for|from|in)\s+(?:the\s+)?(?:helix\s+ask|ask|agent)\b/i,
  /\b(?:what|which)\s+(?:tools?|tool\s+calls?|capabilities)\s+(?:are\s+)?(?:available|visible|admissible|exposed)\s+to\s+(?:you|me|us)\b/i,
  /\b(?:what|which)\s+(?:runtime\s+)?(?:tools?|tool\s+calls?|capabilities)\s+(?:does|do|can)\s+(?:this\s+agent|the\s+agent|helix\s+ask|ask)\s+(?:have|expose|see|access|use|call|run)\b/i,
  /\b(?:what|which|show|list|inspect|explain)\b[\s\S]{0,80}\b(?:live\s+answer\s+)?tool\s+call\s+goals?\b/i,
  /\b(?:live\s+answer\s+)?tool\s+call\s+goals?\b[\s\S]{0,100}\b(?:available|visible|admissible|exposed|agent|helix\s+ask|ask|runtime|catalog|capabilit)/i,
  /\b(?:list|show|inspect|tell\s+me)\b[\s\S]{0,60}\b(?:tools?|tool\s+calls?|capabilities)\b/i,
] as const;

const capabilityCatalogRequestMatchIndex = (promptText: string): number | null => {
  const prompt = promptText.trim();
  if (!prompt) return null;
  const mentionsAskSurface = new RegExp(
    `\\b(?:helix\\s+ask|ask\\s+turn|this\\s+agent|the\\s+agent|live\\s+answer|${CAPABILITY_BEHAVIOR_SUBJECT_PATTERN})\\b`,
    "i",
  ).test(prompt);
  const patterns = mentionsAskSurface
    ? CAPABILITY_CATALOG_REQUEST_PATTERNS
    : [CAPABILITY_CATALOG_REQUEST_PATTERNS[0]];
  let bestIndex: number | null = null;
  for (const pattern of patterns) {
    const matchIndex = prompt.search(pattern);
    if (matchIndex >= 0 && (bestIndex === null || matchIndex < bestIndex)) {
      bestIndex = matchIndex;
    }
  }
  return bestIndex;
};

const isCapabilityCatalogRequestText = (promptText: string): boolean => {
  return capabilityCatalogRequestMatchIndex(promptText) !== null;
};

const hasContextualCapabilityCatalogCue = (promptText: string): boolean => {
  const object = CAPABILITY_CATALOG_OBJECT_PATTERN;
  const wholeQuotedPrompt = stripWholePromptWrappingQuotes(promptText);
  const standaloneQuotedCatalogRequest = Boolean(wholeQuotedPrompt && isCapabilityCatalogRequestText(wholeQuotedPrompt));
  return (
    (!standaloneQuotedCatalogRequest && new RegExp(`["'\`][^"'\`]*(?:${object})[^"'\`]*["'\`]`, "i").test(promptText)) ||
    new RegExp(`\\b(?:if|in\\s+the\\s+future|future|later|eventually|hypothetically|tomorrow|next\\s+time)\\b[\\s\\S]{0,160}\\b(?:${object})\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:would|could|might|should)\\b[\\s\\S]{0,80}\\b(?:we|it|that|this)\\b[\\s\\S]{0,80}\\b(?:later|future|eventually|hypothetically|next\\s+time|if)\\b[\\s\\S]{0,160}\\b(?:${object})\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:would|could|might|should)\\s+(?:we|i)\\s+ask\\b[\\s\\S]{0,160}\\b(?:${object})\\b[\\s\\S]{0,100}\\b(?:later|future|eventually|hypothetically|next\\s+time|tomorrow)\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:previously|earlier|last\\s+time|before|already|historically|was|were|had)\\b[\\s\\S]{0,180}\\b(?:listed|showed|inspected|asked|called|used|queried|viewed|checked)?\\b[\\s\\S]{0,120}\\b(?:${object})\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:screen|page|button|label|ui|text|menu|dropdown|document|quote)\\b[\\s\\S]{0,100}\\b(?:says|shows|reads|contains|labeled|labelled|called|named)\\b[\\s\\S]{0,160}\\b(?:${object})\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:do\\s+not|don't|dont|without|not\\s+asking\\s+to|no\\s+need\\s+to|for\\s+now)\\b[\\s\\S]{0,180}\\b(?:list|show|inspect|tell|explain|query|view|check|read)?\\b[\\s\\S]{0,140}\\b(?:${object})\\b`, "i").test(promptText)
  );
};

export const isAskCapabilityCatalogPrompt = (promptText: string): boolean => {
  return askCapabilityCatalogPromptMatchIndex(promptText) !== null;
};

export const askCapabilityCatalogPromptMatchIndex = (promptText: string): number | null => {
  if (hasContextualCapabilityCatalogCue(promptText)) return null;
  const wholeQuotedPrompt = stripWholePromptWrappingQuotes(promptText);
  if (wholeQuotedPrompt) {
    return isCapabilityCatalogRequestText(wholeQuotedPrompt) ? 0 : null;
  }
  return capabilityCatalogRequestMatchIndex(promptText);
};

export const isAskTurnCapabilityCatalogAvailabilityPrompt = (transcript: string): boolean => {
  return isAskCapabilityCatalogPrompt(transcript);
};

export const isAskTurnCapabilityHelpIntent = (transcript: string): boolean => {
  const normalized = transcript.trim().toLowerCase().replace(/[?!.]+$/g, "").replace(/\s+/g, " ");
  if (!normalized) return false;
  return (
    isAskTurnCapabilityCatalogAvailabilityPrompt(transcript) ||
    /\bwhat\s+can\s+i\s+do\s+with\s+helix\s+ask\b/i.test(normalized) ||
    /\bhow\s+can\s+(?:you|helix\s+ask)\s+help\s+me\b/i.test(normalized) ||
    /\bwhat\s+can\s+(?:this\s+)?(?:workspace\s+)?agent\s+do\b/i.test(normalized) ||
    /\bwhat\s+can\s+helix\s+ask\s+do\b/i.test(normalized)
  );
};
