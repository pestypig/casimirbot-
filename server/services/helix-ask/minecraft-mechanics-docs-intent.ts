export type MinecraftMechanicsDocsPromptMatch = {
  matched_text: string;
  match_index: number;
  match_end_index: number;
};

const RETRIEVAL_PATTERN =
  /\b(?:look\s+up|search|find|consult|check|review|read|cite|quote|extract)\b/i;

const MINECRAFT_SCOPE_PATTERN =
  /\b(?:minecraft|fabric|paper|minehut|mine\s*hut|in[-\s]?game)\b|\bconnected\s+(?:environment|game|world|server)\b/i;

const MECHANICS_EVIDENCE_PATTERN =
  /\b(?:mechanics|commands?|syntax|documentation|docs?|guide|playbook|source|citations?|lines?|evidence)\b/i;

/**
 * Recognizes an immediate request to retrieve Minecraft mechanics guidance.
 * It deliberately does not admit command execution: a prompt may positively
 * request documentation while separately saying not to change the live world.
 */
export const minecraftMechanicsDocsPromptMatch = (
  promptText: string | null | undefined,
): MinecraftMechanicsDocsPromptMatch | null => {
  const prompt = String(promptText ?? "").trim();
  if (
    !prompt ||
    !MINECRAFT_SCOPE_PATTERN.test(prompt) ||
    !MECHANICS_EVIDENCE_PATTERN.test(prompt)
  ) {
    return null;
  }

  const retrieval = prompt.match(RETRIEVAL_PATTERN);
  if (!retrieval || typeof retrieval.index !== "number") return null;
  const index = retrieval.index;
  const prefix = prompt.slice(Math.max(0, index - 180), index);
  const window = prompt.slice(
    Math.max(0, index - 180),
    Math.min(prompt.length, index + 260),
  );

  if (
    /\b(?:do\s+not|don['’]?t|dont|never|avoid|without|no\s+need\s+to|not\s+asking\s+to)\b[\s\S]{0,80}$/i.test(
      prefix,
    ) ||
    /\b(?:later|eventually|tomorrow|someday|not\s+now|if|when|unless|once|may|might)\b[\s\S]{0,120}$/i.test(
      prefix,
    ) ||
    /\b(?:earlier|previously|historically|last\s+turn|last\s+time)\b[\s\S]{0,140}$/i.test(
      prefix,
    ) ||
    /\b(?:screen|page|button|label|ui|transcript|example|quoted?|someone\s+said)\b[\s\S]{0,160}\b(?:says|shows|reads|contains|mentions|asks?|called|named)\b/i.test(
      window,
    ) ||
    /["'`“”‘’][^"'`“”‘’\r\n]{0,100}\b(?:look\s+up|search|find|consult|check|review|read|cite|quote|extract)\b/i.test(
      window,
    )
  ) {
    return null;
  }

  return {
    matched_text: retrieval[0],
    match_index: index,
    match_end_index: index + retrieval[0].length,
  };
};

export const isMinecraftMechanicsDocsPrompt = (
  promptText: string | null | undefined,
): boolean => minecraftMechanicsDocsPromptMatch(promptText) !== null;
