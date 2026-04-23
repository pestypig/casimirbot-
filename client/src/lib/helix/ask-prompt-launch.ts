import { navigate } from "wouter/use-browser-location";

export const HELIX_PENDING_ASK_KEY = "helix:pending-ask";
export const HELIX_ASK_PROMPT_EVENT = "helix-ask:prompt";

export type HelixAskAnswerContractSection = {
  id: string;
  heading: string;
  required?: boolean;
  synonyms?: string[];
};

export type HelixAskAnswerContract = {
  schema: "helix.ask.answer_contract.v1";
  source: "docs_viewer";
  mode: "summarize_doc" | "summarize_section" | "explain_paper";
  strict_sections?: boolean;
  sections?: HelixAskAnswerContractSection[];
  min_tokens?: number;
};

export type PendingHelixAskPrompt = {
  promptId: string;
  question: string;
  autoSubmit: boolean;
  blockId?: string | null;
  panelId?: string | null;
  bypassWorkstationDispatch?: boolean;
  forceReasoningDispatch?: boolean;
  suppressWorkstationPayloadActions?: boolean;
  answerContract?: HelixAskAnswerContract;
  createdAt: number;
};

const isDesktopRoute = () =>
  typeof window !== "undefined" && window.location.pathname.startsWith("/desktop");

export function clearPendingHelixAskPrompt() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HELIX_PENDING_ASK_KEY);
  } catch {
    // ignore storage failures
  }
}

export function consumePendingHelixAskPrompt(): PendingHelixAskPrompt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HELIX_PENDING_ASK_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(HELIX_PENDING_ASK_KEY);
    const parsed = JSON.parse(raw) as Partial<PendingHelixAskPrompt>;
    const question = typeof parsed.question === "string" ? parsed.question.trim() : "";
    if (!question) return null;
    return {
      promptId:
        typeof parsed.promptId === "string" && parsed.promptId.trim()
          ? parsed.promptId.trim()
          : crypto.randomUUID(),
      question,
      autoSubmit: parsed.autoSubmit !== false,
      blockId: typeof parsed.blockId === "string" && parsed.blockId.trim() ? parsed.blockId.trim() : null,
      panelId: typeof parsed.panelId === "string" && parsed.panelId.trim() ? parsed.panelId.trim() : null,
      bypassWorkstationDispatch: parsed.bypassWorkstationDispatch === true,
      forceReasoningDispatch: parsed.forceReasoningDispatch === true ? true : undefined,
      suppressWorkstationPayloadActions:
        parsed.suppressWorkstationPayloadActions === true ? true : undefined,
      answerContract:
        parsed.answerContract &&
        typeof parsed.answerContract === "object" &&
        !Array.isArray(parsed.answerContract)
          ? (parsed.answerContract as HelixAskAnswerContract)
          : undefined,
      createdAt:
        typeof parsed.createdAt === "number" && Number.isFinite(parsed.createdAt)
          ? parsed.createdAt
          : Date.now(),
    };
  } catch {
    clearPendingHelixAskPrompt();
    return null;
  }
}

export function launchHelixAskPrompt(args: {
  question: string;
  autoSubmit?: boolean;
  blockId?: string | null;
  panelId?: string | null;
  bypassWorkstationDispatch?: boolean;
  forceReasoningDispatch?: boolean;
  suppressWorkstationPayloadActions?: boolean;
  answerContract?: HelixAskAnswerContract;
}) {
  if (typeof window === "undefined") return;
  const question = args.question.trim();
  if (!question) return;

  const payload: PendingHelixAskPrompt = {
    promptId: crypto.randomUUID(),
    question,
    autoSubmit: args.autoSubmit !== false,
    blockId: args.blockId?.trim() || null,
    panelId: args.panelId?.trim() || null,
    bypassWorkstationDispatch: args.bypassWorkstationDispatch === true,
    forceReasoningDispatch: args.forceReasoningDispatch === true,
    suppressWorkstationPayloadActions: args.suppressWorkstationPayloadActions === true,
    answerContract: args.answerContract,
    createdAt: Date.now(),
  };

  try {
    window.localStorage.setItem(HELIX_PENDING_ASK_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures; the in-page event can still deliver the prompt
  }

  window.dispatchEvent(new CustomEvent(HELIX_ASK_PROMPT_EVENT, { detail: payload }));

  if (!isDesktopRoute()) {
    navigate("/desktop?desktop=1");
  }
}
