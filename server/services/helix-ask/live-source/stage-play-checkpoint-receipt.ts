import { readAskTurnArtifactPayloadRecord } from "../artifact-text";
import { readAskTurnString } from "../value-readers";

export type StagePlayCheckpointReceiptArtifactLike = {
  artifact_id: string;
  kind: string;
  payload: unknown;
};

const readLiveEnvironmentToolObservationPayload = (
  artifact: StagePlayCheckpointReceiptArtifactLike,
): Record<string, unknown> | null => {
  if (artifact.kind !== "live_environment_tool_observation") return null;
  return readAskTurnArtifactPayloadRecord(artifact);
};

export const readStagePlayReflectionObservationFromArtifacts = (
  artifacts: StagePlayCheckpointReceiptArtifactLike[],
): {
  artifact: StagePlayCheckpointReceiptArtifactLike;
  toolPayload: Record<string, unknown>;
  observation: Record<string, unknown>;
} | null => {
  for (const artifact of [...artifacts].reverse()) {
    if (artifact.kind !== "live_environment_tool_observation") continue;
    const toolPayload = readLiveEnvironmentToolObservationPayload(artifact);
    if (readAskTurnString(toolPayload?.tool_name) !== "live_env.reflect_stage_play_context") continue;
    const observation =
      toolPayload?.observation && typeof toolPayload.observation === "object" && !Array.isArray(toolPayload.observation)
        ? (toolPayload.observation as Record<string, unknown>)
        : null;
    if (readAskTurnString(observation?.schema) !== "stage_play_reflection_result/v1") continue;
    return { artifact, toolPayload, observation };
  }
  return null;
};

export const readStagePlayGraphRecord = (observation: Record<string, unknown>): Record<string, unknown> | null =>
  observation.graph && typeof observation.graph === "object" && !Array.isArray(observation.graph)
    ? (observation.graph as Record<string, unknown>)
    : null;

export const readStagePlaySourceWindowRecord = (graph: Record<string, unknown> | null): Record<string, unknown> | null =>
  graph?.sourceWindow && typeof graph.sourceWindow === "object" && !Array.isArray(graph.sourceWindow)
    ? (graph.sourceWindow as Record<string, unknown>)
    : null;

export const readStagePlayLiveAnswerProjectionRecord = (
  observation: Record<string, unknown>,
): Record<string, unknown> | null =>
  observation.liveAnswerProjection &&
  typeof observation.liveAnswerProjection === "object" &&
  !Array.isArray(observation.liveAnswerProjection)
    ? (observation.liveAnswerProjection as Record<string, unknown>)
    : null;

export const collectStagePlayCheckpointEvidenceRefs = (input: {
  stagePlayArtifact: StagePlayCheckpointReceiptArtifactLike;
  toolPayload: Record<string, unknown>;
  observation: Record<string, unknown>;
  graph: Record<string, unknown> | null;
  liveAnswerProjection: Record<string, unknown> | null;
  turnId: string;
  finalAnswerDraftRef: string;
}): string[] => {
  const graphEvidenceRefs = Array.isArray(input.graph?.evidenceRefs)
    ? input.graph.evidenceRefs.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : [];
  const toolEvidenceRefs = Array.isArray(input.toolPayload.evidence_refs)
    ? input.toolPayload.evidence_refs.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : [];
  const changedLineKeys = Array.isArray(input.liveAnswerProjection?.changedLineKeys)
    ? input.liveAnswerProjection.changedLineKeys.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : [];
  return Array.from(new Set([
    input.stagePlayArtifact.artifact_id,
    readAskTurnString(input.toolPayload.observation_id),
    readAskTurnString(input.graph?.graphId),
    readAskTurnString(input.liveAnswerProjection?.deltaId),
    readAskTurnString(input.liveAnswerProjection?.environmentId),
    `${input.turnId}:agent_runtime_loop`,
    `${input.turnId}:agent_step_decision`,
    `${input.turnId}:ask_turn_solver_trace`,
    input.finalAnswerDraftRef,
    ...changedLineKeys.map((key) => `live_answer_line:${key}`),
    ...toolEvidenceRefs,
    ...graphEvidenceRefs,
  ].filter((entry): entry is string => Boolean(entry))));
};

export const collectStagePlaySourceWindowRefsForReceipt = (
  graph: Record<string, unknown> | null,
  sourceWindow: Record<string, unknown> | null,
): string[] => {
  const readStringList = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
      : [];
  const sources = Array.isArray(sourceWindow?.sources)
    ? sourceWindow.sources.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
      )
    : [];
  const sourceRoutes = Array.isArray(sourceWindow?.sourceRoutes)
    ? sourceWindow.sourceRoutes.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
      )
    : [];
  return Array.from(new Set([
    readAskTurnString(graph?.graphId),
    ...readStringList(sourceWindow?.latestSourceDescriptorRefs),
    ...readStringList(sourceWindow?.latestSourceProducerRefs),
    ...readStringList(sourceWindow?.latestRawSessionBufferRefs),
    ...readStringList(sourceWindow?.latestObservationRefs),
    ...readStringList(sourceWindow?.latestSnapshotRefs),
    ...readStringList(sourceWindow?.latestDeltaOverlayRefs),
    ...readStringList(sourceWindow?.latestNavigationRefs),
    ...sourceRoutes.map((route) => {
      const sourceId = readAskTurnString(route.sourceId);
      const routeTo = readAskTurnString(route.routeTo);
      return sourceId && routeTo ? `source_route:${sourceId}:${routeTo}` : null;
    }),
    ...sources.flatMap((source) => [
      readAskTurnString(source.sourceId),
      readAskTurnString(source.modality)
        ? `${readAskTurnString(source.sourceId) ?? "source"}:${readAskTurnString(source.modality)}`
        : null,
      ...readStringList(source.evidenceRefs),
    ]),
  ].filter((entry): entry is string => Boolean(entry))));
};
