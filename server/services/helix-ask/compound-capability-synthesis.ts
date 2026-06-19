import { buildHelixCapabilityItineraryExecutionState } from "./capability-itinerary-execution";

type RecordLike = Record<string, unknown>;

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

export type HelixCompoundCapabilitySynthesisReadiness = {
  schema: "helix.compound_capability_synthesis_readiness.v1";
  applies: boolean;
  complete: boolean;
  synthesis_required: boolean;
  has_final_answer_draft: boolean;
  has_docs_subgoal: boolean;
  has_failed_subgoal: boolean;
  support_refs: string[];
  goal_kind: "doc_evidence_synthesis" | undefined;
  required_terminal_kind: "doc_evidence_synthesis_answer" | undefined;
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const artifactKind = (artifact: ArtifactLike): string | null =>
  readString(artifact.kind) ?? readString(readRecord(artifact.payload)?.kind);

const artifactId = (artifact: ArtifactLike): string | null =>
  readString(artifact.artifact_id) ?? readString(readRecord(artifact.payload)?.artifact_id);

const finalAnswerDraftRecords = (payload: RecordLike, artifacts: ArtifactLike[]): RecordLike[] => [
  readRecord(payload.final_answer_draft),
  ...artifacts
    .filter((artifact) => artifactKind(artifact) === "final_answer_draft" && Boolean(artifactId(artifact)))
    .map((artifact) => readRecord(artifact.payload)),
].filter((entry): entry is RecordLike => Boolean(entry));

const hasFinalAnswerDraft = (payload: RecordLike, artifacts: ArtifactLike[]): boolean =>
  finalAnswerDraftRecords(payload, artifacts)
    .some((draft) => Boolean(readString(draft.text) ?? readString(draft.answer_text)));

const hasTerminalFinalAnswerDraft = (
  payload: RecordLike,
  artifacts: ArtifactLike[],
  requiredTerminalKind: string | undefined,
): boolean =>
  finalAnswerDraftRecords(payload, artifacts)
    .some((draft) => {
      const text = readString(draft.text) ?? readString(draft.answer_text);
      if (!text) return false;
      const draftTerminalKind = readString(draft.required_terminal_kind) ?? readString(draft.terminal_artifact_kind);
      if (requiredTerminalKind) return draftTerminalKind === requiredTerminalKind;
      return !draftTerminalKind || draftTerminalKind === "model_synthesized_answer";
    });

const capabilityText = (value: unknown): string =>
  readArray(value)
    .map(readRecord)
    .map((entry) => [
      readString(entry?.requested_capability),
      readString(entry?.runtime_capability),
      readString(entry?.executed_capability),
      readString(entry?.selected_capability),
    ].filter(Boolean).join(" "))
    .join(" ");

const itineraryCapabilityText = (itinerary: RecordLike | null): string =>
  [
    capabilityText(readArray(itinerary?.planned_steps)),
    capabilityText(readArray(readRecord(itinerary?.terminal_success_criteria)?.required_capabilities)
      .map((capability) => ({ requested_capability: capability }))),
    capabilityText(readArray(readRecord(itinerary?.execution_state)?.compound_subgoal_ledger)),
  ].join(" ");

const supportRefsFromLedger = (ledger: RecordLike[]): string[] =>
  unique(ledger.flatMap((entry) => [
    readString(entry.observation_ref),
    ...readArray(entry.support_refs).map(readString),
    ...readArray(entry.evidence_refs).map(readString),
    ...readArray(entry.receipt_refs).map(readString),
    ...readArray(entry.receipt_ids).map(readString),
    ...readArray(entry.coverage_refs).map(readString),
  ].filter((ref): ref is string => Boolean(ref))));

const supportRefsFromArtifacts = (artifacts: ArtifactLike[]): string[] =>
  unique(artifacts.flatMap((artifact) => {
    const kind = artifactKind(artifact);
    if (
      !kind ||
      [
        "agent_step_decision",
        "available_capabilities",
        "direct_answer_text",
        "final_answer_draft",
        "typed_failure",
      ].includes(kind)
    ) {
      return [];
    }
    const id = artifactId(artifact);
    return id ? [id] : [];
  }));

export function resolveCompoundCapabilitySynthesisReadiness(input: {
  payload: RecordLike;
  capabilityItinerary?: unknown;
  artifacts?: ArtifactLike[] | null;
}): HelixCompoundCapabilitySynthesisReadiness {
  const artifacts = input.artifacts ?? readArray(input.payload.current_turn_artifact_ledger).map(readRecord).filter(Boolean) as ArtifactLike[];
  const itinerary =
    readRecord(input.capabilityItinerary) ??
    readRecord(input.payload.capability_itinerary);
  const existingState =
    readRecord(input.payload.capability_itinerary_execution_state) ??
    readRecord(itinerary?.execution_state);
  const state = existingState ?? buildHelixCapabilityItineraryExecutionState({
    capabilityItinerary: input.capabilityItinerary ?? input.payload.capability_itinerary,
    artifacts,
  }) as unknown as RecordLike;
  const ledger = readArray(state.compound_subgoal_ledger)
    .map(readRecord)
    .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry));
  const requiredFamilies = readArray(state.required_observation_families)
    .map(readString)
    .filter((entry: string | null): entry is string => Boolean(entry));
  const contract = readRecord(input.payload.compound_capability_contract) ??
    readRecord(itinerary?.compound_capability_contract);
  const terminalCriteria = readRecord(itinerary?.terminal_success_criteria);
  const itineraryRequiresSynthesis = terminalCriteria?.requires_post_observation_synthesis === true;
  const subgoals = readArray(contract?.subgoals);
  const applies = (state.applies === true || itineraryRequiresSynthesis) && (ledger.length > 1 || requiredFamilies.length > 1);
  const complete = applies && state.complete === true;
  const hasFailedSubgoal = ledger.some((entry) => readString(entry.satisfaction) === "failed" || readString(entry.rail_status) === "fail_closed");
  const hasDocsSubgoal = /docs-viewer\.locate_in_doc|docs-viewer\.summarize_doc|docs-viewer\.search_docs/i.test([
    capabilityText(ledger),
    capabilityText(subgoals),
    itineraryCapabilityText(itinerary),
  ].join(" "));
  const requiredTerminalKind = hasDocsSubgoal ? "doc_evidence_synthesis_answer" : undefined;
  const hasDraft = hasFinalAnswerDraft(input.payload, artifacts);
  const hasTerminalDraft = hasTerminalFinalAnswerDraft(input.payload, artifacts, requiredTerminalKind);
  const supportRefs = ledger.length > 0
    ? supportRefsFromLedger(ledger)
    : supportRefsFromArtifacts(artifacts);
  return {
    schema: "helix.compound_capability_synthesis_readiness.v1",
    applies,
    complete,
    synthesis_required: applies && complete && !hasTerminalDraft && !hasFailedSubgoal,
    has_final_answer_draft: hasDraft,
    has_docs_subgoal: hasDocsSubgoal,
    has_failed_subgoal: hasFailedSubgoal,
    support_refs: supportRefs,
    goal_kind: hasDocsSubgoal ? "doc_evidence_synthesis" : undefined,
    required_terminal_kind: requiredTerminalKind,
    assistant_answer: false,
    raw_content_included: false,
  };
}
