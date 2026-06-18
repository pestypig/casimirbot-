const CAPABILITY_CATALOG_OBJECT_PATTERN =
  "(?:helix\\s+ask|ask\\s+turn|this\\s+agent|the\\s+agent|ask|agent)[\\s\\S]{0,120}(?:tools?|tool\\s+calls?|capabilities)|(?:tools?|tool\\s+calls?|capabilities)[\\s\\S]{0,120}(?:helix\\s+ask|ask\\s+turn|this\\s+agent|the\\s+agent|ask|agent)";

const hasContextualCapabilityCatalogCue = (promptText: string): boolean => {
  const object = CAPABILITY_CATALOG_OBJECT_PATTERN;
  return (
    new RegExp(`["'\`][^"'\`]*(?:${object})[^"'\`]*["'\`]`, "i").test(promptText) ||
    new RegExp(`\\b(?:if|in\\s+the\\s+future|future|later|eventually|hypothetically|tomorrow|next\\s+time)\\b[\\s\\S]{0,160}\\b(?:${object})\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:would|could|might|should)\\b[\\s\\S]{0,80}\\b(?:we|it|that|this)\\b[\\s\\S]{0,80}\\b(?:later|future|eventually|hypothetically|next\\s+time|if)\\b[\\s\\S]{0,160}\\b(?:${object})\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:previously|earlier|last\\s+time|before|already|historically|was|were|had)\\b[\\s\\S]{0,180}\\b(?:listed|showed|inspected|asked|called|used|queried|viewed|checked)?\\b[\\s\\S]{0,120}\\b(?:${object})\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:screen|page|button|label|ui|text|menu|dropdown|document|quote)\\b[\\s\\S]{0,100}\\b(?:says|shows|reads|contains|labeled|labelled|called|named)\\b[\\s\\S]{0,160}\\b(?:${object})\\b`, "i").test(promptText) ||
    new RegExp(`\\b(?:do\\s+not|don't|dont|without|not\\s+asking\\s+to|no\\s+need\\s+to|for\\s+now)\\b[\\s\\S]{0,180}\\b(?:list|show|inspect|tell|explain|query|view|check|read)?\\b[\\s\\S]{0,140}\\b(?:${object})\\b`, "i").test(promptText)
  );
};

export const isAskCapabilityCatalogPrompt = (promptText: string): boolean => {
  if (hasContextualCapabilityCatalogCue(promptText)) return false;
  const normalized = promptText.trim().toLowerCase().replace(/[?!.]+$/g, "").replace(/\s+/g, " ");
  if (!normalized) return false;
  const mentionsAskSurface = /\b(?:helix\s+ask|ask\s+turn|this\s+agent|the\s+agent)\b/i.test(normalized);
  return (
    /\bwhat\s+tools\s+are\s+available\s+for\s+(?:the\s+)?helix\s+ask\s+to\s+use\b/i.test(normalized) ||
    (
      mentionsAskSurface &&
      (
        /\bwhat\s+can\s+i\s+do\s+with\s+helix\s+ask\b/i.test(normalized) ||
        /\bwhat\s+can\s+(?:helix\s+ask|ask|this\s+agent|the\s+agent)\s+do\b/i.test(normalized) ||
        /\bhow\s+can\s+(?:helix\s+ask|ask|this\s+agent|the\s+agent)\s+help\b/i.test(normalized) ||
        /\bwhat\s+(?:tools?|tool\s+calls?|capabilities)\s+(?:are\s+)?(?:available|visible|admissible)\b/i.test(normalized) ||
        /\bwhat\s+(?:tools?|tool\s+calls?|capabilities)\s+can\s+(?:helix\s+ask|ask|agent)\s+(?:use|call|run|see|access)\b/i.test(normalized) ||
        /\b(?:list|show|inspect|tell\s+me)\b[\s\S]{0,60}\b(?:tools?|tool\s+calls?|capabilities)\b/i.test(normalized)
      )
    )
  );
};
