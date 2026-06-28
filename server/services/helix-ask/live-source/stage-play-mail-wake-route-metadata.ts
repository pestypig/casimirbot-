import { z } from "zod";

export const StagePlayMailWakeRouteMetadataSchema = z
  .object({
    invocationKind: z.literal("stage_play_mail_wake"),
    wakeRequestId: z.string().min(1),
    mailboxThreadId: z.string().min(1),
    sourceTarget: z.literal("live_source_mailbox"),
    requiredCanonicalGoal: z.enum([
      "processed_mail_interpretation",
      "processed_mail_voice_decision",
      "processed_mail_checkpoint",
    ]),
    requiredPhase: z.string().min(1).optional(),
    allowedCapabilities: z.array(z.string().min(1)).optional(),
    forbiddenCapabilities: z.array(z.string().min(1)).optional(),
    evidenceRefs: z.array(z.string().min(1)).optional(),
  })
  .passthrough();

export type StagePlayMailWakeRouteMetadata = z.infer<typeof StagePlayMailWakeRouteMetadataSchema>;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const synthesizeStagePlayMailWakeRouteMetadata = (value: unknown): StagePlayMailWakeRouteMetadata | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const sourceTargetIntent =
    record.source_target_intent && typeof record.source_target_intent === "object" && !Array.isArray(record.source_target_intent)
      ? (record.source_target_intent as Record<string, unknown>)
      : {};
  const embeddedWakeMetadata =
    sourceTargetIntent.stage_play_mail_wake_route_metadata &&
    typeof sourceTargetIntent.stage_play_mail_wake_route_metadata === "object" &&
    !Array.isArray(sourceTargetIntent.stage_play_mail_wake_route_metadata)
      ? (sourceTargetIntent.stage_play_mail_wake_route_metadata as Record<string, unknown>)
      : {};
  const wakeRequestId =
    readString(record.wakeRequestId) ??
    readString(record.wake_request_id) ??
    readString(sourceTargetIntent.wakeRequestId) ??
    readString(sourceTargetIntent.stage_play_live_source_mail_wake_request_id);
  const isWakeMetadata =
    record.invocationKind === "stage_play_mail_wake" ||
    record.source === "stage_play_mail_wake" ||
    sourceTargetIntent.source === "stage_play_mail_wake_route_metadata" ||
    Boolean(wakeRequestId?.startsWith("stage_play_live_source_mail_wake:"));
  if (!isWakeMetadata || !wakeRequestId) return null;
  const recommendedNext =
    readString(record.recommendedNext) ??
    readString(record.recommended_next) ??
    readString(sourceTargetIntent.recommendedNext) ??
    readString(sourceTargetIntent.recommended_next);
  const requiredCanonicalGoal =
    readString(record.requiredCanonicalGoal) ??
    (recommendedNext === "request_voice_callout"
      ? "processed_mail_voice_decision"
      : "processed_mail_interpretation");
  const candidate = {
    ...record,
    invocationKind: "stage_play_mail_wake",
    wakeRequestId,
    mailboxThreadId:
      readString(record.mailboxThreadId) ??
      readString(record.mailbox_thread_id) ??
      readString(record.threadId) ??
      readString(record.thread_id) ??
      "helix-ask:desktop",
    sourceTarget: "live_source_mailbox",
    requiredCanonicalGoal,
    requiredPhase:
      readString(record.requiredPhase) ??
      readString(record.required_phase) ??
      readString(sourceTargetIntent.requiredPhase) ??
      readString(sourceTargetIntent.required_phase) ??
      undefined,
    allowedCapabilities:
      Array.isArray(record.allowedCapabilities)
        ? record.allowedCapabilities
        : Array.isArray(record.allowed_capabilities)
          ? record.allowed_capabilities
          : Array.isArray(embeddedWakeMetadata.allowedCapabilities)
            ? embeddedWakeMetadata.allowedCapabilities
            : Array.isArray(embeddedWakeMetadata.allowed_capabilities)
              ? embeddedWakeMetadata.allowed_capabilities
              : undefined,
    forbiddenCapabilities:
      Array.isArray(record.forbiddenCapabilities)
        ? record.forbiddenCapabilities
        : Array.isArray(record.forbidden_capabilities)
          ? record.forbidden_capabilities
          : Array.isArray(embeddedWakeMetadata.forbiddenCapabilities)
            ? embeddedWakeMetadata.forbiddenCapabilities
            : Array.isArray(embeddedWakeMetadata.forbidden_capabilities)
              ? embeddedWakeMetadata.forbidden_capabilities
              : undefined,
    evidenceRefs:
      Array.isArray(record.evidenceRefs)
        ? record.evidenceRefs
        : Array.isArray(record.evidence_refs)
          ? record.evidence_refs
          : Array.isArray(embeddedWakeMetadata.evidenceRefs)
            ? embeddedWakeMetadata.evidenceRefs
            : Array.isArray(embeddedWakeMetadata.evidence_refs)
              ? embeddedWakeMetadata.evidence_refs
              : undefined,
  };
  const parsed = StagePlayMailWakeRouteMetadataSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};

