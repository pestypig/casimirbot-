import { navigate } from "wouter/use-browser-location";

export const HELIX_PENDING_ASK_KEY = "helix:pending-ask";
export const HELIX_ASK_PROMPT_EVENT = "helix-ask:prompt";

export type PendingHelixAskPrompt = {
  question: string;
  autoSubmit: boolean;
  blockId?: string | null;
  panelId?: string | null;
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
      question,
      autoSubmit: parsed.autoSubmit !== false,
      blockId: typeof parsed.blockId === "string" && parsed.blockId.trim() ? parsed.blockId.trim() : null,
      panelId: typeof parsed.panelId === "string" && parsed.panelId.trim() ? parsed.panelId.trim() : null,
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
}) {
  if (typeof window === "undefined") return;
  const question = args.question.trim();
  if (!question) return;

  const payload: PendingHelixAskPrompt = {
    question,
    autoSubmit: args.autoSubmit !== false,
    blockId: args.blockId?.trim() || null,
    panelId: args.panelId?.trim() || null,
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
