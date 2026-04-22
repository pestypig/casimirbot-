import { z } from "zod";

const HELIX_ASK_CLARIFY_RESCUE_SCHEMA = z.object({
  lane: z.enum(["conversation", "repo"]).optional(),
  action: z.enum(["answer", "clarify"]),
  answer: z.string().optional(),
  clarify: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type HelixAskClarifyRescueDecision = {
  lane: "conversation" | "repo";
  action: "answer" | "clarify";
  answer: string | null;
  clarify: string | null;
  confidence: number;
};

const HELIX_ASK_CLARIFY_RESCUE_GREETING_RE =
  /^(?:hi|hello|hey|yo|sup|what(?:'s| is)\s+up|how\s+are\s+you|good\s+(?:morning|afternoon|evening)|thanks|thank\s+you|ok|okay)\b/i;
const HELIX_ASK_CLARIFY_RESCUE_GREETING_ONLY_RE =
  /^(?:hi|hello|hey|yo|sup|what(?:'s| is)\s+up|how\s+are\s+you|good\s+(?:morning|afternoon|evening)|thanks|thank\s+you|ok|okay)(?:\s+there)?[!?.\s]*$/i;
const HELIX_ASK_CLARIFY_RESCUE_THANKS_ONLY_RE =
  /^(?:thanks|thank\s+you)(?:\s+(?:so\s+much|a\s+lot))?[!?.\s]*$/i;
const HELIX_ASK_CLARIFY_RESCUE_HOW_ARE_YOU_ONLY_RE = /^how\s+are\s+you[!?.\s]*$/i;

export const isHelixAskClarifyRescueCandidateQuestion = (question: string): boolean => {
  const trimmed = question.trim();
  if (!trimmed) return false;
  if (trimmed.length > 80) return false;
  if (/\d/.test(trimmed)) return false;
  return HELIX_ASK_CLARIFY_RESCUE_GREETING_RE.test(trimmed);
};

const normalizeGreetingTurn = (question: string): string =>
  question
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[!?.]+$/g, "")
    .trim();

export const isHelixAskClarifyRescueGreetingOnlyQuestion = (question: string): boolean => {
  const trimmed = question.trim();
  if (!trimmed) return false;
  if (trimmed.length > 48) return false;
  if (/\d/.test(trimmed)) return false;
  const normalized = normalizeGreetingTurn(trimmed);
  return HELIX_ASK_CLARIFY_RESCUE_GREETING_ONLY_RE.test(normalized);
};

export const renderHelixAskClarifyRescueGreetingOnlyAnswer = (
  question: string,
): string | null => {
  if (!isHelixAskClarifyRescueGreetingOnlyQuestion(question)) return null;
  const normalized = normalizeGreetingTurn(question);
  if (HELIX_ASK_CLARIFY_RESCUE_THANKS_ONLY_RE.test(normalized)) {
    return "You're welcome. How can I assist you next?";
  }
  if (HELIX_ASK_CLARIFY_RESCUE_HOW_ARE_YOU_ONLY_RE.test(normalized)) {
    return "I'm ready to help. What do you want to work on?";
  }
  return "Hello! How can I assist you today?";
};

const clipText = (value: string, limit: number): string => {
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
};

const extractJsonObject = (value: string): string | null => {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return value.slice(start, end + 1);
};

export const buildHelixAskClarifyRescuePrompt = (args: {
  question: string;
  currentClarify: string;
  repoCueSummary: string;
}): string => {
  const lines = [
    "You are Helix Ask pre-intent ambiguity rescue planner.",
    "Decide whether to answer directly or ask a clarifying question.",
    "Use action=answer for weak repo cues and conversational/open-world prompts.",
    "Use action=clarify only if repo anchoring is required now.",
    "Return strict JSON only. No markdown. No commentary.",
    'Schema: {"lane":"conversation|repo","action":"answer|clarify","answer":"string","clarify":"string","confidence":0.0}',
    "If action=answer, answer must be concise (<= 2 sentences).",
    "If action=clarify, clarify must be one concrete question.",
    "",
    `Question: ${args.question.trim()}`,
    `Current clarify candidate: ${args.currentClarify.trim()}`,
    `Repo cues: ${args.repoCueSummary.trim()}`,
  ];
  return lines.filter(Boolean).join("\n");
};

export const parseHelixAskClarifyRescueDecision = (
  raw: string,
): HelixAskClarifyRescueDecision | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const jsonCandidate = extractJsonObject(trimmed) ?? trimmed;
  try {
    const parsed = HELIX_ASK_CLARIFY_RESCUE_SCHEMA.safeParse(JSON.parse(jsonCandidate));
    if (!parsed.success) return null;
    const lane = parsed.data.lane === "repo" ? "repo" : "conversation";
    const action = parsed.data.action;
    const answer = parsed.data.answer ? clipText(parsed.data.answer, 320) : "";
    const clarify = parsed.data.clarify ? clipText(parsed.data.clarify, 220) : "";
    const confidenceRaw = parsed.data.confidence;
    const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw!)) : 0;
    return {
      lane,
      action,
      answer: answer || null,
      clarify: clarify || null,
      confidence,
    };
  } catch {
    return null;
  }
};
