import {
  formatReadAloudButtonLabel,
  shouldStopReadAloudOnButtonPress,
  type ReadAloudPlaybackState,
} from "@/lib/helix/ask-read-aloud-display";
import {
  cleanHelixRenderedFinalAnswerText,
  cleanHelixRenderedQuestionText,
  normalizedDebugReplyText,
} from "@/lib/helix/ask-debug-event-display";
import { formatEnvelopeSectionsForCopy } from "@/lib/helix/ask-envelope-copy";
import { resolveHelixVisibleTerminal } from "@/lib/helix/resolveHelixVisibleTerminal";
import type { HelixAskLatestTurnBinding } from "./HelixAskLatestTurnBinding";

type HelixAskLegacyReplyEnvelopeSection = {
  layer?: string;
  title?: unknown;
  body?: unknown;
  citations?: unknown;
};

type HelixAskLegacyReplyForControls = {
  id?: string;
  content?: unknown;
  text?: unknown;
  debug?: unknown;
  turn_id?: unknown;
  turnId?: unknown;
  resolved_turn_summary?: unknown;
  terminal_answer_authority?: unknown;
  envelope?: {
    answer?: unknown;
    extension?: {
      body?: unknown;
    } | null;
    sections?: HelixAskLegacyReplyEnvelopeSection[];
  } | null;
  [key: string]: unknown;
};

export type HelixAskLegacyTurnControlTextArgs = {
  visibleFinalAnswerText?: unknown;
  fallbackCopyText?: unknown;
};

export type HelixAskLegacyDebugCopyLocalPayloadArgs = {
  providedPayload?: unknown;
  normalizedPayload: string;
  renderedButtonScopedPayload?: string | null;
  providedPayloadMatchesRenderedTurn: boolean;
};

export type HelixAskLegacyDebugCopyLocalPayloadSelection = {
  localExportPayload: string;
  source: "provided_rendered_turn_payload" | "rendered_button_scope" | "normalized_payload";
};

export type HelixAskLegacyClickedTurnDebugScope = {
  question?: string | null;
  finalAnswer?: string | null;
  terminalArtifactKind?: string | null;
  activeTurnId?: string | null;
  clientTurnId?: string | null;
};

export type HelixAskLegacyClickedTurnDebugGuardArgs = {
  exportPayload: string;
  clickedButtonScopedPayload?: string | null;
  clickedTurnScope?: HelixAskLegacyClickedTurnDebugScope | null;
  payloadMatchesClickedTurn: (payload: string) => boolean;
};

export type HelixAskLegacyDebugExportBackendRef = {
  endpoint?: string;
  turn_id?: string;
  [key: string]: unknown;
};

export type HelixAskLegacyDebugExportBackendTarget = {
  activeTurnId: string;
  backendRef: HelixAskLegacyDebugExportBackendRef | null;
  endpoint: string | null;
  status: "ready" | "not_advertised" | "turn_mismatch";
};

export type HelixAskLegacyTurnControlViewModel = {
  showDebugCopy: boolean;
  debugCopyDisabled: boolean;
  copyFinalTestId?: HelixAskLatestTurnBinding["copyFinalTestId"];
  debugCopyTestId?: HelixAskLatestTurnBinding["debugCopyTestId"];
  readAloudTestId?: HelixAskLatestTurnBinding["readAloudTestId"];
  readAloudActive: boolean;
  readAloudAriaLabel: "Read aloud" | "Stop reading";
  readAloudTitle: string;
};

function coerceControlText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch {
    return "";
  }
}

function readControlRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readBackendDebugRef(value: unknown): HelixAskLegacyDebugExportBackendRef | null {
  const record = readControlRecord(value);
  if (!record) return null;
  const endpoint = coerceControlText(record.endpoint).trim();
  if (!endpoint.startsWith("/api/agi/ask/turn/")) return null;
  return {
    ...record,
    endpoint,
    turn_id: coerceControlText(record.turn_id).trim() || undefined,
  };
}

