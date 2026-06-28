import { readAskTurnArtifactPayloadRecord } from "../artifact-text";
import { readAskTurnString } from "../value-readers";

export type AskTurnLiveSourceArtifactLike = {
  kind: string;
  payload?: unknown;
};

export const readAskTurnLiveEnvironmentObservationRecord = (
  artifact: AskTurnLiveSourceArtifactLike,
): Record<string, unknown> | null => {
  if (artifact.kind !== "live_environment_tool_observation") return null;
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  const observation = payload?.observation;
  if (!observation || typeof observation !== "object" || Array.isArray(observation)) return null;
  const observationRecord = observation as Record<string, unknown>;
  const innerObservation = observationRecord.observation;
  return innerObservation && typeof innerObservation === "object" && !Array.isArray(innerObservation)
    ? innerObservation as Record<string, unknown>
    : observationRecord;
};

export const isStagePlayLiveSourceMailReadObservationArtifact = (
  artifact: AskTurnLiveSourceArtifactLike,
): boolean => {
  const payload = artifact.kind === "live_environment_tool_observation"
    ? readAskTurnArtifactPayloadRecord(artifact)
    : null;
  const observation = readAskTurnLiveEnvironmentObservationRecord(artifact);
  const toolName = readAskTurnString(payload?.tool_name);
  return (
    (
      payload?.ok !== false &&
      (
        toolName === "live_env.read_live_source_mail" ||
        toolName === "live_env.read_processed_live_source_mail" ||
        toolName === "live_env.process_live_source_mail"
      )
    ) ||
    readAskTurnString(observation?.artifactId) === "stage_play_live_source_mail_read_result" ||
    readAskTurnString(observation?.schemaVersion) === "stage_play_live_source_mail_read_result/v1" ||
    readAskTurnString(observation?.schema) === "stage_play_processed_live_source_mail_read_result/v1" ||
    readAskTurnString(observation?.schemaVersion) === "stage_play_processed_live_source_mail_read_result/v1" ||
    readAskTurnString(observation?.artifactId) === "stage_play_processed_mail_packet" ||
    readAskTurnString(observation?.schemaVersion) === "stage_play_processed_mail_packet/v1" ||
    (Array.isArray(observation?.packets) && observation.packets.length > 0) ||
    Boolean(readAskTurnString(observation?.readId))
  );
};

export const readStagePlayProcessedMailPacketRecordsFromArtifact = (
  artifact: AskTurnLiveSourceArtifactLike,
): Record<string, unknown>[] => {
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  const observation = artifact.kind === "live_environment_tool_observation"
    ? readAskTurnLiveEnvironmentObservationRecord(artifact)
    : payload;
  const candidates: unknown[] = [
    observation,
    ...(Array.isArray(observation?.packets) ? observation.packets : []),
    ...(Array.isArray(payload?.packets) ? payload.packets : []),
  ];
  return candidates
    .filter((candidate): candidate is Record<string, unknown> =>
      Boolean(candidate && typeof candidate === "object" && !Array.isArray(candidate)),
    )
    .filter((record) =>
      readAskTurnString(record.artifactId) === "stage_play_processed_mail_packet" ||
      readAskTurnString(record.schemaVersion) === "stage_play_processed_mail_packet/v1" ||
      readAskTurnString(record.packetId)?.startsWith("stage_play_processed_mail_packet:") === true,
    );
};

export const stagePlayProcessedMailPacketHasSatisfyingContent = (packet: Record<string, unknown>): boolean => {
  const observedFacts = Array.isArray(packet.observedFacts) ? packet.observedFacts : [];
  const changedFacts = Array.isArray(packet.changedFacts) ? packet.changedFacts : [];
  const inferredFacts = Array.isArray(packet.inferredFacts) ? packet.inferredFacts : [];
  const packetSalience = packet.salience && typeof packet.salience === "object" && !Array.isArray(packet.salience)
    ? packet.salience as Record<string, unknown>
    : null;
  const recommendedNext = readAskTurnString(packet.recommendedNext ?? packet.recommended_next);
  return (
    observedFacts.length > 0 ||
    changedFacts.length > 0 ||
    inferredFacts.length > 0 ||
    Boolean(recommendedNext) ||
    Boolean(readAskTurnString(packetSalience?.level) ?? readAskTurnString(packetSalience?.recommendedNext))
  );
};

const STAGE_PLAY_PROCESSED_MAIL_RECOMMENDATIONS_REQUIRING_DECISION = new Set([
  "record_interpretation",
  "request_voice_callout",
  "request_more_evidence",
  "request_stage_play_checkpoint",
]);

export const readStagePlayProcessedMailPacketRecommendedNext = (
  packet: Record<string, unknown> | null | undefined,
): string | null => readAskTurnString(packet?.recommendedNext ?? packet?.recommended_next)?.toLowerCase() ?? null;

export const stagePlayProcessedMailPacketRequiresDecision = (
  packet: Record<string, unknown> | null | undefined,
): boolean => {
  const recommendedNext = readStagePlayProcessedMailPacketRecommendedNext(packet);
  return Boolean(recommendedNext && STAGE_PLAY_PROCESSED_MAIL_RECOMMENDATIONS_REQUIRING_DECISION.has(recommendedNext));
};

export const stagePlayProcessedMailPacketAllowsDirectCheckpointSummary = (
  packet: Record<string, unknown> | null | undefined,
): boolean => {
  if (!packet || !stagePlayProcessedMailPacketHasSatisfyingContent(packet)) return false;
  return !stagePlayProcessedMailPacketRequiresDecision(packet);
};
