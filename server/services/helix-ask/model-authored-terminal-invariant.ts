import { classifyDeterministicFallbackUse } from "./deterministic-fallback-policy";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const artifactPayload = (artifact: RecordLike): RecordLike | null => readRecord(artifact.payload);

const artifactKind = (artifact: RecordLike): string | null =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind);

const artifactText = (artifact: RecordLike): string | null =>
  readString(artifactPayload(artifact)?.text) ??
  readString(artifactPayload(artifact)?.answer_text) ??
  readString(artifact.text);

const modelAuthoredDraftAuthorities = new Set([
  "model_turn_assistant_message",
  "llm_model_only_concept_composer",
  "llm_post_observation_composer",
]);

const promptTextFromPayload = (payload: RecordLike): string =>
  readString(payload.active_prompt) ?? readString(payload.question) ?? readString(payload.prompt) ?? "";

const isAssistantModelTurn = (modelTurn: RecordLike | null): boolean =>
  readString(modelTurn?.status) === "assistant_message" &&
  Boolean(readString(modelTurn?.assistant_message_text));

const isKnownDeterministicFallbackText = (text: string, fallbackId: string | null): boolean =>
  /model_only_fallback|legacy_fallback|no_tool_direct|deterministic/i.test(fallbackId ?? "") ||
  /^An electron is a fundamental subatomic particle/i.test(text) ||
  /^Proper time is the time measured by a clock moving along a particular worldline/i.test(text) ||
  /^The Doppler effect is the apparent change in a wave's frequency/i.test(text) ||
  /^Extrinsic curvature describes how a slice or surface is bending/i.test(text) ||
  /^A document summary is a shortened explanation of a document's main purpose/i.test(text) ||
  /^Momentum is conserved in an isolated two-object collision/i.test(text);

export function enforceModelAuthoredTerminalInvariant(input: {
  turnId: string;
  payload: RecordLike;
  artifactLedger: Array<RecordLike>;
}): {
  ok: boolean;
  violations: string[];
  repair_required: boolean;
  repair_reason?: string;
} {
  const violations: string[] = [];
  const terminalKind = readString(input.payload.terminal_artifact_kind);
  const selected = readString(input.payload.selected_final_answer) ?? readString(input.payload.answer) ?? readString(input.payload.text);
  const modelTurn = readRecord(input.payload.model_turn_result);
  const finalDraft = readRecord(input.payload.final_answer_draft);
  const finalDraftAuthority = readString(finalDraft?.authority);
  const hasModelAuthoredDraft = Boolean(finalDraftAuthority && modelAuthoredDraftAuthorities.has(finalDraftAuthority));
  const hasModelAuthoredTerminalEvidence = isAssistantModelTurn(modelTurn) || hasModelAuthoredDraft;
  if (
    (terminalKind === "direct_answer_text" || terminalKind === "model_synthesized_answer") &&
    !hasModelAuthoredTerminalEvidence
  ) {
    violations.push("model_answer_terminal_without_model_turn_or_draft");
  }
  const selectedFallbackId =
    readString(input.payload.fallback_id) ?? readString(input.payload.final_answer_source) ?? null;
  if (selected && isKnownDeterministicFallbackText(selected, selectedFallbackId)) {
    const directSelectedPolicy = classifyDeterministicFallbackUse({
      promptText: promptTextFromPayload(input.payload),
      payload: input.payload,
      fallbackId: selectedFallbackId ?? undefined,
      fallbackText: selected,
    });
    if (!directSelectedPolicy.terminal_allowed) {
      violations.push("selected_answer_matches_nonterminal_fallback");
    }
  }
  const fallbackArtifacts = input.artifactLedger.filter((artifact) =>
    artifactKind(artifact) === "deterministic_fallback_observation" ||
    artifactKind(artifact) === "fallback_demoted_observation");
  for (const artifact of fallbackArtifacts) {
    const payload = artifactPayload(artifact);
    const fallbackText = readString(payload?.fallback_text) ?? artifactText(artifact);
    const fallbackId = readString(payload?.fallback_id);
    if (!fallbackText || !selected || fallbackText.trim() !== selected.trim()) continue;
    const policy = classifyDeterministicFallbackUse({
      promptText: promptTextFromPayload(input.payload),
      payload: input.payload,
      fallbackId,
      fallbackText,
    });
    if (!policy.terminal_allowed) violations.push("selected_answer_matches_nonterminal_fallback");
  }
  const directAnswer = input.artifactLedger.find((artifact) => artifactKind(artifact) === "direct_answer_text");
  const directText = directAnswer ? artifactText(directAnswer) : null;
  const finalDraftText = readString(finalDraft?.text) ?? readString(finalDraft?.answer_text);
  if (directText && finalDraftText && directText.trim() === finalDraftText.trim()) {
    const policy = classifyDeterministicFallbackUse({
      promptText: promptTextFromPayload(input.payload),
      payload: input.payload,
      fallbackId: readString(artifactPayload(directAnswer)?.fallback_id) ?? "direct_answer_text",
      fallbackText: directText,
    });
    if (!policy.terminal_allowed) violations.push("final_draft_cloned_from_nonterminal_fallback");
  }
  return {
    ok: violations.length === 0,
    violations,
    repair_required: violations.length > 0,
    repair_reason: violations[0],
  };
}
