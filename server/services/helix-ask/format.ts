import type { HelixAskIntentProfile } from "./intent-directory";

export type HelixAskFormat = "steps" | "compare" | "brief";
export type HelixAskFormatSpec = { format: HelixAskFormat; stageTags: boolean };

const HELIX_ASK_METHOD_TRIGGER = /(scientific method|methodology|method\b)/i;
const HELIX_ASK_STEP_TRIGGER =
  /(how to|how does|how do|steps?|step-by-step|procedure|process|workflow|pipeline|implement|implementation|configure|setup|set up|troubleshoot|debug|fix|resolve)/i;
const HELIX_ASK_COMPARE_TRIGGER =
  /(compare|versus|vs\.?|difference|better|worse|more accurate|accuracy|tradeoffs|advantages|what is|what's|why is|why are|how is|how are)/i;

const HELIX_ASK_COMPARE_QUESTION =
  /\b(compare|comparison|versus|vs\.?|difference|trade-?off|better|worse|pros|cons)\b/i;

export function decideHelixAskFormat(question?: string): HelixAskFormatSpec {
  const normalized = question?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return { format: "brief", stageTags: false };
  }
  if (HELIX_ASK_METHOD_TRIGGER.test(normalized)) {
    return { format: "steps", stageTags: true };
  }
  if (HELIX_ASK_STEP_TRIGGER.test(normalized)) {
    return { format: "steps", stageTags: false };
  }
  if (
    HELIX_ASK_COMPARE_TRIGGER.test(normalized) ||
    normalized.startsWith("why ") ||
    normalized.startsWith("what is") ||
    normalized.startsWith("what's")
  ) {
    return { format: "compare", stageTags: false };
  }
  return { format: "brief", stageTags: false };
}

export function resolveHelixAskFormat(
  question: string,
  intentProfile: HelixAskIntentProfile | null,
  debugEnabled: boolean,
): HelixAskFormatSpec {
  const normalized = question.trim().toLowerCase();
  const base = decideHelixAskFormat(question);
  let format = base.format;
  const policy = intentProfile?.formatPolicy ?? "auto";
  if (policy !== "auto") {
    format = policy;
  }
  const stagePolicy = intentProfile?.stageTags ?? "on_request";
  let stageTags = false;
  if (stagePolicy === "never") {
    stageTags = false;
  } else if (stagePolicy === "on_request") {
    stageTags = HELIX_ASK_METHOD_TRIGGER.test(normalized);
  } else {
    stageTags =
      HELIX_ASK_METHOD_TRIGGER.test(normalized) ||
      (debugEnabled && (intentProfile?.tier === "F2" || intentProfile?.tier === "F3"));
  }
  return { format, stageTags };
}

const collapseListParagraph = (paragraph: string): string => {
  const lines = paragraph.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const cleaned: string[] = [];
  for (const line of lines) {
    const stripped = line.replace(/^\s*(\d+\.\s+|[-*]\s+)/, "").trim();
    if (!stripped) continue;
    const endsWithPunct = /[.!?]$/.test(stripped);
    cleaned.push(endsWithPunct ? stripped : `${stripped}.`);
  }
  return cleaned.join(" ").trim();
};

export function enforceHelixAskAnswerFormat(
  answer: string,
  format: HelixAskFormat,
  question: string,
): string {
  if (!answer) return answer;
  if (format !== "compare" && format !== "brief") return answer;
  const paragraphs = answer.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  if (paragraphs.length === 0) return answer;
  const allowBullets = HELIX_ASK_COMPARE_QUESTION.test(question);
  const nonListParagraphs = paragraphs.filter((paragraph) => {
    const lines = paragraph.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const listLines = lines.filter((line) => /^\s*(\d+\.\s+|[-*]\s+)/.test(line));
    return listLines.length < lines.length;
  });
  const hasMeaningfulNonListParagraph = nonListParagraphs.some((paragraph) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return false;
    if (/^in practice,/i.test(trimmed)) return false;
    return trimmed.split(/\s+/).length >= 6;
  });
  const normalized: string[] = [];
  for (const paragraph of paragraphs) {
    const lines = paragraph.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const listLines = lines.filter((line) => /^\s*(\d+\.\s+|[-*]\s+)/.test(line));
    const nonListLines = lines.length - listLines.length;
    if (listLines.length > 0) {
      if (!allowBullets && hasMeaningfulNonListParagraph && nonListLines === 0) {
        continue;
      }
      const collapsed = collapseListParagraph(listLines.join("\n"));
      if (collapsed) {
        normalized.push(collapsed);
      }
      if (nonListLines > 0) {
        const remainder = lines.filter((line) => !/^\s*(\d+\.\s+|[-*]\s+)/.test(line)).join(" ");
        if (remainder.trim()) {
          normalized.push(remainder.trim());
        }
      }
      continue;
    }
    normalized.push(paragraph);
  }
  let merged = normalized.join("\n\n").trim();
  if (merged && !HELIX_ASK_COMPARE_QUESTION.test(question)) {
    merged = merged.replace(/\n{2,}In practice,/gi, "\n\nIn practice,");
  }
  return merged;
}

export function collapseEvidenceBullets(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const listLines = lines.filter((line) => /^\s*(\d+\.\s+|[-*]\s+)/.test(line));
  if (listLines.length === 0) return "";
  return collapseListParagraph(listLines.join("\n"));
}