export function buildHelixAskLegacyTurnControlViewModel(args: {
  latestTurnBinding: HelixAskLatestTurnBinding;
  showDebugCopy: boolean;
  browserAvailable: boolean;
  readAloudState?: ReadAloudPlaybackState | null;
}): HelixAskLegacyTurnControlViewModel {
  const readAloudState = args.readAloudState ?? "idle";
  const readAloudActive = shouldStopReadAloudOnButtonPress(readAloudState);
  return {
    showDebugCopy: args.showDebugCopy,
    debugCopyDisabled: !args.browserAvailable,
    copyFinalTestId: args.latestTurnBinding.copyFinalTestId,
    debugCopyTestId: args.latestTurnBinding.debugCopyTestId,
    readAloudTestId: args.latestTurnBinding.readAloudTestId,
    readAloudActive,
    readAloudAriaLabel: readAloudActive ? "Stop reading" : "Read aloud",
    readAloudTitle: formatReadAloudButtonLabel(readAloudState),
  };
}

export function resolveHelixAskLegacyTurnControlText(
  args: HelixAskLegacyTurnControlTextArgs,
): string {
  const visibleFinalAnswerText = coerceControlText(args.visibleFinalAnswerText).trim();
  if (visibleFinalAnswerText) return visibleFinalAnswerText;
  return coerceControlText(args.fallbackCopyText);
}

export function buildHelixAskReplyCopyText(reply: HelixAskLegacyReplyForControls | null | undefined): string {
  if (!reply) return "";
  const fallbackContent = coerceControlText(reply.content || reply.text);
  const terminal = resolveHelixVisibleTerminal(reply, fallbackContent);
  if (terminal.backendTerminalText && terminal.text) return terminal.text;
  if (!reply.envelope) return terminal.text || fallbackContent;
  const sections = reply.envelope.sections ?? [];
  const detailSections = sections.filter((section) => section.layer !== "proof");
  const proofSections = sections.filter((section) => section.layer === "proof");
  const chunks: string[] = [coerceControlText(reply.envelope.answer)];
  const extensionBody = coerceControlText(reply.envelope.extension?.body).trim();
  if (extensionBody) {
    chunks.push(`Additional Repo Context\n${extensionBody}`);
  }
  if (detailSections.length > 0) {
    const detailText = formatEnvelopeSectionsForCopy(detailSections, "Details");
    if (detailText) {
      chunks.push(`Details\n${detailText}`);
    }
  }
  if (proofSections.length > 0) {
    const proofText = formatEnvelopeSectionsForCopy(proofSections, "Proof");
    if (proofText) {
      chunks.push(`Proof\n${proofText}`);
    }
  }
  const envelopeText = chunks.filter(Boolean).join("\n\n").trim();
  return envelopeText || terminal.text || fallbackContent;
}

export function selectHelixAskLegacyDebugCopyLocalPayload(
  args: HelixAskLegacyDebugCopyLocalPayloadArgs,
): HelixAskLegacyDebugCopyLocalPayloadSelection {
  const renderedButtonScopedPayload = coerceControlText(args.renderedButtonScopedPayload).trim();
  if (renderedButtonScopedPayload) {
    return {
      localExportPayload: renderedButtonScopedPayload,
      source: "rendered_button_scope",
    };
  }

  const providedPayload = coerceControlText(args.providedPayload).trim();
  if (providedPayload && args.providedPayloadMatchesRenderedTurn) {
    return {
      localExportPayload: providedPayload,
      source: "provided_rendered_turn_payload",
    };
  }

  return {
    localExportPayload: args.normalizedPayload,
    source: "normalized_payload",
  };
}

