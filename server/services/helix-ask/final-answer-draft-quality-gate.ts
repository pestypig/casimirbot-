import { readCompoundTerminalPolicy } from "./compound-terminal-policy";

export type FinalAnswerDraftQualityViolation =
  | "empty_draft"
  | "refusal_without_error"
  | "generic_answer_for_compound_prompt"
  | "missing_required_prompt_parts"
  | "missing_support_refs_for_repo_route"
  | "missing_support_refs_for_scholarly_route"
  | "missing_support_refs_for_internet_search_route"
  | "missing_support_refs_for_source_route"
  | "contradicts_observed_scholarly_full_text"
  | "unsupported_repo_claim"
  | "receipt_like_answer"
  | "fallback_like_answer";

export type FinalAnswerDraftRouteFamily =
  | "model_only"
  | "capability_catalog"
  | "repo_evidence"
  | "scholarly_research"
  | "internet_search"
  | "theory_locator"
  | "context_reflection"
  | "zen_graph_reflection"
  | "civilization_bounds"
  | "workspace_directory"
  | "workspace_diagnostic"
  | "visual_capture"
  | "live_source_mail"
  | "live_environment"
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

const compoundTerminalPolicyActive = (payload?: Record<string, unknown> | null): boolean => {
  return readCompoundTerminalPolicy(payload).active;
};

const artifactKind = (artifact: ArtifactLike): string | null =>
  readString(artifact.kind) ?? readString(readRecord(artifact.payload)?.kind);

const artifactPayloadByKind = (
  artifacts: ArtifactLike[] | null | undefined,
  kind: string,
): Record<string, unknown> | null => {
  const artifact = (artifacts ?? []).find((entry) => artifactKind(entry) === kind);
  return readRecord(artifact?.payload);
};

const compoundLedgerEntryHasSatisfiedObservation = (entry: Record<string, unknown>): boolean => {
  const satisfaction = readString(entry.satisfaction);
  const railStatus = readString(entry.rail_status);
  return (
    satisfaction === "satisfied" &&
    Boolean(readString(entry.observation_ref)) &&
    (!railStatus || railStatus === "complete")
  );
};

const hasCompleteMultiSubgoalExecutionLedger = (
  payload?: Record<string, unknown> | null,
  artifactLedger?: ArtifactLike[] | null,
): boolean => {
  const executionState =
    readRecord(payload?.capability_itinerary_execution_state) ??
    artifactPayloadByKind(artifactLedger, "capability_itinerary_execution_state");
  const ledger = readArray(executionState?.compound_subgoal_ledger)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  if (ledger.length < 2 || executionState?.complete !== true) return false;
  return ledger.every(compoundLedgerEntryHasSatisfiedObservation);
};

