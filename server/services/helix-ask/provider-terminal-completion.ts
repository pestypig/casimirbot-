type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = (values: string[]): string[] => Array.from(new Set(values));

const currentTurnLedger = (payload: RecordLike, turnId: string): RecordLike[] =>
  (Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : [])
    .map(readRecord)
    .filter((artifact): artifact is RecordLike => {
      if (!artifact) return false;
      const artifactPayload = readRecord(artifact.payload);
      const artifactTurnId = readString(artifactPayload?.turn_id);
      const sourceScope = readString(artifact.source_scope) || readString(artifactPayload?.source_scope);
      return (
        !/prior_context|prior_turn_context|prior_artifact/i.test(sourceScope) &&
        (!artifactTurnId || artifactTurnId === turnId)
      );
    });

const artifactRefs = (artifact: RecordLike): string[] => {
  const payload = readRecord(artifact.payload);
  return unique([
    readString(artifact.artifact_id),
    readString(payload?.artifact_id),
    readString(payload?.observation_id),
    readString(payload?.observation_ref),
    readString(payload?.receipt_id),
    readString(payload?.result_ref),
  ].filter(Boolean));
};

const ledgerProviderBridge = (ledger: RecordLike[], turnId: string): RecordLike | null => {
  for (let index = ledger.length - 1; index >= 0; index -= 1) {
    const artifact = ledger[index];
    if (readString(artifact.kind) !== "provider_terminal_authority_bridge") continue;
    const artifactPayload = readRecord(artifact.payload);
    if (artifactPayload && readString(artifactPayload.turn_id) === turnId) return artifactPayload;
  }
  return null;
};

export const providerPostObservationCompletionMaterialized = (input: {
  payload: RecordLike;
  turnId: string;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): boolean => {
  if (
    input.terminalArtifactKind !== "agent_provider_terminal_candidate" ||
    input.finalAnswerSource !== "agent_provider_terminal_candidate"
  ) {
    return false;
  }

  const ledger = currentTurnLedger(input.payload, input.turnId);
  const authority = readRecord(input.payload.terminal_answer_authority);
  const presentation = readRecord(input.payload.terminal_presentation);
  const writer = readRecord(input.payload.terminal_authority_single_writer);
  const writerIntegrity = readRecord(writer?.integrity);
  const providerReentry = readRecord(input.payload.provider_reasoning_reentry);
  const providerBridge =
    readRecord(input.payload.provider_terminal_authority_bridge) ??
    ledgerProviderBridge(ledger, input.turnId);

  const candidateRef =
    readString(writer?.selected_terminal_artifact_ref) ||
    readString(writer?.selectedArtifactRef) ||
    readString(authority?.terminal_artifact_ref) ||
    readString(authority?.terminal_item_id);
  const authorityRef =
    readString(authority?.terminal_artifact_ref) ||
    readString(authority?.terminal_item_id) ||
    candidateRef;
  const supportRefs = unique([
    ...readStringArray(presentation?.selected_observation_refs),
    ...readStringArray(writer?.selected_terminal_support_refs),
  ]);
  const ledgerRefs = new Set(ledger.flatMap(artifactRefs));
  const supportIsCurrentTurn =
    supportRefs.length > 0 &&
    supportRefs.every((ref) => ref.startsWith(`${input.turnId}:`) && ledgerRefs.has(ref));

  const authorityMatches =
    readString(authority?.turn_id) === input.turnId &&
    authority?.server_authoritative === true &&
    readString(authority?.terminal_artifact_kind) === input.terminalArtifactKind &&
    readString(authority?.final_answer_source) === input.finalAnswerSource &&
    Boolean(authorityRef) &&
    authorityRef === candidateRef &&
    candidateRef.startsWith(`${input.turnId}:`);
  const presentationMatches =
    readString(presentation?.turn_id) === input.turnId &&
    readString(presentation?.terminal_artifact_kind) === input.terminalArtifactKind &&
    readString(presentation?.final_answer_source) === input.finalAnswerSource;
  const writerMatches =
    readString(writer?.schema) === "helix.terminal_authority_single_writer_result.v1" &&
    readString(writer?.turn_id) === input.turnId &&
    (readString(writer?.selected_terminal_artifact_kind) || readString(writer?.selectedArtifactKind)) ===
      input.terminalArtifactKind &&
    writerIntegrity?.single_writer_applied === true &&
    writerIntegrity?.post_tool_model_step_satisfied === true;

  const reentryProvesCompletion =
    readString(providerReentry?.turn_id) === input.turnId &&
    readString(providerReentry?.status) === "completed" &&
    providerReentry?.evidence_reentered === true &&
    providerReentry?.solver_completed === true &&
    providerReentry?.goal_satisfaction_compatible === true &&
    readString(providerReentry?.provider_terminal_candidate_ref) === candidateRef;
  const bridgeProvesCompletion =
    readString(providerBridge?.turn_id) === input.turnId &&
    providerBridge?.terminal_authority_granted === true &&
    providerBridge?.final_visible_answer_authorized === true &&
    providerBridge?.all_observations_succeeded === true &&
    providerBridge?.solver_completed === true &&
    providerBridge?.goal_satisfaction_compatible === true &&
    readString(providerBridge?.provider_terminal_candidate_ref) === candidateRef;

  return (
    authorityMatches &&
    presentationMatches &&
    writerMatches &&
    supportIsCurrentTurn &&
    (reentryProvesCompletion || bridgeProvesCompletion)
  );
};