export function selectHelixAskLegacyGuardedDebugExportPayload(
  args: HelixAskLegacyClickedTurnDebugGuardArgs,
): string {
  const rendered = args.clickedTurnScope;
  if (!rendered) return args.exportPayload;
  const scopedPayload = coerceControlText(args.clickedButtonScopedPayload).trim();
  if (!scopedPayload) return args.exportPayload;
  try {
    const parsed = JSON.parse(args.exportPayload) as Record<string, unknown>;
    const parsedReply = readControlRecord(parsed.reply);
    const parsedCurrentTurn = readControlRecord(parsed.currentTurn);
    const activeTurnCandidates = [
      parsed.active_turn_id,
      parsed.backend_turn_id,
      parsed.selectedDebugTurnId,
      parsedCurrentTurn?.turn_id,
      parsedCurrentTurn?.turnId,
    ]
      .map((candidate) => coerceControlText(candidate).trim())
      .filter(Boolean);
    const renderedActiveTurnId = coerceControlText(rendered.activeTurnId).trim();
    if (
      renderedActiveTurnId &&
      activeTurnCandidates.length > 0 &&
      !activeTurnCandidates.some((candidate) => candidate === renderedActiveTurnId)
    ) {
      return scopedPayload;
    }
    const clientTurnCandidates = [
      parsed.client_active_turn_id,
      parsed.ui_client_active_turn_id,
      parsedReply?.client_id,
      parsedReply?.id,
    ]
      .map((candidate) => coerceControlText(candidate).trim())
      .filter(Boolean);
    const renderedClientTurnId = coerceControlText(rendered.clientTurnId).trim();
    if (
      renderedClientTurnId &&
      clientTurnCandidates.length > 0 &&
      !clientTurnCandidates.some((candidate) => candidate === renderedClientTurnId)
    ) {
      return scopedPayload;
    }
    if (!args.payloadMatchesClickedTurn(args.exportPayload)) {
      return scopedPayload;
    }
    return args.exportPayload;
  } catch {
    return scopedPayload;
  }
}

function resolveHelixAskLegacyTerminalArtifactKindFromText(args: {
  terminalSource?: string | null;
  finalAnswer?: string | null;
  fallbackText?: string | null;
}): string | null {
  const terminalSource = coerceControlText(args.terminalSource).trim();
  const finalAnswer = coerceControlText(args.finalAnswer);
  const fallbackText = coerceControlText(args.fallbackText);
  if (/compound evidence synthesis answer/i.test(terminalSource)) return "compound_evidence_synthesis_answer";
  if (/workstation tool evaluation/i.test(terminalSource)) return "workstation_tool_evaluation";
  if (/typed failure/i.test(terminalSource)) return "typed_failure";
  if (/COMPOUND EVIDENCE SYNTHESIS ANSWER/i.test(finalAnswer || fallbackText)) return "compound_evidence_synthesis_answer";
  if (/WORKSTATION TOOL EVALUATION/i.test(finalAnswer || fallbackText)) return "workstation_tool_evaluation";
  if (/TYPED FAILURE/i.test(finalAnswer || fallbackText)) return "typed_failure";
  return null;
}

export function extractHelixAskLegacyClickedTurnDebugScopeFromAncestor(
  sourceElement: HTMLElement | null | undefined,
): HelixAskLegacyClickedTurnDebugScope | null {
  if (!sourceElement) return null;
  let node: HTMLElement | null = sourceElement;
  for (let depth = 0; node && depth < 10; depth += 1, node = node.parentElement) {
    const questionNode = node.querySelector<HTMLElement>('[data-stream-row-source="question"], [data-testid="helix-ask-latest-question"]');
    const finalNode = node.querySelector<HTMLElement>('[data-stream-row-source="final"], [data-testid="helix-ask-latest-final-answer"]');
    const renderedQuestion = cleanHelixRenderedQuestionText(questionNode?.innerText || questionNode?.textContent || "");
    const renderedFinalAnswer =
      cleanHelixRenderedFinalAnswerText(finalNode?.getAttribute("data-final-answer-text")) ??
      cleanHelixRenderedFinalAnswerText(finalNode?.innerText || finalNode?.textContent || "");
    if (renderedQuestion || renderedFinalAnswer) {
      return {
        question: renderedQuestion,
        finalAnswer: renderedFinalAnswer,
        terminalArtifactKind: resolveHelixAskLegacyTerminalArtifactKindFromText({
          terminalSource: finalNode?.getAttribute("data-visible-terminal-source"),
          finalAnswer: renderedFinalAnswer,
        }),
        activeTurnId: null,
        clientTurnId: null,
      };
    }
    const text = (node.innerText || "").trim();
    if (!text || !/\bQuestion\b/i.test(text) || !/\bFinal answer\b/i.test(text)) continue;
    const questionMatch = text.match(/Question\s+QUESTION\s+([\s\S]*?)\s+USER PROMPT/i);
    const finalMatch = text.match(/Final answer\s+FINAL\s+([\s\S]*?)(?:\s+IN HELIX CONSOLE|\s+\d+\s+Question|\s*$)/i);
    const question = questionMatch?.[1]?.trim() || null;
    const finalAnswer = finalMatch?.[1]?.trim() || null;
    if (!question && !finalAnswer) continue;
    return {
      question,
      finalAnswer,
      terminalArtifactKind: resolveHelixAskLegacyTerminalArtifactKindFromText({ finalAnswer, fallbackText: text }),
      activeTurnId: null,
      clientTurnId: null,
    };
  }
  return null;
}

