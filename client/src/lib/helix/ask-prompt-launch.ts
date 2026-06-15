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
  mode: "summarize_doc" | "summarize_section" | "explain_paper" | "locate_in_doc";
  strict_sections?: boolean;
  sections?: HelixAskAnswerContractSection[];
  min_tokens?: number;
};

export type HelixAskMailboxWakeRequiredCanonicalGoal =
  | "processed_mail_interpretation"
  | "processed_mail_voice_decision"
  | "processed_mail_checkpoint";

export type HelixAskStagePlayMailboxWakeRouteMetadata = {
  schema?: "helix.ask.route_metadata.v1" | string;
  source?: "stage_play_mail_wake" | string;
  invocationKind: "stage_play_mail_wake";
  wakeRequestId: string;
  mailboxThreadId: string;
  sourceTarget: "live_source_mailbox";
  requiredCanonicalGoal: HelixAskMailboxWakeRequiredCanonicalGoal;
  requiredPhase?: string;
  allowedCapabilities: string[];
  forbiddenCapabilities: string[];
  evidenceRefs: string[];
  source_target_intent?: Record<string, unknown>;
  stage_play_live_source_mailbox_debug?: Record<string, unknown>;
  live_source_mailbox_authority_summary?: Record<string, unknown>;
  mandatory_next_tool?: Record<string, unknown>;
  requiredToolFamily?: string | null;
  compact_context?: Record<string, unknown>;
  context_resume_frame?: Record<string, unknown> | null;
  contextResumeFrame?: Record<string, unknown> | null;
};

export type HelixAskGenericRouteMetadata = {
  schema?: "helix.ask.route_metadata.v1" | string;
  source?: "stage_play_mail_wake" | string;
  invocationKind?: "stage_play_mail_wake" | string;
  wakeRequestId?: string | null;
  mailboxThreadId?: string | null;
  sourceTarget?: "live_source_mailbox" | string;
  requiredCanonicalGoal?:
    | "processed_mail_interpretation"
    | "processed_mail_voice_decision"
    | "processed_mail_checkpoint"
    | string;
  requiredPhase?: string | null;
  allowedCapabilities?: string[];
  forbiddenCapabilities?: string[];
  evidenceRefs?: string[];
  source_target_intent?: Record<string, unknown>;
  stage_play_live_source_mailbox_debug?: Record<string, unknown>;
  live_source_mailbox_authority_summary?: Record<string, unknown>;
  mandatory_next_tool?: Record<string, unknown>;
  requiredToolFamily?: string | null;
  compact_context?: Record<string, unknown>;
  context_resume_frame?: Record<string, unknown> | null;
  contextResumeFrame?: Record<string, unknown> | null;
};

export type HelixAskRouteMetadata =
  | HelixAskStagePlayMailboxWakeRouteMetadata
  | HelixAskGenericRouteMetadata;

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
  routeMetadata?: HelixAskRouteMetadata;
  route_metadata?: HelixAskRouteMetadata;
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
    const routeMetadata =
      parsed.routeMetadata &&
      typeof parsed.routeMetadata === "object" &&
      !Array.isArray(parsed.routeMetadata)
        ? (parsed.routeMetadata as HelixAskRouteMetadata)
        : parsed.route_metadata &&
            typeof parsed.route_metadata === "object" &&
            !Array.isArray(parsed.route_metadata)
          ? (parsed.route_metadata as HelixAskRouteMetadata)
          : undefined;
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
      routeMetadata,
      route_metadata: routeMetadata,
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
  routeMetadata?: HelixAskRouteMetadata;
  route_metadata?: HelixAskRouteMetadata;
}) {
  if (typeof window === "undefined") return;
  const question = args.question.trim();
  if (!question) return;

  const routeMetadata = args.routeMetadata ?? args.route_metadata;
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
    routeMetadata,
    route_metadata: routeMetadata,
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
