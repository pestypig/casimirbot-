import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";

const FORBIDDEN_HARD_VISUAL_TERMINAL_ROUTES = new Set([
  "live_pipeline_receipt",
  "client_projection",
  "model_only_concept",
  "no_tool_direct",
  "panel_generated_answer",
]);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(readString).filter((entry): entry is string => Boolean(entry)) : [];

export function assertNoLiveSourceSecondLoop(input: {
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null;
  routeReasonCode?: string | null;
  turnInputItems?: unknown[] | null;
  liveArtifacts?: unknown[] | null;
  terminalArtifactKind?: string | null;
  finalAnswerSource?: string | null;
}): void {
  const intent = (input.sourceTargetIntent ?? {}) as Record<string, unknown>;
  const target = readString(intent.target_source);
  const strength = readString(intent.strength);
  const requestedOutputs = readStrings(intent.requested_outputs);
  const routeReasonCode = readString(input.routeReasonCode);
  const livePipelineControl =
    requestedOutputs.includes("live_pipeline_receipt") ||
    /^live_(?:pipeline|runtime|environment)_/.test(routeReasonCode ?? "");
  const hardVisual =
    target === "visual_capture" &&
    !livePipelineControl &&
    (
      requestedOutputs.includes("current_visual_state") ||
      requestedOutputs.includes("field_evaluation_refs") ||
      requestedOutputs.includes("interpretation_refs") ||
      requestedOutputs.includes("terminal_contract") ||
      strength === "hard"
    );
  if (!hardVisual) return;

  const candidates = [
    input.routeReasonCode,
    input.terminalArtifactKind,
    input.finalAnswerSource,
  ].map((entry) => readString(entry)).filter((entry): entry is string => Boolean(entry));
  const forbidden = candidates.find((entry) => FORBIDDEN_HARD_VISUAL_TERMINAL_ROUTES.has(entry));
  if (forbidden) {
    throw new Error(`live_source_second_loop_forbidden:${forbidden}`);
  }
}