export function extractHelixAskLegacyClickedTurnDebugScope(
  sourceElement: HTMLElement | null | undefined,
): HelixAskLegacyClickedTurnDebugScope | null {
  if (!sourceElement) return null;
  const readSourceAttribute = (name: string): string => {
    if (typeof sourceElement.getAttribute !== "function") return "";
    return sourceElement.getAttribute(name) || "";
  };
  const readTurnScopeAttribute = (name: string, legacyName: string): string =>
    readSourceAttribute(name) || readSourceAttribute(legacyName);
  const scopedQuestion = cleanHelixRenderedQuestionText(
    readTurnScopeAttribute("data-turn-control-question", "data-debug-copy-question"),
  );
  const scopedFinalAnswer = cleanHelixRenderedFinalAnswerText(
    readTurnScopeAttribute("data-turn-control-final-answer", "data-debug-copy-final-answer"),
  );
  const scopedActiveTurnId = coerceControlText(
    readTurnScopeAttribute("data-turn-control-active-turn-id", "data-debug-copy-active-turn-id"),
  ).trim();
  const scopedClientTurnId = coerceControlText(
    readTurnScopeAttribute("data-turn-control-client-turn-id", "data-debug-copy-client-turn-id"),
  ).trim();
  const scopedTerminalArtifactKind = coerceControlText(
    readTurnScopeAttribute("data-turn-control-terminal-artifact-kind", "data-debug-copy-terminal-artifact-kind"),
  ).trim();
  if (scopedQuestion || scopedFinalAnswer || scopedActiveTurnId || scopedClientTurnId) {
    const ancestorScope = extractHelixAskLegacyClickedTurnDebugScopeFromAncestor(sourceElement);
    const ancestorQuestion = normalizedDebugReplyText(ancestorScope?.question);
    const ancestorFinalAnswer = normalizedDebugReplyText(ancestorScope?.finalAnswer);
    const scopedQuestionKey = normalizedDebugReplyText(scopedQuestion);
    const scopedFinalAnswerKey = normalizedDebugReplyText(scopedFinalAnswer);
    const staleAttributeMismatch =
      Boolean(ancestorQuestion && scopedQuestionKey && ancestorQuestion !== scopedQuestionKey) ||
      Boolean(ancestorFinalAnswer && scopedFinalAnswerKey && ancestorFinalAnswer !== scopedFinalAnswerKey);
    if (ancestorScope && staleAttributeMismatch) {
      return {
        ...ancestorScope,
        activeTurnId: null,
        clientTurnId: ancestorScope.clientTurnId ?? scopedClientTurnId ?? null,
      };
    }
    return {
      question: scopedQuestion || null,
      finalAnswer: scopedFinalAnswer || null,
      terminalArtifactKind: scopedTerminalArtifactKind || null,
      activeTurnId: scopedActiveTurnId || null,
      clientTurnId: scopedClientTurnId || null,
    };
  }
  return extractHelixAskLegacyClickedTurnDebugScopeFromAncestor(sourceElement);
}

