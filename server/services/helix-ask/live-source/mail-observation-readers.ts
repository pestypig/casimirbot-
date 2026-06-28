import { readAskTurnArtifactPayloadRecord } from "../artifact-text";
import { readAskTurnString, readAskTurnStringList } from "../value-readers";

export type AskTurnLiveSourceArtifactLike = {
  kind: string;
  payload?: unknown;
};

const uniqueAskTurnStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

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

export const artifactHasSatisfyingStagePlayProcessedMailPacket = (
  artifact: AskTurnLiveSourceArtifactLike,
): boolean => {
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  if (artifact.kind === "stage_play_processed_mail_packet") {
    return stagePlayProcessedMailPacketHasSatisfyingContent(payload ?? {});
  }
  if (artifact.kind !== "live_environment_tool_observation" && artifact.kind !== "tool_observation") return false;
  return readStagePlayProcessedMailPacketRecordsFromArtifact(artifact).some(stagePlayProcessedMailPacketHasSatisfyingContent);
};

export const latestStagePlayProcessedMailPacketRecordFromArtifacts = (
  artifacts: AskTurnLiveSourceArtifactLike[] | null | undefined,
): Record<string, unknown> | null => {
  const packets = (artifacts ?? []).flatMap(readStagePlayProcessedMailPacketRecordsFromArtifact);
  return packets.at(-1) ?? null;
};

export const collectStagePlayMailIdsFromRecord = (value: unknown): string[] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const record = value as Record<string, unknown>;
  return uniqueAskTurnStrings([
    ...readAskTurnStringList(record.mailIds),
    ...readAskTurnStringList(record.mail_ids),
    readAskTurnString(record.mailId ?? record.mail_id),
  ]);
};

export const collectStagePlayCurrentBatchMailIds = (artifacts: AskTurnLiveSourceArtifactLike[]): string[] => {
  const mailIds: string[] = [];
  for (const artifact of artifacts) {
    const payload = readAskTurnArtifactPayloadRecord(artifact);
    const observation = artifact.kind === "live_environment_tool_observation"
      ? readAskTurnLiveEnvironmentObservationRecord(artifact)
      : payload;
    mailIds.push(...collectStagePlayMailIdsFromRecord(payload));
    mailIds.push(...collectStagePlayMailIdsFromRecord(observation));
    for (const packet of readStagePlayProcessedMailPacketRecordsFromArtifact(artifact)) {
      mailIds.push(...collectStagePlayMailIdsFromRecord(packet));
    }
    const items = Array.isArray(observation?.items) ? observation.items : [];
    for (const item of items) {
      mailIds.push(...collectStagePlayMailIdsFromRecord(item));
    }
    const packets = Array.isArray(observation?.packets) ? observation.packets : [];
    for (const packet of packets) {
      mailIds.push(...collectStagePlayMailIdsFromRecord(packet));
    }
  }
  return uniqueAskTurnStrings(mailIds);
};

export const processedMailReadObservationHasPacket = (
  observation: Record<string, unknown> | null | undefined,
): boolean => {
  const packetRefs = uniqueAskTurnStrings([
    ...readAskTurnStringList(observation?.processedPacketRefs),
    ...readAskTurnStringList(observation?.processed_packet_refs),
  ]);
  if (packetRefs.some((ref) => /^stage_play_processed_mail_packet:/i.test(ref))) return true;
  const packets = Array.isArray(observation?.packets)
    ? observation.packets.filter((packet): packet is Record<string, unknown> =>
        Boolean(packet && typeof packet === "object" && !Array.isArray(packet)),
      )
    : [];
  return packets.some(stagePlayProcessedMailPacketHasSatisfyingContent);
};

export const processedMailReadObservationMissingRawMailIds = (
  observation: Record<string, unknown> | null | undefined,
): string[] => uniqueAskTurnStrings([
  ...readAskTurnStringList(observation?.missingRawMailIds),
  ...readAskTurnStringList(observation?.missing_raw_mail_ids),
]);

export const processedMailReadObservationNeedsProcessFallback = (
  observation: Record<string, unknown> | null | undefined,
): boolean => {
  if (!observation || processedMailReadObservationHasPacket(observation)) return false;
  const fallbackTool = readAskTurnString(observation.fallbackTool ?? observation.fallback_tool);
  const schema = readAskTurnString(observation.schema ?? observation.schemaVersion);
  return (
    fallbackTool === "live_env.process_live_source_mail" ||
    processedMailReadObservationMissingRawMailIds(observation).length > 0 ||
    (
      schema === "stage_play_processed_live_source_mail_read_result/v1" &&
      observation.ok !== true
    )
  );
};
