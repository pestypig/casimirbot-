import {
  formatReadAloudButtonLabel,
  shouldStopReadAloudOnButtonPress,
  type ReadAloudPlaybackState,
} from "@/lib/helix/ask-read-aloud-display";
import type { HelixAskLatestTurnBinding } from "./HelixAskLatestTurnBinding";

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

export function selectHelixAskLegacyDebugCopyLocalPayload(
  args: HelixAskLegacyDebugCopyLocalPayloadArgs,
): HelixAskLegacyDebugCopyLocalPayloadSelection {
  const providedPayload = coerceControlText(args.providedPayload).trim();
  if (providedPayload && args.providedPayloadMatchesRenderedTurn) {
    return {
      localExportPayload: args.normalizedPayload,
      source: "provided_rendered_turn_payload",
    };
  }

  const renderedButtonScopedPayload = coerceControlText(args.renderedButtonScopedPayload).trim();
  if (renderedButtonScopedPayload) {
    return {
      localExportPayload: renderedButtonScopedPayload,
      source: "rendered_button_scope",
    };
  }

  return {
    localExportPayload: args.normalizedPayload,
    source: "normalized_payload",
  };
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
