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

export function formatDistilledAnswer(input: {
  conciseAnswer: string;
  caveat?: string | null;
  style: HelixConversationalAnswerStyle;
  expansionAvailable: boolean;
}): string {
  const answer = input.conciseAnswer.trim();
  const caveat = input.caveat?.trim();
  const withCaveat = caveat && !answer.includes(caveat) ? `${answer} ${caveat}` : answer;
  if (input.style === "voice") return withCaveat.split(/\s+/).slice(0, 34).join(" ").replace(/[,:;]$/, ".");
  if (input.style === "debug") return withCaveat;
  if (input.expansionAvailable) return `${withCaveat} Details are saved in the procedure log.`;
  return withCaveat;
}
