export type FinalAnswerDraftQualityViolation =
  | "empty_draft"
  | "refusal_without_error"
  | "generic_answer_for_compound_prompt"
  | "missing_required_prompt_parts"
  | "missing_support_refs_for_repo_route"
  | "unsupported_repo_claim"
  | "receipt_like_answer"
  | "fallback_like_answer";

export type FinalAnswerDraftRouteFamily =
  | "model_only"
  | "repo_evidence"
  | "docs_source"
  | "workstation_tool"
  | "calculator_tool"
  | "situation_room"
  | "unknown";

export type FinalAnswerDraftQualityGate = {
  schema: "helix.final_answer_draft_quality_gate.v1";
  turn_id: string;
  final_answer_draft_ref: string;
  ok: boolean;
  violations: FinalAnswerDraftQualityViolation[];
  route_family: FinalAnswerDraftRouteFamily;
  assistant_answer: false;
  raw_content_included: false;
};

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const textIncludesAny = (text: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

export const inferFinalAnswerDraftRouteFamily = (input: {
  routeProductContract?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
  artifactLedger?: ArtifactLike[] | null;
}): FinalAnswerDraftRouteFamily => {
  const sourceTarget = readString(input.routeProductContract?.source_target);
  const goalKind =
    readString(readRecord(input.payload?.canonical_goal_frame)?.goal_kind) ??
    readString(input.payload?.goal_kind);
  const terminalKind = readString(input.payload?.terminal_artifact_kind);
  const finalAnswerSource = readString(input.payload?.final_answer_source);
  const routeText = [
    sourceTarget,
    goalKind,
    terminalKind,
    finalAnswerSource,
    readString(input.payload?.route_reason_code),
    readString(input.payload?.route),
  ].join(" ");
  if (sourceTarget === "repo_code" || sourceTarget === "runtime_evidence" || /repo_code|repo_evidence/i.test(routeText)) {
    return "repo_evidence";
  }
  if (sourceTarget === "docs_viewer" || sourceTarget === "active_doc" || /\bdoc|docs_viewer|active_doc/i.test(routeText)) {
    return "docs_source";
  }
  if (sourceTarget === "calculator_stream" || /calculator|calculation/i.test(routeText)) {
    return "calculator_tool";
  }
  if (sourceTarget === "workstation_panel" || sourceTarget === "workspace_action" || sourceTarget === "workstation_state" || /panel_control|workspace_action/i.test(routeText)) {
    return "workstation_tool";
  }
  if (sourceTarget === "live_environment" || sourceTarget === "live_pipeline" || sourceTarget === "world_event" || /situation|live_environment|live_job|dottie/i.test(routeText)) {
    return "situation_room";
  }
  if (sourceTarget === "model_only" || sourceTarget === "general_background" || goalKind === "model_only_concept") {
    return "model_only";
  }
  const ledger = input.artifactLedger ?? [];
  if (ledger.some((artifact) => {
    const kind = readString(artifact.kind);
    const payload = readRecord(artifact.payload);
    const schema = readString(payload?.schema);
    return /repo_code_evidence_observation|scholarly_research_observation/i.test([kind, schema].join(" "));
  })) {
    return "repo_evidence";
  }
  return "unknown";
};

export const collectFinalAnswerDraftSupportRefs = (input: {
  draftPayload?: Record<string, unknown> | null;
  artifactLedger?: ArtifactLike[] | null;
}): string[] => {
  const draftRefs = readArray(input.draftPayload?.artifact_refs)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  const ledgerRefs = (input.artifactLedger ?? []).flatMap((artifact) => {
    const payload = readRecord(artifact.payload);
    const kind = readString(artifact.kind);
    const schema = readString(payload?.schema);
    if (!/repo_code_evidence_observation|scholarly_research_observation|doc_|docs|calculator|workspace_action|agent_step_observation/i.test([kind, schema].join(" "))) return [];
    return [
      readString(artifact.artifact_id),
      ...readArray(payload?.evidence_refs).map(readString),
      ...readArray(payload?.produced_artifact_refs).map(readString),
      ...readArray(payload?.support_refs).map(readString),
      ...readArray(payload?.spans)
        .map(readRecord)
        .map((span) => readString(span?.ref) ?? readString(span?.path)),
    ].filter((entry): entry is string => Boolean(entry));
  });
  return unique([...draftRefs, ...ledgerRefs]).slice(0, 16);
};

const isFallbackLike = (text: string): boolean =>
  /\b(?:I could not produce a terminal answer|could not produce a final answer|No final answer returned|terminal answer unavailable|missing_allowed_terminal_artifact)\b/i.test(text);

const isReceiptLike = (text: string): boolean =>
  /^(?:Opening panel|Opened panel|Workspace action|Action receipt|Receipt:|Successfully executed)\b/i.test(text.trim()) ||
  /\b(?:workspace_action_receipt|runtime_tool_observation|client_projection|panel receipt)\b/i.test(text);

const isRefusalLike = (text: string): boolean =>
  /\b(?:I can't|I cannot|I’m unable|I am unable|cannot answer|can't answer)\b/i.test(text);

const isCompoundComparisonPrompt = (prompt: string): boolean =>
  /\bcompare\b/i.test(prompt) &&
  /\b(?:three|ways|charge|mass|role|consequence|difference)\b/i.test(prompt);

const compoundComparisonCovered = (text: string): boolean =>
  textIncludesAny(text, [/\bnegative\b/i, /\belectron[^.\n]*(?:-1|negative|charge)/i]) &&
  textIncludesAny(text, [/\bpositive\b/i, /\bproton[^.\n]*(?:\+1|positive|charge)/i]) &&
  textIncludesAny(text, [/\b(?:mass|lighter|heavier|more massive|1836)\b/i]) &&
  textIncludesAny(text, [/\b(?:clouds?|shells?|orbitals?|surround(?:s|ing)?|bonding)\b/i]) &&
  textIncludesAny(text, [/\b(?:nucleus|atomic number|element identity|identity of the element)\b/i]) &&
  textIncludesAny(text, [/\b(?:consequence|therefore|because|this means|practical)\b/i]);

export function evaluateFinalAnswerDraftQualityGate(input: {
  turnId: string;
  finalAnswerDraftRef: string;
  draftText: string;
  draftPayload?: Record<string, unknown> | null;
  promptText?: string | null;
  routeProductContract?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
  artifactLedger?: ArtifactLike[] | null;
}): FinalAnswerDraftQualityGate {
  const text = String(input.draftText ?? "").trim();
  const routeFamily = inferFinalAnswerDraftRouteFamily({
    routeProductContract: input.routeProductContract,
    payload: input.payload,
    artifactLedger: input.artifactLedger,
  });
  const violations: FinalAnswerDraftQualityViolation[] = [];
  if (!text) violations.push("empty_draft");
  if (isFallbackLike(text)) violations.push("fallback_like_answer");
  if (isReceiptLike(text)) violations.push("receipt_like_answer");
  if (isRefusalLike(text) && !readString(input.payload?.terminal_error_code)) {
    violations.push("refusal_without_error");
  }
  const prompt = input.promptText ?? readString(input.payload?.active_prompt) ?? "";
  if (routeFamily === "model_only" && isCompoundComparisonPrompt(prompt) && !compoundComparisonCovered(text)) {
    violations.push("missing_required_prompt_parts");
  }
  if (routeFamily === "repo_evidence") {
    if (collectFinalAnswerDraftSupportRefs({
      draftPayload: input.draftPayload,
      artifactLedger: input.artifactLedger,
    }).length === 0) {
      violations.push("missing_support_refs_for_repo_route");
    }
    if (/\b(?:no|without|missing)\s+(?:current-turn\s+)?(?:repo|repository|code)\s+evidence/i.test(text)) {
      violations.push("unsupported_repo_claim");
    }
  }
  return {
    schema: "helix.final_answer_draft_quality_gate.v1",
    turn_id: input.turnId,
    final_answer_draft_ref: input.finalAnswerDraftRef,
    ok: unique(violations).length === 0,
    violations: unique(violations),
    route_family: routeFamily,
    assistant_answer: false,
    raw_content_included: false,
  };
}
