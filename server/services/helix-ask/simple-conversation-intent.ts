export const isAskTurnSimpleConversationStatusCheck = (transcript: string): boolean => {
  const normalized = transcript
    .trim()
    .toLowerCase()
    .replace(/[?!.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return false;
  if (/^(?:hello|hi|hey|yo|howdy)$/.test(normalized)) return true;
  if (/^(?:ok|okay|test|testing|ping|ready|you there|are you there|can you hear me|are you awake|are you alive)$/.test(normalized)) return true;
  if (/^(?:is this|is it|are we|is everything)\s+(?:working|on|live|connected|running|ok|okay)$/.test(normalized)) return true;
  if (/^(?:does this|can this)\s+(?:work|respond)$/.test(normalized)) return true;
  if (
    /^(?:hello|hi|hey|yo|howdy)\b/.test(normalized) &&
    /\b(?:respond|reply|answer)\b/.test(normalized) &&
    /\bwithout\b[\s\S]*\b(?:workspace\s+actions?|tools?|acting|doing\s+workspace\s+actions?)\b/.test(normalized)
  ) return true;
  if (
    /\b(?:respond|reply|answer)\b/.test(normalized) &&
    /\b(?:without|no)\b[\s\S]*\b(?:workspace\s+actions?|tools?|tool\s+use|acting)\b/.test(normalized) &&
    !/\b(?:open|go to|switch|create|make|append|copy|summari[sz]e|compare|locate|find)\b/.test(normalized)
  ) return true;
  if (
    /^(?:hello|hi|hey|yo|howdy)\b/.test(normalized) &&
    (
      /\b(?:is this|is it|are we|is everything)\s+(?:working|on|live|connected|running|ok|okay)\b/.test(normalized) ||
      /\bis\s+this\s+thing\s+on\b/.test(normalized) ||
      /\bstill\s+(?:working|on|live|connected|running|ok|okay)\b/.test(normalized) ||
      /\b(?:you there|are you there|can you hear me|are you awake|you awake|are you alive|are you working)\b/.test(normalized)
    )
  ) return true;
  if (/^(?:hello|hi|hey|yo|howdy)[,\s]+(?:are\s+you\s+there|can\s+you\s+hear\s+me|are\s+you\s+awake|you\s+awake|are\s+you\s+alive)\b/.test(normalized)) return true;
  return false;
};
