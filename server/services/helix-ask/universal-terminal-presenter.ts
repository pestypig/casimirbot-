import crypto from "node:crypto";
import {
  HELIX_RECEIPT_PRESENTATION_SNAPSHOT_SCHEMA,
  type HelixReceiptPresentationSnapshot,
} from "@shared/helix-receipt-presentation-snapshot";
import {
  HELIX_TERMINAL_PRESENTATION_SCHEMA,
  type HelixTerminalPresentation,
  type HelixTerminalPresentationStyle,
} from "@shared/helix-terminal-presentation";
import { recordReceiptPresentationSnapshot } from "./receipt-presentation-snapshot-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const readObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function distillLivePipelineReceipt(input: {
  rawTerminalText: string;
  terminalArtifact: unknown;
}): { concise: string; importantState: Record<string, unknown> } {
  const receipt = readObject(input.terminalArtifact);
  const freshness = readObject(receipt.producer_freshness);
  const cadenceMs = readNumber(receipt.cadence_ms) ?? readNumber(readObject(receipt.cadence).cadence_ms);
  const seconds = cadenceMs ? Math.round(cadenceMs / 1000) : null;
  const actionId = readString(receipt.action_id) ?? "situation-room.live-source.set_rate";
  const clientStatus = readString(freshness.client_adoption_status) ?? null;
  const readiness = readString(freshness.readiness_state) ?? null;
  const staleReason = readString(freshness.stale_reason) ?? null;
  const nextRequiredAction =
    readString(freshness.next_required_action) ??
    readString(receipt.next_required_action) ??
    (Array.isArray(receipt.next_repair_actions) ? readString(receipt.next_repair_actions[0]) : null);
  const importantState = {
    action_id: actionId,
    cadence_ms: cadenceMs,
    producer_state: readiness ?? clientStatus ?? staleReason ?? "unknown",
    client_adoption_status: clientStatus,
    next_required_action: nextRequiredAction,
  };
  if (readiness === "analysis_blocked" || staleReason === "analysis_blocked") {
    return {
      concise: "Visual capture is scheduled, but image analysis is blocked until the vision provider is configured.",
      importantState,
    };
  }
  if (clientStatus === "adopted" || freshness.client_adoption_ok === true) {
    return {
      concise: seconds
        ? `Visual capture is running every ${seconds} seconds.`
        : "Visual capture is running.",
      importantState,
    };
  }
  if (readiness === "waiting_for_client_adoption" || nextRequiredAction === "client_adopt_visual_producer") {
    return {
      concise: seconds
        ? `Requested visual capture every ${seconds} seconds. The browser still needs to adopt the visual producer before the interval is fully active.`
        : "Requested visual capture. The browser still needs to adopt the visual producer before it is fully active.",
      importantState,
    };
  }
  if (!receipt.visual_producer_id && !freshness.producer_id) {
    return {
      concise: "I can set that interval after you grant visual capture.",
      importantState,
    };
  }
  return {
    concise: seconds
      ? `Requested visual capture every ${seconds} seconds.`
      : input.rawTerminalText.split(/\n+/)[0] ?? input.rawTerminalText,
    importantState,
  };
}

function distillSituationContextText(rawTerminalText: string): string {
  if (/no server-bound active SituationRun evidence/i.test(rawTerminalText)) {
    if (/live visual source producer exists/i.test(rawTerminalText)) {
      return "A visual producer exists, but it is not bound to an active SituationRun yet. Create or bind the SituationRun before I can answer from the current screen.";
    }
    return "I need an active visual SituationRun before I can answer from the current screen.";
  }
  return rawTerminalText;
}

export function presentTerminalArtifact(input: {
  turnId: string;
  threadId: string;
  promptText: string;
  routeReasonCode: string;
  terminalArtifactKind: string;
  finalAnswerSource: string;
  rawTerminalText: string;
  artifactRefs?: string[];
  preflightContextRef: string;
  style?: HelixTerminalPresentationStyle;
  terminalArtifact?: unknown;
  distillationRef?: string | null;
  expansionRef?: string | null;
}): {
  presentation: HelixTerminalPresentation;
  receiptSnapshot: HelixReceiptPresentationSnapshot | null;
} {
  let conciseText = input.rawTerminalText;
  let importantState: Record<string, unknown> = {};
  if (input.terminalArtifactKind === "live_pipeline_receipt") {
    const distilled = distillLivePipelineReceipt({
      rawTerminalText: input.rawTerminalText,
      terminalArtifact: input.terminalArtifact,
    });
    conciseText = distilled.concise;
    importantState = distilled.importantState;
  } else if (input.terminalArtifactKind === "situation_context_pack") {
    conciseText = distillSituationContextText(input.rawTerminalText);
  }
  const receiptSnapshot = input.terminalArtifactKind === "live_pipeline_receipt" ||
    input.terminalArtifactKind === "workspace_action_receipt" ||
    input.terminalArtifactKind === "tool_evaluation" ||
    input.terminalArtifactKind === "request_user_input" ||
    input.terminalArtifactKind === "typed_failure"
      ? recordReceiptPresentationSnapshot({
          schema: HELIX_RECEIPT_PRESENTATION_SNAPSHOT_SCHEMA,
          snapshot_id: `receipt_presentation_snapshot:${hashShort([
            input.turnId,
            input.terminalArtifactKind,
            input.rawTerminalText,
          ])}`,
          turn_id: input.turnId,
          artifact_kind: input.terminalArtifactKind,
          raw_receipt_ref: input.artifactRefs?.[0] ?? input.terminalArtifactKind,
          full_summary: input.rawTerminalText.slice(0, 1200),
          important_state: importantState,
          assistant_answer: false,
          raw_content_included: false,
        })
      : null;
  const presentation: HelixTerminalPresentation = {
    schema: HELIX_TERMINAL_PRESENTATION_SCHEMA,
    presentation_id: `terminal_presentation:${hashShort([
      input.turnId,
      input.terminalArtifactKind,
      conciseText,
    ])}`,
    turn_id: input.turnId,
    terminal_artifact_kind: input.terminalArtifactKind,
    concise_text: conciseText,
    expansion_available: Boolean(receiptSnapshot || input.expansionRef || input.distillationRef),
    expansion_ref: input.expansionRef ?? receiptSnapshot?.snapshot_id ?? null,
    distillation_ref: input.distillationRef ?? null,
    receipt_snapshot_ref: receiptSnapshot?.snapshot_id ?? null,
    assistant_answer: false,
    raw_content_included: false,
  };
  return { presentation, receiptSnapshot };
}