export function resolveHelixAskLegacyReplyDebugTurnId(
  reply: HelixAskLegacyReplyForControls | null | undefined,
): string {
  if (!reply) return "";
  const replyRecord = reply as Record<string, unknown>;
  const replyDebugRecord = readControlRecord(reply.debug);
  const resolvedTurnSummary = readControlRecord(
    replyRecord.resolved_turn_summary ?? replyDebugRecord?.resolved_turn_summary,
  );
  const terminalAuthority = readControlRecord(
    replyRecord.terminal_answer_authority ?? replyDebugRecord?.terminal_answer_authority,
  );
  const candidates = [
    replyRecord.turn_id,
    replyRecord.turnId,
    replyDebugRecord?.turn_id,
    replyDebugRecord?.turnId,
    resolvedTurnSummary?.turn_id,
    terminalAuthority?.turn_id,
    reply.id,
  ];
  for (const candidate of candidates) {
    const turnId = coerceControlText(candidate).trim();
    if (turnId) return turnId;
  }
  return reply.id ?? "";
}

export function isHelixAskLegacyBackendDebugExportEligibleTurnId(turnId: string): boolean {
  const trimmed = turnId.trim();
  return Boolean(trimmed && (trimmed.startsWith("ask:") || /(?:^|:)ask:[^:]+/i.test(trimmed)));
}

export function resolveHelixAskLegacyDebugExportBackendTarget(
  parsedPayload: Record<string, unknown>,
): HelixAskLegacyDebugExportBackendTarget {
  const activeTurnId = coerceControlText(parsedPayload.active_turn_id).trim();
  const rebuildReason = coerceControlText(parsedPayload.debug_export_rebuild_reason).trim();
  const isReplyScopedRebuild =
    rebuildReason === "empty_payload" ||
    rebuildReason === "payload_reply_mismatch" ||
    rebuildReason === "invalid_json_payload" ||
    rebuildReason === "rendered_reply" ||
    rebuildReason === "rendered_button_scope";
  const parsedDebug = readControlRecord(parsedPayload.debug);
  const refCandidates = [
    readBackendDebugRef(parsedPayload.backend_debug_response_ref),
    readBackendDebugRef(parsedPayload.debug_export_ref),
    readBackendDebugRef(parsedDebug?.backend_debug_response_ref),
    readBackendDebugRef(parsedDebug?.debug_export_ref),
  ].filter((entry): entry is HelixAskLegacyDebugExportBackendRef => Boolean(entry));
  const activeTurnFallbackRef = isHelixAskLegacyBackendDebugExportEligibleTurnId(activeTurnId)
    ? {
        endpoint: `/api/agi/ask/turn/${encodeURIComponent(activeTurnId)}/debug-export`,
        turn_id: activeTurnId,
      }
    : null;
  const matchingBackendRef = refCandidates.find((entry) => {
    const candidateTurnId = coerceControlText(entry.turn_id).trim();
    return Boolean(activeTurnId && candidateTurnId === activeTurnId);
  });
  if (isReplyScopedRebuild && !matchingBackendRef && !activeTurnFallbackRef) {
    return {
      activeTurnId,
      backendRef: null,
      endpoint: null,
      status: "not_advertised",
    };
  }
  const backendRef =
    matchingBackendRef ??
    (isReplyScopedRebuild ? null : refCandidates[0]) ??
    activeTurnFallbackRef;
  const endpoint = coerceControlText(backendRef?.endpoint).trim();
  if (!endpoint || !endpoint.startsWith("/api/agi/ask/turn/")) {
    return {
      activeTurnId,
      backendRef: null,
      endpoint: null,
      status: "not_advertised",
    };
  }
  const backendTurnId = coerceControlText(backendRef?.turn_id).trim();
  if (backendTurnId && activeTurnId && backendTurnId !== activeTurnId) {
    return {
      activeTurnId,
      backendRef,
      endpoint,
      status: "turn_mismatch",
    };
  }
  return {
    activeTurnId,
    backendRef,
    endpoint,
    status: "ready",
  };
}
