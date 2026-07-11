type RecordLike = Record<string, unknown>;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

export const hasCurrentTurnProviderTerminalPresentation = (
  payload: RecordLike,
  expectedTurnId?: string | null,
): boolean => {
  const presentation = readRecord(payload.terminal_presentation);
  const presentationTurnId = readString(presentation?.turn_id) ?? expectedTurnId ?? null;
  const authorityRef = readString(presentation?.terminal_authority_ref);
  const selectedRefs = readStringArray(presentation?.selected_observation_refs);
  return (
    readString(presentation?.final_answer_source) === "agent_provider_terminal_candidate" &&
    Boolean(presentationTurnId) &&
    Boolean(authorityRef?.startsWith(`${presentationTurnId}:`)) &&
    selectedRefs.length > 0 &&
    selectedRefs.every((ref) => ref.startsWith(`${presentationTurnId}:`))
  );
};

export const resolveCurrentTurnProviderTerminalIdentity = (input: {
  payload: RecordLike;
  turnId: string;
  fallbackTerminalArtifactKind: string;
  fallbackFinalAnswerSource: string;
}): { terminalArtifactKind: string; finalAnswerSource: string } => {
  if (hasCurrentTurnProviderTerminalPresentation(input.payload, input.turnId)) {
    return {
      terminalArtifactKind: "agent_provider_terminal_candidate",
      finalAnswerSource: "agent_provider_terminal_candidate",
    };
  }
  return {
    terminalArtifactKind:
      readString(input.payload.terminal_artifact_kind) ?? input.fallbackTerminalArtifactKind,
    finalAnswerSource:
      readString(input.payload.final_answer_source) ?? input.fallbackFinalAnswerSource,
  };
};

export const resolvePublishedWorkstationToolTerminal = (
  payload: RecordLike,
): { terminalArtifactKind: "workstation_tool_evaluation"; finalAnswerSource: "workstation_tool_evaluation" } | null => {
  if (hasCurrentTurnProviderTerminalPresentation(payload)) return null;
  const terminalAuthority = readRecord(payload.terminal_answer_authority);
  const terminalWriter = readRecord(payload.terminal_authority_single_writer);
  const terminalPresentation = readRecord(payload.terminal_presentation);
  const resolvedSummary = readRecord(payload.resolved_turn_summary);
  const authorityWorkstation =
    readString(terminalAuthority?.terminal_artifact_kind) === "workstation_tool_evaluation" &&
    readString(terminalAuthority?.final_answer_source) === "workstation_tool_evaluation" &&
    terminalAuthority?.server_authoritative === true;
  const materializedWorkstation =
    readString(terminalWriter?.selected_terminal_artifact_kind) === "workstation_tool_evaluation" ||
    readString(terminalWriter?.selectedArtifactKind) === "workstation_tool_evaluation" ||
    readString(terminalWriter?.source) === "workstation_tool_evaluation" ||
    readString(terminalPresentation?.terminal_artifact_kind) === "workstation_tool_evaluation" ||
    (
      readString(resolvedSummary?.terminal_artifact_kind) === "workstation_tool_evaluation" &&
      readString(resolvedSummary?.final_answer_source) === "workstation_tool_evaluation"
    );
  return authorityWorkstation && materializedWorkstation
    ? {
        terminalArtifactKind: "workstation_tool_evaluation",
        finalAnswerSource: "workstation_tool_evaluation",
      }
    : null;
};
