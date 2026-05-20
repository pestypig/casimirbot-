import type { HelixConversationalAnswerStyle } from "@shared/helix-conversational-answer-distillation";

export function chooseLiveAnswerStyle(input: {
  promptText: string;
  inputModality?: string | null;
}): HelixConversationalAnswerStyle {
  if (input.inputModality === "voice") return "voice";
  if (/\b(?:debug|show\s+evidence|evidence\s+refs?|full\s+details?|go\s+to\s+log|raw\s+refs?)\b/i.test(input.promptText)) {
    return "debug";
  }
  if (/\b(?:why|replay|what\s+changed|confidence|epoch|stay\s+silent|interject)\b/i.test(input.promptText)) {
    return "operational";
  }
  return "brief";
}

const normalizeLine = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const ensureTerminalPunctuation = (value: string): string => {
  const text = normalizeLine(value);
  if (!text) return text;
  return /[.!?]$/.test(text) ? text : `${text}.`;
};

const stripDuplicateCaveatLead = (value: string): string =>
  value.replace(/^caveat:\s*/i, "").trim();

const joinAuthorizedAnswerParts = (input: {
  answer: string;
  caveat?: string | null;
}): string => {
  const answer = ensureTerminalPunctuation(input.answer);
  const caveat = stripDuplicateCaveatLead(normalizeLine(input.caveat ?? ""));
  if (!caveat || answer.toLowerCase().includes(caveat.toLowerCase())) return answer;
  return `${answer} Caveat: ${ensureTerminalPunctuation(caveat)}`;
};

export function formatDistilledAnswer(input: {
  conciseAnswer: string;
  caveat?: string | null;
  style: HelixConversationalAnswerStyle;
  expansionAvailable: boolean;
}): string {
  const withCaveat = joinAuthorizedAnswerParts({
    answer: input.conciseAnswer,
    caveat: input.caveat,
  });
  if (input.style === "debug") return withCaveat;
  return withCaveat;
}