export const readStagePlayMailWakeRouteMetadata = (value: unknown): StagePlayMailWakeRouteMetadata | null => {
  const parsed = StagePlayMailWakeRouteMetadataSchema.safeParse(value);
  return parsed.success ? parsed.data : synthesizeStagePlayMailWakeRouteMetadata(value);
};

const readRouteMetadataStringArrayField = (
  value: unknown,
  camelKey: string,
  snakeKey: string,
): string[] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const record = value as Record<string, unknown>;
  const raw = record[camelKey] ?? record[snakeKey];
  if (Array.isArray(raw)) {
    return uniqueStrings(raw.map(readString).filter((entry): entry is string => Boolean(entry)));
  }
  const nestedCandidates = [
    record.route_metadata,
    record.routeMetadata,
    record.stage_play_mail_wake_route_metadata,
    record.source_target_intent && typeof record.source_target_intent === "object" && !Array.isArray(record.source_target_intent)
      ? (record.source_target_intent as Record<string, unknown>).stage_play_mail_wake_route_metadata
      : null,
  ];
  return uniqueStrings(nestedCandidates.flatMap((candidate) =>
    readRouteMetadataStringArrayField(candidate, camelKey, snakeKey)
  ));
};

const readRouteMetadataStringField = (
  value: unknown,
  camelKey: string,
  snakeKey: string,
): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return readString(record[camelKey]) ?? readString(record[snakeKey]);
};

export const mergeStagePlayMailWakeRouteMetadataSources = (
  metadata: StagePlayMailWakeRouteMetadata | null,
  ...sources: unknown[]
): StagePlayMailWakeRouteMetadata | null => {
  if (!metadata) return null;
  const allowedCapabilities = uniqueStrings([
    ...(metadata.allowedCapabilities ?? []),
    ...sources.flatMap((source) =>
      readRouteMetadataStringArrayField(source, "allowedCapabilities", "allowed_capabilities")
    ),
  ]);
  const forbiddenCapabilities = uniqueStrings([
    ...(metadata.forbiddenCapabilities ?? []),
    ...sources.flatMap((source) =>
      readRouteMetadataStringArrayField(source, "forbiddenCapabilities", "forbidden_capabilities")
    ),
  ]);
  const evidenceRefs = uniqueStrings([
    ...(metadata.evidenceRefs ?? []),
    ...sources.flatMap((source) =>
      readRouteMetadataStringArrayField(source, "evidenceRefs", "evidence_refs")
    ),
  ]);
  const rawMailboxThreadId = sources
    .map((source) => readRouteMetadataStringField(source, "mailboxThreadId", "mailbox_thread_id"))
    .find((entry): entry is string => Boolean(entry));
  return {
    ...metadata,
    mailboxThreadId: rawMailboxThreadId ?? metadata.mailboxThreadId,
    ...(allowedCapabilities.length > 0 ? { allowedCapabilities } : {}),
    ...(forbiddenCapabilities.length > 0 ? { forbiddenCapabilities } : {}),
    ...(evidenceRefs.length > 0 ? { evidenceRefs } : {}),
  };
};

export const readStagePlayMailWakeRouteMetadataFromRequest = (
  request: Record<string, unknown>,
): StagePlayMailWakeRouteMetadata | null =>
  mergeStagePlayMailWakeRouteMetadataSources(
    readStagePlayMailWakeRouteMetadata(request.route_metadata) ??
      readStagePlayMailWakeRouteMetadata(request.routeMetadata) ??
      readStagePlayMailWakeRouteMetadata(request.source_target_intent),
    request,
    request.route_metadata,
    request.routeMetadata,
    request.source_target_intent,
  );