export const inferFinalAnswerDraftRouteFamily = (input: {
  routeProductContract?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
  artifactLedger?: ArtifactLike[] | null;
}): FinalAnswerDraftRouteFamily => {
  const committedRoute = readRecord(input.payload?.committed_ask_route);
  const committedRouteSource = readRecord(committedRoute?.route);
  const committedGoal = readRecord(committedRoute?.canonical_goal);
  const committedSourceTarget = readString(committedRouteSource?.source_target);
  const committedGoalKind = readString(committedGoal?.goal_kind);
  if (
    compoundTerminalPolicyActive(input.payload) &&
    (
      readString(readRecord(input.payload?.compound_capability_synthesis_readiness)?.required_terminal_kind) === "compound_evidence_synthesis_answer" ||
      readString(readRecord(input.payload?.compound_capability_synthesis_readiness)?.synthesis_terminal_kind) === "compound_evidence_synthesis_answer" ||
      readString(readRecord(input.payload?.compound_capability_synthesis_readiness)?.required_terminal_kind) === "model_synthesized_answer" ||
      readString(readRecord(input.payload?.compound_capability_synthesis_readiness)?.synthesis_terminal_kind) === "model_synthesized_answer"
    )
  ) {
    return "unknown";
  }
  if (
    hasCompleteMultiSubgoalExecutionLedger(input.payload, input.artifactLedger) &&
    (
      committedSourceTarget === "runtime_evidence" ||
      /compound|compound_evidence_synthesis_answer|model_synthesized_answer/i.test(committedGoalKind ?? "")
    )
  ) {
    return "unknown";
  }
  if (committedSourceTarget === "model_only" || committedGoalKind === "model_only_concept") {
    return "model_only";
  }
  if (
    committedSourceTarget === "runtime_evidence" &&
    /capability_(?:help|catalog)|runtime_capability_catalog/i.test(committedGoalKind ?? "")
  ) {
    return "capability_catalog";
  }
  if (committedSourceTarget === "repo_code" || committedSourceTarget === "runtime_evidence") {
    return "repo_evidence";
  }
  if (committedSourceTarget === "scholarly_research") {
    return "scholarly_research";
  }
  if (committedSourceTarget === "internet_search") {
    return "internet_search";
  }
  if (committedSourceTarget === "theory_locator") {
    return "theory_locator";
  }
  if (committedSourceTarget === "context_reflection") {
    return "context_reflection";
  }
  if (committedSourceTarget === "workspace_directory") {
    return "workspace_directory";
  }
  if (committedSourceTarget === "workspace_diagnostic") {
    return "workspace_diagnostic";
  }
  if (committedSourceTarget === "visual_capture") {
    return "visual_capture";
  }
  if (/context_reflection|context_attachment|live_synthetic_data/i.test(committedGoalKind ?? "")) {
    return "context_reflection";
  }
  if (/zen_graph|ideology_context|procedural_zen|theory_ideology_bridge/i.test(committedGoalKind ?? "")) {
    return "zen_graph_reflection";
  }
  if (/civilization_bounds|civilization_scenario|civilization_roadmap/i.test(committedGoalKind ?? "")) {
    return "civilization_bounds";
  }
  if (committedSourceTarget === "docs_viewer" || committedSourceTarget === "active_doc") {
    return "docs_source";
  }
  if (committedSourceTarget === "calculator_stream") {
    return "calculator_tool";
  }
  if (committedSourceTarget === "workstation_panel" || committedSourceTarget === "workspace_action" || committedSourceTarget === "workstation_state") {
    return "workstation_tool";
  }
  if (committedSourceTarget === "live_source_mailbox" || /live_source_mailbox|live_source_mail/i.test(committedGoalKind ?? "")) {
    return "live_source_mail";
  }
  if (committedSourceTarget === "live_environment" || committedSourceTarget === "live_pipeline" || committedSourceTarget === "world_event") {
    return "situation_room";
  }

  const sourceTarget = readString(input.routeProductContract?.source_target);
  const goalKind =
    readString(readRecord(input.payload?.canonical_goal_frame)?.goal_kind) ??
    readString(input.payload?.goal_kind);
  const terminalKind = readString(input.payload?.terminal_artifact_kind);
  const finalAnswerSource = readString(input.payload?.final_answer_source);
  const latestDraftPayload = [...(input.artifactLedger ?? [])]
    .reverse()
    .map((artifact) => readRecord(artifact?.payload))
    .find((payload) =>
      readString(payload?.kind) === "final_answer_draft" ||
      readString(payload?.schema) === "helix.final_answer_draft.v1",
    );
  const draftGoalKind = readString(latestDraftPayload?.goal_kind);
  const draftRequiredTerminalKind = readString(latestDraftPayload?.required_terminal_kind);
  if (
    draftGoalKind === "doc_evidence_synthesis" ||
    draftRequiredTerminalKind === "doc_evidence_synthesis_answer"
  ) {
    return "docs_source";
  }
  const routeText = [
    sourceTarget,
    goalKind,
    terminalKind,
    finalAnswerSource,
    readString(input.payload?.route_reason_code),
    readString(input.payload?.route),
  ].join(" ");
  if (
    hasCompleteMultiSubgoalExecutionLedger(input.payload, input.artifactLedger) &&
    (
      sourceTarget === "runtime_evidence" ||
      /compound|compound_evidence_synthesis_answer|model_synthesized_answer/i.test(routeText)
    )
  ) {
    return "unknown";
  }
  if (
    sourceTarget === "runtime_evidence" &&
    /capability_(?:help|catalog)|inspect_capability_catalog/i.test(routeText)
  ) {
    return "capability_catalog";
  }
  if (sourceTarget === "repo_code" || sourceTarget === "runtime_evidence" || /repo_code|repo_evidence/i.test(routeText)) {
    return "repo_evidence";
  }
  if (sourceTarget === "scholarly_research" || /scholarly_research|doi|citation|journal/i.test(routeText)) {
    return "scholarly_research";
  }
  if (sourceTarget === "internet_search" || /internet_search|internet-search|web_search|google_custom_search|search_web/i.test(routeText)) {
    return "internet_search";
  }
  if (sourceTarget === "theory_locator" || /theory_locator|reflect_theory_context|theory_context_reflection|frontierVectorFieldTrace|theory_frontier_vector_field/i.test(routeText)) {
    return "theory_locator";
  }
  if (sourceTarget === "context_reflection" || /context_reflection|reflect_context_attachments|reflect_live_synthetic_data|bounded_context_reference/i.test(routeText)) {
    return "context_reflection";
  }
  if (/zen_graph_reflection|ideology_context_reflection|procedural_zen_classification|bridge_theory_ideology_context|theory_ideology_bridge/i.test(routeText)) {
    return "zen_graph_reflection";
  }
  if (/civilization_bounds|civilization_scenario_frame|civilization_bounds_roadmap/i.test(routeText)) {
    return "civilization_bounds";
  }
  if (sourceTarget === "workspace_directory" || /workspace_directory|workspace-directory\.resolve|workspace_directory_resolution/i.test(routeText)) {
    return "workspace_directory";
  }
  if (sourceTarget === "workspace_diagnostic" || /workspace_diagnostic|workspace_os\.status|workspace_os_status|workspace[- ]status/i.test(routeText)) {
    return "workspace_diagnostic";
  }
  if (sourceTarget === "visual_capture" || /visual_capture|image_lens|visual_frame_evidence|situation_context_pack/i.test(routeText)) {
    return "visual_capture";
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
  if (/live_environment|micro_reasoner|workstation_goal|agent_goal|route_watch|loop_state/i.test(routeText)) {
    return "live_environment";
  }
  if (sourceTarget === "live_source_mailbox" || /live_source_mailbox|live_source_mail/i.test(routeText)) {
    return "live_source_mail";
  }
  if (sourceTarget === "live_environment" || sourceTarget === "live_pipeline" || sourceTarget === "world_event" || /situation|live_job|dottie/i.test(routeText)) {
    return "situation_room";
  }
  if (sourceTarget === "model_only" || sourceTarget === "general_background" || goalKind === "model_only_concept") {
    return "model_only";
  }
  const ledger = input.artifactLedger ?? [];
  if (ledger.some((artifact: ArtifactLike) => {
    const kind = readString(artifact.kind);
    const payload = readRecord(artifact.payload);
    const schema = readString(payload?.schema);
    return /repo_code_evidence_observation|scholarly_research_observation|scholarly_full_text_observation|internet_search_observation/i.test([kind, schema].join(" "));
  })) {
    return ledger.some((artifact: ArtifactLike) => {
      const kind = readString(artifact.kind);
      const payload = readRecord(artifact.payload);
      const schema = readString(payload?.schema);
      if (/internet_search_observation/i.test([kind, schema].join(" "))) return true;
      return /scholarly_research_observation|scholarly_full_text_observation/i.test([kind, schema].join(" "));
    })
      ? ledger.some((artifact: ArtifactLike) => {
          const kind = readString(artifact.kind);
          const payload = readRecord(artifact.payload);
          const schema = readString(payload?.schema);
          return /internet_search_observation/i.test([kind, schema].join(" "));
        })
        ? "internet_search"
        : "scholarly_research"
      : "repo_evidence";
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
  const ledgerRefs = (input.artifactLedger ?? []).flatMap((artifact: ArtifactLike) => {
    const payload = readRecord(artifact.payload);
    const kind = readString(artifact.kind);
    const schema = readString(payload?.schema);
    if (!/repo_code_evidence_observation|scholarly_research_observation|scholarly_full_text_observation|internet_search_observation|helix_theory_context_reflection_tool_receipt|theory_context_reflection|reflect_theory_context|helix_theory_frontier_vector_field_tool_receipt|theory_frontier_vector_field|frontierVectorFieldTrace|capability_registry|capability_catalog|workspace_os_status_observation|workspace_status|doc_|docs|calculator|workspace_action|agent_step_observation/i.test([kind, schema].join(" "))) return [];
    return [
      readString(artifact.artifact_id),
      ...readArray(payload?.evidence_refs).map(readString),
      ...readArray(payload?.results)
        .map(readRecord)
        .flatMap((result: Record<string, unknown> | null) => [
          readString(result?.result_id),
          readString(result?.url),
          ...readArray(result?.evidence_refs).map(readString),
        ]),
      ...readArray(payload?.produced_artifact_refs).map(readString),
      ...readArray(payload?.support_refs).map(readString),
      ...readArray(payload?.page_text_refs)
        .map(readRecord)
        .map((page: Record<string, unknown> | null) => readString(page?.text_ref)),
      ...readArray(payload?.selected_chunks)
        .map(readRecord)
        .flatMap((chunk: Record<string, unknown> | null) => [readString(chunk?.source_text_ref), readString(chunk?.citation_ref)]),
      ...readArray(payload?.spans)
        .map(readRecord)
        .map((span: Record<string, unknown> | null) => readString(span?.ref) ?? readString(span?.path)),
    ].filter((entry): entry is string => Boolean(entry));
  });
  return unique([...draftRefs, ...ledgerRefs]).slice(0, 16);
};

const isFallbackLike = (text: string): boolean =>
  /\b(?:I could not produce a terminal answer|I couldn['’]?t produce a final answer|could not produce a final answer|No final answer returned|terminal answer unavailable|Please retry once|missing_allowed_terminal_artifact)\b/i.test(text);

const isReceiptLike = (text: string): boolean =>
  /^(?:Opening panel|Opened panel|Workspace action|Action receipt|Receipt:|Successfully executed)\b/i.test(text.trim()) ||
  /\b(?:workspace_action_receipt|runtime_tool_observation|client_projection|panel receipt)\b/i.test(text);

const isRefusalLike = (text: string): boolean =>
  /\b(?:I can't|I cannot|I’m unable|I am unable|cannot answer|can't answer)\b/i.test(text);

const isScholarlyFullTextObservation = (artifact: ArtifactLike): boolean => {
  const payload = readRecord(artifact.payload);
  return /scholarly_full_text_observation/i.test([
    readString(artifact.kind),
    readString(payload?.schema),
  ].join(" "));
};

const hasObservedScholarlyFullText = (artifacts?: ArtifactLike[] | null): boolean =>
  (artifacts ?? []).some((artifact) => {
    if (!isScholarlyFullTextObservation(artifact)) return false;
    const payload = readRecord(artifact.payload);
    if (!payload) return false;
    const pagesParsed = typeof payload.pages_parsed === "number" ? payload.pages_parsed : 0;
    return (
      pagesParsed > 0 ||
      readArray(payload.selected_chunks).length > 0 ||
      readArray(payload.page_text_refs).length > 0 ||
      Boolean(readString(payload.source_url) ?? readString(payload.source_pdf_ref))
    );
  });

const contradictsObservedScholarlyFullText = (text: string): boolean =>
  textIncludesAny(text, [
    /\b(?:I\s+(?:can(?:not|'t)|am unable)|unable to|could not)\s+(?:fetch|access|retrieve|read)\b.{0,120}\b(?:pdf|full[-\s]?text|external documents?|paper|document)\b/i,
    /\b(?:no|none)\b.{0,80}\b(?:full[-\s]?text|pdf)\b.{0,80}\b(?:available|retrieved|fetched|selected|found)\b/i,
    /\b(?:full[-\s]?text|pdf)\s+(?:is|was|were)?\s*(?:not|unavailable|inaccessible)\b/i,
  ]);

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

const sourceBackedModelSynthesisRouteFamilies = new Set<FinalAnswerDraftRouteFamily>([
  "capability_catalog",
  "context_reflection",
  "zen_graph_reflection",
  "civilization_bounds",
  "workspace_directory",
  "workspace_diagnostic",
  "visual_capture",
  "live_source_mail",
  "live_environment",
  "workstation_tool",
  "calculator_tool",
  "situation_room",
]);

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
  if (routeFamily === "repo_evidence" || routeFamily === "scholarly_research" || routeFamily === "internet_search") {
    if (collectFinalAnswerDraftSupportRefs({
      draftPayload: input.draftPayload,
      artifactLedger: input.artifactLedger,
    }).length === 0) {
      violations.push(routeFamily === "scholarly_research"
        ? "missing_support_refs_for_scholarly_route"
        : routeFamily === "internet_search"
          ? "missing_support_refs_for_internet_search_route"
          : "missing_support_refs_for_repo_route");
    }
    if (routeFamily === "repo_evidence" && /\b(?:no|without|missing)\s+(?:current-turn\s+)?(?:repo|repository|code)\s+evidence/i.test(text)) {
      violations.push("unsupported_repo_claim");
    }
    if (
      routeFamily === "scholarly_research" &&
      hasObservedScholarlyFullText(input.artifactLedger) &&
      contradictsObservedScholarlyFullText(text)
    ) {
      violations.push("contradicts_observed_scholarly_full_text");
    }
  }
  if (
    sourceBackedModelSynthesisRouteFamilies.has(routeFamily) &&
    collectFinalAnswerDraftSupportRefs({
      draftPayload: input.draftPayload,
      artifactLedger: input.artifactLedger,
    }).length === 0
  ) {
    violations.push("missing_support_refs_for_source_route");
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
