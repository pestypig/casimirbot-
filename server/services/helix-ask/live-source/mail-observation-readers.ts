import { readAskTurnArtifactPayloadRecord } from "../artifact-text";
import { readAskTurnString, readAskTurnStringList } from "../value-readers";

export type AskTurnLiveSourceArtifactLike = {
  kind: string;
  payload?: unknown;
  artifact_id?: unknown;
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

export const latestLiveEnvironmentToolObservationArtifact = <T extends AskTurnLiveSourceArtifactLike>(
  artifacts: T[] | null | undefined,
  toolName: string,
): T | null => {
  const matches = (artifacts ?? []).filter((artifact) => {
    if (artifact.kind !== "live_environment_tool_observation") return false;
    const payload = readAskTurnArtifactPayloadRecord(artifact);
    return readAskTurnString(payload?.tool_name) === toolName;
  });
  return matches.at(-1) ?? null;
};

export const latestLiveEnvironmentToolObservationRecord = (
  artifacts: AskTurnLiveSourceArtifactLike[] | null | undefined,
  toolName: string,
): Record<string, unknown> | null => {
  const artifact = latestLiveEnvironmentToolObservationArtifact(artifacts, toolName);
  return artifact ? readAskTurnLiveEnvironmentObservationRecord(artifact) : null;
};

export const artifactIndexInList = <T extends { artifact_id?: unknown }>(
  artifacts: T[] | null | undefined,
  target: T | null,
): number => {
  if (!target) return -1;
  return (artifacts ?? []).findIndex((artifact) => artifact.artifact_id === target.artifact_id);
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

export const isStagePlayLiveSourceMailDecisionObservationArtifact = (
  artifact: AskTurnLiveSourceArtifactLike,
): boolean => {
  const observation = readAskTurnLiveEnvironmentObservationRecord(artifact);
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  return (
    artifact.kind === "stage_play_live_source_mail_decision" ||
    readAskTurnString(payload?.artifactId) === "stage_play_live_source_mail_decision" ||
    readAskTurnString(payload?.schemaVersion) === "stage_play_live_source_mail_decision/v1" ||
    readAskTurnString(observation?.artifactId) === "stage_play_live_source_mail_decision" ||
    readAskTurnString(observation?.schemaVersion) === "stage_play_live_source_mail_decision/v1" ||
    Boolean(readAskTurnString(observation?.decisionId ?? payload?.decisionId))
  );
};

export const isStagePlayLiveSourceWatchJobPolicyObservationArtifact = (
  artifact: AskTurnLiveSourceArtifactLike,
): boolean => {
  const payload = artifact.kind === "live_environment_tool_observation"
    ? readAskTurnArtifactPayloadRecord(artifact)
    : null;
  const observation = readAskTurnLiveEnvironmentObservationRecord(artifact);
  const policy = observation?.policy && typeof observation.policy === "object" && !Array.isArray(observation.policy)
    ? observation.policy as Record<string, unknown>
    : null;
  return (
    (
      readAskTurnString(payload?.tool_name) === "live_env.configure_live_source_watch_job" &&
      payload?.ok !== false
    ) ||
    readAskTurnString(observation?.artifactId) === "stage_play_live_source_watch_job_policy_result" ||
    readAskTurnString(observation?.artifactId) === "stage_play_live_source_watch_job_policy_config_result" ||
    readAskTurnString(observation?.schemaVersion) === "stage_play_live_source_watch_job_policy_result/v1" ||
    readAskTurnString(observation?.schemaVersion) === "stage_play_live_source_watch_job_policy_config_result/v1" ||
    readAskTurnString(observation?.schema) === "stage_play_live_source_watch_job_policy_config_result/v1" ||
    readAskTurnString(policy?.artifactId) === "stage_play_live_source_watch_job_policy" ||
    readAskTurnString(policy?.schemaVersion) === "stage_play_live_source_watch_job_policy/v1" ||
    Boolean(readAskTurnString(observation?.watchJobPolicyRef ?? observation?.watch_job_policy_ref))
  );
};

export const isStagePlayInterpreterProfileConfigObservationArtifact = (
  artifact: AskTurnLiveSourceArtifactLike,
): boolean => {
  const payload = artifact.kind === "live_environment_tool_observation"
    ? readAskTurnArtifactPayloadRecord(artifact)
    : null;
  const observation = readAskTurnLiveEnvironmentObservationRecord(artifact);
  const profile = observation?.profile && typeof observation.profile === "object" && !Array.isArray(observation.profile)
    ? observation.profile as Record<string, unknown>
    : null;
  return (
    (
      readAskTurnString(payload?.tool_name) === "live_env.configure_interpreter_profile" &&
      payload?.ok !== false
    ) ||
    readAskTurnString(observation?.artifactId) === "stage_play_interpreter_profile_config_result" ||
    readAskTurnString(observation?.schema) === "stage_play_interpreter_profile_config_result/v1" ||
    readAskTurnString(profile?.artifactId) === "stage_play_live_source_interpreter_profile" ||
    readAskTurnString(profile?.schemaVersion) === "stage_play_live_source_interpreter_profile/v1" ||
    Boolean(readAskTurnString(observation?.interpreterProfileRef ?? observation?.interpreter_profile_ref))
  );
};

export const isStagePlayInterpreterProfileComparisonObservationArtifact = (
  artifact: AskTurnLiveSourceArtifactLike,
): boolean => {
  const payload = artifact.kind === "live_environment_tool_observation"
    ? readAskTurnArtifactPayloadRecord(artifact)
    : null;
  const observation = readAskTurnLiveEnvironmentObservationRecord(artifact);
  return (
    (
      readAskTurnString(payload?.tool_name) === "live_env.compare_mail_to_interpreter_profile" &&
      payload?.ok !== false
    ) ||
    readAskTurnString(observation?.artifactId) === "stage_play_live_source_interpreter_profile_comparison" ||
    readAskTurnString(observation?.schemaVersion) === "stage_play_live_source_interpreter_profile_comparison/v1" ||
    Boolean(readAskTurnString(observation?.comparisonId))
  );
};