export const readStagePlayMailWakeRouteMetadataFromPayload = (
  payload: Record<string, unknown>,
): StagePlayMailWakeRouteMetadata | null => {
  const direct =
    readStagePlayMailWakeRouteMetadata(payload.route_metadata) ??
    readStagePlayMailWakeRouteMetadata(payload.routeMetadata) ??
    readStagePlayMailWakeRouteMetadata(payload.source_target_intent) ??
    (
      payload.request_metadata && typeof payload.request_metadata === "object" && !Array.isArray(payload.request_metadata)
        ? readStagePlayMailWakeRouteMetadata((payload.request_metadata as Record<string, unknown>).route_metadata) ??
          readStagePlayMailWakeRouteMetadata((payload.request_metadata as Record<string, unknown>).routeMetadata)
        : null
    );
  if (direct) {
    return mergeStagePlayMailWakeRouteMetadataSources(
      direct,
      payload.route_metadata,
      payload.routeMetadata,
      payload.source_target_intent,
      payload.request_metadata && typeof payload.request_metadata === "object" && !Array.isArray(payload.request_metadata)
        ? (payload.request_metadata as Record<string, unknown>).route_metadata
        : null,
      payload.request_metadata && typeof payload.request_metadata === "object" && !Array.isArray(payload.request_metadata)
        ? (payload.request_metadata as Record<string, unknown>).routeMetadata
        : null,
    );
  }
  const sourceTargetIntent =
    payload.source_target_intent && typeof payload.source_target_intent === "object" && !Array.isArray(payload.source_target_intent)
      ? (payload.source_target_intent as Record<string, unknown>)
      : null;
  const canonicalGoal =
    payload.canonical_goal_frame && typeof payload.canonical_goal_frame === "object" && !Array.isArray(payload.canonical_goal_frame)
      ? (payload.canonical_goal_frame as Record<string, unknown>)
      : null;
  const conceptTokens = Array.isArray(canonicalGoal?.concept_tokens)
    ? canonicalGoal.concept_tokens.map(readString).filter((entry): entry is string => Boolean(entry))
    : [];
  const classifierReasons = Array.isArray(canonicalGoal?.classifier_reasons)
    ? canonicalGoal.classifier_reasons.map(readString).filter((entry): entry is string => Boolean(entry))
    : [];
  const hasWakeSignal =
    conceptTokens.includes("stage_play_mail_wake") ||
    classifierReasons.includes("stage_play_mail_wake_route_metadata") ||
    readString(sourceTargetIntent?.source) === "stage_play_mail_wake_route_metadata";
  if (!hasWakeSignal) return null;
  const wakeRequestId =
    conceptTokens.find((entry) => /^stage_play_live_source_mail_wake:/i.test(entry)) ??
    readString(sourceTargetIntent?.wakeRequestId) ??
    readString(sourceTargetIntent?.stage_play_live_source_mail_wake_request_id);
  if (!wakeRequestId) return null;
  const requiredCanonicalGoal =
    conceptTokens.includes("processed_mail_voice_decision") ||
    classifierReasons.includes("prefer_record_live_source_mail_decision")
      ? "processed_mail_voice_decision"
      : conceptTokens.includes("processed_mail_checkpoint")
        ? "processed_mail_checkpoint"
        : "processed_mail_interpretation";
  const requiredPhase =
    classifierReasons
      .map((reason) => reason.match(/^live_source_phase:(.+)$/)?.[1])
      .find((entry): entry is string => Boolean(entry)) ??
    readString(sourceTargetIntent?.requiredPhase) ??
    readString(sourceTargetIntent?.required_phase) ??
    undefined;
  const evidenceRefs = uniqueStrings(conceptTokens.filter((entry) =>
    /^(?:stage_play_processed_mail_packet|stage_play_live_source_mail|helix_interim_voice_callout_receipt|live_source_interim_voice_callout_receipt):/i.test(entry)
  ));
  return readStagePlayMailWakeRouteMetadata({
    invocationKind: "stage_play_mail_wake",
    wakeRequestId,
    mailboxThreadId:
      readString(sourceTargetIntent?.thread_id) ??
      readString(payload.thread_id) ??
      readString(payload.sessionId) ??
      "helix-ask:desktop",
    sourceTarget: "live_source_mailbox",
    requiredCanonicalGoal,
    ...(requiredPhase ? { requiredPhase } : {}),
    evidenceRefs,
  });
};
