import { AnchorConfig, Intent } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesPhrase(text: string, phrase: string): boolean {
  return normalize(text).includes(normalize(phrase));
}

function score(text: string, phrases: string[]): number {
  const normalized = normalize(text);
  let count = 0;
  for (const phrase of phrases) {
    if (includesPhrase(normalized, phrase)) {
      count += 1;
    }
  }
  return count;
}

export function routeIntent(userText: string, cfg: AnchorConfig): Intent {
  const architectureScore = score(userText, cfg.router.architectureKeywords);
  const ideologyScore = score(userText, cfg.router.ideologyKeywords);

  if (architectureScore > 0 && ideologyScore > 0) return "hybrid";
  if (architectureScore > 0) return "architecture";
  if (ideologyScore > 0) return "ideology";
  return "none";
}
